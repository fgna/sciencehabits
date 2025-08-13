import React from 'react';

interface ExportSectionProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const ExportSection: React.FC<ExportSectionProps> = ({
  onExportCSV,
  onExportPDF
}) => {
  return (
    <div className="export-section">
      <h3>Export Data</h3>
      <p className="export-subtitle">Download your progress data</p>
      
      <div className="export-buttons">
        <button
          onClick={onExportCSV}
          className="export-btn csv-btn"
        >
          <span className="btn-icon">📄</span>
          <div className="btn-content">
            <span className="btn-title">Download CSV</span>
            <span className="btn-subtitle">Raw data for analysis</span>
          </div>
        </button>
        
        <button
          onClick={onExportPDF}
          className="export-btn pdf-btn"
        >
          <span className="btn-icon">📊</span>
          <div className="btn-content">
            <span className="btn-title">Generate Report</span>
            <span className="btn-subtitle">Formatted summary</span>
          </div>
        </button>
      </div>
    </div>
  );
};