'use client';
import { useState, useEffect, useRef } from 'react';

interface TripFormProps {
  onGenerate: (data: any) => void;
}

interface PlaceSuggestion {
  name: string;
  country: string;
  display: string;
}

export default function TripForm({ onGenerate }: TripFormProps) {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState<number | ''>('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Popular destinations with suggestions
  const popularDestinations: PlaceSuggestion[] = [
    { name: 'Paris', country: 'France', display: 'Paris, France' },
    { name: 'London', country: 'United Kingdom', display: 'London, United Kingdom' },
    { name: 'Tokyo', country: 'Japan', display: 'Tokyo, Japan' },
    { name: 'New York', country: 'USA', display: 'New York, USA' },
    { name: 'Rome', country: 'Italy', display: 'Rome, Italy' },
    { name: 'Barcelona', country: 'Spain', display: 'Barcelona, Spain' },
    { name: 'Dubai', country: 'UAE', display: 'Dubai, UAE' },
    { name: 'Bali', country: 'Indonesia', display: 'Bali, Indonesia' },
    { name: 'Singapore', country: 'Singapore', display: 'Singapore' },
    { name: 'Sydney', country: 'Australia', display: 'Sydney, Australia' },
    { name: 'Amsterdam', country: 'Netherlands', display: 'Amsterdam, Netherlands' },
    { name: 'Istanbul', country: 'Turkey', display: 'Istanbul, Turkey' },
    { name: 'Bangkok', country: 'Thailand', display: 'Bangkok, Thailand' },
    { name: 'Prague', country: 'Czech Republic', display: 'Prague, Czech Republic' },
    { name: 'Venice', country: 'Italy', display: 'Venice, Italy' },
  ];

  // Handle destination input changes
  const handleDestinationChange = (value: string) => {
    setDestination(value);

    if (value.trim().length >= 2) {
      const filtered = popularDestinations.filter(place =>
        place.display.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    setDestination(suggestion.display);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, days, preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to generate itinerary');
      }

      const data = await response.json();
      onGenerate(data);
    } catch (err) {
      setError('Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="relative" ref={suggestionsRef}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Destination
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => handleDestinationChange(e.target.value)}
          onFocus={() => destination.trim().length >= 2 && setShowSuggestions(true)}
          placeholder="Where do you want to go?"
          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoComplete="off"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 cursor-pointer"
              >
                <span className="text-lg">📍</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{suggestion.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.country}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Number of Days
        </label>
        <input
          type="number"
          min={1}
          max={30}
          value={days}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              setDays('');
            } else {
              setDays(Math.max(1, Math.min(30, Number(value))));
            }
          }}
          placeholder="Enter number of days (1-30)"
          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preferences (optional)
        </label>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="e.g., family-friendly, budget travel, adventure, food tours..."
          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>

      {error && (
        <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </span>
        ) : (
          'Generate Itinerary'
        )}
      </button>
    </form>
  );
}