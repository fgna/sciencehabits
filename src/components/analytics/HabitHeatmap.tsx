/**
 * Habit Heatmap Component
 * 
 * Interactive calendar heatmap showing habit completion patterns
 * with support for different frequency types and drill-down functionality
 */

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../ui';
import { HeatmapData } from '../../utils/frequencyAnalyticsHelpers';

interface HabitHeatmapProps {
  heatmapData: HeatmapData[];
  title?: string;
  showLegend?: boolean;
  interactive?: boolean;
  className?: string;
}

interface HeatmapCell {
  date: string;
  value: number;
  completions: number;
  totalPossible: number;
  habitBreakdown: {
    daily: number;
    weekly: number;
    periodic: number;
  };
}

export function HabitHeatmap({ 
  heatmapData, 
  title = "Habit Completion Heatmap",
  showLegend = true,
  interactive = true,
  className = ""
}: HabitHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'daily' | 'weekly' | 'periodic'>('all');

  // Transform heatmap data into calendar grid
  const calendarData = useMemo(() => {
    if (heatmapData.length === 0) return [];

    const firstDate = new Date(heatmapData[0].date);
    const lastDate = new Date(heatmapData[heatmapData.length - 1].date);
    
    // Calculate weeks needed
    const weeks: HeatmapCell[][] = [];
    let currentWeek: HeatmapCell[] = [];
    
    // Start from Sunday of the first week
    const startOfWeek = new Date(firstDate);
    startOfWeek.setDate(firstDate.getDate() - firstDate.getDay());
    
    const currentDate = new Date(startOfWeek);
    
    while (currentDate <= lastDate || currentWeek.length > 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dataPoint = heatmapData.find(d => d.date === dateStr);
      
      const cell: HeatmapCell = dataPoint ? {
        date: dateStr,
        value: dataPoint.value,
        completions: dataPoint.completions,
        totalPossible: dataPoint.totalPossible,
        habitBreakdown: dataPoint.habitBreakdown
      } : {
        date: dateStr,
        value: 0,
        completions: 0,
        totalPossible: 0,
        habitBreakdown: { daily: 0, weekly: 0, periodic: 0 }
      };
      
      currentWeek.push(cell);
      
      // Complete week (Sunday = 0 to Saturday = 6)
      if (currentDate.getDay() === 6) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Safety check to prevent infinite loop
      if (weeks.length > 60) break; // Max ~1 year of weeks
    }
    
    // Add incomplete week if it exists
    if (currentWeek.length > 0) {
      // Fill remaining days with empty cells
      while (currentWeek.length < 7) {
        const fillDate = new Date(currentDate);
        currentWeek.push({
          date: fillDate.toISOString().split('T')[0],
          value: 0,
          completions: 0,
          totalPossible: 0,
          habitBreakdown: { daily: 0, weekly: 0, periodic: 0 }
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [heatmapData]);

  const getIntensityColor = (value: number, viewMode: string) => {
    if (value === 0) return 'bg-gray-100 border-gray-200';
    
    const intensity = Math.min(value, 1);
    const colorMap = {
      all: {
        1: 'bg-green-100 border-green-200',
        2: 'bg-green-200 border-green-300', 
        3: 'bg-green-300 border-green-400',
        4: 'bg-green-400 border-green-500',
        5: 'bg-green-500 border-green-600'
      },
      daily: {
        1: 'bg-blue-100 border-blue-200',
        2: 'bg-blue-200 border-blue-300',
        3: 'bg-blue-300 border-blue-400', 
        4: 'bg-blue-400 border-blue-500',
        5: 'bg-blue-500 border-blue-600'
      },
      weekly: {
        1: 'bg-orange-100 border-orange-200',
        2: 'bg-orange-200 border-orange-300',
        3: 'bg-orange-300 border-orange-400',
        4: 'bg-orange-400 border-orange-500', 
        5: 'bg-orange-500 border-orange-600'
      },
      periodic: {
        1: 'bg-purple-100 border-purple-200',
        2: 'bg-purple-200 border-purple-300',
        3: 'bg-purple-300 border-purple-400',
        4: 'bg-purple-400 border-purple-500',
        5: 'bg-purple-500 border-purple-600'
      }
    };
    
    const level = Math.ceil(intensity * 5);
    return colorMap[viewMode as keyof typeof colorMap]?.[level as keyof typeof colorMap.all] || 
           colorMap.all[level as keyof typeof colorMap.all];
  };

  const formatCellTooltip = (cell: HeatmapCell) => {
    const date = new Date(cell.date);
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return (
      <div className="text-xs">
        <div className="font-medium">{dateStr}</div>
        <div>Completed: {cell.completions}/{cell.totalPossible}</div>
        {cell.completions > 0 && (
          <div className="mt-1 text-gray-600">
            {cell.habitBreakdown.daily > 0 && <div>Daily: {cell.habitBreakdown.daily}</div>}
            {cell.habitBreakdown.weekly > 0 && <div>Weekly: {cell.habitBreakdown.weekly}</div>}
            {cell.habitBreakdown.periodic > 0 && <div>Periodic: {cell.habitBreakdown.periodic}</div>}
          </div>
        )}
      </div>
    );
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          
          {/* View Mode Filter */}
          <div className="flex space-x-1">
            {(['all', 'daily', 'weekly', 'periodic'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {calendarData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No data available for heatmap
          </div>
        ) : (
          <div className="space-y-4">
            {/* Heatmap Calendar */}
            <div className="flex flex-col space-y-1">
              {/* Day labels */}
              <div className="flex justify-start ml-6">
                {dayLabels.map((day, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 flex items-center justify-center text-xs text-gray-500 font-medium"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="flex flex-col space-y-1">
                {calendarData.map((week, weekIndex) => {
                  // Show month label for first week of each month
                  const firstDayOfWeek = new Date(week[0].date);
                  const showMonthLabel = weekIndex === 0 || firstDayOfWeek.getDate() <= 7;
                  const monthLabel = showMonthLabel 
                    ? firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' })
                    : '';
                  
                  return (
                    <div key={weekIndex} className="flex items-center space-x-1">
                      {/* Month label */}
                      <div className="w-5 text-xs text-gray-500 font-medium text-right">
                        {monthLabel}
                      </div>
                      
                      {/* Week cells */}
                      <div className="flex space-x-1">
                        {week.map((cell, dayIndex) => {
                          const cellValue = viewMode === 'all' 
                            ? cell.value 
                            : cell.habitBreakdown[viewMode as keyof typeof cell.habitBreakdown] > 0 ? 1 : 0;
                          
                          return (
                            <div
                              key={dayIndex}
                              className={`w-4 h-4 border rounded-sm cursor-pointer transition-transform hover:scale-110 ${
                                getIntensityColor(cellValue, viewMode)
                              }`}
                              onClick={() => interactive && setSelectedCell(cell)}
                              title={interactive ? undefined : formatCellTooltip(cell).props.children}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            {showLegend && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div>Less</div>
                <div className="flex space-x-1">
                  {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 border rounded-sm ${getIntensityColor(intensity, viewMode)}`}
                    />
                  ))}
                </div>
                <div>More</div>
              </div>
            )}
            
            {/* Selected Cell Info */}
            {selectedCell && interactive && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  {new Date(selectedCell.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Completed:</span>
                    <span className="ml-2 font-medium">{selectedCell.completions}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Possible:</span>
                    <span className="ml-2 font-medium">{selectedCell.totalPossible}</span>
                  </div>
                  
                  {selectedCell.completions > 0 && (
                    <>
                      <div>
                        <span className="text-blue-600">Daily:</span>
                        <span className="ml-2 font-medium">{selectedCell.habitBreakdown.daily}</span>
                      </div>
                      <div>
                        <span className="text-orange-600">Weekly:</span>
                        <span className="ml-2 font-medium">{selectedCell.habitBreakdown.weekly}</span>
                      </div>
                      <div>
                        <span className="text-purple-600">Periodic:</span>
                        <span className="ml-2 font-medium">{selectedCell.habitBreakdown.periodic}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Completion Rate:</span>
                        <span className="ml-2 font-medium">
                          {selectedCell.totalPossible > 0 
                            ? Math.round((selectedCell.completions / selectedCell.totalPossible) * 100)
                            : 0}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}