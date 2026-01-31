import { ExecutionResult, TestResult } from '../types';
import { CheckCircle, XCircle, Clock, Terminal } from 'lucide-react';
import './Console.css';

interface ConsoleProps {
  result: ExecutionResult | null;
  isRunning: boolean;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

function TestResultItem({ test }: { test: TestResult }) {
  return (
    <div className={`test-result ${test.passed ? 'passed' : 'failed'}`}>
      <div className="test-header">
        <div className="test-status">
          {test.passed ? (
            <CheckCircle size={16} className="status-icon success" />
          ) : (
            <XCircle size={16} className="status-icon error" />
          )}
          <span className="test-label">Test {test.id}</span>
        </div>
        <span className={`test-badge ${test.passed ? 'success' : 'error'}`}>
          {test.passed ? 'Passed' : 'Failed'}
        </span>
      </div>

      <div className="test-details">
        <div className="test-row">
          <span className="test-key">Input:</span>
          <code className="test-value">{formatValue(test.input)}</code>
        </div>
        <div className="test-row">
          <span className="test-key">Expected:</span>
          <code className="test-value">{formatValue(test.expectedOutput)}</code>
        </div>
        <div className="test-row">
          <span className="test-key">Output:</span>
          <code className={`test-value ${test.passed ? '' : 'error-text'}`}>
            {test.error ? test.error : formatValue(test.actualOutput)}
          </code>
        </div>

        {test.output && test.output.length > 0 && (
          <div className="test-row">
            <span className="test-key">Console:</span>
            <div className="test-console">
              {test.output.map((line, i) => (
                <div key={i} className="console-line">{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Console({ result, isRunning }: ConsoleProps) {
  if (isRunning) {
    return (
      <div className="console">
        <div className="console-header">
          <Terminal size={16} />
          <span>Console</span>
        </div>
        <div className="console-content">
          <div className="console-loading">
            <div className="spinner" />
            <span>Running tests...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="console">
        <div className="console-header">
          <Terminal size={16} />
          <span>Console</span>
        </div>
        <div className="console-content">
          <div className="console-empty">
            <Terminal size={24} className="empty-icon" />
            <p>Click "Run" to execute your code and see results</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="console">
      <div className="console-header">
        <Terminal size={16} />
        <span>Console</span>
        <div className="console-summary">
          <span className={`summary-text ${result.passedCount === result.totalCount ? 'success' : 'error'}`}>
            {result.passedCount}/{result.totalCount} tests passed
          </span>
          <span className="summary-time">
            <Clock size={14} />
            {result.executionTime}ms
          </span>
        </div>
      </div>
      <div className="console-content">
        <div className="test-results">
          {result.testResults.map((test) => (
            <TestResultItem key={test.id} test={test} />
          ))}
        </div>
      </div>
    </div>
  );
}
