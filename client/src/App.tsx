import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { MapView } from './components/MapView';
import { FeatureList } from './components/FeatureList';
import { AddFeatureDialog } from './components/AddFeatureDialog';
import type { GeographicFeature, MapView as MapViewType, BoundingBox } from '../../server/src/schema';

function App() {
  const [mapView, setMapView] = useState<MapViewType | null>(null);
  const [franceBounds, setFranceBounds] = useState<BoundingBox | null>(null);
  const [features, setFeatures] = useState<GeographicFeature[]>([]);
  const [filteredFeatures, setFilteredFeatures] = useState<GeographicFeature[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeatureType, setSelectedFeatureType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial map data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [initialMapView, bounds, allFeatures] = await Promise.all([
        trpc.getInitialMapView.query(),
        trpc.getFranceBounds.query(),
        trpc.getGeographicFeatures.query()
      ]);

      setMapView(initialMapView);
      setFranceBounds(bounds);
      setFeatures(allFeatures);
      setFilteredFeatures(allFeatures);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Impossible de charger les données cartographiques');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter features based on search and type
  const filterFeatures = useCallback(() => {
    let filtered = features;

    if (searchQuery) {
      filtered = filtered.filter((feature: GeographicFeature) =>
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (feature.description && feature.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedFeatureType !== 'all') {
      filtered = filtered.filter((feature: GeographicFeature) => 
        feature.feature_type === selectedFeatureType
      );
    }

    setFilteredFeatures(filtered);
  }, [features, searchQuery, selectedFeatureType]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    filterFeatures();
  }, [filterFeatures]);

  const handleFeatureAdded = (newFeature: GeographicFeature) => {
    setFeatures((prev: GeographicFeature[]) => [...prev, newFeature]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement de la carte de France...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold mb-2">❌ Erreur</p>
              <p>{error}</p>
              <Button 
                onClick={loadInitialData}
                className="mt-4"
                variant="outline"
              >
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🗺️</div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Géoportail France</h1>
                <p className="text-blue-600 text-sm">Exploration géographique de la France</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {features.length} {features.length === 1 ? 'lieu' : 'lieux'} référencés
              </Badge>
              <AddFeatureDialog onFeatureAdded={handleFeatureAdded} />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-blue-900 flex items-center">
                      🌍 Carte de France
                    </CardTitle>
                    <CardDescription>
                      Vue d'ensemble du territoire français
                    </CardDescription>
                  </div>
                  {mapView && (
                    <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                      Centre: {mapView.center.latitude.toFixed(4)}°N, {mapView.center.longitude.toFixed(4)}°E
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {mapView && franceBounds ? (
                  <MapView 
                    mapView={mapView}
                    bounds={franceBounds}
                    features={filteredFeatures}
                  />
                ) : (
                  <div className="h-96 bg-blue-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-600">Chargement de la carte...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800 flex items-center">
                  🔍 Recherche et Filtres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Rechercher un lieu..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="border-green-200 focus:border-green-400"
                  />
                </div>
                <div>
                  <Select value={selectedFeatureType} onValueChange={setSelectedFeatureType}>
                    <SelectTrigger className="border-green-200">
                      <SelectValue placeholder="Type de lieu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="city">🏙️ Villes</SelectItem>
                      <SelectItem value="region">🗺️ Régions</SelectItem>
                      <SelectItem value="landmark">🏛️ Monuments</SelectItem>
                      <SelectItem value="administrative">🏢 Administratif</SelectItem>
                      <SelectItem value="natural">🌲 Naturel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(searchQuery || selectedFeatureType !== 'all') && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{filteredFeatures.length} résultat(s)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedFeatureType('all');
                      }}
                    >
                      Effacer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features List */}
            <Card className="border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-800 flex items-center">
                  📍 Lieux d'Intérêt
                </CardTitle>
                <CardDescription>
                  {filteredFeatures.length === 0 
                    ? 'Aucun lieu trouvé'
                    : `${filteredFeatures.length} lieu(x) affiché(s)`
                  }
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <FeatureList features={filteredFeatures} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-sm border-t border-blue-200 mt-12">
        <div className="container mx-auto px-6 py-4 text-center text-gray-600">
          <p className="flex items-center justify-center space-x-2">
            <span>🇫🇷</span>
            <span>Géoportail France - Exploration géographique interactive</span>
            <span>🗺️</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;