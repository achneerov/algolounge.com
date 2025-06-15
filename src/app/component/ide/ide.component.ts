import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";

@Component({
  selector: "app-ide",
  imports: [],
  templateUrl: "./ide.component.html",
  styleUrl: "./ide.component.scss",
})
export class IdeComponent implements OnInit {
  @ViewChild("editor", { static: true }) editorElement!: ElementRef;

  ngOnInit() {
    new EditorView({
      parent: this.editorElement.nativeElement,
      doc: 'print("Hello world")',
      extensions: [basicSetup, python()],
    });
  }
}
