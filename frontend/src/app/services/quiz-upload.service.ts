import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QuizUploadService {
  private jsZipLoaded = false;

  constructor() { }

  /**
   * Ensure JSZip library is loaded
   */
  private async ensureJSZipLoaded(): Promise<void> {
    if (this.jsZipLoaded || (window as any).JSZip) {
      this.jsZipLoaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = () => {
        this.jsZipLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load JSZip library'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Download sample quiz zip file with images
   */
  downloadSampleQuizzes(): void {
    // Download the pre-made zip file with images
    const zipUrl = '/quiz-samples/sample-with-images.zip';
    fetch(zipUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quiz-sample-with-images.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading samples:', error);
        alert('Failed to download sample quizzes');
      });
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

        // Validate imageFilename if provided (optional field)
        if (round.imageFilename && typeof round.imageFilename !== 'string') {
          return { valid: false, error: `Round ${i + 1}: "imageFilename" must be a string` };
        }
      }

      return { valid: true, data };
    } catch (error: any) {
      return { valid: false, error: `JSON parsing error: ${error.message}` };
    }
  }

  /**
   * Validate and extract zip file contents
   */
  async validateZipFile(file: File): Promise<{ valid: boolean; error?: string; jsonContent?: string; images?: Map<string, Blob>; music?: { filename: string; blob: Blob } }> {
    try {
      // Load JSZip library dynamically if not already loaded
      try {
        await this.ensureJSZipLoaded();
      } catch (loadError) {
        return { valid: false, error: 'Failed to load ZIP library. Please check your internet connection.' };
      }

      const JSZip = (window as any).JSZip;
      if (!JSZip) {
        return { valid: false, error: 'Unable to load ZIP library' };
      }

      const zip = new JSZip();
      await zip.loadAsync(file);

      let jsonFile: string | null = null;
      let jsonContent: string | null = null;
      const images = new Map<string, Blob>();
      let musicFile: { filename: string; blob: Blob } | null = null;
      const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const validAudioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'webm'];

      // Extract files from zip
      for (const filename of Object.keys(zip.files)) {
        const fileEntry = zip.files[filename];

        // Skip directories
        if (fileEntry.dir) continue;

        const ext = filename.split('.').pop()?.toLowerCase() || '';

        // Look for JSON file (should be in root)
        if (ext === 'json' && !filename.includes('/')) {
          if (jsonFile) {
            return { valid: false, error: 'ZIP contains multiple JSON files. Only one quiz.json allowed.' };
          }
          jsonFile = filename;
          jsonContent = await fileEntry.async('string');
        }
        // Look for audio/music file (only one allowed)
        else if (validAudioExtensions.includes(ext) && !filename.includes('/')) {
          if (musicFile) {
            return { valid: false, error: 'ZIP contains multiple audio files. Only one music file allowed.' };
          }
          const blob = await fileEntry.async('blob');
          musicFile = { filename, blob };
        }
        // Look for image files
        else if (validImageExtensions.includes(ext) && !filename.includes('/')) {
          const blob = await fileEntry.async('blob');
          images.set(filename, blob);
        }
      }

      if (!jsonFile) {
        return { valid: false, error: 'ZIP must contain a JSON file in the root directory' };
      }

      // Validate the JSON content
      const jsonValidation = this.validateQuizJson(jsonContent!);
      if (!jsonValidation.valid) {
        return { valid: false, error: jsonValidation.error };
      }

      return { valid: true, jsonContent: jsonContent!, images, music: musicFile || undefined };
    } catch (error: any) {
      return { valid: false, error: `ZIP processing error: ${error.message}` };
    }
  }
}
