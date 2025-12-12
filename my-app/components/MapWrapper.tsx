'use client';
import dynamic from 'next/dynamic';
import { useState, useRef } from 'react';
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
    try {
      const mapInstance = tripMapRef.current?.getMap();
      if (!mapInstance) {
        alert('Map not ready. Please try again.');
        return;
      }

      // Get the map container
      const mapDiv = mapInstance.getContainer();
      if (!mapDiv) {
        alert('Map container not found.');
        return;
      }

      // Wait for all tiles to finish loading
      await new Promise<void>((resolve) => {
        const checkTilesLoaded = () => {
          const tiles = mapDiv.querySelectorAll('.leaflet-tile');
          const allLoaded = Array.from(tiles).every((tile) => {
            const img = tile as HTMLImageElement;
            return img.complete && img.naturalHeight !== 0;
          });

          if (allLoaded) {
            // Extra delay to ensure rendering is complete
            setTimeout(() => resolve(), 500);
          } else {
            setTimeout(checkTilesLoaded, 100);
          }
        };
        checkTilesLoaded();
      });

      // Dynamically import dom-to-image-more only on client side
      const domtoimage = (await import('dom-to-image-more')).default;

      // Use dom-to-image-more to capture the map
      const dataUrl = await domtoimage.toPng(mapDiv, {
        quality: 1,
        width: mapDiv.offsetWidth,
        height: mapDiv.offsetHeight,
        style: {
          // Ensure tiles are rendered without borders
          'image-rendering': 'crisp-edges',
        },
        filter: (node: HTMLElement) => {
          // Filter out controls and buttons
          if (node.tagName === 'BUTTON') return false;
          if (node.classList && (
            node.classList.contains('leaflet-control-zoom') ||
            node.classList.contains('leaflet-control-attribution')
          )) return false;
          return true;
        },
      });

      // Download the image (mobile-friendly approach)
      const link = document.createElement('a');
      link.download = `trip-map-${Date.now()}.png`;
      link.href = dataUrl;

      // Mobile Safari and other mobile browsers need special handling
      if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // For mobile devices, open in new tab if direct download fails
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(dataUrl);
      }, 100);
    } catch (error) {
      console.error('Failed to download map:', error);
      alert(`Failed to download map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-[900] h-full w-full bg-white dark:bg-gray-900'
    : 'relative w-full h-96';

  return (
    <div ref={mapContainerRef} className={containerClass}>
      {/* Buttons inside map container */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Download Map */}
        <button
          onClick={downloadMap}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg flex items-center gap-2 group transition-all"
        >
          <span>📷</span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
            Download Map
          </span>
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow-lg flex items-center gap-2 group transition-all"
        >
          <span>{isFullscreen ? '✕' : '⛶'}</span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </span>
        </button>

        {/* Download Itinerary Options */}
        {onDownloadItinerary && (
          <div className="relative">
            <button
              onClick={() => setShowItineraryMenu(prev => !prev)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg"
            >
              ⬇️ Download Itinerary
            </button>

            {showItineraryMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-[1100]">
                <button
                  onClick={() => {
                    setShowItineraryMenu(false);
                    onDownloadItinerary();
                  }}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => alert('Add more formats if needed')}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  Download TXT
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MAP */}
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
