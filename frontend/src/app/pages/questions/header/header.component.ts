import { Component, Output, EventEmitter, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { DropdownModule } from "primeng/dropdown";
import { AutoCompleteModule } from "primeng/autocomplete";
import { QuestionSearchService, QuestionSearchResult } from "../../../services/question-search.service";
import { LocalStorageService } from "../../../services/local-storage.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule, DropdownModule, AutoCompleteModule],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent implements OnInit {
  questionName: string = "";
  searchResults: QuestionSearchResult[] = [];
  selectedQuestion: QuestionSearchResult | null = null;
  @Input() selectedLanguage: string = "python";
  @Input() isRunning: boolean = false;
  @Input() isCompleted: boolean = false;
  @Output() go = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<string>();
  @Output() run = new EventEmitter<void>();

  languages = [
    { label: "Python", value: "python" }
  ];

  constructor(
    private questionSearchService: QuestionSearchService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    // Wait for questions to load before initializing
    this.questionSearchService.isIndexLoaded().subscribe(loaded => {
      if (loaded) {
        // Trigger initial search with empty string to show all questions
        this.onSearch({ query: "" });
      }
    });
  }

  onSearch(event: any): void {
    const query = event.query;
    if (query && query.length > 0) {
      this.searchResults = this.questionSearchService.searchQuestions(query);
    } else {
      this.searchResults = this.questionSearchService.getAllQuestions();
    }
  }

  onSelect(event: any): void {
    const question = event.value as QuestionSearchResult;
    this.selectedQuestion = null; // Clear the textbox
    this.go.emit(question.filename);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.searchResults.length > 0) {
        // Select the top result
        const topResult = this.searchResults[0];
        this.selectedQuestion = null; // Clear the textbox
        this.go.emit(topResult.filename);
      }
    }
  }

  onLanguageChange(language: string): void {
    this.selectedLanguage = language;
    this.languageChange.emit(language);
  }

  onRun(): void {
    this.run.emit();
  }

  isQuestionCompleted(filename: string): boolean {
    return this.localStorageService.isQuestionCompleted(filename);
  }
}
