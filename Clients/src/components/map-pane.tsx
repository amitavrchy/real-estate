"use client";
import "leaflet/dist/leaflet.css";
import { divIcon, latLngBounds } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import Link from "@/components/link";
import type { Property } from "@/lib/types";
import { money } from "@/lib/api";
import { hoverProperty, useAppDispatch, useAppSelector } from "@/store";

function MapSync({
  properties,
  onBounds,
}: {
  properties: Property[];
  onBounds?: (bbox: string) => void;
}) {
  const map = useMap();
  const key = properties.map((p) => p.id).join(",");
  useEffect(() => {
    if (properties.length)
      map.fitBounds(latLngBounds(properties.map((p) => [p.lat, p.lng])), {
        padding: [50, 50],
        maxZoom: 14,
        animate: false,
      });
  }, [key, map, properties]);
  useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onBounds?.(
        [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
          .map((n) => n.toFixed(5))
          .join(","),
      );
    },
  });
  return null;
}
function Pins({ properties }: { properties: Property[] }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const dispatch = useAppDispatch();
  const hovered = useAppSelector((s) => s.searchUi.hoveredId);
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const groups = useMemo(() => {
    if (zoom >= 12) return properties.map((p) => [p]);
    const grouped: Property[][] = [];
    for (const p of properties) {
      const group = grouped.find(
        (g) =>
          Math.abs(g[0].lat - p.lat) < 0.035 &&
          Math.abs(g[0].lng - p.lng) < 0.045,
      );
      if (group) group.push(p);
      else grouped.push([p]);
    }
    return grouped;
  }, [properties, zoom]);
  return groups.map((group) => {
    const p = group[0];
    const cluster = group.length > 1;
    const active = group.some((p) => p.id === hovered);
    return (
      <Marker
        key={group.map((p) => p.id).join(",")}
        position={[p.lat, p.lng]}
        icon={divIcon({
          className: `price-pin ${active ? "pin-active" : ""} ${cluster ? "pin-cluster" : ""}`,
          html: cluster ? String(group.length) : money(p.price, true),
          iconSize: cluster ? [44, 44] : [83, 34],
          iconAnchor: cluster ? [22, 22] : [42, 17],
        })}
        eventHandlers={{
          mouseover: () => dispatch(hoverProperty(p.id)),
          mouseout: () => dispatch(hoverProperty(null)),
          click: () => {
            dispatch(hoverProperty(p.id));
            if (cluster) map.setView([p.lat, p.lng], 13);
          },
        }}
      >
        {!cluster && (
          <Popup>
            <div className="map-popup">
              <p>{p.title}</p>
              <strong>{money(p.price)}</strong>
              <span>
                {p.beds} beds · {p.baths} baths
              </span>
              <Link href={`/property/${p.slug}`}>Discover this home →</Link>
            </div>
          </Popup>
        )}
      </Marker>
    );
  });
}
export default function MapPane({
  properties,
  onBounds,
}: {
  properties: Property[];
  onBounds?: (bbox: string) => void;
}) {
  const [tileError, setTileError] = useState(false);
  return (
    <div className="map-canvas" aria-label="Map of matching homes">
      <MapContainer
        center={[37.8, -122.45]}
        zoom={12}
        scrollWheelZoom={false}
        className="leaflet-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{ tileerror: () => setTileError(true) }}
        />
        <MapSync properties={properties} onBounds={onBounds} />
        <Pins properties={properties} />
      </MapContainer>
      {tileError && (
        <div className="map-notice">
          Map tiles are unavailable. All homes remain available in the list.
        </div>
      )}
      <span className="map-hint">A new perspective on your next chapter.</span>
    </div>
  );
}
