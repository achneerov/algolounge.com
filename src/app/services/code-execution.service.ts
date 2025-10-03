import { Injectable } from '@angular/core';
import { TestResult, ExecutionResult } from '../pages/questions/console/console.component';

@Injectable({
  providedIn: 'root'
})
export class CodeExecutionService {
  private worker: Worker | null = null;
  private workerReady: boolean = false;

  constructor() {}

  async initPyodide(): Promise<void> {
    if (this.workerReady) {
      return;
    }

    if (!this.worker) {
      this.worker = new Worker(new URL('../workers/code-execution.worker', import.meta.url), {
        type: 'module'
      });

      // Wait for worker to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Worker initialization timeout'));
        }, 30000);

        this.worker!.onmessage = (e) => {
          if (e.data.type === 'ready') {
            clearTimeout(timeout);
            this.workerReady = true;
            resolve();
          }
        };

        this.worker!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };

        this.worker!.postMessage({ type: 'init' });
      });
    }
  }

  async executeCode(
    code: string,
    testCases: any[],
    functionName: string,
    prepareCode: string,
    verifyCode: string,
    timeout: number = 5000
  ): Promise<ExecutionResult> {
    await this.initPyodide();

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const timeoutId = setTimeout(() => {
        // Terminate the worker on timeout
        if (this.worker) {
          this.worker.terminate();
          this.worker = null;
          this.workerReady = false;
        }

        const timeoutSeconds = Math.round(timeout / 1000);
        resolve({
          testResults: [{
            id: 1,
            input: {},
            expectedOutput: null,
            actualOutput: null,
            passed: false,
            error: `⏱️ Execution timeout (${timeoutSeconds}s). Your code may have an infinite loop or is taking too long. The worker has been reset - you can run your code again.`,
            output: []
          }],
          executionTime: timeout,
          passedCount: 0,
          totalCount: 1,
          output: []
        });
      }, timeout);

      const messageHandler = (e: MessageEvent) => {
        clearTimeout(timeoutId);
        this.worker!.removeEventListener('message', messageHandler);

        if (e.data.type === 'result') {
          resolve(e.data.result);
        } else if (e.data.type === 'error') {
          resolve({
            testResults: [{
              id: 1,
              input: {},
              expectedOutput: null,
              actualOutput: null,
              passed: false,
              error: e.data.error,
              output: []
            }],
            executionTime: 0,
            passedCount: 0,
            totalCount: 1,
            output: []
          });
        }
      };

      const errorHandler = (error: ErrorEvent) => {
        clearTimeout(timeoutId);
        this.worker!.removeEventListener('error', errorHandler);

        resolve({
          testResults: [{
            id: 1,
            input: {},
            expectedOutput: null,
            actualOutput: null,
            passed: false,
            error: error.message || 'Worker error',
            output: []
          }],
          executionTime: 0,
          passedCount: 0,
          totalCount: 1,
          output: []
        });
      };

      this.worker.addEventListener('message', messageHandler);
      this.worker.addEventListener('error', errorHandler);

      this.worker.postMessage({
        type: 'execute',
        code,
        testCases,
        functionName,
        prepareCode,
        verifyCode,
        timeout
      });
    });
  }
}