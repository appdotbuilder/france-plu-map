import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MapView as MapViewType, BoundingBox, GeographicFeature } from '../../../server/src/schema';

interface MapViewProps {
  mapView: MapViewType;
  bounds: BoundingBox;
  features: GeographicFeature[];
}

interface MapPosition {
  x: number;
  y: number;
}

export function MapView({ mapView, bounds, features }: MapViewProps) {
  const [hoveredFeature, setHoveredFeature] = useState<GeographicFeature | null>(null);
  const [currentZoom, setCurrentZoom] = useState(mapView.zoom_level);
  const [currentCenter, setCurrentCenter] = useState(mapView.center);

  // Convert geographic coordinates to pixel coordinates within the map container
  const coordinateToPixel = (lat: number, lng: number): MapPosition => {
    // Map container is 600x400px - this is a simplified projection
    const mapWidth = 600;
    const mapHeight = 400;
    
    // Calculate relative position within bounds
    const relativeX = (lng - bounds.west) / (bounds.east - bounds.west);
    const relativeY = (bounds.north - lat) / (bounds.north - bounds.south);
    
    return {
      x: Math.max(10, Math.min(mapWidth - 10, relativeX * mapWidth)),
      y: Math.max(10, Math.min(mapHeight - 10, relativeY * mapHeight))
    };
  };

  const getFeatureIcon = (featureType: string): string => {
    switch (featureType) {
      case 'city': return '🏙️';
      case 'region': return '🗺️';
      case 'landmark': return '🏛️';
      case 'administrative': return '🏢';
      case 'natural': return '🌲';
      default: return '📍';
    }
  };

  const getFeatureColor = (featureType: string): string => {
    switch (featureType) {
      case 'city': return 'bg-blue-500';
      case 'region': return 'bg-purple-500';
      case 'landmark': return 'bg-yellow-500';
      case 'administrative': return 'bg-gray-500';
      case 'natural': return 'bg-green-500';
      default: return 'bg-red-500';
    }
  };

  const handleZoomIn = () => {
    setCurrentZoom((prev: number) => Math.min(20, prev + 1));
  };

  const handleZoomOut = () => {
    setCurrentZoom((prev: number) => Math.max(1, prev - 1));
  };

  const handleResetView = () => {
    setCurrentZoom(mapView.zoom_level);
    setCurrentCenter(mapView.center);
  };

  return (
    <div className="relative">
      {/* Map Container - Simulated France Map */}
      <div 
        className="relative w-full h-96 bg-gradient-to-br from-blue-200 via-green-200 to-blue-300 rounded-lg border-2 border-blue-300 overflow-hidden"
        style={{ 
          backgroundImage: `
            radial-gradient(circle at 30% 40%, rgba(34, 139, 34, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 60% 20%, rgba(70, 130, 180, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 215, 0, 0.1) 0%, transparent 50%)
          `
        }}
      >
        {/* France Outline Simulation */}
        <div className="absolute inset-4 border-2 border-dashed border-blue-400 rounded-lg opacity-30"></div>
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleZoomIn}
            className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
          >
            +
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleZoomOut}
            className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
          >
            -
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleResetView}
            className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-xs"
          >
            ⌂
          </Button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="bg-white/90 text-blue-800">
            Zoom: {currentZoom}
          </Badge>
        </div>

        {/* Geographic Features */}
        {features.map((feature: GeographicFeature) => {
          const position = coordinateToPixel(feature.latitude, feature.longitude);
          return (
            <div
              key={feature.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
              }}
              onMouseEnter={() => setHoveredFeature(feature)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className={`
                w-4 h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs
                ${getFeatureColor(feature.feature_type)}
                hover:scale-125 transition-transform duration-200
                ${hoveredFeature?.id === feature.id ? 'scale-125 ring-2 ring-white' : ''}
              `}>
                <span className="text-white text-xs">
                  {getFeatureIcon(feature.feature_type)}
                </span>
              </div>
              
              {/* Feature Label */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <Badge 
                  variant="secondary" 
                  className={`
                    text-xs bg-white/95 text-gray-800 border
                    ${hoveredFeature?.id === feature.id ? 'opacity-100' : 'opacity-0'}
                    transition-opacity duration-200 pointer-events-none
                  `}
                >
                  {feature.name}
                </Badge>
              </div>
            </div>
          );
        })}

        {/* Center Marker */}
        <div 
          className="absolute w-2 h-2 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: `${coordinateToPixel(currentCenter.latitude, currentCenter.longitude).x}px`,
            top: `${coordinateToPixel(currentCenter.latitude, currentCenter.longitude).y}px`,
          }}
        >
          <div className="absolute -top-1 -left-1 w-4 h-4 border-2 border-red-500 rounded-full animate-pulse"></div>
        </div>

        {/* No Features Message */}
        {features.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 mb-2">🗺️ Aucun lieu à afficher</p>
                <p className="text-sm text-gray-500">
                  Ajoutez des lieux d'intérêt pour les voir sur la carte
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Feature Details Popup */}
      {hoveredFeature && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <Card className="bg-white/95 backdrop-blur-sm border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">
                  {getFeatureIcon(hoveredFeature.feature_type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">{hoveredFeature.name}</h3>
                  {hoveredFeature.description && (
                    <p className="text-sm text-gray-600 mt-1">{hoveredFeature.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>📍 {hoveredFeature.latitude.toFixed(4)}°N, {hoveredFeature.longitude.toFixed(4)}°E</span>
                    <Badge variant="outline" className="text-xs">
                      {hoveredFeature.feature_type}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Legend */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {[
          { type: 'city', label: 'Villes', icon: '🏙️', color: 'bg-blue-500' },
          { type: 'region', label: 'Régions', icon: '🗺️', color: 'bg-purple-500' },
          { type: 'landmark', label: 'Monuments', icon: '🏛️', color: 'bg-yellow-500' },
          { type: 'administrative', label: 'Administratif', icon: '🏢', color: 'bg-gray-500' },
          { type: 'natural', label: 'Naturel', icon: '🌲', color: 'bg-green-500' },
        ].map((legendItem) => (
          <div key={legendItem.type} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${legendItem.color}`}></div>
            <span className="text-xs text-gray-600">
              {legendItem.icon} {legendItem.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}