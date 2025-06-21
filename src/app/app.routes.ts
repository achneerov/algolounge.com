import { Routes } from "@angular/router";
import { QuestionComponent } from "./pages/question/question.component";
import { NotFoundComponent } from "./pages/not-found/not-found.component";
import { HomeComponent } from "./pages/home/home.component";

export const routes: Routes = [
  { path: "question", component: QuestionComponent },
  { path: "home", component: HomeComponent },

  { path: "**", component: NotFoundComponent },
];
