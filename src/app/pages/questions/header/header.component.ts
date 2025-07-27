import { Component, Output, EventEmitter, Input } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { DropdownModule } from "primeng/dropdown";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [ButtonModule, FormsModule, DropdownModule],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  questionId: string = "";
  @Input() selectedLanguage: string = "python";
  @Output() go = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<string>();

  languages = [
    { label: "Python", value: "python" },
    { label: "JavaScript", value: "javascript" },
    { label: "TypeScript", value: "typescript" }
  ];

  onGo(): void {
    if (this.questionId.trim()) {
      this.go.emit(this.questionId.trim());
    }
  }

  onLanguageChange(language: string): void {
    this.selectedLanguage = language;
    this.languageChange.emit(language);
  }

  onRun(): void {}
}
