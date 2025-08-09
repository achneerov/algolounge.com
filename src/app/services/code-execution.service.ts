import { Injectable } from '@angular/core';
import { TestResult, ExecutionResult } from '../pages/questions/console/console.component';

declare global {
  interface Window {
    loadPyodide: any;
    cheerpjInit: any;
    cheerpjRunJar: any;
    cheerpOSAddStringFile: any;
    cjFileBlob: any;
    JSZip: any;
  }
}

interface PyodideInterface {
  runPython: (code: string) => any;
}

@Injectable({
  providedIn: 'root'
})
export class CodeExecutionService {
  private readonly JAVA_LINE_OFFSET = 3; // Lines added before user code in Java wrapper
  private pyodide: PyodideInterface | null = null;
  private pyodideLoading: Promise<PyodideInterface> | null = null;
  private cheerpjInitialized = false;
  private cheerpjInitializing: Promise<void> | null = null;

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

  async initCheerpJ(): Promise<void> {
    if (this.cheerpjInitialized) {
      return;
    }

    if (this.cheerpjInitializing) {
      return this.cheerpjInitializing;
    }

    this.cheerpjInitializing = this.loadCheerpJScripts();
    await this.cheerpjInitializing;
    this.cheerpjInitialized = true;
  }

  private async loadCheerpJScripts(): Promise<void> {
    // Load CheerpJ loader
    if (!window.cheerpjInit) {
      await this.loadScript('https://cjrtnc.leaningtech.com/4.2/loader.js');
    }
    
    // Load JSZip for creating JAR files
    if (!window.JSZip) {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    }

    // Initialize CheerpJ
    console.log('[CHEERPJ] Calling cheerpjInit()...');
    await window.cheerpjInit();
    console.log('[CHEERPJ] cheerpjInit() completed');
  }

  private async loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
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
    const testResults: TestResult[] = [];
    const output: string[] = [];

    try {
      if (language === 'python') {
        return await this.executePython(code, testCases, functionName, startTime, output, orderMatters);
      } else if (language === 'javascript' || language === 'typescript') {
        // For TypeScript, strip type annotations before execution
        const processedCode = language === 'typescript' ? this.stripTypeScript(code) : code;
        return await this.executeJavaScript(processedCode, testCases, functionName, startTime, output, orderMatters);
      } else if (language === 'java') {
        return await this.executeJava(code, testCases, functionName, startTime, output, orderMatters, questionName);
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

  private async executeJavaScript(
    code: string, 
    testCases: any[], 
    functionName: string, 
    startTime: number,
    output: string[],
    orderMatters: boolean = true
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
            passed: this.deepEqual(result, testCase.output, orderMatters),
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

  private async executeJava(
    code: string,
    testCases: any[],
    functionName: string,
    startTime: number,
    output: string[],
    orderMatters: boolean = true,
    questionName?: string
  ): Promise<ExecutionResult> {
    const testResults: TestResult[] = [];

    try {
      // Initialize CheerpJ
      await this.initCheerpJ();

      // Load ECJ jar from assets and upload to virtual filesystem
      const response = await fetch('/assets/ecj.jar');
      if (!response.ok) {
        throw new Error('Failed to load ECJ compiler jar');
      }
      const ecjData = await response.arrayBuffer();
      await window.cheerpOSAddStringFile("/str/ecj.jar", new Uint8Array(ecjData));

      // Create question-specific directory path
      const outputDir = questionName ? `/files/${questionName}` : '/files';
      
      // Get Java template to extract method signature
      const javaTemplate = await this.getJavaTemplate(questionName);
      const signature = this.parseJavaMethodSignature(javaTemplate, functionName);
      
      // Check if TestRunner is already compiled for this question
      const lastCompiledQuestion = sessionStorage.getItem('lastCompiledJavaQuestion');
      const isTestRunnerCompiled = lastCompiledQuestion === questionName;
      
      // Always write user's Solution.java file
      await window.cheerpOSAddStringFile("/str/Solution.java", code);
      
      // Only compile TestRunner if not already compiled for this question
      if (!isTestRunnerCompiled) {
        const testRunnerCode = this.createTestRunner(functionName, signature, testCases);
        await window.cheerpOSAddStringFile("/str/TestRunner.java", testRunnerCode);
      }

      // Compile the Java code and capture compilation output
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      const compilationOutput: string[] = [];
      
      // Capture both console.log and console.error during compilation
      console.log = (...args: any[]) => {
        const line = args.map(arg => String(arg)).join(' ');
        compilationOutput.push(line);
        originalConsoleLog(...args);
      };
      
      console.error = (...args: any[]) => {
        const line = args.map(arg => String(arg)).join(' ');
        compilationOutput.push(line);
        originalConsoleError(...args);
      };

      const ecjStartTime = performance.now();
      
      // Compile files based on what needs compilation
      const filesToCompile: string[] = ["/str/Solution.java"];
      if (!isTestRunnerCompiled) {
        filesToCompile.push("/str/TestRunner.java");
        console.log(`[JAVA] Compiling TestRunner for question: ${questionName}`);
      } else {
        console.log(`[JAVA] Using cached TestRunner for question: ${questionName}`);
      }
      
      try {
        await window.cheerpjRunJar(
          "/str/ecj.jar",
          "-source",
          "1.7",
          "-target", 
          "1.7",
          "-d",
          outputDir,
          ...filesToCompile
        );
        const ecjEndTime = performance.now();
        console.log(`[TIMING] ECJ compilation: ${Math.round(ecjEndTime - ecjStartTime)}ms`);
        
        // Mark this question's TestRunner as compiled
        if (!isTestRunnerCompiled) {
          sessionStorage.setItem('lastCompiledJavaQuestion', questionName || '');
        }
      } finally {
        // Restore original console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
      }

      // Check for compilation errors FIRST, before checking for class files
      // This prevents using old successful class files when current compilation failed
      const errorLines = compilationOutput.filter(line => 
        line.includes('ERROR') || 
        line.includes('error') ||
        line.includes('cannot find symbol') ||
        line.includes('cannot resolve') ||
        line.includes('incompatible types') ||
        line.includes('method') && line.includes('cannot be applied') ||
        line.includes('problems (') && line.includes('errors')
      );
      
      if (errorLines.length > 0) {
        throw new Error(this.formatCompilationError(errorLines));
      } else if (compilationOutput.length > 0 && compilationOutput.some(line => line.includes('problems (') && line.includes('errors'))) {
        throw new Error(this.formatCompilationError(compilationOutput));
      }

      // Check for required class files
      const testRunnerBlob = await window.cjFileBlob(`${outputDir}/TestRunner.class`);
      if (!testRunnerBlob) {
        throw new Error("Compilation failed - TestRunner class file not generated");
      }
      
      const solutionBlob = await window.cjFileBlob(`${outputDir}/Solution.class`);
      if (!solutionBlob) {
        throw new Error("Compilation failed - Solution class file not generated");
      }

      // Create JAR file with proper structure
      const manifest = `Manifest-Version: 1.0\r\nMain-Class: TestRunner\r\n\r\n`;
      const zip = new window.JSZip();
      zip.file("META-INF/MANIFEST.MF", manifest);
      
      // Add compiled class files
      const testRunnerData = await testRunnerBlob.arrayBuffer();
      const solutionData = await solutionBlob.arrayBuffer();
      
      zip.file("TestRunner.class", testRunnerData);
      zip.file("Solution.class", solutionData);

      // Generate and upload JAR
      const jarStartTime = performance.now();
      const jarBlob = await zip.generateAsync({ type: "blob" });
      const jarBytes = await jarBlob.arrayBuffer();
      const jarPath = `/str/solution.jar`;
      await window.cheerpOSAddStringFile(jarPath, new Uint8Array(jarBytes));
      const jarEndTime = performance.now();
      console.log(`[TIMING] JAR creation: ${Math.round(jarEndTime - jarStartTime)}ms`);

      // Execute the JAR and capture results
      const executionConsoleLog = console.log;
      const capturedOutput: string[] = [];
      const userOutput: string[] = [];
      
      console.log = (...args: any[]) => {
        const line = args.map(arg => String(arg)).join(' ');
        capturedOutput.push(line);
        
        // Check if this is a test result line or user output
        if (!line.includes('TEST_RESULT_START') && 
            !line.includes('TEST_RESULT_END') &&
            !line.includes('USER_OUTPUT_START') &&
            !line.includes('USER_OUTPUT_END') &&
            !line.startsWith('ID:') &&
            !line.startsWith('INPUT:') &&
            !line.startsWith('EXPECTED:') &&
            !line.startsWith('ACTUAL:') &&
            !line.startsWith('ERROR:')) {
          userOutput.push(line);
        }
      };

      const executionStartTime = performance.now();
      try {
        await window.cheerpjRunJar(jarPath);
        
        // Parse the captured output to extract test results
        testResults.push(...this.parseJavaTestResults(capturedOutput, testCases, orderMatters));
        
      } finally {
        const executionEndTime = performance.now();
        console.log = executionConsoleLog;
        executionConsoleLog(`[TIMING] User code execution: ${Math.round(executionEndTime - executionStartTime)}ms`);
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


  private parseJavaMethodSignature(template: string, functionName: string): { returnType: string, parameters: string } {
    // Extract method signature from template
    // Example: "public int[] twoSum(int[] nums, int target)" -> { returnType: "int[]", parameters: "int[] nums, int target" }
    const methodRegex = new RegExp(`public\\s+(.+?)\\s+${functionName}\\s*\\(([^)]*)\\)`);
    const match = template.match(methodRegex);
    
    if (!match) {
      throw new Error(`Could not parse method signature for function: ${functionName}`);
    }
    
    return {
      returnType: match[1].trim(),
      parameters: match[2].trim()
    };
  }

  private createTestRunner(functionName: string, signature: { returnType: string, parameters: string }, testCases: any[]): string {
    // Create test execution logic
    const testExecutionCode = testCases.map((testCase) => {
      const args = Object.values(testCase.input);
      const argList = args.map(arg => this.javaValueToString(arg)).join(', ');
      
      return `
        try {
            System.out.println("USER_OUTPUT_START");
            Solution solution = new Solution();
            ${signature.returnType} result = solution.${functionName}(${argList});
            System.out.println("USER_OUTPUT_END");
            System.out.println("TEST_RESULT_START");
            System.out.println("ID:" + ${testCase.id});
            System.out.println("INPUT:" + "${this.escapeString(JSON.stringify(testCase.input))}");
            System.out.println("EXPECTED:" + "${this.escapeString(JSON.stringify(testCase.output))}");
            System.out.println("ACTUAL:" + objectToJson(result));
            System.out.println("TEST_RESULT_END");
        } catch (Exception e) {
            System.out.println("USER_OUTPUT_END");
            System.out.println("TEST_RESULT_START");
            System.out.println("ID:" + ${testCase.id});
            System.out.println("INPUT:" + "${this.escapeString(JSON.stringify(testCase.input))}");
            System.out.println("EXPECTED:" + "${this.escapeString(JSON.stringify(testCase.output))}");
            System.out.println("ACTUAL:null");
            System.out.println("ERROR:" + e.getMessage());
            System.out.println("TEST_RESULT_END");
        }`;
    }).join('\n');

    return `
import java.util.*;
import java.util.stream.*;

public class TestRunner {
    public static void main(String[] args) {
${testExecutionCode}
    }
    
    private static String objectToJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\\"" + obj.toString() + "\\"";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof int[]) {
            int[] arr = (int[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append(arr[i]);
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof String[]) {
            String[] arr = (String[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append("\\"").append(arr[i]).append("\\"");
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(objectToJson(list.get(i)));
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof int[][]) {
            int[][] arr = (int[][]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append(objectToJson(arr[i]));
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof String[][]) {
            String[][] arr = (String[][]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append(objectToJson(arr[i]));
            }
            sb.append("]");
            return sb.toString();
        }
        return obj.toString();
    }
}`;
  }

  private async getJavaTemplate(questionName?: string): Promise<string> {
    if (!questionName) {
      throw new Error('Question name is required to get Java template');
    }
    
    const response = await fetch(`/questions/${questionName}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load question data for: ${questionName}`);
    }
    
    const questionData = await response.json();
    const javaLanguageData = questionData.languages?.java;
    
    if (!javaLanguageData?.template) {
      throw new Error(`No Java template found for question: ${questionName}`);
    }
    
    return javaLanguageData.template;
  }

  private javaValueToString(value: any): string {
    if (typeof value === 'string') {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return 'new int[0]';
      if (typeof value[0] === 'number') {
        return `new int[]{${value.join(', ')}}`;
      } else if (typeof value[0] === 'string') {
        return `new String[]{"${value.join('", "')}"}`;
      }
    }
    return String(value);
  }

  private escapeString(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  private parseJavaTestResults(output: string[], testCases: any[], orderMatters: boolean): TestResult[] {
    const results: TestResult[] = [];
    let currentResult: any = {};
    let inTestResult = false;
    let inUserOutput = false;
    let currentUserOutput: string[] = [];

    for (const line of output) {
      if (line === 'USER_OUTPUT_START') {
        inUserOutput = true;
        currentUserOutput = [];
      } else if (line === 'USER_OUTPUT_END') {
        inUserOutput = false;
      } else if (line === 'TEST_RESULT_START') {
        inTestResult = true;
        currentResult = { userOutput: [...currentUserOutput] };
      } else if (line === 'TEST_RESULT_END') {
        inTestResult = false;
        if (currentResult.id) {
          const testCase = testCases.find(tc => tc.id === parseInt(currentResult.id));
          if (testCase) {
            let actualOutput = null;
            let passed = false;
            let error = undefined;

            if (currentResult.error) {
              error = currentResult.error;
            } else if (currentResult.actual) {
              try {
                actualOutput = JSON.parse(currentResult.actual);
                passed = this.deepEqual(actualOutput, testCase.output, orderMatters);
              } catch (e) {
                actualOutput = currentResult.actual;
                passed = false;
              }
            }

            results.push({
              id: parseInt(currentResult.id),
              input: testCase.input,
              expectedOutput: testCase.output,
              actualOutput,
              passed,
              error,
              output: currentResult.userOutput || []
            });
          }
        }
      } else if (inUserOutput) {
        currentUserOutput.push(line);
      } else if (inTestResult) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');
        if (key === 'ID') currentResult.id = value;
        else if (key === 'INPUT') currentResult.input = value;
        else if (key === 'EXPECTED') currentResult.expected = value;
        else if (key === 'ACTUAL') currentResult.actual = value;
        else if (key === 'ERROR') currentResult.error = value;
      }
    }

    return results;
  }

  private stripTypeScript(code: string): string {
    // Remove type annotations from function parameters and return types
    let jsCode = code;
    
    // Remove return type annotations (: type after function parameters)
    jsCode = jsCode.replace(/\)\s*:\s*[^{]+(?=\s*\{)/g, ')');
    
    // Remove parameter type annotations (: type after parameter name)
    jsCode = jsCode.replace(/(\w+)\s*:\s*[^,)]+/g, '$1');
    
    // Remove variable type annotations including complex object types
    jsCode = jsCode.replace(/:\s*\{[^}]*\}/g, '');
    
    // Remove generic type parameters (<T, U>)
    jsCode = jsCode.replace(/<[^>]+>/g, '');
    
    // Remove interface declarations and type aliases (basic removal)
    jsCode = jsCode.replace(/^(interface|type)\s+\w+.*$/gm, '');
    
    // Remove import type statements
    jsCode = jsCode.replace(/^import\s+type\s+.*$/gm, '');
    
    // Remove as type assertions
    jsCode = jsCode.replace(/\s+as\s+\w+/g, '');
    
    return jsCode.trim();
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

  private formatCompilationError(errorLines: string[]): string {
    // Clean up and format compilation errors for better readability
    const cleanedErrors = errorLines
      .filter(line => line.trim().length > 0)
      .map(line => {
        // Adjust line numbers to match user's IDE - handle ECJ format "(at line X)"
        return line
          .replace(/\(at line (\d+)\)/g, (match, lineNum) => {
            const adjustedLine = Math.max(1, parseInt(lineNum) - this.JAVA_LINE_OFFSET);
            return `(at line ${adjustedLine})`;
          })
          // Also handle other formats like "TestRunner.java:X:"
          .replace(/^.*?TestRunner\.java:(\d+):\s*/, (match, lineNum) => {
            const adjustedLine = Math.max(1, parseInt(lineNum) - this.JAVA_LINE_OFFSET);
            return `Line ${adjustedLine}: `;
          })
          .replace(/^.*?\.java:(\d+):\s*/, (match, lineNum) => {
            const adjustedLine = Math.max(1, parseInt(lineNum) - this.JAVA_LINE_OFFSET);
            return `Line ${adjustedLine}: `;
          })
          .replace(/\s+/g, ' ')
          .trim();
      })
      .filter(line => !line.includes('Note:') && !line.includes('warning:'));

    if (cleanedErrors.length === 0) {
      return 'Compilation failed';
    }

    // Group similar errors and provide a clean summary
    const uniqueErrors = [...new Set(cleanedErrors)];
    
    return `Compilation Error:\n${uniqueErrors.slice(0, 5).join('\n')}${uniqueErrors.length > 5 ? '\n... and more errors' : ''}`;
  }

}