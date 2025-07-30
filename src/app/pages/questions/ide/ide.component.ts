import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";

@Component({
  selector: "app-ide",
  imports: [],
  templateUrl: "./ide.component.html",
  styleUrl: "./ide.component.scss",
})
export class IdeComponent implements AfterViewInit, OnChanges {
  @ViewChild("editor") editorElement!: ElementRef;
  @Input() language: string = "python";
  @Input() template: string = "";

  private editorView?: EditorView;

  ngAfterViewInit() {
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      (changes["language"] || changes["template"]) &&
      this.editorElement
    ) {
      this.initEditor();
    }
  }

  private initEditor() {
    const doc = this.template || "";
    let languageExtension;

    switch (this.language) {
      case "python":
        languageExtension = python();
        break;
      case "javascript":
      case "typescript":
        languageExtension = javascript();
        break;
      default:
        languageExtension = python();
    }

    if (this.editorView) {
      this.editorView.destroy();
    }
    this.editorView = new EditorView({
      parent: this.editorElement.nativeElement,
      doc,
      extensions: [basicSetup, languageExtension],
    });
  }

  getCode(): string {
    if (!this.editorView) {
      return "";
    }
    return this.editorView.state.doc.toString();
  }

  getFunctionName(): string {
    // Extract function name from template
    if (this.template) {
      if (this.language === "python") {
        const match = this.template.match(/def\s+(\w+)\s*\(/);
        return match ? match[1] : "function";
      } else {
        const match = this.template.match(/function\s+(\w+)\s*\(/);
        return match ? match[1] : "function";
      }
    }
    
    // Fallback to generic name
    return "function";
  }
}
