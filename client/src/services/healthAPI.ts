interface HealthSearchResult {
  summary: string;
  details: string;
  sources: string[];
  relatedTopics: string[];
  recommendations: string[];
  medicalDisclaimer: string;
}

interface HealthCondition {
  name: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  prevention: string[];
  whenToSeeDoctor: string[];
}

class HealthAPIService {
  private healthDatabase: { [key: string]: HealthCondition } = {
    // Cardiovascular Health
    "heart disease": {
      name: "Heart Disease",
      symptoms: ["Chest pain", "Shortness of breath", "Fatigue", "Irregular heartbeat", "Dizziness"],
      causes: ["High cholesterol", "High blood pressure", "Smoking", "Diabetes", "Family history"],
      treatments: ["Medications", "Lifestyle changes", "Cardiac procedures", "Surgery in severe cases"],
      prevention: ["Regular exercise", "Healthy diet", "No smoking", "Limit alcohol", "Manage stress"],
      whenToSeeDoctor: ["Chest pain", "Severe shortness of breath", "Fainting", "Rapid or irregular heartbeat"]
    },
    "high blood pressure": {
      name: "High Blood Pressure (Hypertension)",
      symptoms: ["Often no symptoms", "Headaches", "Dizziness", "Blurred vision", "Nosebleeds"],
      causes: ["Genetics", "Age", "Obesity", "Lack of exercise", "High salt intake", "Stress"],
      treatments: ["ACE inhibitors", "Diuretics", "Beta-blockers", "Lifestyle modifications"],
      prevention: ["Maintain healthy weight", "Exercise regularly", "Limit sodium", "Eat potassium-rich foods"],
      whenToSeeDoctor: ["Blood pressure consistently above 140/90", "Severe headaches", "Vision changes"]
    },

    // Respiratory Health
    "asthma": {
      name: "Asthma",
      symptoms: ["Wheezing", "Shortness of breath", "Chest tightness", "Coughing", "Difficulty sleeping"],
      causes: ["Allergens", "Air pollution", "Respiratory infections", "Exercise", "Weather changes"],
      treatments: ["Inhaled corticosteroids", "Bronchodilators", "Allergy medications", "Immunotherapy"],
      prevention: ["Avoid triggers", "Use air purifiers", "Get vaccinated", "Exercise regularly"],
      whenToSeeDoctor: ["Difficulty breathing", "Frequent use of rescue inhaler", "Symptoms worsen"]
    },

    // Mental Health
    "depression": {
      name: "Depression",
      symptoms: ["Persistent sadness", "Loss of interest", "Fatigue", "Sleep changes", "Appetite changes"],
      causes: ["Brain chemistry", "Genetics", "Life events", "Medical conditions", "Substance abuse"],
      treatments: ["Antidepressants", "Psychotherapy", "Cognitive behavioral therapy", "Lifestyle changes"],
      prevention: ["Regular exercise", "Social connections", "Stress management", "Adequate sleep"],
      whenToSeeDoctor: ["Persistent sadness", "Thoughts of suicide", "Unable to function daily"]
    },

    // Diabetes
    "diabetes": {
      name: "Diabetes",
      symptoms: ["Increased thirst", "Frequent urination", "Fatigue", "Blurred vision", "Slow healing wounds"],
      causes: ["Genetics", "Obesity", "Lack of exercise", "Age", "Family history"],
      treatments: ["Insulin", "Oral medications", "Diet management", "Exercise", "Blood sugar monitoring"],
      prevention: ["Maintain healthy weight", "Exercise regularly", "Eat balanced diet", "Limit processed foods"],
      whenToSeeDoctor: ["Excessive thirst", "Frequent infections", "Numbness in extremities"]
    },

    // Nutrition
    "nutrition": {
      name: "Healthy Nutrition",
      symptoms: ["N/A - Preventive topic"],
      causes: ["N/A - Preventive topic"],
      treatments: ["Balanced diet", "Portion control", "Regular meals", "Hydration"],
      prevention: ["Eat variety of foods", "Limit processed foods", "Include fruits and vegetables", "Stay hydrated"],
      whenToSeeDoctor: ["Significant weight loss/gain", "Digestive issues", "Food allergies"]
    }
  };

  // Main search function
  async searchHealthInfo(query: string): Promise<HealthSearchResult> {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check for direct matches first
    const directMatch = this.findDirectMatch(normalizedQuery);
    if (directMatch) {
      return this.formatHealthResult(directMatch, query);
    }

    // Check for partial matches
    const partialMatch = this.findPartialMatch(normalizedQuery);
    if (partialMatch) {
      return this.formatHealthResult(partialMatch, query);
    }

    // Check for general health topics
    const generalInfo = this.getGeneralHealthInfo(normalizedQuery);
    if (generalInfo) {
      return generalInfo;
    }

    // Fallback to general health advice
    return this.getGeneralHealthAdvice(query);
  }

  private findDirectMatch(query: string): HealthCondition | null {
    return this.healthDatabase[query] || null;
  }

  private findPartialMatch(query: string): HealthCondition | null {
    for (const [key, condition] of Object.entries(this.healthDatabase)) {
      if (query.includes(key) || key.includes(query)) {
        return condition;
      }
    }
    return null;
  }

  private getGeneralHealthInfo(query: string): HealthSearchResult | null {
    const healthTopics: { [key: string]: HealthSearchResult } = {
      "exercise": {
        summary: "Regular physical activity is essential for maintaining good health and preventing chronic diseases.",
        details: "Exercise helps strengthen your heart, improve circulation, build muscle mass, enhance mental health, and boost immune function. Adults should aim for at least 150 minutes of moderate-intensity aerobic activity per week, plus muscle-strengthening activities on 2 or more days per week.",
        sources: ["CDC Physical Activity Guidelines", "American Heart Association", "WHO Exercise Recommendations"],
        relatedTopics: ["Cardiovascular health", "Weight management", "Mental health", "Bone health"],
        recommendations: [
          "Start slowly and gradually increase intensity",
          "Choose activities you enjoy",
          "Include both aerobic and strength training",
          "Stay hydrated during exercise",
          "Consult a doctor before starting new exercise programs"
        ],
        medicalDisclaimer: "Always consult with a healthcare provider before starting any new exercise program, especially if you have existing health conditions."
      },
      "sleep": {
        summary: "Quality sleep is fundamental to physical health, mental well-being, and overall quality of life.",
        details: "Adults need 7-9 hours of quality sleep per night. Good sleep helps repair tissues, consolidate memories, regulate hormones, and boost immune function. Poor sleep is linked to numerous health problems including obesity, diabetes, cardiovascular disease, and mental health issues.",
        sources: ["National Sleep Foundation", "CDC Sleep Guidelines", "American Academy of Sleep Medicine"],
        relatedTopics: ["Mental health", "Immune system", "Weight management", "Cognitive function"],
        recommendations: [
          "Maintain a consistent sleep schedule",
          "Create a relaxing bedtime routine",
          "Avoid screens before bedtime",
          "Keep bedroom cool and dark",
          "Limit caffeine and alcohol intake"
        ],
        medicalDisclaimer: "If you experience persistent sleep problems, consult a healthcare provider as it may indicate an underlying sleep disorder."
      },
      "stress": {
        summary: "Chronic stress can significantly impact both physical and mental health, but can be effectively managed with proper techniques.",
        details: "Stress triggers the release of hormones like cortisol, which can affect immune function, cardiovascular health, and mental well-being when elevated long-term. Effective stress management techniques include exercise, meditation, deep breathing, social support, and professional counseling when needed.",
        sources: ["American Psychological Association", "Mayo Clinic Stress Management", "Harvard Health"],
        relatedTopics: ["Mental health", "Sleep", "Heart health", "Immune system"],
        recommendations: [
          "Practice regular relaxation techniques",
          "Maintain social connections",
          "Exercise regularly",
          "Get adequate sleep",
          "Consider professional help if needed"
        ],
        medicalDisclaimer: "If stress is significantly impacting your daily life, consider speaking with a mental health professional."
      }
    };

    for (const [topic, info] of Object.entries(healthTopics)) {
      if (query.includes(topic) || topic.includes(query)) {
        return info;
      }
    }

    return null;
  }

  private formatHealthResult(condition: HealthCondition, originalQuery: string): HealthSearchResult {
    return {
      summary: `${condition.name} is a health condition that requires proper understanding and management.`,
      details: this.createDetailedDescription(condition),
      sources: [
        "Mayo Clinic",
        "WebMD",
        "National Institutes of Health (NIH)",
        "American Medical Association"
      ],
      relatedTopics: this.getRelatedTopics(condition),
      recommendations: condition.prevention,
      medicalDisclaimer: "This information is for educational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment."
    };
  }

  private createDetailedDescription(condition: HealthCondition): string {
    let description = `${condition.name} overview:\n\n`;
    
    if (condition.symptoms.length > 0) {
      description += `**Common Symptoms:**\n${condition.symptoms.map(s => `• ${s}`).join('\n')}\n\n`;
    }
    
    if (condition.causes.length > 0) {
      description += `**Common Causes:**\n${condition.causes.map(c => `• ${c}`).join('\n')}\n\n`;
    }
    
    if (condition.treatments.length > 0) {
      description += `**Treatment Options:**\n${condition.treatments.map(t => `• ${t}`).join('\n')}\n\n`;
    }
    
    if (condition.prevention.length > 0) {
      description += `**Prevention Strategies:**\n${condition.prevention.map(p => `• ${p}`).join('\n')}\n\n`;
    }
    
    if (condition.whenToSeeDoctor.length > 0) {
      description += `**When to See a Doctor:**\n${condition.whenToSeeDoctor.map(w => `• ${w}`).join('\n')}`;
    }
    
    return description;
  }

  private getRelatedTopics(condition: HealthCondition): string[] {
    const allTopics = Object.keys(this.healthDatabase);
    return allTopics.filter(topic => topic !== condition.name.toLowerCase()).slice(0, 4);
  }

  private getGeneralHealthAdvice(query: string): HealthSearchResult {
    return {
      summary: `General health information related to: "${query}"`,
      details: `While specific information about "${query}" may require consultation with a healthcare provider, here are some general health principles:\n\n**Maintain a Healthy Lifestyle:**\n• Eat a balanced diet rich in fruits, vegetables, and whole grains\n• Exercise regularly (at least 150 minutes per week)\n• Get adequate sleep (7-9 hours nightly)\n• Manage stress effectively\n• Avoid smoking and limit alcohol\n• Stay hydrated\n• Get regular check-ups\n\n**When to Seek Medical Care:**\n• Persistent or severe symptoms\n• Sudden changes in health\n• Concerns about medications\n• Preventive care and screenings`,
      sources: [
        "Centers for Disease Control and Prevention (CDC)",
        "World Health Organization (WHO)",
        "U.S. Department of Health and Human Services"
      ],
      relatedTopics: ["Preventive care", "Nutrition", "Exercise", "Mental health"],
      recommendations: [
        "Consult healthcare providers for specific concerns",
        "Maintain regular check-ups",
        "Keep track of health metrics",
        "Stay informed about health topics",
        "Build a support network"
      ],
      medicalDisclaimer: "This general information should not replace professional medical advice. For specific health concerns, please consult with a qualified healthcare provider."
    };
  }
}

export const healthAPI = new HealthAPIService();