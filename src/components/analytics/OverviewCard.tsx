import React from 'react';

interface TrendData {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  timeframe: string;
}

interface OverviewCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: TrendData;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  icon,
  trend
}) => {
  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '→';
    }
  };

  return (
    <div className="overview-card">
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <span className="card-title">{title}</span>
      </div>
      
      <div className="card-value">
        {value}
      </div>
      
      {trend && (
        <div className={`card-trend ${getTrendColor(trend.direction)}`}>
          <span>{getTrendIcon(trend.direction)}</span>
          <span>{Math.abs(trend.percentage)}% {trend.timeframe}</span>
        </div>
      )}
    </div>
  );
};