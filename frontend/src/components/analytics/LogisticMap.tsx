import React, { useEffect, useRef } from 'react';
import { Card } from '../molecules/ui/card';
import { Loader2, Navigation2, Truck } from 'lucide-react';
import { useMapStats } from '../../hooks/useDashboardStats';

// Access Leaflet from the global window object (loaded via CDN in index.html)
declare const L: any;

const CI_REGIONS_GEOJSON: any = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Lagunes", "id": "LAGUNES" },
      "geometry": { "type": "Polygon", "coordinates": [[[ -3.5, 5.0 ], [ -4.5, 5.0 ], [ -4.5, 6.0 ], [ -3.5, 6.0 ], [ -3.5, 5.0 ]]] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Bas-Sassandra", "id": "BAS-SASSANDRA" },
      "geometry": { "type": "Polygon", "coordinates": [[[ -6.0, 4.5 ], [ -7.5, 4.5 ], [ -7.5, 6.0 ], [ -6.0, 6.0 ], [ -6.0, 4.5 ]]] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Vallée du Bandama", "id": "BOUAKE" },
      "geometry": { "type": "Polygon", "coordinates": [[[ -4.5, 7.5 ], [ -5.5, 7.5 ], [ -5.5, 8.5 ], [ -4.5, 8.5 ], [ -4.5, 7.5 ]]] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Savanes", "id": "KORHOGO" },
      "geometry": { "type": "Polygon", "coordinates": [[[ -5.0, 9.0 ], [ -6.5, 9.0 ], [ -6.5, 10.5 ], [ -5.0, 10.5 ], [ -5.0, 9.0 ]]] }
    }
  ]
};

export const LogisticMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const { data: stats, isLoading } = useMapStats();

  const getColor = (count: number) => {
    return count > 15 ? '#ef4444' :
           count > 10 ? '#f97316' :
           count > 5  ? '#f59e0b' :
           count > 0  ? '#10b981' :
                        '#e2e8f0';
  };

  useEffect(() => {
    if (!mapRef.current || isLoading || !stats || typeof L === 'undefined') return;

    // Initialize map if not already done
    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        scrollWheelZoom: false,
        zoomControl: true
      }).setView([7.539989, -5.547080], 7);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap.current);
    }

    // Clear previous layers if any
    leafletMap.current.eachLayer((layer: any) => {
        if (layer.feature) leafletMap.current.removeLayer(layer);
    });

    // Add GeoJSON layer
    L.geoJSON(CI_REGIONS_GEOJSON, {
      style: (feature: any) => {
        const regionId = feature.properties.id;
        const regionStat = (stats || []).find(s => s.region.toUpperCase() === regionId || s.region.toUpperCase() === feature.properties.name.toUpperCase());
        const count = regionStat ? regionStat.total : 0;
        
        return {
          fillColor: getColor(count),
          weight: 2,
          opacity: 1,
          color: 'white',
          fillOpacity: 0.7
        };
      },
      onEachFeature: (feature: any, layer: any) => {
        const regionId = feature.properties.id;
        const regionStat = (stats || []).find(s => s.region.toUpperCase() === regionId || s.region.toUpperCase() === feature.properties.name.toUpperCase());
        
        const enRoute = regionStat ? regionStat.enRoute : 0;
        const arrived = regionStat ? regionStat.arrived : 0;

        layer.bindPopup(`
          <div class="p-2 min-w-[150px]">
            <h4 class="font-black text-slate-800 uppercase text-xs mb-2">${feature.properties.name}</h4>
            <div class="space-y-1">
              <div class="flex justify-between text-[10px]">
                <span class="font-bold text-blue-600 uppercase">En Route</span>
                <span class="font-black text-slate-900">${enRoute}</span>
              </div>
              <div class="flex justify-between text-[10px]">
                <span class="font-bold text-emerald-600 uppercase">Arrivés</span>
                <span class="font-black text-slate-900">${arrived}</span>
              </div>
            </div>
          </div>
        `);

        layer.on({
          mouseover: (e: any) => {
            const l = e.target;
            l.setStyle({ fillOpacity: 0.9, weight: 3 });
          },
          mouseout: (e: any) => {
            const l = e.target;
            l.setStyle({ fillOpacity: 0.7, weight: 2 });
          }
        });
      }
    }).addTo(leafletMap.current);

    return () => {
        // Cleanup not strictly necessary here as we reuse leafletMap.current
    };
  }, [isLoading, stats]);

  return (
    <Card className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border-white/20 shadow-sm border-0 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
            <Navigation2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Provenance des Transporteurs</h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
              Flux logistique national vers Abidjan
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Critique</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Fluide</span>
            </div>
        </div>
      </div>

      <div className="h-[400px] w-full rounded-[2rem] overflow-hidden border border-slate-100 relative z-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
          </div>
        )}
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>
      
      <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
        <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
            <Truck className="w-5 h-5" />
        </div>
        <div>
            <p className="text-xs font-bold text-slate-700">Flux National en Temps Réel</p>
            <p className="text-[10px] text-slate-500 leading-tight">
                Les zones colorées indiquent la densité de véhicules en provenance des différentes régions de Côte d'Ivoire.
                Survolez une région pour voir le détail des camions en transit.
            </p>
        </div>
      </div>
    </Card>
  );
};

export default LogisticMap;
