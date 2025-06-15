import { Component } from "@angular/core";
import { IdeComponent } from "../ide/ide.component";
import { QuestionHeaderComponent } from "../question-header/question-header.component";

@Component({
  selector: "app-question",
  imports: [IdeComponent, QuestionHeaderComponent],
  templateUrl: "./question.component.html",
  styleUrl: "./question.component.scss",
})
export class QuestionComponent {}
