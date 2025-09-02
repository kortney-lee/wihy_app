interface ChatGPTResponse {
  summary: string;
  details: string;
  sources: string[];
  relatedTopics: string[];
  recommendations: string[];
  medicalDisclaimer: string;
}

interface QueryLog {
  timestamp: string;
  query: string;
  rawResponse?: string;
  citationsExtracted?: string[];
}

class OpenAIHealthService {
  private apiKey: string;
  private model: string;
  private queryLog: QueryLog[];

  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    this.model = 'gpt-4';
    this.queryLog = [];
    console.log("OpenAI API Service initialized");
    console.log("API Key configured:", this.apiKey ? "Yes" : "No");
  }

  // Add the isConfigured method
  isConfigured = (): boolean => {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  };

  private async moderateQuery(query: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          input: query
        })
      });

      const data = await response.json();
      const flagged = data.results?.[0]?.flagged || false;
      
      if (flagged) {
        console.warn('🚨 Query flagged by moderation:', query);
      }
      
      return !flagged;
    } catch (error) {
      console.error('Moderation check failed:', error);
      return true;
    }
  }

  private logQuery(query: string, rawResponse: string = '', citations: string[] = []): void {
    const logEntry: QueryLog = {
      timestamp: new Date().toISOString(),
      query: query,
      rawResponse: rawResponse,
      citationsExtracted: citations
    };
    
    try {
      const existingLogs = JSON.parse(localStorage.getItem('healthQueryLogs') || '[]');
      existingLogs.push(logEntry);
      
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('healthQueryLogs', JSON.stringify(existingLogs));
      console.log('📝 Query logged for audit trail');
    } catch (error) {
      console.warn('Failed to log query:', error);
    }
  }

  searchHealthInfo = async (query: string): Promise<ChatGPTResponse> => {
    console.log(`Searching for health info: ${query}`);

    // Initial log with just the query
    this.logQuery(query);

    try {
      if (!this.isConfigured()) {
        console.warn("OpenAI API key not configured, using fallback data");
        return this.getFallbackResults(query);
      }

      // Optional: Check content moderation (can be skipped for speed)
      // const isAppropriate = await this.moderateQuery(query);
      // if (!isAppropriate) {
      //   return this.getInappropriateContentResponse();
      // }

      // Make the actual API call
      const url = 'https://api.openai.com/v1/chat/completions';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a health and nutrition expert. Provide accurate, science-based information with references. Always respond with useful information even if the query is vague.'
            },
            {
              role: 'user',
              content: `Please provide health and nutrition information about: ${query}. Include a brief summary, detailed information, sources, related topics, recommendations, and a medical disclaimer.`
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        console.error("API error:", await response.text());
        return this.getFallbackResults(query);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Unexpected API response format:", data);
        return this.getFallbackResults(query);
      }
      
      const content = data.choices[0].message.content;
      
      // Extract structured information from the response
      const summary = this.extractSummary(content);
      const details = this.extractDetails(content);
      const sources = this.extractRealCitations(content);
      const recommendations = this.extractRecommendations(content);
      const relatedTopics = this.generateRelatedTopics(query);
      
      // Update log with full response
      this.logQuery(query, content, sources);
      
      return {
        summary,
        details,
        sources,
        relatedTopics,
        recommendations,
        medicalDisclaimer: "This information is for educational purposes only and not intended as medical advice."
      };
    } catch (error) {
      console.error("Error processing search request:", error);
      return this.getFallbackResults(query);
    }
  };
  
  // Extract citations from OpenAI response
  private extractRealCitations(text: string): string[] {
    // Simple extraction of citations - improve as needed
    const citations: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.match(/^\d+\.\s/) || line.includes('Source:') || line.includes('Reference:')) {
        citations.push(line.trim());
      }
    }
    
    return citations;
  }

  // Add helper methods to extract information from the response
  private extractSummary(content: string): string {
    const firstParagraph = content.split('\n\n')[0];
    return firstParagraph || `Information about the requested topic`;
  }

  private extractDetails(content: string): string {
    // Skip the first paragraph (summary) and take the rest for details
    const paragraphs = content.split('\n\n');
    if (paragraphs.length > 1) {
      return paragraphs.slice(1).join('\n\n');
    }
    return content;
  }

  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = [];
    const lines = content.split('\n');
    
    let inRecommendationsSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommendation') && line.includes(':')) {
        inRecommendationsSection = true;
        continue;
      }
      
      if (inRecommendationsSection && line.trim() && line.match(/^[•\-\*]/)) {
        recommendations.push(line.replace(/^[•\-\*]\s*/, '').trim());
      } else if (inRecommendationsSection && line.trim() === '') {
        inRecommendationsSection = false;
      }
    }
    
    // If no recommendations found, generate some generic ones
    if (recommendations.length === 0) {
      recommendations.push(`Consult healthcare professionals for personalized advice`);
      recommendations.push(`Research from reliable medical sources for more information`);
    }
    
    return recommendations;
  }

  private generateRelatedTopics(query: string): string[] {
    const baseTopics = ["Nutrition", "Health Benefits", "Dietary Considerations", "Research"];
    return baseTopics.map(topic => `${query} ${topic}`);
  }

  // Create a fallback response for when API calls fail
  private getFallbackResults(query: string): ChatGPTResponse {
    return {
      summary: `Information about ${query}`,
      details: `${query} is a topic related to health or nutrition. While we couldn't retrieve specific information at this moment, it's generally recommended to consider how any food or health practice fits within a balanced lifestyle.

Common nutritional advice includes eating a varied diet rich in fruits, vegetables, whole grains, lean proteins, and healthy fats. Moderation is key with most foods and health practices.

For specific health conditions or concerns, consulting with healthcare professionals is always recommended.`,
      sources: [
        "General nutrition guidelines",
        "Medical consensus on balanced diets",
        "USDA Dietary Guidelines"
      ],
      relatedTopics: [
        `${query} nutrition facts`,
        `${query} health impact`,
        `${query} in balanced diet`,
        `${query} research`
      ],
      recommendations: [
        "Consider how this fits within your overall balanced diet",
        "Consult healthcare professionals for personalized advice",
        "Research from reliable medical sources for more information"
      ],
      medicalDisclaimer: "This information is for educational purposes only and not intended as medical advice."
    };
  }

  // Response for inappropriate content
  private getInappropriateContentResponse(): ChatGPTResponse {
    return {
      summary: "We're unable to provide information on this topic",
      details: "The requested information appears to be outside the scope of general health and nutrition advice that we can provide. Our service focuses on evidence-based health and nutrition information.",
      sources: ["Medical ethics guidelines", "Content policy"],
      relatedTopics: [
        "General nutrition guidelines",
        "Balanced diet principles",
        "Recommended daily nutrition"
      ],
      recommendations: [
        "Consider searching for general health and nutrition topics",
        "Consult healthcare professionals for specific medical advice",
        "Refer to reputable health resources for specialized information"
      ],
      medicalDisclaimer: "This information is for educational purposes only and not intended as medical advice."
    };
  }
}

export default new OpenAIHealthService();
export const openaiAPI = new OpenAIHealthService();