import { Routes } from "@angular/router";
import { QuestionsComponent } from "./pages/questions/questions.component";
import { NotFoundComponent } from "./pages/not-found/not-found.component";
import { HomeComponent } from "./pages/home/home.component";

export const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "questions/:id", component: QuestionsComponent },
  { path: "questions", redirectTo: "questions/0", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "**", component: NotFoundComponent },
];
