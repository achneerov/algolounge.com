import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QuizUploadService {

  constructor() { }

  /**
   * Download sample quiz files as a zip
   */
  downloadSampleQuizzes(): void {
    const sampleQuizzes = [
      {
        name: 'sample-1-geography.json',
        url: '/quiz-samples/sample-1-geography.json'
      },
      {
        name: 'sample-2-science.json',
        url: '/quiz-samples/sample-2-science.json'
      },
      {
        name: 'sample-3-history.json',
        url: '/quiz-samples/sample-3-history.json'
      }
    ];

    // Fetch all sample files
    Promise.all(
      sampleQuizzes.map(sample =>
        fetch(sample.url).then(res => res.text()).then(content => ({
          name: sample.name,
          content
        }))
      )
    ).then(files => {
      this.createAndDownloadZip(files);
    }).catch(error => {
      console.error('Error downloading samples:', error);
      alert('Failed to download sample quizzes');
    });
  }

  private createAndDownloadZip(files: Array<{ name: string; content: string }>): void {
    // Dynamically import JSZip
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => {
      const JSZip = (window as any).JSZip;
      const zip = new JSZip();

      // Add each file to the zip
      files.forEach(file => {
        zip.file(file.name, file.content);
      });

      // Generate the zip file
      zip.generateAsync({ type: 'blob' }).then((blob: Blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quiz-samples.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    };
    document.head.appendChild(script);
  }

  /**
   * Parse and validate a quiz JSON file
   */
  validateQuizJson(jsonText: string): { valid: boolean; error?: string; data?: any } {
    try {
      const data = JSON.parse(jsonText);

      // Validate required fields
      if (!data.name || typeof data.name !== 'string') {
        return { valid: false, error: 'Missing or invalid "name" field' };
      }

      if (!Array.isArray(data.rounds) || data.rounds.length === 0) {
        return { valid: false, error: 'Missing or empty "rounds" array' };
      }

      // Validate each round
      for (let i = 0; i < data.rounds.length; i++) {
        const round = data.rounds[i];

        if (!round.questionText || typeof round.questionText !== 'string') {
          return { valid: false, error: `Round ${i + 1}: Missing or invalid "questionText"` };
        }

        if (!round.questionType || typeof round.questionType !== 'string') {
          return { valid: false, error: `Round ${i + 1}: Missing or invalid "questionType"` };
        }

        const validTypes = ['multiple_choice_2', 'multiple_choice_3', 'multiple_choice_4', 'true_false', 'typed'];
        if (!validTypes.includes(round.questionType)) {
          return {
            valid: false,
            error: `Round ${i + 1}: Invalid questionType "${round.questionType}". Must be one of: ${validTypes.join(', ')}`
          };
        }

        // Validate question type specific requirements
        if (round.questionType.startsWith('multiple_choice')) {
          const optionCount = parseInt(round.questionType.split('_')[2]);
          if (!Array.isArray(round.options) || round.options.length !== optionCount) {
            return {
              valid: false,
              error: `Round ${i + 1}: "${round.questionType}" requires ${optionCount} options`
            };
          }
          if (typeof round.correctOptionIndex !== 'number' || round.correctOptionIndex < 0 || round.correctOptionIndex >= optionCount) {
            return {
              valid: false,
              error: `Round ${i + 1}: Invalid "correctOptionIndex" (must be 0-${optionCount - 1})`
            };
          }
        } else if (round.questionType === 'true_false') {
          if (typeof round.correctAnswer !== 'boolean') {
            return { valid: false, error: `Round ${i + 1}: "correctAnswer" must be a boolean (true/false)` };
          }
        } else if (round.questionType === 'typed') {
          if (typeof round.correctAnswer !== 'string') {
            return { valid: false, error: `Round ${i + 1}: "correctAnswer" must be a string` };
          }
        }
      }

      return { valid: true, data };
    } catch (error: any) {
      return { valid: false, error: `JSON parsing error: ${error.message}` };
    }
  }
}
