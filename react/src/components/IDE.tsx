import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { indentUnit } from '@codemirror/language';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useTheme } from '../context/ThemeContext';
import { Play, Square, RotateCcw } from 'lucide-react';
import './IDE.css';

interface IDEProps {
  template: string;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
}

export interface IDEHandle {
  getCode: () => string;
  resetTemplate: () => void;
}

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#F8FAFC',
    color: '#0A1628',
  },
  '.cm-content': {
    caretColor: '#3B82F6',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#3B82F6',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection, .cm-line ::selection': {
    backgroundColor: 'rgba(59, 130, 246, 0.4) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(241, 245, 249, 0.3)',
  },
  '.cm-gutters': {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#FFFFFF',
  },
}, { dark: false });

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0F172A',
    color: '#E2E8F0',
  },
  '.cm-content': {
    caretColor: '#60A5FA',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#60A5FA',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection, .cm-line ::selection': {
    backgroundColor: 'rgba(96, 165, 250, 0.5) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
  },
  '.cm-gutters': {
    backgroundColor: '#1E293B',
    color: '#94A3B8',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1E293B',
  },
}, { dark: true });

const darkHighlighting = syntaxHighlighting(HighlightStyle.define([
  { tag: t.keyword, color: '#C792EA' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#E2E8F0' },
  { tag: [t.function(t.variableName), t.labelName], color: '#82AAFF' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#FFCB6B' },
  { tag: [t.definition(t.name), t.separator], color: '#E2E8F0' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#F78C6C' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#89DDFF' },
  { tag: [t.meta, t.comment], color: '#546E7A', fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#89DDFF', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#C792EA' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#F78C6C' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#C3E88D' },
  { tag: t.invalid, color: '#FF5370' },
]));

export const IDE = forwardRef<IDEHandle, IDEProps>(function IDE(
  { template, isRunning, onRun, onStop, onReset },
  ref
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const templateRef = useRef(template);
  const { activeTheme } = useTheme();

  const initEditor = useCallback((forceTemplate = false) => {
    if (!editorRef.current) return;

    const currentDoc = (forceTemplate || !viewRef.current || viewRef.current.state.doc.toString().trim() === '')
      ? template
      : viewRef.current.state.doc.toString();

    const isDarkMode = activeTheme === 'dark';

    const extensions = [
      basicSetup,
      indentUnit.of('    '),
      keymap.of([indentWithTab]),
      python(),
      isDarkMode ? darkTheme : lightTheme,
      isDarkMode ? darkHighlighting : [],
    ];

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    viewRef.current = new EditorView({
      parent: editorRef.current,
      doc: currentDoc,
      extensions,
    });
  }, [activeTheme, template]);

  useEffect(() => {
    initEditor(false);
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, [initEditor]);

  useEffect(() => {
    if (template !== templateRef.current) {
      templateRef.current = template;
      initEditor(true);
    }
  }, [template, initEditor]);

  useImperativeHandle(ref, () => ({
    getCode: () => {
      return viewRef.current?.state.doc.toString() || '';
    },
    resetTemplate: () => {
      if (isRunning) {
        onStop();
      }
      initEditor(true);
      onReset();
    },
  }), [initEditor, isRunning, onStop, onReset]);

  return (
    <div className="ide">
      <div className="ide-toolbar">
        <div className="ide-toolbar-left">
          <span className="ide-label">Python</span>
        </div>
        <div className="ide-toolbar-right">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => {
              if (isRunning) {
                onStop();
              }
              initEditor(true);
              onReset();
            }}
            title="Reset to template"
          >
            <RotateCcw size={16} />
          </button>
          {isRunning ? (
            <button className="btn btn-secondary" onClick={onStop}>
              <Square size={16} />
              <span>Stop</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onRun}>
              <Play size={16} />
              <span>Run</span>
            </button>
          )}
        </div>
      </div>
      <div className="ide-editor" ref={editorRef} />
    </div>
  );
});
