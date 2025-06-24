import { Component } from "@angular/core";
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
export class QuestionsComponent {
  description: string = "";

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

  notFound = false;

  loadQuestion(id: string) {
    this.notFound = false;
    this.http.get<{ description: string }>(`/questions/${id}.json`).subscribe({
      next: (data) => {
        this.description = data.description;
        this.notFound = false;
      },
      error: () => {
        this.notFound = true;
      },
    });
  }
}
