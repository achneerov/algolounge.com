import { Routes } from "@angular/router";
import { QuestionComponent } from "./page/question/question.component";
import { NotFoundComponent } from "./page/not-found/not-found.component";

export const routes: Routes = [
  { path: "question", component: QuestionComponent },
  { path: "**", component: NotFoundComponent },
];
