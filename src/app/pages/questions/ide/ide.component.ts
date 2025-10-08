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
} from "@angular/core";
import { isPlatformBrowser, CommonModule } from "@angular/common";
import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { oneDark } from "@codemirror/theme-one-dark";
import { ButtonModule } from "primeng/button";

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

  private editorView?: EditorView;
  private darkModeQuery?: MediaQueryList;
  private darkModeListener?: (e: MediaQueryListEvent) => void;
  private forceTemplateReload = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    this.initEditor();
    this.setupThemeListener();
  }

  ngOnDestroy() {
    if (this.editorView) {
      this.editorView.destroy();
    }
    if (this.darkModeQuery && this.darkModeListener) {
      this.darkModeQuery.removeEventListener('change', this.darkModeListener);
    }
  }

  private setupThemeListener() {
    if (isPlatformBrowser(this.platformId)) {
      this.darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.darkModeListener = () => {
        // Re-initialize editor when theme changes (don't force template reload)
        this.initEditor();
      };
      this.darkModeQuery.addEventListener('change', this.darkModeListener);
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

    // Check if dark mode is active
    const isDarkMode = isPlatformBrowser(this.platformId) && 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches || 
                       document.documentElement.classList.contains('dark-mode'));

    const extensions = [
      basicSetup,
      keymap.of([indentWithTab]),
      languageExtension
    ];
    if (isDarkMode) {
      extensions.push(oneDark);
    }

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
  }

  onRun(): void {
    this.run.emit();
  }
}
