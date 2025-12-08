'use client';
import dynamic from 'next/dynamic';
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Map } from 'leaflet';

const TripMap = dynamic(() => import('./TripMap'), {
  ssr: false,
  loading: () => <div className="h-96 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
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
}

export default function MapWrapper({ activities, selectedActivity, onSelectActivity }: MapWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const tripMapRef = useRef<{ getMap: () => L.Map | null }>(null); // New ref for TripMap

  const downloadMap = async () => {
  const map = tripMapRef.current?.getMap();
  if (!map) return;

  try {
    // Use leaflet-image to generate the image
    leafletImage(map, function (err: Error, canvas: HTMLCanvasElement) {
      if (err) throw err;

      const link = document.createElement('a');
      link.download = 'trip-map.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  } catch (error) {
    console.error('Failed to download map:', error);
    alert('Failed to download map. Please try again.');
  }
};

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        <div className="absolute top-4 right-4 z-[1000] flex gap-2">
          <button
            onClick={downloadMap}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span>📷</span> Download Map
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            ✕ Exit Fullscreen
          </button>
        </div>
        <div ref={mapContainerRef} className="h-full w-full">
          <TripMap
            activities={activities}
            selectedActivity={selectedActivity}
            onSelectActivity={onSelectActivity}
            isFullscreen={true}
            className = "h-full w-full"
          />
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-gray-800/90 backdrop-blur p-4 rounded-lg text-white text-sm">
          <h4 className="font-semibold mb-2">Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
              <span>Activity Location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-500 rounded-full"></span>
              <span>Selected Location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>Recommendation</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-[1000] flex gap-2">
        <button
          onClick={downloadMap}
          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          title="Download Map"
        >
          📷
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          title="Fullscreen"
        >
          ⛶
        </button>
      </div>
      <div ref={mapContainerRef}>
        <TripMap
          activities={activities}
          selectedActivity={selectedActivity}
          onSelectActivity={onSelectActivity}
          isFullscreen={false}
        />
      </div>
    </div>
  );
}

function leafletImage(map: Map, arg1: (err: Error, canvas: HTMLCanvasElement) => void) {
  throw new Error('Function not implemented.');
}
