import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalysisForm from './pages/AnalysisForm';
import Results from './pages/Results';

export default function App() {
  const [resultId, setResultId] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 py-6 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">
            AD-DSS
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Academic Deployment Decision-Support System
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-6">
        <Routes>
          <Route 
            path="/" 
            element={<AnalysisForm onResultCreated={setResultId} />} 
          />
          <Route 
            path="/results/:id" 
            element={<Results />} 
          />
        </Routes>
      </main>
    </div>
  );
}
