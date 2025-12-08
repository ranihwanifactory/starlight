import React, { useEffect, useRef, useState } from 'react';
import { X, Check, MapPin } from 'lucide-react';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ isOpen, onClose, onConfirm, initialLat, initialLng }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);

  // Initialize selected coords when props change
  useEffect(() => {
    if (isOpen) {
        if (initialLat && initialLng) {
            setSelectedCoords({ lat: initialLat, lng: initialLng });
        } else {
            // Default center (Korea) if no initial coords, or try to get current position?
            // Let's stick to null and let map center on Korea default.
            setSelectedCoords(null);
        }
    }
  }, [isOpen, initialLat, initialLng]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Destroy existing map if any (cleanup)
    if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
    }

    const defaultCenter = [36.5, 127.5]; // Korea
    const initialCenter = (selectedCoords) ? [selectedCoords.lat, selectedCoords.lng] : defaultCenter;
    const initialZoom = selectedCoords ? 15 : 7;

    const map = L.map(mapRef.current).setView(initialCenter, initialZoom);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add marker if coords exist
    if (selectedCoords) {
        markerInstance.current = L.marker([selectedCoords.lat, selectedCoords.lng]).addTo(map);
    }

    // Handle Map Click
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      setSelectedCoords({ lat, lng });

      if (markerInstance.current) {
        markerInstance.current.setLatLng([lat, lng]);
      } else {
        markerInstance.current = L.marker([lat, lng]).addTo(map);
      }
    });

    // Cleanup
    return () => {
       if (mapInstance.current) {
           mapInstance.current.remove();
           mapInstance.current = null;
       }
    };
  }, [isOpen]); // Re-init when opened. Simple approach.

  const handleConfirm = () => {
    if (selectedCoords) {
      onConfirm(selectedCoords.lat, selectedCoords.lng);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl h-[80vh] rounded-xl overflow-hidden shadow-2xl flex flex-col animate-fade-in relative">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white z-10">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <MapPin size={20} className="text-space-accent" />
            위치 선택
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X size={24} />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100">
             <div ref={mapRef} className="absolute inset-0 z-0" />
             {!selectedCoords && (
                 <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-md text-sm font-bold text-gray-700 pointer-events-none z-[400]">
                    지도에서 위치를 클릭하세요
                 </div>
             )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3 z-10">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
            >
                취소
            </button>
            <button 
                onClick={handleConfirm}
                disabled={!selectedCoords}
                className="px-6 py-2 bg-space-accent text-white font-bold rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all"
            >
                <Check size={18} />
                이 위치로 설정
            </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;