export interface HealthSearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
}

// Empty export to make it a module
export {};