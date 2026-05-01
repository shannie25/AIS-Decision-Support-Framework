import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        // Check sessionStorage first (for temporary results)
        const cached = sessionStorage.getItem(`result-${id}`);
        if (cached) {
          setResult(JSON.parse(cached));
          setLoading(false);
          return;
        }
        
        // Try to fetch from API
        const response = await fetch(`http://localhost:5000/api/results/${id}`);
        
        if (!response.ok) {
          throw new Error('Result not found');
        }

        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResult();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="card max-w-md mx-auto">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Back to Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { inputs, recommendation, scores, alternatives } = result;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Analysis for {inputs.school}
        </h2>
        <p className="text-sm text-gray-500">
          Result ID: {id}
        </p>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="card border-l-4 border-green-500 bg-green-50">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Recommendation
          </h3>
          <p className="text-gray-700 mb-4">
            {recommendation}
          </p>
        </div>
      )}

      {/* Scores */}
      {scores && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Assessment Scores
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(scores).map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">
                  {key}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {alternatives && alternatives.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Alternative Recommendations
          </h3>
          <div className="space-y-3">
            {alternatives.map((alt, idx) => (
              <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-900">
                  Option {idx + 1}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {alt}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Summary */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Input Parameters
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(inputs).map(([key, value]) => (
            <div key={key} className="text-sm">
              <p className="text-gray-500 font-medium">
                {key}
              </p>
              <p className="text-gray-900">
                {String(value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="btn-primary flex-1"
        >
          New Analysis
        </button>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex-1"
        >
          Print Results
        </button>
      </div>
    </div>
  );
}
