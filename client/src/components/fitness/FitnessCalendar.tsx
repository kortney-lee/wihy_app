import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Dumbbell,
  Moon,
  Check,
  Clock,
  Flame,
  Target,
  Trophy,
  PlayCircle
} from 'lucide-react';
import { CalendarData, CalendarDayData, CalendarWorkout, FitnessProgram } from '../../types/fitness';

interface FitnessCalendarProps {
  programId: string;
  programName?: string;
  calendarData?: CalendarData;
  onDaySelect?: (date: string, workouts: CalendarWorkout[]) => void;
  onStartWorkout?: (workoutId: string) => void;
  onBack?: () => void;
}

// Helper to get days in a month
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper to get first day of month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

// Format date as YYYY-MM-DD
const formatDate = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Parse date string to Date object
const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const FitnessCalendar: React.FC<FitnessCalendarProps> = ({
  programId,
  programName,
  calendarData,
  onDaySelect,
  onStartWorkout,
  onBack
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build a map of dates to calendar days for quick lookup
  const calendarDayMap = useMemo(() => {
    const map = new Map<string, CalendarDayData>();
    calendarData?.calendar_days.forEach(day => {
      map.set(day.date, day);
    });
    return map;
  }, [calendarData]);

  // Get calendar grid
  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const grid: (number | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(day);
    }

    return grid;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDayClick = (day: number) => {
    const dateStr = formatDate(currentYear, currentMonth, day);
    setSelectedDate(dateStr);
    
    const dayData = calendarDayMap.get(dateStr);
    if (onDaySelect && dayData) {
      onDaySelect(dateStr, dayData.workouts);
    }
  };

  const getDayStyle = (day: number) => {
    const dateStr = formatDate(currentYear, currentMonth, day);
    const dayData = calendarDayMap.get(dateStr);
    const isToday = dateStr === formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    const isSelected = dateStr === selectedDate;

    let bgColor = 'bg-white';
    let textColor = 'text-gray-900';
    let borderColor = 'border-gray-200';
    let dotColor = '';

    if (dayData) {
      if (dayData.has_rest_day && !dayData.has_workout) {
        bgColor = 'bg-gray-50';
        textColor = 'text-gray-500';
      } else if (dayData.has_workout) {
        if (dayData.all_completed) {
          dotColor = 'bg-green-500';
        } else {
          dotColor = 'bg-blue-500';
        }
      }
    }

    if (isToday) {
      borderColor = 'border-orange-400 border-2';
    }

    if (isSelected) {
      bgColor = 'bg-blue-500';
      textColor = 'text-white';
      borderColor = 'border-blue-500';
    }

    return { bgColor, textColor, borderColor, dotColor, isToday, isSelected };
  };

  const selectedDayData = selectedDate ? calendarDayMap.get(selectedDate) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <h1 className="text-xl font-bold flex-1 text-center">
              {programName || 'Workout Calendar'}
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Stats */}
          {calendarData?.summary && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{calendarData.summary.workout_days}</p>
                <p className="text-xs text-white/80">Workout Days</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{calendarData.summary.completed_days}</p>
                <p className="text-xs text-white/80">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{calendarData.summary.completion_percentage}%</p>
                <p className="text-xs text-white/80">Progress</p>
              </div>
            </div>
          )}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <h2 className="text-lg font-bold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map(day => (
              <div 
                key={day}
                className="py-3 text-center text-xs font-semibold text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarGrid.map((day, index) => {
              if (day === null) {
                return (
                  <div 
                    key={`empty-${index}`}
                    className="aspect-square border-b border-r border-gray-100"
                  />
                );
              }

              const { bgColor, textColor, borderColor, dotColor, isToday, isSelected } = getDayStyle(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square border-b border-r border-gray-100 flex flex-col items-center justify-center relative transition-all ${bgColor} ${textColor} hover:bg-gray-50 ${isSelected ? 'hover:bg-blue-500' : ''}`}
                >
                  <span 
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      isToday && !isSelected ? 'bg-orange-100 text-orange-600 font-bold' : ''
                    } ${isSelected ? 'bg-white/20' : ''}`}
                  >
                    {day}
                  </span>
                  
                  {/* Workout indicator dot */}
                  {dotColor && (
                    <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${dotColor} ${isSelected ? 'bg-white' : ''}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-gray-600">Rest Day</span>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDate && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </h3>

            {selectedDayData ? (
              <>
                {selectedDayData.has_rest_day && !selectedDayData.has_workout ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Moon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-xl font-semibold text-gray-700">Rest Day</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Recovery time for muscle growth
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayData.workouts.map(workout => (
                      <div 
                        key={workout.workout_id}
                        className="bg-gray-50 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{workout.name}</h4>
                            <p className="text-sm text-gray-500">
                              Week {workout.week}, Day {workout.day}
                            </p>
                          </div>
                          
                          {workout.is_completed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              <Check className="w-4 h-4" />
                              Done
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              <Clock className="w-4 h-4" />
                              Pending
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {workout.estimated_duration} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Dumbbell className="w-4 h-4" />
                            {workout.exercise_count} exercises
                          </span>
                        </div>

                        {workout.is_completed && workout.completed_at && (
                          <div className="text-xs text-gray-500 mb-3">
                            Completed at {new Date(workout.completed_at).toLocaleTimeString()}
                            {workout.energy_level && ` • Energy: ${workout.energy_level}`}
                          </div>
                        )}

                        {!workout.is_completed && !workout.is_rest_day && onStartWorkout && (
                          <button
                            onClick={() => onStartWorkout(workout.workout_id)}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <PlayCircle className="w-5 h-5" />
                            Start Workout
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No workout scheduled</p>
              </div>
            )}
          </div>
        )}

        {/* Today's Workout Quick Access */}
        {!selectedDate && (
          <div className="mt-6">
            {(() => {
              const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
              const todayData = calendarDayMap.get(todayStr);
              const todayWorkout = todayData?.workouts.find(w => !w.is_rest_day && !w.is_completed);

              if (todayWorkout && onStartWorkout) {
                return (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-white/80">Today's Workout</p>
                        <h3 className="text-lg font-bold">{todayWorkout.name}</h3>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Flame className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 text-sm text-white/90 mb-4">
                      <span>{todayWorkout.estimated_duration} min</span>
                      <span>•</span>
                      <span>{todayWorkout.exercise_count} exercises</span>
                    </div>

                    <button
                      onClick={() => onStartWorkout(todayWorkout.workout_id)}
                      className="w-full py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Start Now
                    </button>
                  </div>
                );
              }

              return null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default FitnessCalendar;
