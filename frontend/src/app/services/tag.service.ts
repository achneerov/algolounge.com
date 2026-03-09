import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface TagConfig {
  difficulties: { [key: string]: string };
  tags: { [key: string]: string };
}

export interface Tag {
  text: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private tagConfig: TagConfig = { difficulties: {}, tags: {} };

  constructor(private http: HttpClient) {
    this.loadTagConfig();
  }

  private loadTagConfig(): void {
    this.http.get<TagConfig>('/tags-config.json').subscribe({
      next: (data) => {
        this.tagConfig = data;
      },
      error: (error) => {
        console.error('Failed to load tags config:', error);
      }
    });
  }

  /**
   * Get color for a difficulty level (Easy, Medium, Hard)
   */
  getDifficultyColor(difficulty: string): string {
    return this.tagConfig.difficulties[difficulty];
  }

  /**
   * Get color for a tag
   */
  getTagColor(tagName: string): string {
    return this.tagConfig.difficulties[tagName] || this.tagConfig.tags[tagName];
  }

  /**
   * Convert difficulty to Tag object with color
   */
  getDifficultyTag(difficulty: string): Tag {
    return {
      text: difficulty,
      color: this.getDifficultyColor(difficulty)
    };
  }

  /**
   * Convert tag name to Tag object with color
   */
  getTag(tagName: string): Tag {
    return {
      text: tagName,
      color: this.getTagColor(tagName)
    };
  }

  /**
   * Convert array of tag names to Tag objects with colors
   */
  getTags(tagNames: string[]): Tag[] {
    return tagNames.map(name => this.getTag(name));
  }

  /**
   * Get all tags for a question (difficulty + other tags)
   */
  getQuestionTags(difficulty: string, tags: string[]): Tag[] {
    const result: Tag[] = [];

    if (difficulty) {
      result.push(this.getDifficultyTag(difficulty));
    }

    if (tags && tags.length > 0) {
      result.push(...this.getTags(tags));
    }

    return result;
  }

}
