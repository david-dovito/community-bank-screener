"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface BranchPoint {
  LATITUDE?: number;
  LONGITUDE?: number;
  BRNAME?: string;
  CERT?: number;
  latitude?: number;
  longitude?: number;
  brname?: string;
  cert?: number;
  city?: string;
  stname?: string;
  CITY?: string;
  STNAME?: string;
}

interface Props {
  branches: BranchPoint[];
}

export default function BranchMap({ branches }: Props) {
  const valid = branches.filter((b) => {
    const lat = b.LATITUDE ?? b.latitude;
    const lng = b.LONGITUDE ?? b.longitude;
    return lat && lng && lat !== 0 && lng !== 0;
  });

  const center: [number, number] =
    valid.length > 0
      ? [
          valid.reduce((s, b) => s + (b.LATITUDE ?? b.latitude ?? 0), 0) / valid.length,
          valid.reduce((s, b) => s + (b.LONGITUDE ?? b.longitude ?? 0), 0) / valid.length,
        ]
      : [39.5, -98.35]; // US center

  return (
    <MapContainer
      center={center}
      zoom={valid.length === 0 ? 4 : 7}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {valid.map((b, i) => {
        const lat = (b.LATITUDE ?? b.latitude) as number;
        const lng = (b.LONGITUDE ?? b.longitude) as number;
        const name = b.BRNAME ?? b.brname ?? "Branch";
        const city = b.CITY ?? b.city ?? "";
        const state = b.STNAME ?? b.stname ?? "";

        return (
          <CircleMarker
            key={i}
            center={[lat, lng]}
            radius={5}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.6,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-medium">{name}</p>
                {city && <p className="text-gray-500">{city}, {state}</p>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
