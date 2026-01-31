import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SidebarContextType {
  isVisible: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setVisible: (visible: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar_visible';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const setVisible = useCallback((visible: boolean) => {
    setIsVisible(visible);
    localStorage.setItem(STORAGE_KEY, String(visible));
  }, []);

  const toggle = useCallback(() => {
    setVisible(!isVisible);
  }, [isVisible, setVisible]);

  const open = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const close = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  return (
    <SidebarContext.Provider value={{ isVisible, toggle, open, close, setVisible }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
