import { useEffect, useState } from 'react';
import {
  AttributionControl,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/context';
import { shortId, validCoordinates } from '../../lib/domain';
import type { WasteRequest } from '../../types/domain';
import 'leaflet/dist/leaflet.css';
const colors: Record<string, string> = {
  Pending: '#b77825',
  Assigned: '#467a9b',
  'In Progress': '#785b9b',
  Collected: '#2d7151',
  Cancelled: '#727976',
  Rejected: '#a4544e',
};
function Picker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onSelect(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))),
  });
  return null;
}
function MapPosition({ selected }: { selected?: [number, number] | null }) {
  const map = useMap();
  const lat = selected?.[0],
    lng = selected?.[1];
  useEffect(() => {
    if (lat !== undefined && lng !== undefined) map.panTo([lat, lng], { animate: false });
  }, [lat, lng, map]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}
export default function WasteMap({
  requests = [],
  selected,
  onSelect,
  compact = false,
}: {
  requests?: WasteRequest[];
  selected?: [number, number] | null;
  onSelect?: (lat: number, lng: number) => void;
  compact?: boolean;
}) {
  const { demo, actor } = useApp(),
    [online, setOnline] = useState(!demo),
    [tileError, setTileError] = useState(false);
  const located = requests.filter((r) => validCoordinates(r.latitude, r.longitude));
  return (
    <div className={`map-panel ${compact ? 'map-compact' : ''}`}>
      <div className="map-toolbar">
        <span>
          {online ? 'OpenStreetMap' : 'Offline coordinate view'}
          {demo && ' · Synthetic pins'}
        </span>
        <label className="inline-checkbox">
          <input
            type="checkbox"
            checked={online}
            onChange={(e) => {
              setOnline(e.target.checked);
              setTileError(false);
            }}
          />
          Online map tiles
        </label>
      </div>
      <div className={!online ? 'offline-map' : ''}>
        <MapContainer
          center={selected ?? [10.309, 76.203]}
          zoom={13}
          scrollWheelZoom={false}
          className="leaflet-map"
          attributionControl={false}
        >
          <MapPosition selected={selected} />
          {online && <AttributionControl position="bottomright" />}
          {online && (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              eventHandlers={{ tileerror: () => setTileError(true) }}
            />
          )}{' '}
          {onSelect && <Picker onSelect={onSelect} />}{' '}
          {selected && (
            <CircleMarker
              center={selected}
              radius={10}
              pathOptions={{ color: '#173d30', fillColor: '#173d30', fillOpacity: 0.8 }}
            >
              <Popup>
                Selected location
                <br />
                {selected[0]}, {selected[1]}
              </Popup>
            </CircleMarker>
          )}
          {located.map((r) => (
            <CircleMarker
              key={r.id}
              center={[r.latitude!, r.longitude!]}
              radius={8}
              pathOptions={{
                color: '#fff',
                weight: 2,
                fillColor: colors[r.status],
                fillOpacity: 1,
              }}
            >
              <Popup>
                <strong>{shortId(r.id)}</strong>
                <br />
                {r.request_type === 'pickup' ? 'Household pickup' : 'Open dumping'} ·{' '}
                {r.waste_category}
                <br />
                {r.ward} · {r.status}
                <br />
                <Link to={`/${actor?.role}/requests/${r.id}`}>View details</Link>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="map-caption">
        {onSelect
          ? 'Click or tap the map to choose a location, or enter coordinates manually below.'
          : `${located.length} located records · ${requests.length - located.length} without coordinates`}
        {!online && <span>Grid only; not a street map. Works without internet.</span>}
        {tileError && (
          <span role="status">
            Map tiles are unavailable. Turn off online tiles to continue with the coordinate view.
          </span>
        )}
      </div>
      {!compact && (
        <div className="map-legend">
          {Object.entries(colors)
            .slice(0, 4)
            .map(([status, color]) => (
              <span key={status}>
                <i style={{ background: color }} />
                {status}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
