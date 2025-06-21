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
  templateUrl: "./question.component.html",
  styleUrl: "./question.component.scss",
})
export class QuestionComponent {}
