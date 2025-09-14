import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { IdeComponent } from "./ide/ide.component";
import { ConsoleComponent, ExecutionResult } from "./console/console.component";
import { ContentTabsComponent } from "../../components/general/content-tabs.component";
import { SplitterModule } from "primeng/splitter";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { NotFoundComponent } from "../not-found/not-found.component";
import { CodeExecutionService } from "../../services/code-execution.service";
import { LocalStorageService } from "../../services/local-storage.service";

@Component({
  selector: "app-questions",
  standalone: true,
  imports: [
    CommonModule,
    IdeComponent,
    ConsoleComponent,
    ContentTabsComponent,
    SplitterModule,
    NotFoundComponent,
  ],
  templateUrl: "./questions.component.html",
  styleUrl: "./questions.component.scss",
})
export class QuestionsComponent implements OnInit, OnDestroy {
  @ViewChild(IdeComponent) ideComponent!: IdeComponent;
  
  description: string = "";
  solutionText: string = "";
  solutionCode: string = "";
  selectedLanguage: string = "python";
  questionData: any = null;
  template: string = "";
  executionResult: ExecutionResult | null = null;
  isRunning: boolean = false;
  horizontalPanelSizes: number[] = [40, 60];
  verticalPanelSizes: number[] = [70, 30];
  currentQuestionFilename: string = "";
  isCompleted: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private codeExecutionService: CodeExecutionService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit() {
    // Add questions-page class to body
    document.body.classList.add('questions-page');
    
    this.route.paramMap.subscribe((params) => {
      const name = params.get("name");
      if (name) {
        this.currentQuestionFilename = name;
        this.isCompleted = this.localStorageService.isQuestionCompleted(name);
        this.loadQuestion(name);
      }
    });
  }

  ngOnDestroy() {
    // Remove questions-page class when leaving
    document.body.classList.remove('questions-page');
  }

  onGo(name: string) {
    this.router.navigate(["/questions", name]);
  }

  onLanguageChange(language: string) {
    this.selectedLanguage = language;
    this.updateLanguageContent();
    // Clear previous execution results when language changes
    this.executionResult = null;
  }

  async onRun() {
    if (!this.ideComponent || !this.questionData) {
      return;
    }

    this.isRunning = true;
    this.executionResult = null;

    try {
      const code = this.ideComponent.getCode();
      const functionName = this.ideComponent.getFunctionName();
      const testCases = this.questionData.test_cases || [];

      this.executionResult = await this.codeExecutionService.executeCode(
        code,
        testCases,
        functionName,
        this.questionData.order_matters !== false // Default to true if not specified
      );

      // Check if all tests passed and mark as completed
      if (this.executionResult.passedCount === this.executionResult.totalCount && this.executionResult.totalCount > 0) {
        if (!this.isCompleted) {
          this.localStorageService.addCompletedQuestion(this.currentQuestionFilename);
          this.isCompleted = true;
        }
      }
    } catch (error) {
      console.error('Execution error:', error);
      this.executionResult = {
        testResults: [],
        executionTime: 0,
        passedCount: 0,
        totalCount: 0,
        output: [`Error: ${error instanceof Error ? error.message : String(error)}`]
      };
    } finally {
      this.isRunning = false;
    }
  }

  notFound = false;

  loadQuestion(name: string) {
    this.notFound = false;
    this.http
      .get<any>(`/questions/${name}.json`)
      .subscribe({
        next: (data) => {
          this.questionData = data;
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
      // Old multi-language format (archived questions)
      const langData = this.questionData.languages[this.selectedLanguage];
      if (langData) {
        this.solutionText = langData.solution_text || "";
        this.solutionCode = langData.solution_code || "";
        this.template = langData.template || "";
      }
      this.description = this.questionData.description || "";
    } else {
      // New Python-only format (current questions)
      this.description = this.questionData.description || "";
      this.solutionText = this.questionData.solution_text || "";
      this.solutionCode = this.questionData.solution_code || "";
      this.template = this.questionData.template || "";
    }
  }


  onHorizontalResizeEnd(event: any) {
    this.horizontalPanelSizes = event.sizes;
  }

  onVerticalResizeEnd(event: any) {
    this.verticalPanelSizes = event.sizes;
  }
}
