'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import html2canvas from 'html2canvas'; // Correct import
import TripMap, { Activity } from './TripMap'; // Adjust based on your export

interface MapWrapperProps {
  activities: Activity[];
  selectedActivity?: Activity;
  onSelectActivity?: (activity: Activity) => void;
}

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapWrapper = forwardRef(({ activities, selectedActivity, onSelectActivity }: MapWrapperProps, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    downloadMap: async () => {
      if (!mapRef.current) return;
      const canvas = await html2canvas(mapRef.current, { useCORS: true });
      const link = document.createElement('a');
      link.download = 'trip-map.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    },
  }));

  return (
    <div ref={mapRef} style={{ height: '500px', width: '100%' }}>
      <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {activities.map((activity) => (
          <Marker
            key={activity.id}
            position={[activity.lat, activity.lng]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => onSelectActivity?.(activity),
            }}
          >
            <Popup>{activity.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
});

MapWrapper.displayName = 'MapWrapper';

export default MapWrapper;
