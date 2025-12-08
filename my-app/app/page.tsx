'use client';
import { useState } from 'react';
import TripForm from '@/components/TripForm';
import MapWrapper from '@/components/MapWrapper';
import ChatBot from '@/components/ChatBot';
import ThemeToggle from '@/components/ThemeToggle';
import DownloadButton from '@/components/DownloadButton';


interface Activity {
  time: string;
  place: string;
  description: string;
  coordinates: [number, number];
  recommendations?: Recommendation[];
}

interface Recommendation {
  name: string;
  type: string;
  coordinates: [number, number];
}

interface Day {
  day: number;
  activities: Activity[];
}

interface Itinerary {
  days: Day[];
}

export default function Home() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [destination, setDestination] = useState('');

  const handleGenerate = (data: Itinerary & { destination?: string }) => {
  setItinerary(data);

  // Extract destination safely from data
  setDestination(data.destination ?? '');

  setSelectedDay(0);
  setSelectedActivity(null);
};

  const currentActivities = itinerary?.days?.[selectedDay]?.activities || [];

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center">
            🌍 Wander AI
          </h1>
          <div className="flex items-center gap-4 relative z-30">
            <DownloadButton itinerary={itinerary} destination={destination} />
            <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side: Form and Itinerary */}
          <div className="space-y-6">
            <TripForm onGenerate={handleGenerate} />

            {itinerary && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Your Itinerary</h2>

                {/* Day selector tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {itinerary.days.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDay(idx);
                        setSelectedActivity(null);
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedDay === idx
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Day {day.day}
                    </button>
                  ))}
                </div>

                {/* Activities list */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {currentActivities.map((activity, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedActivity(activity)}
                      className={`border-l-4 pl-4 py-3 cursor-pointer rounded-r-lg transition-colors ${
                        selectedActivity === activity
                          ? 'border-blue-500 bg-blue-50 dark:bg-gray-700'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <p className="text-sm text-blue-600 dark:text-blue-400">{activity.time}</p>
                      <p className="font-medium">{activity.place}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{activity.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right side: Map and Recommendations */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Map</h2>
              <MapWrapper
                activities={currentActivities}
                selectedActivity={selectedActivity}
                onSelectActivity={setSelectedActivity}
              />
            </div>

            {/* Recommendations */}
            {selectedActivity?.recommendations && selectedActivity.recommendations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4">
                  📍 Near {selectedActivity.place}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedActivity.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <p className="font-medium">{rec.name}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">{rec.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Button */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="fixed bottom-6 left-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg transition-all z-[101] flex items-center gap-2 group"
        >
          {showChat ? (
            <span className="text-xl">✕</span>
          ) : (
            <>
              <span className="text-xl">🧭</span>
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
                Ask Sanchari
              </span>
            </>
          )}
        </button>


        {/* Chat Panel */}
        {showChat && (
          <ChatBot
            itinerary={itinerary}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </main>
  );
}