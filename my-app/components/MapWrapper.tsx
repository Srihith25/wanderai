'use client';
import dynamic from 'next/dynamic';
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
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
  // Optional prop if you want to handle itinerary download outside map
  onDownloadItinerary?: () => void;
}

export default function MapWrapper({
  activities,
  selectedActivity,
  onSelectActivity,
  onDownloadItinerary,
}: MapWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tripMapRef = useRef<{ getMap: () => Map | null }>(null);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Map download using html2canvas
  const downloadMap = async () => {
    const mapDiv = mapContainerRef.current;
    if (!mapDiv) return;

    try {
      const canvas = await html2canvas(mapDiv, { useCORS: true });
      const link = document.createElement('a');
      link.download = 'trip-map.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download map:', error);
      alert('Failed to download map. Please try again.');
    }
  };

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[1000] bg-gray-900">
          {/* Buttons */}
          <div className="fixed top-4 right-4 z-[1100] flex gap-2">
            <button
              onClick={downloadMap}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              📷 Download Map
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              ✕ Exit Fullscreen
            </button>
            {onDownloadItinerary && (
              <button
                onClick={onDownloadItinerary}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                ⬇️ Download Itinerary
              </button>
            )}
          </div>

          {/* Map */}
          <div ref={mapContainerRef} className="h-full w-full">
            <TripMap
              ref={tripMapRef}
              activities={activities}
              selectedActivity={selectedActivity}
              onSelectActivity={onSelectActivity}
              isFullscreen={true}
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      {/* Normal (non-fullscreen) map */}
      {!isFullscreen && (
        <div className="relative">
          {/* Buttons */}
          <div className="absolute top-2 right-2 z-[100] flex gap-2">
            <button
              onClick={downloadMap}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              title="Download Map"
            >
              📷
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              title="Fullscreen"
            >
              ⛶
            </button>
            {onDownloadItinerary && (
              <button
                onClick={onDownloadItinerary}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                title="Download Itinerary"
              >
                ⬇️
              </button>
            )}
          </div>

          {/* Map */}
          <div ref={mapContainerRef}>
            <TripMap
              ref={tripMapRef}
              activities={activities}
              selectedActivity={selectedActivity}
              onSelectActivity={onSelectActivity}
              isFullscreen={false}
              className="w-full h-96"
            />
          </div>
        </div>
      )}
    </>
  );
}
