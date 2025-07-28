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
  @Input() functionName: string = "";

  private editorView?: EditorView;

  ngAfterViewInit() {
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      (changes["params"] || changes["language"] || changes["functionSignature"] || changes["functionName"]) &&
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
      const funcName = this.functionName || "function";
      
      if (this.language === "python") {
        doc = `def ${funcName}(${paramList}):\n  `;
      } else if (this.language === "javascript" || this.language === "typescript") {
        const tsTypes = this.language === "typescript" ? this.getTypeScript(funcName) : "";
        doc = `function ${funcName}(${paramList}${tsTypes}) {\n  \n}`;
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
    // First try to use the explicit functionName input
    if (this.functionName) {
      return this.functionName;
    }
    
    // If we have a function signature, extract the name from it
    if (this.functionSignature) {
      if (this.language === "python") {
        const match = this.functionSignature.match(/def\s+(\w+)\s*\(/);
        return match ? match[1] : "function";
      } else {
        const match = this.functionSignature.match(/function\s+(\w+)\s*\(/);
        return match ? match[1] : "function";
      }
    }
    
    // Fallback to generic name
    return "function";
  }

  private getTypeScript(funcName: string): string {
    // Basic TypeScript type annotations based on common function names
    if (funcName === "containsDuplicate") {
      return ": boolean";
    } else if (funcName === "isAnagram") {
      return ": boolean";
    } else if (funcName === "twoSum") {
      return ": number[]";
    } else if (funcName === "groupAnagrams") {
      return ": string[][]";
    }
    return "";
  }
}
