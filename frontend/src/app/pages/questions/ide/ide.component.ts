import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  effect,
} from "@angular/core";
import { isPlatformBrowser, CommonModule } from "@angular/common";
import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView as EditorViewClass } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { ButtonModule } from "primeng/button";
import { ThemeService } from "../../../services/theme.service";

@Component({
  selector: "app-ide",
  imports: [CommonModule, ButtonModule],
  templateUrl: "./ide.component.html",
  styleUrl: "./ide.component.scss",
})
export class IdeComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild("editor") editorElement!: ElementRef;
  @Input() template: string = "";
  @Input() questionData: any = null;
  @Input() isRunning: boolean = false;
  @Output() run = new EventEmitter<void>();
  @Output() stop = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  private editorView?: EditorView;
  private forceTemplateReload = false;

  // Custom light theme matching design system
  private getLightTheme() {
    return EditorViewClass.theme({
      "&": {
        backgroundColor: "#F8FAFC",
        color: "#0A1628",
      },
      ".cm-content": {
        caretColor: "#3B82F6",
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "#3B82F6",
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection, .cm-line ::selection": {
        backgroundColor: "rgba(59, 130, 246, 0.4) !important",
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(241, 245, 249, 0.3)",
      },
      ".cm-gutters": {
        backgroundColor: "#F1F5F9",
        color: "#64748B",
        border: "none",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "#FFFFFF",
      },
    }, { dark: false });
  }

  // Custom dark theme matching design system
  private getDarkTheme() {
    return EditorViewClass.theme({
      "&": {
        backgroundColor: "#0F172A",
        color: "#E2E8F0",
      },
      ".cm-content": {
        caretColor: "#60A5FA",
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "#60A5FA",
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection, .cm-line ::selection": {
        backgroundColor: "rgba(96, 165, 250, 0.5) !important",
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(30, 41, 59, 0.3)",
      },
      ".cm-gutters": {
        backgroundColor: "#1E293B",
        color: "#94A3B8",
        border: "none",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "#1E293B",
      },
    }, { dark: true });
  }

  // Custom syntax highlighting for dark theme
  private getDarkHighlighting() {
    return syntaxHighlighting(HighlightStyle.define([
      { tag: t.keyword, color: "#C792EA" },           // Purple for keywords (def, class, if, etc.)
      { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: "#E2E8F0" },
      { tag: [t.function(t.variableName), t.labelName], color: "#82AAFF" }, // Blue for functions
      { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: "#FFCB6B" }, // Yellow for constants
      { tag: [t.definition(t.name), t.separator], color: "#E2E8F0" },
      { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: "#F78C6C" }, // Orange
      { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: "#89DDFF" }, // Cyan
      { tag: [t.meta, t.comment], color: "#546E7A", fontStyle: "italic" }, // Muted for comments
      { tag: t.strong, fontWeight: "bold" },
      { tag: t.emphasis, fontStyle: "italic" },
      { tag: t.strikethrough, textDecoration: "line-through" },
      { tag: t.link, color: "#89DDFF", textDecoration: "underline" },
      { tag: t.heading, fontWeight: "bold", color: "#C792EA" },
      { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#F78C6C" },
      { tag: [t.processingInstruction, t.string, t.inserted], color: "#C3E88D" }, // Green for strings
      { tag: t.invalid, color: "#FF5370" }, // Red for errors
    ]));
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService
  ) {
    // Listen to theme changes and update editor
    effect(() => {
      const theme = this.themeService.activeTheme();
      if (this.editorView) {
        this.initEditor();
      }
    });
  }

  ngAfterViewInit() {
    this.initEditor();
  }

  ngOnDestroy() {
    if (this.editorView) {
      this.editorView.destroy();
    }
  }


  ngOnChanges(changes: SimpleChanges) {
    if (
      changes["template"] &&
      this.editorElement
    ) {
      // Force template reload when template changes
      this.forceTemplateReload = true;
      this.initEditor();
    }
  }

  private initEditor() {
    // Use template if forced reload or no editor exists, otherwise preserve content
    const currentDoc = (this.forceTemplateReload || !this.editorView || this.editorView.state.doc.toString().trim() === "")
      ? (this.template || "")
      : this.editorView.state.doc.toString();

    // Reset the force reload flag
    this.forceTemplateReload = false;
    const languageExtension = python();

    // Get current theme from theme service
    const isDarkMode = this.themeService.activeTheme() === 'dark';

    const extensions = [
      basicSetup,
      keymap.of([indentWithTab]),
      languageExtension,
      isDarkMode ? this.getDarkTheme() : this.getLightTheme(),
      isDarkMode ? this.getDarkHighlighting() : []
    ];

    if (this.editorView) {
      this.editorView.destroy();
    }
    this.editorView = new EditorView({
      parent: this.editorElement.nativeElement,
      doc: currentDoc,
      extensions,
    });
  }

  getCode(): string {
    if (!this.editorView) {
      return "";
    }
    return this.editorView.state.doc.toString();
  }



  resetTemplate(): void {
    // If code is running, stop it first
    if (this.isRunning) {
      this.stop.emit();
    }

    if (this.template && this.editorView) {
      // Force template reload and reinitialize editor
      this.forceTemplateReload = true;
      this.initEditor();
    }
    
    // Emit reset event to parent to clear console output
    this.reset.emit();
  }

  onRun(): void {
    this.run.emit();
  }
}
