'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Activity {
  place: string;
  coordinates: [number, number];
}

interface TripMapProps {
  activities: Activity[];
  selectedActivity?: Activity | null;
  onSelectActivity?: (activity: Activity) => void;
  className?: string;
}

export interface TripMapRef {
  getMap: () => LeafletMap | null;
}

const TripMap = forwardRef<TripMapRef, TripMapProps>(
  ({ activities, onSelectActivity, className }, ref) => {
    const defaultPosition: [number, number] =
      activities.length > 0 ? activities[0].coordinates : [40.7128, -74.006];

    const mapRef = useRef<LeafletMap | null>(null);

    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
    }));

    return (
      <MapContainer
        center={defaultPosition}
        zoom={13}
        scrollWheelZoom={true}
        className={className}
        ref={mapRef as any} // ✅ use ref instead of whenCreated
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
