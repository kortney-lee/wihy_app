export interface HealthSearchResult {
  summary: string;
  details: string;
  sources: string[];
  relatedTopics: any[];
  recommendations: any[];
  dataSource?: string;
  medicalDisclaimer?: string;
}