import { Routes } from "@angular/router";
import { QuestionsComponent } from "./pages/questions/questions.component";
import { NotFoundComponent } from "./pages/not-found/not-found.component";
import { HomeComponent } from "./pages/home/home.component";
import { CoursesComponent } from "./pages/courses/courses.component";
import { CourseDetailComponent } from "./pages/course-detail/course-detail.component";
import { UnitDetailComponent } from "./pages/unit-detail/unit-detail.component";
import { SignInComponent } from "./pages/auth/sign-in/sign-in.component";
import { SignUpComponent } from "./pages/auth/sign-up/sign-up.component";

export const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "auth/sign-in", component: SignInComponent },
  { path: "auth/sign-up", component: SignUpComponent },
  { path: "questions/:name", component: QuestionsComponent },
  { path: "questions", redirectTo: "questions/two-sum", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "courses/:courseName/:unitKey", component: UnitDetailComponent },
  { path: "courses/:filename", component: CourseDetailComponent },
  { path: "courses", component: CoursesComponent },
  { path: "**", component: NotFoundComponent },
];
