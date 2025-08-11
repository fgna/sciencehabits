import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { AnalyticsData, HabitAnalytics } from '../../utils/analyticsHelpers';
import { formatPercentage } from '../../stores/analyticsStore';

interface ReportExporterProps {
  analytics: AnalyticsData;
  habitPerformance: HabitAnalytics[];
  timeRange: string;
}

type ReportFormat = 'pdf' | 'csv' | 'json';
type ReportType = 'summary' | 'detailed' | 'habits' | 'insights';

export function ReportExporter({ analytics, habitPerformance, timeRange }: ReportExporterProps) {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf');
  const [selectedTypes, setSelectedTypes] = useState<ReportType[]>(['summary']);
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes: { id: ReportType; name: string; description: string; icon: string }[] = [
    {
      id: 'summary',
      name: 'Executive Summary',
      description: 'High-level overview of your habit tracking performance',
      icon: '📊'
    },
    {
      id: 'detailed',
      name: 'Detailed Analytics',
      description: 'Comprehensive analysis with charts and trends',
      icon: '📈'
    },
    {
      id: 'habits',
      name: 'Individual Habits',
      description: 'Performance breakdown for each habit',
      icon: '📋'
    },
    {
      id: 'insights',
      name: 'Insights & Recommendations',
      description: 'AI-generated insights and improvement suggestions',
      icon: '💡'
    }
  ];

  const formatOptions: { id: ReportFormat; name: string; description: string; icon: string }[] = [
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Professional formatted document',
      icon: '📄'
    },
    {
      id: 'csv',
      name: 'CSV Data',
      description: 'Spreadsheet-compatible format',
      icon: '📊'
    },
    {
      id: 'json',
      name: 'JSON Export',
      description: 'Raw data for external analysis',
      icon: '⚙️'
    }
  ];

  const handleExport = async () => {
    setIsGenerating(true);
    
    try {
      switch (selectedFormat) {
        case 'pdf':
          await generatePDFReport();
          break;
        case 'csv':
          await generateCSVReport();
          break;
        case 'json':
          await generateJSONReport();
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDFReport = async () => {
    const reportData = generateReportData();
    const htmlContent = generateHTMLReport(reportData);
    
    // In a real implementation, you would use a PDF generation library like jsPDF or Puppeteer
    // For now, we'll create a downloadable HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ScienceHabits_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSVReport = async () => {
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ScienceHabits_Data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateJSONReport = async () => {
    const jsonData = {
      export_date: new Date().toISOString(),
      time_range: timeRange,
      analytics: analytics,
      habit_performance: habitPerformance,
      report_types: selectedTypes
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ScienceHabits_Export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportData = () => {
    return {
      exportDate: new Date().toISOString(),
      timeRange,
      analytics,
      habitPerformance,
      insights: generateInsightsSummary(),
      selectedTypes
    };
  };

  const generateHTMLReport = (data: any) => {
    const styles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f9fafb; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
        .subtitle { color: #6b7280; font-size: 16px; }
        .section { margin-bottom: 32px; }
        .section-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px; display: flex; align-items: center; }
        .section-title .icon { margin-right: 8px; font-size: 24px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
        .metric-card { padding: 20px; background: #f3f4f6; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 4px; }
        .metric-label { color: #6b7280; font-size: 14px; }
        .habit-list { space-y: 12px; }
        .habit-item { padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #2563eb; }
        .habit-name { font-weight: 600; color: #111827; margin-bottom: 4px; }
        .habit-stats { color: #6b7280; font-size: 14px; }
        .insight { padding: 16px; background: #dbeafe; border-radius: 8px; margin-bottom: 12px; }
        .insight-title { font-weight: 600; color: #1e40af; margin-bottom: 4px; }
        .insight-text { color: #1e3a8a; font-size: 14px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
      </style>
    `;

    let content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ScienceHabits Analytics Report</title>
          ${styles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🧠 ScienceHabits</div>
              <div class="subtitle">Analytics Report - ${new Date(data.exportDate).toLocaleDateString()}</div>
              <div class="subtitle">Time Period: ${timeRange}</div>
            </div>
    `;

    if (selectedTypes.includes('summary')) {
      content += `
        <div class="section">
          <h2 class="section-title"><span class="icon">📊</span>Executive Summary</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${Math.round(analytics.overallCompletionRate)}%</div>
              <div class="metric-label">Overall Completion Rate</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analytics.totalCompletions}</div>
              <div class="metric-label">Total Completions</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analytics.longestOverallStreak}</div>
              <div class="metric-label">Longest Streak (days)</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analytics.activeHabitsCount}</div>
              <div class="metric-label">Active Habits</div>
            </div>
          </div>
        </div>
      `;
    }

    if (selectedTypes.includes('habits')) {
      content += `
        <div class="section">
          <h2 class="section-title"><span class="icon">📋</span>Habit Performance</h2>
          <div class="habit-list">
      `;
      
      habitPerformance.forEach(habit => {
        content += `
          <div class="habit-item">
            <div class="habit-name">${habit.habitTitle}</div>
            <div class="habit-stats">
              Completion: ${Math.round(habit.completionRate)}% | 
              Current Streak: ${habit.currentStreak} days | 
              Best Streak: ${habit.longestStreak} days | 
              Consistency: ${Math.round(habit.consistencyScore)}
            </div>
          </div>
        `;
      });
      
      content += `
          </div>
        </div>
      `;
    }

    if (selectedTypes.includes('insights')) {
      const insights = generateInsightsSummary();
      content += `
        <div class="section">
          <h2 class="section-title"><span class="icon">💡</span>Key Insights</h2>
      `;
      
      insights.forEach(insight => {
        content += `
          <div class="insight">
            <div class="insight-title">${insight.title}</div>
            <div class="insight-text">${insight.message}</div>
          </div>
        `;
      });
      
      content += `</div>`;
    }

    content += `
            <div class="footer">
              Generated by ScienceHabits Analytics • ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `;

    return content;
  };

  const generateCSVContent = () => {
    let csvContent = '';
    
    // Habit performance data
    csvContent += 'Habit Name,Category,Completion Rate (%),Current Streak,Longest Streak,Total Completions,Consistency Score,Days Tracked\n';
    habitPerformance.forEach(habit => {
      csvContent += `"${habit.habitTitle}","${habit.habitCategory}",${habit.completionRate.toFixed(2)},${habit.currentStreak},${habit.longestStreak},${habit.totalCompletions},${habit.consistencyScore.toFixed(2)},${habit.daysTracked}\n`;
    });

    csvContent += '\n';
    
    // Overall analytics
    csvContent += 'Metric,Value\n';
    csvContent += `Overall Completion Rate (%),${analytics.overallCompletionRate.toFixed(2)}\n`;
    csvContent += `Total Completions,${analytics.totalCompletions}\n`;
    csvContent += `Longest Overall Streak,${analytics.longestOverallStreak}\n`;
    csvContent += `Active Habits Count,${analytics.activeHabitsCount}\n`;
    csvContent += `Consistency Score,${analytics.consistencyScore.toFixed(2)}\n`;
    csvContent += `Momentum Score,${analytics.momentumScore.toFixed(2)}\n`;
    csvContent += `Days Tracked,${analytics.totalDaysTracked}\n`;

    return csvContent;
  };

  const generateInsightsSummary = () => {
    const insights = [];

    if (analytics.overallCompletionRate >= 80) {
      insights.push({
        title: 'Excellent Performance',
        message: `Your ${Math.round(analytics.overallCompletionRate)}% completion rate demonstrates strong commitment to your habits.`
      });
    }

    if (analytics.longestOverallStreak >= 30) {
      insights.push({
        title: 'Impressive Consistency',
        message: `Your ${analytics.longestOverallStreak}-day streak shows excellent dedication and habit formation.`
      });
    }

    const topHabit = habitPerformance.reduce((best, current) => 
      current.completionRate > best.completionRate ? current : best
    );
    
    if (topHabit) {
      insights.push({
        title: 'Top Performing Habit',
        message: `"${topHabit.habitTitle}" is your strongest habit with ${Math.round(topHabit.completionRate)}% completion rate.`
      });
    }

    const improvementAreas = habitPerformance.filter(h => h.completionRate < 60);
    if (improvementAreas.length > 0) {
      insights.push({
        title: 'Areas for Improvement',
        message: `Consider focusing on ${improvementAreas.length} habit${improvementAreas.length > 1 ? 's' : ''} with completion rates below 60%.`
      });
    }

    return insights;
  };

  const toggleReportType = (type: ReportType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Export Analytics Report</h3>
          <p className="text-sm text-gray-600">
            Generate comprehensive reports from your habit tracking data
          </p>
        </CardHeader>
        <CardContent>
          {/* Report Types Selection */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-gray-900">Report Sections</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {reportTypes.map(type => (
                <label key={type.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.id)}
                    onChange={() => toggleReportType(type.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{type.icon}</span>
                      <span className="font-medium text-gray-900">{type.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-gray-900">Export Format</h4>
            <div className="flex flex-wrap gap-2">
              {formatOptions.map(format => (
                <Button
                  key={format.id}
                  variant={selectedFormat === format.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFormat(format.id)}
                  className="flex items-center space-x-2"
                >
                  <span>{format.icon}</span>
                  <span>{format.name}</span>
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {formatOptions.find(f => f.id === selectedFormat)?.description}
            </p>
          </div>

          {/* Export Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Exporting {selectedTypes.length} section{selectedTypes.length !== 1 ? 's' : ''} as {selectedFormat.toUpperCase()}
            </div>
            <Button
              onClick={handleExport}
              disabled={isGenerating || selectedTypes.length === 0}
              className="flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export Report</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <h4 className="font-medium text-gray-900">Report Preview</h4>
        </CardHeader>
        <CardContent>
          <ReportPreview 
            analytics={analytics}
            habitPerformance={habitPerformance}
            selectedTypes={selectedTypes}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ReportPreview({ 
  analytics, 
  habitPerformance, 
  selectedTypes 
}: { 
  analytics: AnalyticsData;
  habitPerformance: HabitAnalytics[];
  selectedTypes: ReportType[];
}) {
  if (selectedTypes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📄</div>
        <p>Select report sections to see preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedTypes.includes('summary') && (
        <div>
          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
            <span className="mr-2">📊</span>
            Executive Summary Preview
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{Math.round(analytics.overallCompletionRate)}%</div>
              <div className="text-xs text-gray-600">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{analytics.totalCompletions}</div>
              <div className="text-xs text-gray-600">Total Completions</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{analytics.longestOverallStreak}</div>
              <div className="text-xs text-gray-600">Longest Streak</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{analytics.activeHabitsCount}</div>
              <div className="text-xs text-gray-600">Active Habits</div>
            </div>
          </div>
        </div>
      )}

      {selectedTypes.includes('habits') && (
        <div>
          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
            <span className="mr-2">📋</span>
            Habit Performance Preview (Top 3)
          </h5>
          <div className="space-y-2">
            {habitPerformance.slice(0, 3).map((habit, index) => (
              <div key={habit.habitId} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="font-medium truncate">{habit.habitTitle}</span>
                <span className="text-primary-600">{Math.round(habit.completionRate)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTypes.includes('insights') && (
        <div>
          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            Insights Preview
          </h5>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              • Overall performance analysis and trends
              <br />
              • Habit-specific recommendations
              <br />
              • Goal achievement insights
              <br />
              • Improvement opportunities
            </p>
          </div>
        </div>
      )}
    </div>
  );
}