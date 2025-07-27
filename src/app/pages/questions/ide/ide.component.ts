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
  @Input() params: string[] = [];
  @Input() language: string = "python";
  @Input() functionSignature: string = "";

  private editorView?: EditorView;

  ngAfterViewInit() {
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      (changes["params"] || changes["language"] || changes["functionSignature"]) &&
      this.editorElement
    ) {
      this.initEditor();
    }
  }

  private initEditor() {
    let doc = "";
    let languageExtension;

    if (this.functionSignature) {
      doc = `${this.functionSignature}\n  `;
    } else {
      const paramList = (this.params || []).join(", ");
      if (this.language === "python") {
        doc = `def function(${paramList}):\n  `;
      } else if (this.language === "javascript" || this.language === "typescript") {
        doc = `function containsDuplicate(${paramList}) {\n  \n}`;
      }
    }

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
    if (this.language === "python") {
      return "function";
    } else {
      // For JS/TS, extract function name from signature or default to containsDuplicate
      if (this.functionSignature) {
        const match = this.functionSignature.match(/function\s+(\w+)/);
        return match ? match[1] : "containsDuplicate";
      }
      return "containsDuplicate";
    }
  }
}
