import { Routes } from "@angular/router";
import { QuestionsComponent } from "./pages/questions/questions.component";
import { NotFoundComponent } from "./pages/not-found/not-found.component";
import { HomeComponent } from "./pages/home/home.component";

export const routes: Routes = [
  { path: "questions", component: QuestionsComponent },
  { path: "home", component: HomeComponent },

  { path: "**", component: NotFoundComponent },
];
