import { Routes } from "@angular/router";
import { QuestionsComponent } from "./pages/questions/questions.component";
import { NotFoundComponent } from "./pages/not-found/not-found.component";
import { HomeComponent } from "./pages/home/home.component";
import { CoursesComponent } from "./pages/courses/courses.component";
import { CourseDetailComponent } from "./pages/course-detail/course-detail.component";

export const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "questions/:name", component: QuestionsComponent },
  { path: "questions", redirectTo: "questions/contains-duplicate", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "courses/:filename", component: CourseDetailComponent },
  { path: "courses", component: CoursesComponent },
  { path: "**", component: NotFoundComponent },
];
