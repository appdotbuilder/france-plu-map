import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { GeographicFeature } from '../../../server/src/schema';

interface FeatureListProps {
  features: GeographicFeature[];
}

export function FeatureList({ features }: FeatureListProps) {
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

  const getFeatureTypeLabel = (featureType: string): string => {
    switch (featureType) {
      case 'city': return 'Ville';
      case 'region': return 'Région';
      case 'landmark': return 'Monument';
      case 'administrative': return 'Administratif';
      case 'natural': return 'Naturel';
      default: return 'Autre';
    }
  };

  const getFeatureColor = (featureType: string): string => {
    switch (featureType) {
      case 'city': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'region': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'landmark': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'administrative': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'natural': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  if (features.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🗺️</div>
        <p className="text-gray-500 mb-2">Aucun lieu trouvé</p>
        <p className="text-sm text-gray-400">
          Modifiez vos critères de recherche ou ajoutez de nouveaux lieux
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-3">
        {features.map((feature: GeographicFeature, index: number) => (
          <div key={feature.id}>
            <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer border-l-4 border-l-blue-400">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  <div className="text-xl flex-shrink-0">
                    {getFeatureIcon(feature.feature_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {feature.name}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className={`ml-2 flex-shrink-0 text-xs ${getFeatureColor(feature.feature_type)}`}
                      >
                        {getFeatureTypeLabel(feature.feature_type)}
                      </Badge>
                    </div>
                    
                    {feature.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {feature.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span>📍</span>
                        <span>
                          {feature.latitude.toFixed(4)}°N, {feature.longitude.toFixed(4)}°E
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>
                          Ajouté le {feature.created_at.toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Additional Properties */}
                    {feature.properties && Object.keys(feature.properties).length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Propriétés additionnelles :</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(feature.properties).slice(0, 3).map(([key, value]) => (
                            <Badge 
                              key={key} 
                              variant="outline" 
                              className="text-xs bg-gray-50"
                            >
                              {key}: {value}
                            </Badge>
                          ))}
                          {Object.keys(feature.properties).length > 3 && (
                            <Badge variant="outline" className="text-xs bg-gray-50">
                              +{Object.keys(feature.properties).length - 3} autres
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            {index < features.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}