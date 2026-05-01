import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FORM_FIELDS = {
  school: { label: 'Institution Name', type: 'text', required: true },
  students: { label: 'Student Population', type: 'select', options: ['small', 'medium', 'large', 'xlarge'] },
  staff: { label: 'Staff Size', type: 'select', options: ['small', 'medium', 'large'] },
  it: { label: 'IT Resources', type: 'select', options: ['none', 'small', 'full'] },
  itype: { label: 'Institution Type', type: 'select', options: ['private', 'public'] },
  hw: { label: 'Hardware Condition', type: 'select', options: ['none', 'old', 'some', 'good'] },
  power: { label: 'Power Reliability', type: 'select', options: ['poor', 'fair', 'good'] },
  capex: { label: 'Capital Budget', type: 'select', options: ['none', 'low', 'med', 'high'] },
  opex: { label: 'Operating Budget', type: 'select', options: ['none', 'low', 'med', 'high'] },
  costpref: { label: 'Cost Preference', type: 'select', options: ['capex', 'opex', 'neutral'] },
  uptime: { label: 'Current Uptime (%)', type: 'number', min: 40, max: 100 },
  speed: { label: 'Network Speed (Mbps)', type: 'number', min: 1, max: 200 },
  gov: { label: 'Government Support (1-5)', type: 'number', min: 1, max: 5 },
  acc: { label: 'Academic Quality (1-5)', type: 'number', min: 1, max: 5 },
  priv: { label: 'Privacy Requirements (1-5)', type: 'number', min: 1, max: 5 },
  scale: { label: 'Scalability Need (1-5)', type: 'number', min: 1, max: 5 },
};

export default function AnalysisForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    school: '',
    students: 'medium',
    staff: 'medium',
    it: 'small',
    itype: 'public',
    hw: 'some',
    power: 'fair',
    capex: 'med',
    opex: 'med',
    costpref: 'neutral',
    uptime: 85,
    speed: 50,
    gov: 3,
    acc: 3,
    priv: 3,
    scale: 3,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('uptime') || name.includes('speed') || ['gov', 'acc', 'priv', 'scale'].includes(name) 
        ? Number(value) 
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      
      // Cache the result in sessionStorage so Results page can access it
      sessionStorage.setItem(`result-${result.id}`, JSON.stringify(result));
      
      navigate(`/results/${result.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Institutional Analysis
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.entries(FORM_FIELDS).map(([key, field]) => (
            <div key={key}>
              <label className="field-label">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="field-input"
                >
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  min={field.min}
                  max={field.max}
                  required={field.required}
                  className="field-input"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </form>
      </div>
    </div>
  );
}
