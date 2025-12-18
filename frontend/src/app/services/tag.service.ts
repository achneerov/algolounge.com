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
  private tagConfig: TagConfig | null = null;
  private configLoaded = false;

  constructor(private http: HttpClient) {
    this.loadTagConfig();
  }

  private loadTagConfig(): void {
    this.http.get<TagConfig>('/tags-config.json').subscribe({
      next: (data) => {
        this.tagConfig = data;
        this.configLoaded = true;
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
    if (!this.tagConfig) {
      return '#94a3b8'; // Default gray color
    }
    return this.tagConfig.difficulties[difficulty] || '#94a3b8';
  }

  /**
   * Get color for a tag
   */
  getTagColor(tagName: string): string {
    if (!this.tagConfig) {
      return '#94a3b8'; // Default gray color
    }
    return this.tagConfig.tags[tagName] || '#94a3b8';
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

  /**
   * Check if config is loaded
   */
  isConfigLoaded(): boolean {
    return this.configLoaded;
  }
}
