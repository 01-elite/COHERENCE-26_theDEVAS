import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { districtAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatAmount } from '../utils/formatters';
import 'leaflet/dist/leaflet.css';

const GeospatialView = () => {
  const [selectedState, setSelectedState] = useState('all');

  const { data: mapData, isLoading } = useQuery({
    queryKey: ['map-data'],
    queryFn: districtAPI.getMapData
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading map..." />
      </div>
    );
  }

  // Filter out districts with invalid coordinates
  const districts = (mapData?.data || []).filter(d => {
    return d.coordinates && 
           typeof d.coordinates.latitude === 'number' && 
           typeof d.coordinates.longitude === 'number' &&
           !isNaN(d.coordinates.latitude) &&
           !isNaN(d.coordinates.longitude) &&
           Math.abs(d.coordinates.latitude) <= 90 &&
           Math.abs(d.coordinates.longitude) <= 180;
  });
  
  const states = [...new Set(districts.map(d => d.state))].sort();

  const filteredDistricts = selectedState === 'all' 
    ? districts 
    : districts.filter(d => d.state === selectedState);

  // Function to determine circle color based on utilization
  const getCircleColor = (utilization) => {
    if (utilization >= 75) return '#10b981'; // green
    if (utilization >= 50) return '#f59e0b'; // yellow
    if (utilization >= 25) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  // Function to determine circle size based on budget
  const getCircleRadius = (allocated) => {
    const minRadius = 5;
    const maxRadius = 30;
    const maxBudget = Math.max(...districts.map(d => d.totalBudgetAllocated || 0).filter(b => b > 0), 1);
    const safeAllocated = allocated || 0;
    if (maxBudget === 0 || safeAllocated === 0) return minRadius;
    return minRadius + ((safeAllocated / maxBudget) * (maxRadius - minRadius));
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Geospatial View</h1>
        <p className="text-gray-600 mt-1">District-wise budget allocation and utilization map</p>
      </div>

      {/* Filters and Legend */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* State Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Legend */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Utilization Rate</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">75-100%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">50-75%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-600">25-50%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">0-25%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="card flex-1">
        <div className="h-[600px] rounded-lg overflow-hidden">
          <MapContainer
            center={[20.5937, 78.9629]} // Center of India
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {filteredDistricts.map((district) => {
              const lat = parseFloat(district.coordinates?.latitude);
              const lng = parseFloat(district.coordinates?.longitude);
              
              // Skip if coordinates are still invalid
              if (isNaN(lat) || isNaN(lng)) return null;
              
              return (
              <CircleMarker
                key={district.id}
                center={[lat, lng]}
                radius={getCircleRadius(district.totalBudgetAllocated || 0)}
                fillColor={getCircleColor(parseFloat(district.utilization) || 0)}
                color="#fff"
                weight={2}
                opacity={1}
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-lg mb-2">{district.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{district.state}</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Allocated:</span> {formatAmount(district.totalBudgetAllocated || 0)}</p>
                      <p><span className="font-medium">Spent:</span> {formatAmount(district.totalBudgetSpent || 0)}</p>
                      <p><span className="font-medium">Utilization:</span> {(district.utilization || 0).toFixed(2)}%</p>
                      <p><span className="font-medium">Population:</span> {(district.population || 0).toLocaleString()}</p>
                      {district.anomalyCount > 0 && (
                        <p className="text-red-600 font-medium">
                          ⚠️ {district.anomalyCount} anomalies detected
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Districts</p>
          <h3 className="text-2xl font-bold text-gray-900">{filteredDistricts.length}</h3>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Allocated</p>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatAmount(filteredDistricts.reduce((sum, d) => sum + (d.totalBudgetAllocated || 0), 0))}
          </h3>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Average Utilization</p>
          <h3 className="text-2xl font-bold text-gray-900">
            {filteredDistricts.length > 0 
              ? (filteredDistricts.reduce((sum, d) => sum + (parseFloat(d.utilization) || 0), 0) / filteredDistricts.length).toFixed(1)
              : '0.0'
            }%
          </h3>
        </div>
      </div>
    </div>
  );
};

export default GeospatialView;
