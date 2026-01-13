import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';
import * as Location from 'expo-location';

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  emoji: string;
  uvIndex?: number;
  airQuality?: {
    aqi: number;
    level: string;
    healthImpact: string;
  };
  forecast?: ForecastDay[];
  healthRecommendations?: string[];
}

export interface ForecastDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  emoji: string;
  precipitationChance: number;
}

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
}

class WeatherService {
  private apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';
  
  /**
   * Get user's current location
   */
  async getCurrentLocation(): Promise<WeatherLocation> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: geocode.city || undefined,
        region: geocode.region || undefined,
        country: geocode.country || undefined,
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      // Fallback to default location (New York)
      return {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        region: 'NY',
        country: 'US',
      };
    }
  }

  /**
   * Get current weather for location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      if (!this.apiKey) {
        return this.getMockWeather();
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
      const response = await fetchWithLogging(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        location: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        emoji: this.getWeatherEmoji(data.weather[0].main),
        uvIndex: data.uvi,
      };
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      return this.getMockWeather();
    }
  }

  /**
   * Get weather forecast
   */
  async getForecast(lat: number, lon: number, days: number = 7): Promise<ForecastDay[]> {
    try {
      if (!this.apiKey) {
        return this.getMockForecast();
      }

      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=${days * 8}&appid=${this.apiKey}`;
      const response = await fetchWithLogging(url);
      
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Group by day and take daily averages
      const dailyData: { [key: string]: any[] } = {};
      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = [];
        }
        dailyData[date].push(item);
      });

      return Object.entries(dailyData).slice(0, days).map(([date, items]) => {
        const temps = items.map(i => i.main.temp);
        const conditions = items.map(i => i.weather[0].main);
        const precip = items.map(i => i.pop || 0);
        
        return {
          date,
          tempHigh: Math.round(Math.max(...temps)),
          tempLow: Math.round(Math.min(...temps)),
          condition: conditions[Math.floor(conditions.length / 2)],
          emoji: this.getWeatherEmoji(conditions[Math.floor(conditions.length / 2)]),
          precipitationChance: Math.round(Math.max(...precip) * 100),
        };
      });
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
      return this.getMockForecast();
    }
  }

  /**
   * Get air quality index
   */
  async getAirQuality(lat: number, lon: number): Promise<WeatherData['airQuality']> {
    try {
      if (!this.apiKey) {
        return this.getMockAirQuality();
      }

      const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;
      const response = await fetchWithLogging(url);
      
      if (!response.ok) {
        throw new Error(`Air Quality API error: ${response.status}`);
      }

      const data = await response.json();
      const aqi = data.list[0].main.aqi;
      
      return {
        aqi,
        level: this.getAQILevel(aqi),
        healthImpact: this.getAQIHealthImpact(aqi),
      };
    } catch (error) {
      console.error('Failed to fetch air quality:', error);
      return this.getMockAirQuality();
    }
  }

  /**
   * Get health recommendations based on weather
   */
  async getHealthRecommendations(weatherData: WeatherData, userProfile?: any): Promise<string[]> {
    const recommendations: string[] = [];

    // Temperature-based recommendations
    if (weatherData.temperature > 30) {
      recommendations.push('🌡️ Stay hydrated - drink extra water in hot weather');
      recommendations.push('🏃 Exercise during cooler hours (early morning or evening)');
    } else if (weatherData.temperature < 5) {
      recommendations.push('🧥 Dress warmly to prevent cold-related illnesses');
      recommendations.push('🏃 Warm up thoroughly before outdoor exercise');
    }

    // UV Index recommendations
    if (weatherData.uvIndex && weatherData.uvIndex > 6) {
      recommendations.push('☀️ Apply SPF 30+ sunscreen every 2 hours');
      recommendations.push('🕶️ Wear protective clothing and sunglasses');
    }

    // Air quality recommendations
    if (weatherData.airQuality && weatherData.airQuality.aqi > 100) {
      recommendations.push('😷 Consider wearing a mask outdoors');
      recommendations.push('🏋️ Limit outdoor exercise intensity');
    }

    // Humidity recommendations
    if (weatherData.humidity > 80) {
      recommendations.push('💧 High humidity may impact workout performance - adjust intensity');
    }

    // Wind recommendations
    if (weatherData.windSpeed > 30) {
      recommendations.push('💨 Strong winds - be cautious with outdoor activities');
    }

    return recommendations;
  }

  /**
   * Get complete weather data with health insights
   */
  async getCompleteWeatherData(lat?: number, lon?: number): Promise<WeatherData> {
    try {
      let location: WeatherLocation;
      
      if (lat && lon) {
        location = { latitude: lat, longitude: lon };
      } else {
        location = await this.getCurrentLocation();
      }

      const [weather, forecast, airQuality] = await Promise.all([
        this.getCurrentWeather(location.latitude, location.longitude),
        this.getForecast(location.latitude, location.longitude, 7),
        this.getAirQuality(location.latitude, location.longitude),
      ]);

      const completeWeather = {
        ...weather,
        location: location.city || weather.location,
        forecast,
        airQuality,
      };

      const healthRecommendations = await this.getHealthRecommendations(completeWeather);

      return {
        ...completeWeather,
        healthRecommendations,
      };
    } catch (error) {
      console.error('Failed to get complete weather data:', error);
      return this.getMockWeather();
    }
  }

  // Helper methods
  private getWeatherEmoji(condition: string): string {
    const emojiMap: { [key: string]: string } = {
      Clear: '☀️',
      Clouds: '☁️',
      Rain: '🌧️',
      Drizzle: '🌦️',
      Thunderstorm: '⛈️',
      Snow: '❄️',
      Mist: '🌫️',
      Fog: '🌫️',
      Haze: '🌫️',
    };
    return emojiMap[condition] || '🌤️';
  }

  private getAQILevel(aqi: number): string {
    if (aqi === 1) return 'Good';
    if (aqi === 2) return 'Fair';
    if (aqi === 3) return 'Moderate';
    if (aqi === 4) return 'Poor';
    return 'Very Poor';
  }

  private getAQIHealthImpact(aqi: number): string {
    if (aqi === 1) return 'Air quality is good, enjoy outdoor activities';
    if (aqi === 2) return 'Air quality is acceptable';
    if (aqi === 3) return 'Sensitive groups should limit prolonged outdoor exposure';
    if (aqi === 4) return 'Everyone should reduce prolonged outdoor exertion';
    return 'Health alert: everyone may experience serious health effects';
  }

  // Mock data methods
  private getMockWeather(): WeatherData {
    const mockData = [
      {
        location: 'New York',
        temperature: 22,
        condition: 'Sunny',
        humidity: 65,
        windSpeed: 8,
        emoji: '☀️',
        uvIndex: 7,
      },
      {
        location: 'San Francisco',
        temperature: 18,
        condition: 'Cloudy',
        humidity: 78,
        windSpeed: 12,
        emoji: '☁️',
        uvIndex: 4,
      },
      {
        location: 'Miami',
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 72,
        windSpeed: 6,
        emoji: '⛅',
        uvIndex: 9,
      },
    ];
    return mockData[Math.floor(Math.random() * mockData.length)];
  }

  private getMockForecast(): ForecastDay[] {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Partly Cloudy'];
    return Array.from({ length: 7 }, (_, i) => {
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      return {
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tempHigh: Math.round(20 + Math.random() * 10),
        tempLow: Math.round(10 + Math.random() * 10),
        condition,
        emoji: this.getWeatherEmoji(condition),
        precipitationChance: Math.round(Math.random() * 100),
      };
    });
  }

  private getMockAirQuality(): WeatherData['airQuality'] {
    const aqi = Math.floor(Math.random() * 5) + 1;
    return {
      aqi,
      level: this.getAQILevel(aqi),
      healthImpact: this.getAQIHealthImpact(aqi),
    };
  }
}

export const weatherService = new WeatherService();
