/// <reference lib="webworker" />

interface PyodideInterface {
  runPython: (code: string) => any;
  setInterruptBuffer: (buffer: Int32Array) => void;
  checkInterrupt: () => void;
}

declare const loadPyodide: any;

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

async function initPyodide(): Promise<PyodideInterface> {
  if (pyodide) {
    return pyodide;
  }

  if (pyodideLoading) {
    return pyodideLoading;
  }

  pyodideLoading = (async () => {
    try {
      // Dynamic import for module workers
      const pyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.mjs');
      const pyodideInstance = await pyodideModule.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/"
      });

      // Set up interrupt buffer for stopping infinite loops (if SharedArrayBuffer is available)
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
    // Execute the user's code
    try {
      pyodideInstance.runPython(code);
    } catch (error) {
      // Handle syntax errors more gracefully
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('SyntaxError') || errorMsg.includes('IndentationError')) {
        // Extract just the error type and message
        const match = errorMsg.match(/(SyntaxError|IndentationError): (.+?)(?:\n|$)/);
        if (match) {
          throw new Error(`${match[1]}: ${match[2]}`);
        }
        // Fallback to showing the last line which usually has the error
        const lines = errorMsg.split('\n').filter(line => line.trim());
        const lastLine = lines[lines.length - 1];
        throw new Error(lastLine);
      }
      throw error;
    }

    // Load required prepare and verify functions
    pyodideInstance.runPython(prepareCode);
    pyodideInstance.runPython(verifyCode);

    // Run each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const testOutput: string[] = [];

      try {
        // Set up output capture for this test case
        pyodideInstance.runPython(`
import sys
from io import StringIO
test_output = StringIO()
sys.stdout = test_output
        `);

        let jsResult: any;
        let passed: boolean;
        let outputStr: string = '';

        // Use prepare/verify flow (required for all questions)
        const inputString = JSON.stringify(testCase.input).replace(/null/g, 'None');

        // Call user function with prepared input (unpack tuple from prepare)
        const result = pyodideInstance.runPython(`
_test_input = prepare(${inputString})
_test_result = ${functionName}(*_test_input)
_test_result
        `);

        // Convert result to JS
        jsResult = result && typeof result.toJs === 'function' ? result.toJs() : result;

        // Call verify function to check result and get output string
        const outputString = JSON.stringify(testCase.output).replace(/null/g, 'None');
        const verifyResult = pyodideInstance.runPython(`verify(_test_result, ${outputString})`);
        const verifyJs = verifyResult && typeof verifyResult.toJs === 'function' ? verifyResult.toJs() : verifyResult;

        passed = verifyJs[0];
        outputStr = verifyJs[1] || '';

        // Get output for this test case
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
        testResults.push({
          id: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: null,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          output: testOutput
        });
      } finally {
        // Restore stdout
        pyodideInstance.runPython('sys.stdout = sys.__stdout__');
      }
    }

  } catch (error) {
    // If there's an error in the code itself
    testResults.push({
      id: 1,
      input: {},
      expectedOutput: null,
      actualOutput: null,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
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

// Message handler
addEventListener('message', async ({ data }: MessageEvent<WorkerMessage>) => {
  try {
    if (data.type === 'init') {
      await initPyodide();
      postMessage({ type: 'ready' });
    } else if (data.type === 'getInterruptBuffer') {
      // Send the interrupt buffer to the main thread
      if (interruptBuffer) {
        postMessage({ type: 'interruptBuffer', buffer: interruptBuffer }, [interruptBuffer.buffer as any]);
      }
    } else if (data.type === 'interrupt') {
      // Signal interrupt by setting the buffer value
      if (interruptBuffer) {
        Atomics.store(interruptBuffer, 0, 2);
      }
    } else if (data.type === 'execute') {
      // Reset interrupt buffer before execution
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
