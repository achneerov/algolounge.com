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

@Component({
  selector: "app-ide",
  imports: [],
  templateUrl: "./ide.component.html",
  styleUrl: "./ide.component.scss",
})
export class IdeComponent implements AfterViewInit, OnChanges {
  @ViewChild("editor") editorElement!: ElementRef;
  @Input() params: string[] = [];

  private editorView?: EditorView;

  ngAfterViewInit() {
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes["params"] &&
      !changes["params"].firstChange &&
      this.editorElement
    ) {
      this.initEditor();
    }
  }

  private initEditor() {
    const paramList = (this.params || []).join(", ");
    const doc = `def function(${paramList}):\n    `;
    if (this.editorView) {
      this.editorView.destroy();
    }
    this.editorView = new EditorView({
      parent: this.editorElement.nativeElement,
      doc,
      extensions: [basicSetup, python()],
    });
  }
}
