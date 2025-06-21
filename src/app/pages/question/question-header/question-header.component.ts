import { Component } from "@angular/core";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-question-header",
  imports: [ButtonModule],
  templateUrl: "./question-header.component.html",
  styleUrl: "./question-header.component.scss",
})
export class QuestionHeaderComponent {
  onRun(): void {}
}
