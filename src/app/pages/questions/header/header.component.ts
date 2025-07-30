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
  questionName: string = "";
  @Input() selectedLanguage: string = "python";
  @Input() isRunning: boolean = false;
  @Output() go = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<string>();
  @Output() run = new EventEmitter<void>();

  languages = [
    { label: "Python", value: "python" },
    { label: "JavaScript", value: "javascript" },
    { label: "TypeScript", value: "typescript" }
  ];

  onGo(): void {
    if (this.questionName.trim()) {
      this.go.emit(this.questionName.trim());
    }
  }

  onLanguageChange(language: string): void {
    this.selectedLanguage = language;
    this.languageChange.emit(language);
  }

  onRun(): void {
    this.run.emit();
  }
}
