export interface HealthData {
    heartRate: number;
    bloodPressure: {
        systolic: number;
        diastolic: number;
    };
    cholesterol: number;
    glucose: number;
    weight: number;
    height: number;
}

export interface UserProfile {
    id: string;
    name: string;
    age: number;
    email: string;
    healthData: HealthData;
}

// Health search types for Header component
export interface HealthSearchResult {
    summary: string;
    details: string;
    sources: string[];
    relatedTopics: string[];
    recommendations: string[];
}