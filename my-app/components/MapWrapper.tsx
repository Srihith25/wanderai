'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
// @ts-ignore
import leafletImage from 'leaflet-image';
import { Map as LeafletMap } from 'leaflet';
import { Activity, TripMapRef } from './TripMap';

// Dynamically import TripMap to avoid SSR issues
const TripMap = dynamic(() => import('./TripMap'), { ssr: false });

interface MapWrapperProps {
  activities: Activity[];
  selectedActivity: Activity | null;
  onSelectActivity: (activity: Activity) => void;
}

export default function MapWrapper({
  activities,
  selectedActivity,
  onSelectActivity,
}: MapWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tripMapRef = useRef<TripMapRef>(null);

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
        isFullscreen={isFullscreen}
        className="h-full w-full"
      />
    </div>
  );
}
