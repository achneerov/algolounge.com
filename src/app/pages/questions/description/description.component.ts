import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-description",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./description.component.html",
  styleUrl: "./description.component.scss",
})
export class DescriptionComponent {
  @Input() description: string = "";
}
