import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SolutionSection {
  type: 'algorithm' | 'complexity' | 'insights' | 'generic';
  title?: string;
  items?: string[];
  content?: string;
}

@Component({
  selector: 'app-solution',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solution.component.html',
  styleUrl: './solution.component.scss'
})
export class SolutionComponent implements OnChanges {
  @Input() solutionText: string = '';
  @Input() solutionCode: string = '';

  parsedSections: SolutionSection[] = [];
  showCopyFeedback = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['solutionText'] && this.solutionText) {
      this.parsedSections = this.parseSolutionText(this.solutionText);
    }
  }

  private parseSolutionText(html: string): SolutionSection[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const sections: SolutionSection[] = [];

    // Look for structured content with **Algorithm:**, **Time Complexity:**, etc.
    const paragraphs = Array.from(doc.querySelectorAll('p'));
    const allText = doc.body.innerHTML;

    // Check if it has the new structured format with **Algorithm:**
    if (allText.includes('<strong>Algorithm:</strong>') || allText.includes('**Algorithm:**')) {
      // Extract Algorithm section
      const algorithmMatch = allText.match(/<strong>Algorithm:<\/strong>(.*?)(?=<strong>(?:Time Complexity|Space Complexity|Key Insights):|$)/is);
      if (algorithmMatch) {
        const algorithmContent = algorithmMatch[1].trim();
        const items = this.extractListItems(algorithmContent);
        if (items.length > 0) {
          sections.push({
            type: 'algorithm',
            title: 'Algorithm',
            items
          });
        }
      }

      // Extract Time Complexity
      const timeMatch = allText.match(/<strong>Time Complexity:<\/strong>\s*(.*?)(?=<br>|<strong>|<\/p>|$)/is);
      if (timeMatch) {
        sections.push({
          type: 'complexity',
          title: 'Time Complexity',
          content: timeMatch[1].trim()
        });
      }

      // Extract Space Complexity
      const spaceMatch = allText.match(/<strong>Space Complexity:<\/strong>\s*(.*?)(?=<br>|<strong>|<\/p>|$)/is);
      if (spaceMatch) {
        sections.push({
          type: 'complexity',
          title: 'Space Complexity',
          content: spaceMatch[1].trim()
        });
      }

      // Extract Key Insights
      const insightsMatch = allText.match(/<strong>Key Insights:<\/strong>(.*?)(?=<strong>|$)/is);
      if (insightsMatch) {
        const insightsContent = insightsMatch[1].trim();
        const items = this.extractListItems(insightsContent);
        if (items.length > 0) {
          sections.push({
            type: 'insights',
            title: 'Key Insights',
            items
          });
        }
      }
    } else {
      // Old format - just display as-is
      sections.push({
        type: 'generic',
        content: allText
      });
    }

    return sections;
  }

  private extractListItems(html: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const items: string[] = [];

    // Look for <ol> or <ul> lists
    const lists = doc.querySelectorAll('ol, ul');
    lists.forEach(list => {
      const listItems = list.querySelectorAll('li');
      listItems.forEach(li => {
        items.push(li.innerHTML.trim());
      });
    });

    return items;
  }

  copyCode() {
    if (this.solutionCode) {
      navigator.clipboard.writeText(this.solutionCode).then(() => {
        this.showCopyFeedback = true;
        setTimeout(() => {
          this.showCopyFeedback = false;
        }, 2000);
      });
    }
  }
}
