import { Component, Output, EventEmitter } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [ButtonModule, FormsModule],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  questionId: string = "";
  @Output() go = new EventEmitter<string>();

  onGo(): void {
    if (this.questionId.trim()) {
      this.go.emit(this.questionId.trim());
    }
  }
  onRun(): void {}
}
