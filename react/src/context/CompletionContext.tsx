import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { completionsApi } from '../api';
import { useAuth } from './AuthContext';

interface CompletionContextType {
  completions: string[];
  isCompleted: (filename: string) => boolean;
  markCompleted: (filename: string) => Promise<void>;
  loadCompletions: () => Promise<void>;
}

const CompletionContext = createContext<CompletionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'completed_questions';

function getLocalCompletions(): string[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function setLocalCompletions(completions: string[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(completions));
}

export function CompletionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [completions, setCompletions] = useState<string[]>(() => getLocalCompletions());

  const loadCompletions = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const response = await completionsApi.getCompletions();
        setCompletions(response.completedQuestions);
      } catch (error) {
        console.error('Failed to load completions:', error);
        // Fallback to local storage
        setCompletions(getLocalCompletions());
      }
    } else {
      setCompletions(getLocalCompletions());
    }
  }, [isAuthenticated]);

  const isCompleted = useCallback((filename: string) => {
    return completions.includes(filename);
  }, [completions]);

  const markCompleted = useCallback(async (filename: string) => {
    if (completions.includes(filename)) return;

    const newCompletions = [...completions, filename];
    setCompletions(newCompletions);

    if (isAuthenticated) {
      try {
        await completionsApi.markCompleted(filename);
      } catch (error) {
        console.error('Failed to mark completion:', error);
        // Still save locally as fallback
        setLocalCompletions(newCompletions);
      }
    } else {
      setLocalCompletions(newCompletions);
    }
  }, [completions, isAuthenticated]);

  // Load completions on mount and when auth changes
  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  return (
    <CompletionContext.Provider value={{ completions, isCompleted, markCompleted, loadCompletions }}>
      {children}
    </CompletionContext.Provider>
  );
}

export function useCompletion() {
  const context = useContext(CompletionContext);
  if (context === undefined) {
    throw new Error('useCompletion must be used within a CompletionProvider');
  }
  return context;
}
