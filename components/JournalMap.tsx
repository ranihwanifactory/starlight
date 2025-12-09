
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

    // Fix: Invalidate size to ensure map renders tiles correctly after mounting
    // This is often needed when the map container is initially hidden or animating
    setTimeout(() => {
        mapInstance.current?.invalidateSize();
    }, 100);

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
                .addTo(mapInstance.current);

            // Popup (Click) - Shows detail
            marker.bindPopup(`
                <div style="text-align:center; min-width: 150px;">
                    <h3 style="font-weight:bold; margin-bottom:4px;">${entry.title}</h3>
                    <p style="font-size:12px; color:#666; margin:0;">${entry.target}</p>
                    ${entry.imageUrl ? `<img src="${entry.imageUrl}" style="width:100%; height:80px; object-fit:cover; margin-top:8px; border-radius:4px;" />` : ''}
                </div>
            `);
            
            // Tooltip (Hover) - Shows Image Thumbnail
            if (entry.imageUrl) {
               // Use custom tooltip class defined in index.html
               marker.bindTooltip(
                 `<div style="width: 100px; height: 100px; border-radius: 8px; overflow: hidden; border: 3px solid white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); background: white;">
                    <img src="${entry.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                  </div>`, 
                 {
                   direction: 'top',
                   className: 'custom-tooltip', // Defined in index.html to be transparent/borderless
                   offset: [0, -40],
                   opacity: 1
                 }
               );
            } else {
               marker.bindTooltip(entry.title, {
                   direction: 'top',
                   offset: [0, -30]
               });
            }

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
        // Adding a small timeout to fitBounds as well ensures it happens after invalidateSize
        setTimeout(() => {
             mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        }, 150);
    }

  }, [entries, onSelect]);

  return (
    <div className="w-full h-full relative z-10">
       <div ref={mapRef} className="w-full h-full min-h-[calc(100vh-140px)] bg-gray-100 rounded-xl overflow-hidden shadow-inner" />
    </div>
  );
};

export default JournalMap;
