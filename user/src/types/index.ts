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