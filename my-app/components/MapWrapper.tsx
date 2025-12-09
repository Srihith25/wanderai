'use client';
import dynamic from 'next/dynamic';
import { useState, useRef } from 'react';
import * as html2canvas from 'html2canvas';
import { Map } from 'leaflet';

const TripMap = dynamic(() => import('./TripMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
  ),
});

interface Activity {
  time: string;
  place: string;
  description: string;
  coordinates: [number, number];
  recommendations?: {
    name: string;
    type: string;
    coordinates: [number, number];
  }[];
}

interface MapWrapperProps {
  activities: Activity[];
  selectedActivity: Activity | null;
  onSelectActivity: (activity: Activity) => void;
  onDownloadItinerary?: () => void;
}

export default function MapWrapper({
  activities,
  selectedActivity,
  onSelectActivity,
  onDownloadItinerary,
}: MapWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showItineraryMenu, setShowItineraryMenu] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tripMapRef = useRef<{ getMap: () => Map | null }>(null);

  const toggleFullscreen = () => {
    setShowItineraryMenu(false);
    setIsFullscreen(!isFullscreen);
  };

  const downloadMap = async () => {
    const mapDiv = mapContainerRef.current;
    if (!mapDiv) return;

    try {
      const canvas = await (html2canvas as any)(mapDiv, {
        useCORS: true,
        allowTaint: false,
        background: null,
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = 'trip-map.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download map:', error);
      alert('Failed to download map. Please try again.');
    }
  };

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-[900] h-full w-full bg-white dark:bg-gray-900'
    : 'relative w-full h-96';

  return (
    <>
      {/* Floating buttons (ALWAYS ON TOP) */}
      <div className="fixed top-4 right-4 z-[2000] flex flex-col gap-2">

        {/* Download Map */}
        <button
          onClick={downloadMap}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-xl"
        >
          📷 Download Map
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow-xl"
        >
          {isFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen'}
        </button>

        {/* Download Itinerary Options */}
        {onDownloadItinerary && (
          <div className="relative">
            <button
              onClick={() => setShowItineraryMenu(prev => !prev)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xl"
            >
              ⬇️ Download Itinerary
            </button>

            {showItineraryMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-[3000]">
                <button
                  onClick={() => {
                    setShowItineraryMenu(false);
                    onDownloadItinerary();
                  }}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => alert('Add more formats if needed')}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Download TXT
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MAP */}
      <div ref={mapContainerRef} className={containerClass}>
        <TripMap
          ref={tripMapRef}
          activities={activities}
          selectedActivity={selectedActivity}
          onSelectActivity={onSelectActivity}
          isFullscreen={isFullscreen}
          className="h-full w-full"
        />
      </div>
    </>
  );
}
