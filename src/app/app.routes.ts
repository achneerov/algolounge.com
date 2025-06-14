import { Routes } from "@angular/router";
import { QuestionComponent } from "./component/question/question.component";
import { NotFoundComponent } from "./component/not-found/not-found.component";

export const routes: Routes = [
  { path: "question", component: QuestionComponent },
  { path: "**", component: NotFoundComponent },
];
