/// <reference lib="webworker" />

interface PyodideInterface {
  runPython: (code: string) => any;
  setInterruptBuffer: (buffer: Int32Array) => void;
  checkInterrupt: () => void;
}

declare const loadPyodide: (options: { indexURL: string }) => Promise<PyodideInterface>;

let pyodide: PyodideInterface | null = null;
let pyodideLoading: Promise<PyodideInterface> | null = null;
let interruptBuffer: Int32Array | null = null;

interface ExecuteMessage {
  type: 'execute';
  code: string;
  testCases: any[];
  functionName: string;
  prepareCode: string;
  verifyCode: string;
  timeout: number;
}

interface InitMessage {
  type: 'init';
}

interface InterruptMessage {
  type: 'interrupt';
}

interface GetInterruptBufferMessage {
  type: 'getInterruptBuffer';
}

type WorkerMessage = ExecuteMessage | InitMessage | InterruptMessage | GetInterruptBufferMessage;

function parseErrorMessage(errorMessage: string): string {
  if (!errorMessage.includes('Traceback') && !errorMessage.includes('File')) {
    return errorMessage;
  }

  const lines = errorMessage.split('\n').filter(line => line.trim());
  const errorLine = lines[lines.length - 1] || errorMessage;

  let lineNumber: number | null = null;
  for (const line of lines) {
    const execMatch = line.match(/File.*<exec>.*line (\d+)/);
    if (execMatch) {
      lineNumber = parseInt(execMatch[1]);
      break;
    }
  }

  let cleanError = errorLine.trim();
  cleanError = cleanError.replace(/^(Error:|Exception:)\s*/, '');

  if (lineNumber) {
    return `Line ${lineNumber}: ${cleanError}`;
  }

  return cleanError;
}

async function initPyodide(): Promise<PyodideInterface> {
  if (pyodide) {
    return pyodide;
  }

  if (pyodideLoading) {
    return pyodideLoading;
  }

  pyodideLoading = (async () => {
    try {
      // Dynamic import from CDN - use Function constructor to bypass TypeScript check
      const pyodideUrl = 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.mjs';
      const pyodideModule = await (Function('return import("' + pyodideUrl + '")')() as Promise<{ loadPyodide: typeof loadPyodide }>);
      const pyodideInstance = await pyodideModule.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/"
      });

      if (typeof SharedArrayBuffer !== 'undefined') {
        interruptBuffer = new Int32Array(new SharedArrayBuffer(4));
        pyodideInstance.setInterruptBuffer(interruptBuffer);
      }

      return pyodideInstance;
    } catch (error) {
      pyodideLoading = null;
      throw new Error(`Failed to load Pyodide: ${error instanceof Error ? error.message : String(error)}`);
    }
  })();

  pyodide = await pyodideLoading;
  return pyodide!;
}

async function executeCode(
  code: string,
  testCases: any[],
  functionName: string,
  prepareCode: string,
  verifyCode: string
): Promise<any> {
  const startTime = performance.now();
  const pyodideInstance = await initPyodide();
  const testResults: any[] = [];
  const output: string[] = [];

  try {
    pyodideInstance.runPython(code);
    pyodideInstance.runPython(prepareCode);
    pyodideInstance.runPython(verifyCode);

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const testOutput: string[] = [];

      try {
        pyodideInstance.runPython(`
import sys
from io import StringIO
test_output = StringIO()
sys.stdout = test_output
        `);

        let jsResult: any;
        let passed: boolean;
        let outputStr: string = '';

        const inputString = JSON.stringify(testCase.input).replace(/null/g, 'None');

        const result = pyodideInstance.runPython(`
_test_input = prepare(${inputString})
_test_result = ${functionName}(*_test_input)
_test_result
        `);

        jsResult = result && typeof result.toJs === 'function' ? result.toJs() : result;

        const outputString = JSON.stringify(testCase.output).replace(/null/g, 'None');
        const verifyResult = pyodideInstance.runPython(`
import inspect
_verify_sig = inspect.signature(verify)
_verify_param_count = len(_verify_sig.parameters)

if _verify_param_count >= 3:
    _verify_result = verify(_test_result, ${outputString}, _test_input)
else:
    _verify_result = verify(_test_result, ${outputString})
_verify_result
        `);
        const verifyJs = verifyResult && typeof verifyResult.toJs === 'function' ? verifyResult.toJs() : verifyResult;

        passed = verifyJs[0];
        outputStr = verifyJs[1] || '';

        const capturedOutput = pyodideInstance.runPython('test_output.getvalue()');
        if (capturedOutput) {
          testOutput.push(...capturedOutput.split('\n').filter((line: string) => line.trim()));
        }

        testResults.push({
          id: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: outputStr || jsResult,
          passed: passed,
          output: testOutput
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        testResults.push({
          id: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: null,
          passed: false,
          error: parseErrorMessage(errorMessage),
          output: testOutput
        });
      } finally {
        pyodideInstance.runPython('sys.stdout = sys.__stdout__');
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({
      id: 1,
      input: {},
      expectedOutput: null,
      actualOutput: null,
      passed: false,
      error: parseErrorMessage(errorMessage),
      output: []
    });
  }

  const endTime = performance.now();
  const passedCount = testResults.filter(result => result.passed).length;

  return {
    testResults,
    executionTime: Math.round(endTime - startTime),
    passedCount,
    totalCount: testResults.length,
    output
  };
}

addEventListener('message', async ({ data }: MessageEvent<WorkerMessage>) => {
  try {
    if (data.type === 'init') {
      await initPyodide();
      postMessage({ type: 'ready' });
    } else if (data.type === 'getInterruptBuffer') {
      if (interruptBuffer) {
        postMessage({ type: 'interruptBuffer', buffer: interruptBuffer }, [interruptBuffer.buffer as any]);
      }
    } else if (data.type === 'interrupt') {
      if (interruptBuffer) {
        Atomics.store(interruptBuffer, 0, 2);
      }
    } else if (data.type === 'execute') {
      if (interruptBuffer) {
        Atomics.store(interruptBuffer, 0, 0);
      }

      const result = await executeCode(
        data.code,
        data.testCases,
        data.functionName,
        data.prepareCode,
        data.verifyCode
      );
      postMessage({ type: 'result', result });
    }
  } catch (error) {
    postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});
