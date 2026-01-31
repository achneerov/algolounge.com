import { useRef, useCallback, useState } from 'react';
import { ExecutionResult } from '../types';

export function useCodeExecution() {
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef(false);
  const interruptBufferRef = useRef<Int32Array | null>(null);
  const currentTimeoutRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initPyodide = useCallback(async (): Promise<void> => {
    if (workerReadyRef.current) {
      return;
    }

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/code-execution.worker.ts', import.meta.url),
        { type: 'module' }
      );

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Worker initialization timeout'));
        }, 30000);

        const messageHandler = (e: MessageEvent) => {
          if (e.data.type === 'ready') {
            clearTimeout(timeout);
            workerReadyRef.current = true;
            workerRef.current!.removeEventListener('message', messageHandler);
            resolve();
          } else if (e.data.type === 'interruptBuffer') {
            interruptBufferRef.current = e.data.buffer;
          }
        };

        workerRef.current!.addEventListener('message', messageHandler);

        workerRef.current!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };

        workerRef.current!.postMessage({ type: 'init' });
      });
    }
  }, []);

  const executeCode = useCallback(async (
    code: string,
    testCases: any[],
    functionName: string,
    prepareCode: string,
    verifyCode: string,
    timeout: number = 5000
  ): Promise<ExecutionResult> => {
    setIsLoading(true);

    try {
      await initPyodide();

      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const timeoutId = setTimeout(() => {
          stopExecution();

          const timeoutSeconds = Math.round(timeout / 1000);
          resolve({
            testResults: [{
              id: 1,
              input: {},
              expectedOutput: null,
              actualOutput: null,
              passed: false,
              error: `Execution timeout (${timeoutSeconds}s). Your code may have an infinite loop or is taking too long.`,
              output: []
            }],
            executionTime: timeout,
            passedCount: 0,
            totalCount: 1,
            output: []
          });
        }, timeout);

        currentTimeoutRef.current = timeoutId as unknown as number;

        const messageHandler = (e: MessageEvent) => {
          if (currentTimeoutRef.current) {
            clearTimeout(currentTimeoutRef.current);
            currentTimeoutRef.current = null;
          }
          workerRef.current!.removeEventListener('message', messageHandler);
          setIsLoading(false);

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
          if (currentTimeoutRef.current) {
            clearTimeout(currentTimeoutRef.current);
            currentTimeoutRef.current = null;
          }
          workerRef.current!.removeEventListener('error', errorHandler);
          setIsLoading(false);

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

        workerRef.current.addEventListener('message', messageHandler);
        workerRef.current.addEventListener('error', errorHandler);

        workerRef.current.postMessage({
          type: 'execute',
          code,
          testCases,
          functionName,
          prepareCode,
          verifyCode,
          timeout
        });
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [initPyodide]);

  const stopExecution = useCallback(() => {
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    if (workerRef.current && interruptBufferRef.current) {
      Atomics.store(interruptBufferRef.current, 0, 2);
    } else if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      workerReadyRef.current = false;
    }

    setIsLoading(false);
  }, []);

  return {
    executeCode,
    stopExecution,
    initPyodide,
    isLoading
  };
}
