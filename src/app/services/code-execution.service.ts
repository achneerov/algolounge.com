import { Injectable } from '@angular/core';
import { TestResult, ExecutionResult } from '../pages/questions/console/console.component';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

interface PyodideInterface {
  runPython: (code: string) => any;
}

@Injectable({
  providedIn: 'root'
})
export class CodeExecutionService {
  private pyodide: PyodideInterface | null = null;
  private pyodideLoading: Promise<PyodideInterface> | null = null;

  constructor() {}

  async initPyodide(): Promise<PyodideInterface> {
    if (this.pyodide) {
      return this.pyodide;
    }

    if (this.pyodideLoading) {
      return this.pyodideLoading;
    }

    // Load Pyodide script dynamically to avoid Vite warnings
    if (!window.loadPyodide) {
      await this.loadPyodideScript();
    }

    this.pyodideLoading = window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/"
    });

    this.pyodide = await this.pyodideLoading;
    return this.pyodide!;
  }

  private async loadPyodideScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pyodide'));
      document.head.appendChild(script);
    });
  }

  async executeCode(
    code: string,
    testCases: any[],
    functionName: string,
    prepareCode: string,
    verifyCode: string
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const pyodide = await this.initPyodide();
    const testResults: TestResult[] = [];
    const output: string[] = [];

    try {
      // Execute the user's code
      pyodide.runPython(code);

      // Load required prepare and verify functions
      pyodide.runPython(prepareCode);
      pyodide.runPython(verifyCode);

      // Run each test case
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const testOutput: string[] = [];

        try {
          // Set up output capture for this test case
          pyodide.runPython(`
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
          const result = pyodide.runPython(`${functionName}(*prepare(${inputString}))`);

          // Convert result to JS
          jsResult = result && typeof result.toJs === 'function' ? result.toJs() : result;

          // Call verify function to check result and get output string
          const verifyResult = pyodide.runPython(`verify(${functionName}(*prepare(${inputString})), ${JSON.stringify(testCase.output)})`);
          const verifyJs = verifyResult && typeof verifyResult.toJs === 'function' ? verifyResult.toJs() : verifyResult;

          passed = verifyJs[0];
          outputStr = verifyJs[1] || '';

          // Get output for this test case
          const capturedOutput = pyodide.runPython('test_output.getvalue()');
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
          pyodide.runPython('sys.stdout = sys.__stdout__');
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

}