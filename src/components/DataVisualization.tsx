import React from 'react';

interface DataVisualizationProps {
  className?: string;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Data Flow Lines */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <div className="pipeline-line w-full mb-4" />
          <div className="pipeline-line w-3/4 mx-auto mb-4" />
          <div className="pipeline-line w-1/2 mx-auto" />
        </div>
      </div>

      {/* Data Nodes */}
      <div className="relative grid grid-cols-3 gap-8">
        <div className="data-card">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Data Sources</h3>
          <p className="text-sm">APIs, Databases, Streams</p>
        </div>

        <div className="data-card">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Processing</h3>
          <p className="text-sm">ETL, Transformations</p>
        </div>

        <div className="data-card">
          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Analytics</h3>
          <p className="text-sm">Insights, Visualizations</p>
        </div>
      </div>

      <div className="data-card">
        <h3 className="text-lg font-semibold">Your Content</h3>
      </div>

      <button className="data-button">Click Me</button>
    </div>
  );
};

export default DataVisualization; 