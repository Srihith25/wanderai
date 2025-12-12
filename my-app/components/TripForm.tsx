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
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch location suggestions from Nominatim (OpenStreetMap) API
  const fetchLocationSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=8&` +
        `featureType=city`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();

      const formattedSuggestions: PlaceSuggestion[] = data
        .filter((item: any) => {
          // Filter for cities, towns, and major locations
          const type = item.type;
          return ['city', 'town', 'village', 'municipality', 'administrative'].includes(type) ||
                 item.class === 'place' || item.class === 'boundary';
        })
        .map((item: any) => {
          const address = item.address || {};
          const city = address.city || address.town || address.village || item.name;
          const country = address.country || '';

          return {
            name: city,
            country: country,
            display: `${city}${country ? ', ' + country : ''}`,
          };
        })
        .filter((item: PlaceSuggestion, index: number, self: PlaceSuggestion[]) =>
          // Remove duplicates
          index === self.findIndex(s => s.display === item.display)
        )
        .slice(0, 8);

      setSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
    } catch (err) {
      console.error('Failed to fetch location suggestions:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handle destination input changes with debouncing
  const handleDestinationChange = (value: string) => {
    setDestination(value);

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce API calls
    debounceTimerRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
    }, 300); // Wait 300ms after user stops typing
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup debounce timer on unmount
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
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
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Destination
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => handleDestinationChange(e.target.value)}
          onFocus={() => {
            if (destination.trim().length >= 2 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Where do you want to go?"
          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoComplete="off"
        />

        {/* Loading indicator */}
        {loadingSuggestions && (
          <div className="absolute right-3 top-[42px] text-gray-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}
          >
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