import { Habit, Progress } from '../types';

interface HabitAnalytics {
  id: string;
  title: string;
  completionRate: number;
  currentStreak: number;
  totalSessions: number;
  category?: string;
}

interface AnalyticsData {
  overallCompletionRate: number;
  longestCurrentStreak: number;
  totalSessions: number;
  totalCompletions: number;
  averageDaily: number;
  bestDay: string;
  consistencyScore: number;
  habitBreakdown: HabitAnalytics[];
}

export const exportToCSV = (habits: Habit[], progressArray: Progress[]) => {
  const csvHeaders = [
    'Habit ID',
    'Habit Title',
    'Category',
    'Total Completions',
    'Current Streak',
    'Best Streak',
    'Last Completion',
    'Creation Date'
  ];

  const csvRows = habits.map(habit => {
    const habitProgress = progressArray.find(p => p.habitId === habit.id);
    const completions = habitProgress?.completions || [];
    const lastCompletion = completions.length > 0 
      ? completions[completions.length - 1] 
      : 'Never';

    return [
      habit.id,
      `"${habit.title}"`,
      habit.category || 'General',
      completions.length,
      habitProgress?.currentStreak || 0,
      habitProgress?.bestStreak || 0,
      lastCompletion,
      habit.createdAt || 'Unknown'
    ];
  });

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `habit-data-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generatePDFReport = async (analyticsData: AnalyticsData, timeRange: string) => {
  // Create a simple HTML report that can be printed or saved as PDF
  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Habit Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .habits-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .habits-table th, .habits-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .habits-table th { background: #f8f9fa; font-weight: bold; }
        .progress-bar { width: 100px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: #10b981; }
        .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📈 Habit Analytics Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} | Time Range: ${timeRange}</p>
      </div>

      <div class="overview">
        <div class="metric-card">
          <div class="metric-value">${analyticsData.overallCompletionRate}%</div>
          <div class="metric-label">Overall Success Rate</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${analyticsData.longestCurrentStreak}</div>
          <div class="metric-label">Longest Current Streak</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${analyticsData.totalCompletions}</div>
          <div class="metric-label">Total Completions</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${analyticsData.consistencyScore}%</div>
          <div class="metric-label">Consistency Score</div>
        </div>
      </div>

      <h2>📊 Habit Performance Breakdown</h2>
      <table class="habits-table">
        <thead>
          <tr>
            <th>Habit</th>
            <th>Category</th>
            <th>Success Rate</th>
            <th>Current Streak</th>
            <th>Total Sessions</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          ${analyticsData.habitBreakdown.map(habit => `
            <tr>
              <td>${habit.title}</td>
              <td>${habit.category || 'General'}</td>
              <td>${habit.completionRate}%</td>
              <td>${habit.currentStreak} days</td>
              <td>${habit.totalSessions}</td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Math.min(habit.completionRate, 100)}%"></div>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>📱 Generated by Science Habits App</p>
        <p>Best performing day: ${analyticsData.bestDay} | Average daily completion: ${analyticsData.averageDaily}%</p>
      </div>
    </body>
    </html>
  `;

  // Open the report in a new window for printing/saving as PDF
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(reportHTML);
    newWindow.document.close();
    
    // Trigger print dialog after content loads
    newWindow.onload = () => {
      newWindow.print();
    };
  } else {
    alert('Please allow popups to generate the PDF report.');
  }
};