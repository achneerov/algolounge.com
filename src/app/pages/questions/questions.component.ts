import { Component } from "@angular/core";
import { IdeComponent } from "./ide/ide.component";
import { QuestionHeaderComponent } from "./question-header/question-header.component";
import { ConsoleComponent } from "./console/console.component";
import { DescriptionComponent } from "./description/description.component";
import { SplitterModule } from "primeng/splitter";

@Component({
  selector: "app-question",
  imports: [
    IdeComponent,
    QuestionHeaderComponent,
    ConsoleComponent,
    DescriptionComponent,
    SplitterModule,
  ],
  templateUrl: "./questions.component.html",
  styleUrl: "./questions.component.scss",
})
export class QuestionsComponent {}
