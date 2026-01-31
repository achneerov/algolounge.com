import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { IDE, IDEHandle } from '../components/IDE';
import { Console } from '../components/Console';
import { ContentTabs } from '../components/ContentTabs';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useCodeExecution } from '../hooks/useCodeExecution';
import { useTags } from '../hooks/useTags';
import { useCompletion } from '../context/CompletionContext';
import { useSidebar } from '../context/SidebarContext';
import { Question, ExecutionResult, Tag } from '../types';
import './Questions.css';

export function Questions() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const ideRef = useRef<IDEHandle>(null);
  const { executeCode, stopExecution, initPyodide, isLoading } = useCodeExecution();
  const { getQuestionTags } = useTags();
  const { isCompleted, markCompleted } = useCompletion();
  const { isVisible: sidebarVisible } = useSidebar();

  const [question, setQuestion] = useState<Question | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [questionTags, setQuestionTags] = useState<Tag[]>([]);

  const currentFilename = name || '';
  const completed = isCompleted(currentFilename);

  // Load question data
  useEffect(() => {
    if (!name) return;

    setNotFound(false);
    setExecutionResult(null);

    fetch(`/questions/${name}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data: Question) => {
        setQuestion(data);
        setQuestionTags(getQuestionTags(data.difficulty, data.tags));
        // Preload Pyodide
        initPyodide().catch(console.warn);
      })
      .catch(() => {
        setNotFound(true);
      });
  }, [name, getQuestionTags, initPyodide]);

  const handleRun = useCallback(async () => {
    if (!ideRef.current || !question) return;

    setIsRunning(true);
    setExecutionResult(null);

    try {
      const code = ideRef.current.getCode();
      const result = await executeCode(
        code,
        question.test_cases,
        question.entry_function,
        question.prepare,
        question.verify
      );

      setExecutionResult(result);

      // Check if all tests passed
      if (result.passedCount === result.totalCount && result.totalCount > 0) {
        if (!completed) {
          await markCompleted(currentFilename);
        }
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Execution error:', error);
      setExecutionResult({
        testResults: [{
          id: 1,
          input: {},
          expectedOutput: null,
          actualOutput: null,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          output: []
        }],
        executionTime: 0,
        passedCount: 0,
        totalCount: 1,
        output: []
      });
    } finally {
      setIsRunning(false);
    }
  }, [question, executeCode, completed, markCompleted, currentFilename]);

  const handleStop = useCallback(() => {
    stopExecution();
    setIsRunning(false);
  }, [stopExecution]);

  const handleReset = useCallback(() => {
    setExecutionResult(null);
  }, []);

  if (notFound) {
    return (
      <div className="questions-page">
        <div className="not-found">
          <h2>Question Not Found</h2>
          <p>The question "{name}" doesn't exist.</p>
          <button className="btn btn-primary" onClick={() => navigate('/questions/two-sum')}>
            Go to Two Sum
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="questions-page">
        <div className="loading">
          <div className="spinner" />
          <span>Loading question...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="questions-page">
      <SuccessAnimation show={showSuccess} onComplete={() => setShowSuccess(false)} />

      <Sidebar currentQuestionFilename={currentFilename} />

      <main className={`questions-main ${!sidebarVisible ? 'full-width' : ''}`}>
        <div className="questions-layout">
          <div className="left-panel">
            <ContentTabs
              description={question.description}
              solutionText={question.solution_text}
              solutionCode={question.solution_code}
              questionTags={questionTags}
              isCompleted={completed}
            />
          </div>

          <div className="right-panel">
            <div className="ide-container">
              <IDE
                ref={ideRef}
                template={question.template}
                isRunning={isRunning}
                onRun={handleRun}
                onStop={handleStop}
                onReset={handleReset}
              />
            </div>
            <div className="console-container">
              <Console result={executionResult} isRunning={isRunning} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
