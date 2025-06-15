import { Component } from "@angular/core";
import { IdeComponent } from "../ide/ide.component";

@Component({
  selector: "app-question",
  imports: [IdeComponent],
  templateUrl: "./question.component.html",
  styleUrl: "./question.component.scss",
})
export class QuestionComponent {}
