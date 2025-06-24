import { Component } from "@angular/core";
import { IdeComponent } from "./ide/ide.component";
import { HeaderComponent } from "./header/header.component";
import { ConsoleComponent } from "./console/console.component";
import { DescriptionComponent } from "./description/description.component";
import { SplitterModule } from "primeng/splitter";

@Component({
  selector: "app-questions",
  imports: [
    IdeComponent,
    HeaderComponent,
    ConsoleComponent,
    DescriptionComponent,
    SplitterModule,
  ],
  templateUrl: "./questions.component.html",
  styleUrl: "./questions.component.scss",
})
export class QuestionsComponent {}
