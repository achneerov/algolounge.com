import { Component, OnInit } from "@angular/core";
import { IdeComponent } from "./ide/ide.component";
import { HeaderComponent } from "./header/header.component";
import { ConsoleComponent } from "./console/console.component";
import { DescriptionComponent } from "./description/description.component";
import { SplitterModule } from "primeng/splitter";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { NotFoundComponent } from "../not-found/not-found.component";

@Component({
  selector: "app-questions",
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    IdeComponent,
    HeaderComponent,
    ConsoleComponent,
    DescriptionComponent,
    SplitterModule,
    NotFoundComponent,
  ],
  templateUrl: "./questions.component.html",
  styleUrl: "./questions.component.scss",
})
export class QuestionsComponent implements OnInit {
  description: string = "";
  solution: string = "";
  functionParams: string[] = [];
  selectedLanguage: string = "python";
  questionData: any = null;
  functionSignature: string = "";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get("id");
      if (id) {
        this.loadQuestion(id);
      }
    });
  }

  onGo(id: string) {
    this.router.navigate(["/questions", id]);
  }

  onLanguageChange(language: string) {
    this.selectedLanguage = language;
    this.updateLanguageContent();
  }

  notFound = false;

  loadQuestion(id: string) {
    this.notFound = false;
    this.http
      .get<any>(`/questions/${id}.json`)
      .subscribe({
        next: (data) => {
          this.questionData = data;
          this.functionParams = data.function_params_names || [];
          this.updateLanguageContent();
          this.notFound = false;
        },
        error: () => {
          this.notFound = true;
        },
      });
  }

  updateLanguageContent() {
    if (!this.questionData) return;
    
    if (this.questionData.languages) {
      // New multi-language format
      const langData = this.questionData.languages[this.selectedLanguage];
      if (langData) {
        this.solution = langData.solution;
        this.functionSignature = langData.function_signature;
      }
      // Set description from the global level for multi-language format
      this.description = this.questionData.description || "";
    } else {
      // Old single-language format (fallback)
      this.description = this.questionData.description || "";
      this.solution = this.questionData.solution || "";
      this.functionSignature = "";
    }
  }
}
