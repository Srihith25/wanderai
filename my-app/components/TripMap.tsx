'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { forwardRef, useImperativeHandle } from 'react';
import L, { Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Activity {
  coordinates: [number, number];
  place: string;
  // Add other activity fields if needed
}

interface TripMapProps {
  activities: Activity[];
  selectedActivity?: Activity | null;
  onSelectActivity?: (activity: Activity) => void;
  isFullscreen?: boolean;
  className?: string;
}

const TripMap = forwardRef<{ getMap: () => Map | null }, TripMapProps>(
  ({ activities, selectedActivity, onSelectActivity, className }, ref) => {
    const defaultPosition: [number, number] =
      activities.length > 0 ? activities[0].coordinates : [40.7128, -74.006];

    const map = useMap();

    useImperativeHandle(ref, () => ({
      getMap: () => map,
    }));

    return (
      <MapContainer
        center={defaultPosition}
        zoom={13}
        scrollWheelZoom
        className={className}
      >
        <TileLayer
          attribution="&copy; Stadia Maps"
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png?api_key=YOUR_API_KEY"
        />

        {activities.map((activity, idx) => (
          <Marker
            key={idx}
            position={activity.coordinates}
            eventHandlers={{
              click: () => onSelectActivity?.(activity),
            }}
          >
            <Popup>{activity.place}</Popup>
          </Marker>
        ))}
      </MapContainer>
    );
  }
);

TripMap.displayName = 'TripMap';
export default TripMap;
