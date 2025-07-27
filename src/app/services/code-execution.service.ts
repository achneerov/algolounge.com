import { Injectable } from '@angular/core';
import { loadPyodide, PyodideInterface } from 'pyodide';
import { TestResult, ExecutionResult } from '../pages/questions/console/console.component';

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

    this.pyodideLoading = loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/"
    });

    this.pyodide = await this.pyodideLoading;
    return this.pyodide;
  }

  async executeCode(
    code: string, 
    language: string, 
    testCases: any[], 
    functionName: string
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const testResults: TestResult[] = [];
    const output: string[] = [];

    try {
      if (language === 'python') {
        return await this.executePython(code, testCases, functionName, startTime, output);
      } else if (language === 'javascript' || language === 'typescript') {
        return await this.executeJavaScript(code, testCases, functionName, startTime, output);
      } else {
        throw new Error(`Unsupported language: ${language}`);
      }
    } catch (error) {
      const endTime = performance.now();
      return {
        testResults: [{
          id: 1,
          input: {},
          expectedOutput: null,
          actualOutput: null,
          passed: false,
          error: error instanceof Error ? error.message : String(error)
        }],
        executionTime: Math.round(endTime - startTime),
        passedCount: 0,
        totalCount: 1,
        output
      };
    }
  }

  private async executePython(
    code: string, 
    testCases: any[], 
    functionName: string, 
    startTime: number,
    output: string[]
  ): Promise<ExecutionResult> {
    const pyodide = await this.initPyodide();
    const testResults: TestResult[] = [];

    try {
      // Execute the user's code
      pyodide.runPython(code);

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

          // Prepare the function call
          const args = Object.values(testCase.input);
          const argString = args.map(arg => JSON.stringify(arg)).join(', ');
          
          const result = pyodide.runPython(`${functionName}(${argString})`);
          
          // Get output for this test case
          const capturedOutput = pyodide.runPython('test_output.getvalue()');
          if (capturedOutput) {
            testOutput.push(...capturedOutput.split('\n').filter((line: string) => line.trim()));
          }
          
          testResults.push({
            id: testCase.id,
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: result,
            passed: this.deepEqual(result, testCase.output),
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

  private async executeJavaScript(
    code: string, 
    testCases: any[], 
    functionName: string, 
    startTime: number,
    output: string[]
  ): Promise<ExecutionResult> {
    const testResults: TestResult[] = [];

    try {
      // Execute the user's code in a safe context
      const userFunction = new Function(`
        ${code}
        return ${functionName};
      `)();

      // Run each test case
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const testOutput: string[] = [];
        
        // Capture console.log for this test case
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          testOutput.push(args.map(arg => String(arg)).join(' '));
        };

        try {
          const args = Object.values(testCase.input);
          const result = userFunction(...args);
          
          testResults.push({
            id: testCase.id,
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: result,
            passed: this.deepEqual(result, testCase.output),
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
          console.log = originalLog;
        }
      }

    } catch (error) {
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

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, index) => this.deepEqual(val, b[index]));
    }
    
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.deepEqual(a[key], b[key]));
    }
    
    return false;
  }
}