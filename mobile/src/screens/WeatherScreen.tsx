import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import {colors, spacing, typography} from '../theme';
import { weatherService, WeatherData, ForecastDay } from '../services';

const WeatherScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await weatherService.getCompleteWeatherData();
      setWeather(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load weather';
      setError(message);
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWeather();
    setRefreshing(false);
  }, [fetchWeather]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const getTemperatureColor = (temp: number) => {
    if (temp >= 25) {return '#FF6B6B';} // Hot - Red
    if (temp >= 15) {return '#4ECDC4';} // Mild - Teal
    return '#45B7D1'; // Cold - Blue
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>🌤️ Weather & Health</Text>
          <Text style={styles.subtitle}>Current weather conditions and health impacts</Text>

          {loading && !weather ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading weather data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchWeather}>
                <Text style={styles.refreshButtonText}>🔄 Retry</Text>
              </TouchableOpacity>
            </View>
          ) : weather ? (
            <>
              {/* Main Weather Card */}
              <View style={styles.weatherCard}>
                <View style={styles.weatherHeader}>
                  <Text style={styles.weatherEmoji}>{weather.emoji}</Text>
                  <View style={styles.locationInfo}>
                    <Text style={styles.location}>{weather.location}</Text>
                    <Text style={styles.condition}>{weather.condition}</Text>
                  </View>
                </View>

                <View style={styles.temperatureContainer}>
                  <Text
                    style={[
                      styles.temperature,
                      {color: getTemperatureColor(weather.temperature)},
                    ]}>
                    {weather.temperature}°C
                  </Text>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>💧</Text>
                    <Text style={styles.detailLabel}>Humidity</Text>
                    <Text style={styles.detailValue}>{weather.humidity}%</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>💨</Text>
                    <Text style={styles.detailLabel}>Wind Speed</Text>
                    <Text style={styles.detailValue}>{weather.windSpeed} km/h</Text>
                  </View>

                  {weather.uvIndex !== undefined && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailIcon}>☀️</Text>
                      <Text style={styles.detailLabel}>UV Index</Text>
                      <Text style={styles.detailValue}>{weather.uvIndex}</Text>
                    </View>
                  )}
                </View>

                {/* Air Quality */}
                {weather.airQuality && (
                  <View style={styles.airQualityContainer}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Air Quality</Text>
                    <View style={styles.airQualityContent}>
                      <Text style={styles.airQualityLevel}>{weather.airQuality.level}</Text>
                      <Text style={styles.airQualityImpact}>{weather.airQuality.healthImpact}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Health Recommendations */}
              {weather.healthRecommendations && weather.healthRecommendations.length > 0 && (
                <View style={styles.recommendationsCard}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>💡 Health Recommendations</Text>
                  {weather.healthRecommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 7-Day Forecast */}
              {weather.forecast && weather.forecast.length > 0 && (
                <View style={styles.forecastCard}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📅 7-Day Forecast</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {weather.forecast.map((day, index) => (
                      <View key={index} style={styles.forecastDay}>
                        <Text style={styles.forecastDate}>
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </Text>
                        <Text style={styles.forecastEmoji}>{day.emoji}</Text>
                        <Text style={styles.forecastTemp}>{day.tempHigh}°</Text>
                        <Text style={styles.forecastTempLow}>{day.tempLow}°</Text>
                        {day.precipitationChance > 30 && (
                          <Text style={styles.forecastPrecip}>💧 {day.precipitationChance}%</Text>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No weather data available</Text>
            </View>
          )}

          <TouchableOpacity style={styles.refreshButton} onPress={fetchWeather}>
            <Text style={styles.refreshButtonText}>
              🔄 Refresh Weather
            </Text>
          </TouchableOpacity>

          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigation.navigate('Home' as never)}>
              <Text style={styles.navButtonText}>🏠 Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigation.navigate('Todo' as never)}>
              <Text style={styles.navButtonText}>📝 Tasks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  weatherCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  weatherEmoji: {
    fontSize: 48,
    marginRight: spacing.sm,
  },
  locationInfo: {
    flex: 1,
  },
  location: {
    ...typography.h2,
    color: colors.text,
  },
  condition: {
    ...typography.body,
    color: colors.textSecondary,
  },
  temperatureContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  temperature: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  airQualityContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  airQualityContent: {
    alignItems: 'center',
  },
  airQualityLevel: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  airQualityImpact: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  recommendationsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recommendationItem: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  recommendationText: {
    ...typography.body,
    color: colors.text,
  },
  forecastCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  forecastDay: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
  },
  forecastDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  forecastEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  forecastTemp: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  forecastTempLow: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  forecastPrecip: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  refreshButtonText: {
    color: '#ffffff',
    ...typography.body,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonText: {
    ...typography.body,
    color: colors.text,
  },
});

export default WeatherScreen;
