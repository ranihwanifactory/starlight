import React, { useEffect, useRef } from 'react';
import { JournalEntry } from '../types';

interface JournalMapProps {
  entries: JournalEntry[];
  onSelect: (entry: JournalEntry) => void;
}

const JournalMap: React.FC<JournalMapProps> = ({ entries, onSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null); // Leaflet map instance

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Check if L is available (loaded via CDN in index.html)
    const L = (window as any).L;
    if (!L) {
        console.error("Leaflet not loaded");
        return;
    }

    // Initialize Map only once
    if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current).setView([36.5, 127.5], 7); // Center of Korea

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance.current);
    }

    // Clear existing markers (by removing standard layers except tile layer)
    // For simplicity, we just rebuild markers. A better way in production is managing a layer group.
    mapInstance.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
            mapInstance.current.removeLayer(layer);
        }
    });

    // Add Markers
    const bounds = L.latLngBounds([]);
    let hasMarkers = false;

    entries.forEach(entry => {
        if (entry.coordinates && entry.coordinates.lat && entry.coordinates.lng) {
            const marker = L.marker([entry.coordinates.lat, entry.coordinates.lng])
                .addTo(mapInstance.current)
                .bindPopup(`
                    <div style="text-align:center; min-width: 150px;">
                        <h3 style="font-weight:bold; margin-bottom:4px;">${entry.title}</h3>
                        <p style="font-size:12px; color:#666; margin:0;">${entry.target}</p>
                        ${entry.imageUrl ? `<img src="${entry.imageUrl}" style="width:100%; height:80px; object-fit:cover; margin-top:8px; border-radius:4px;" />` : ''}
                    </div>
                `);
            
            // Custom click handler
            marker.on('popupopen', () => {
                 // We could auto-select, but popup is nice. 
                 // Let's add a button inside popup via DOM manipulation if needed, or just let user click the item in list.
            });
            
            // Add click event to marker to select entry
            marker.on('click', () => {
                onSelect(entry);
            });

            bounds.extend([entry.coordinates.lat, entry.coordinates.lng]);
            hasMarkers = true;
        }
    });

    // Fit bounds if markers exist
    if (hasMarkers) {
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [entries, onSelect]);

  return (
    <div className="w-full h-full relative z-10">
       <div ref={mapRef} className="w-full h-full min-h-[calc(100vh-140px)] bg-gray-100 rounded-xl overflow-hidden shadow-inner" />
    </div>
  );
};

export default JournalMap;