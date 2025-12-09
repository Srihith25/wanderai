'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { Map as LeafletMap } from 'leaflet';
// @ts-ignore
import leafletImage from 'leaflet-image';

const TripMap = dynamic(() => import('./TripMap'), { ssr: false });

interface Activity {
  place: string;
  coordinates: [number, number];
}

export default function MapWrapper({
  activities,
  selectedActivity,
  onSelectActivity,
}: {
  activities: Activity[];
  selectedActivity?: Activity | null;
  onSelectActivity?: (activity: Activity) => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tripMapRef = useRef<{ getMap: () => LeafletMap | null }>(null);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const downloadMap = () => {
    const map = tripMapRef.current?.getMap();
    if (!map) return;

    leafletImage(map, (err: Error | null, canvas: HTMLCanvasElement) => {
      if (err) {
        console.error(err);
        alert('Failed to download map.');
        return;
      }

      const link = document.createElement('a');
      link.download = 'trip-map.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-white dark:bg-black'
          : 'relative h-96 w-full'
      }
    >
      {/* Buttons */}
      <div className="absolute top-4 right-4 z-[10000] flex flex-col gap-2">
        <button
          onClick={downloadMap}
          className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg"
        >
          📷 Download Map
        </button>
        <button
          onClick={toggleFullscreen}
          className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow-lg"
        >
          {isFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
      </div>

      {/* Map */}
      <TripMap
        ref={tripMapRef}
        activities={activities}
        selectedActivity={selectedActivity}
        onSelectActivity={onSelectActivity}
        className="h-full w-full"
      />
    </div>
  );
}
