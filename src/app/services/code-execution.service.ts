import { Injectable } from '@angular/core';
import { TestResult, ExecutionResult } from '../pages/questions/console/console.component';

@Injectable({
  providedIn: 'root'
})
export class CodeExecutionService {
  private worker: Worker | null = null;
  private workerReady: boolean = false;
  private interruptBuffer: Int32Array | null = null;
  private currentExecutionTimeout: number | null = null;

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

        const messageHandler = (e: MessageEvent) => {
          if (e.data.type === 'ready') {
            clearTimeout(timeout);
            this.workerReady = true;
            this.worker!.removeEventListener('message', messageHandler);
            resolve();
          } else if (e.data.type === 'interruptBuffer') {
            this.interruptBuffer = e.data.buffer;
          }
        };

        this.worker!.addEventListener('message', messageHandler);

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
        this.stopExecution();

        const timeoutSeconds = Math.round(timeout / 1000);
        resolve({
          testResults: [{
            id: 1,
            input: {},
            expectedOutput: null,
            actualOutput: null,
            passed: false,
            error: `⏱️ Execution timeout (${timeoutSeconds}s). Your code may have an infinite loop or is taking too long.`,
            output: []
          }],
          executionTime: timeout,
          passedCount: 0,
          totalCount: 1,
          output: []
        });
      }, timeout);

      this.currentExecutionTimeout = timeoutId as any;

      const messageHandler = (e: MessageEvent) => {
        if (this.currentExecutionTimeout) {
          clearTimeout(this.currentExecutionTimeout);
          this.currentExecutionTimeout = null;
        }
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
        if (this.currentExecutionTimeout) {
          clearTimeout(this.currentExecutionTimeout);
          this.currentExecutionTimeout = null;
        }
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

  stopExecution(): void {
    // Clear the timeout
    if (this.currentExecutionTimeout) {
      clearTimeout(this.currentExecutionTimeout);
      this.currentExecutionTimeout = null;
    }

    // Send interrupt signal if available, otherwise terminate worker
    if (this.worker && this.interruptBuffer) {
      Atomics.store(this.interruptBuffer, 0, 2);
    } else if (this.worker) {
      // Fallback: terminate and reset worker if SharedArrayBuffer not available
      this.worker.terminate();
      this.worker = null;
      this.workerReady = false;
    }
  }
}