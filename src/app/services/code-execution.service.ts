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
    language: string, 
    testCases: any[], 
    functionName: string,
    orderMatters: boolean = true,
    questionName?: string
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const output: string[] = [];

    try {
      if (language === 'python') {
        return await this.executePython(code, testCases, functionName, startTime, output, orderMatters);
      } else {
        throw new Error(`Unsupported language: ${language}. Only Python is supported.`);
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
    output: string[],
    orderMatters: boolean = true
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
          
          // Convert Pyodide result to JS immediately to avoid proxy destruction
          const jsResult = result && typeof result.toJs === 'function' ? result.toJs() : result;
          
          // Get output for this test case
          const capturedOutput = pyodide.runPython('test_output.getvalue()');
          if (capturedOutput) {
            testOutput.push(...capturedOutput.split('\n').filter((line: string) => line.trim()));
          }
          
          testResults.push({
            id: testCase.id,
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: jsResult,
            passed: this.deepEqual(jsResult, testCase.output, orderMatters),
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

  private deepEqual(a: any, b: any, orderMatters: boolean = true): boolean {
    if (a === b) return true;
    
    // Handle null/undefined cases
    if (a == null || b == null) return a === b;
    
    // Since we now convert Pyodide objects earlier, we don't need to do it here
    const normalizedA = a;
    const normalizedB = b;
    
    // Check if both are arrays (handles Pyodide arrays too)
    const isArrayA = Array.isArray(normalizedA) || (normalizedA && typeof normalizedA[Symbol.iterator] === 'function' && typeof normalizedA.length === 'number');
    const isArrayB = Array.isArray(normalizedB) || (normalizedB && typeof normalizedB[Symbol.iterator] === 'function' && typeof normalizedB.length === 'number');
    
    if (isArrayA && isArrayB) {
      const arrayA = Array.from(normalizedA);
      const arrayB = Array.from(normalizedB);
      if (arrayA.length !== arrayB.length) return false;
      
      if (!orderMatters) {
        // For order-agnostic comparison (like Group Anagrams)
        // Check if it's a 2D array
        if (arrayA.length > 0 && Array.isArray(arrayA[0])) {
          // Sort both arrays and their sub-arrays for comparison
          const sortedA = (arrayA as any[][]).map(arr => [...arr].sort()).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
          const sortedB = (arrayB as any[][]).map(arr => [...arr].sort()).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
          return this.deepEqual(sortedA, sortedB, true); // Use order-sensitive comparison for sorted arrays
        } else {
          // For 1D arrays, just sort and compare
          const sortedA = [...arrayA].sort();
          const sortedB = [...arrayB].sort();
          return this.deepEqual(sortedA, sortedB, true);
        }
      }
      
      return arrayA.every((val, index) => this.deepEqual(val, arrayB[index], orderMatters));
    }
    
    // Handle objects
    if (typeof normalizedA === 'object' && typeof normalizedB === 'object' && normalizedA !== null && normalizedB !== null && !isArrayA && !isArrayB) {
      const keysA = Object.keys(normalizedA);
      const keysB = Object.keys(normalizedB);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.deepEqual(normalizedA[key], normalizedB[key]));
    }
    
    // For primitive types and final comparison
    return normalizedA === normalizedB;
  }
}