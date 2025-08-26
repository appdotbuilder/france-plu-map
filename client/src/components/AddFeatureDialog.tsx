import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { GeographicFeature, CreateGeographicFeatureInput } from '../../../server/src/schema';

interface AddFeatureDialogProps {
  onFeatureAdded: (feature: GeographicFeature) => void;
}

export function AddFeatureDialog({ onFeatureAdded }: AddFeatureDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateGeographicFeatureInput>({
    name: '',
    description: null,
    feature_type: 'city',
    latitude: 46.2276, // Default to center of France
    longitude: 2.2137,
    properties: null
  });

  const featureTypes = [
    { value: 'city', label: '🏙️ Ville', description: 'Centre urbain, commune' },
    { value: 'region', label: '🗺️ Région', description: 'Division administrative' },
    { value: 'landmark', label: '🏛️ Monument', description: 'Site remarquable, monument historique' },
    { value: 'administrative', label: '🏢 Administratif', description: 'Bâtiment ou zone administrative' },
    { value: 'natural', label: '🌲 Naturel', description: 'Parc, forêt, site naturel' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Le nom est requis');
      }

      // Validate coordinates for France
      if (formData.latitude < 41.3 || formData.latitude > 51.1) {
        throw new Error('La latitude doit être entre 41.3°N et 51.1°N pour la France');
      }
      if (formData.longitude < -5.1 || formData.longitude > 9.6) {
        throw new Error('La longitude doit être entre -5.1°E et 9.6°E pour la France');
      }

      const newFeature = await trpc.createGeographicFeature.mutate(formData);
      onFeatureAdded(newFeature);
      
      // Reset form
      setFormData({
        name: '',
        description: null,
        feature_type: 'city',
        latitude: 46.2276,
        longitude: 2.2137,
        properties: null
      });
      
      setIsOpen(false);
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du lieu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoordinateClick = (preset: { name: string; lat: number; lng: number }) => {
    setFormData((prev: CreateGeographicFeatureInput) => ({
      ...prev,
      latitude: preset.lat,
      longitude: preset.lng
    }));
  };

  // Some preset coordinates for major French cities
  const presetLocations = [
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Lyon', lat: 45.7640, lng: 4.8357 },
    { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
    { name: 'Toulouse', lat: 43.6047, lng: 1.4442 },
    { name: 'Nice', lat: 43.7102, lng: 7.2620 },
    { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
    { name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
    { name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          ➕ Ajouter un lieu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>📍</span>
            <span>Ajouter un nouveau lieu</span>
          </DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau lieu d'intérêt géographique sur la carte de France
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nom du lieu *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateGeographicFeatureInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Tour Eiffel, Lyon, Parc du Mercantour..."
                className="mt-1"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="feature_type">Type de lieu *</Label>
              <Select
                value={formData.feature_type}
                onValueChange={(value: 'city' | 'region' | 'landmark' | 'administrative' | 'natural') =>
                  setFormData((prev: CreateGeographicFeatureInput) => ({ ...prev, feature_type: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {featureTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateGeographicFeatureInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              placeholder="Description optionnelle du lieu..."
              className="mt-1 resize-none h-20"
            />
          </div>

          {/* Coordinates */}
          <div>
            <Label className="text-base font-medium">Coordonnées géographiques *</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="latitude" className="text-sm">Latitude (°N)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  min="41.3"
                  max="51.1"
                  value={formData.latitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateGeographicFeatureInput) => ({
                      ...prev,
                      latitude: parseFloat(e.target.value) || 0
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-sm">Longitude (°E)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  min="-5.1"
                  max="9.6"
                  value={formData.longitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateGeographicFeatureInput) => ({
                      ...prev,
                      longitude: parseFloat(e.target.value) || 0
                    }))
                  }
                  className="mt-1"
                  required
                />
              </div>
            </div>

            {/* Quick Location Presets */}
            <div className="mt-3">
              <Label className="text-sm text-gray-600">Ou choisir une ville :</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {presetLocations.map((location) => (
                  <Button
                    key={location.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCoordinateClick(location)}
                    className="text-xs h-7"
                  >
                    {location.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">❌ {error}</p>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Création...' : '✅ Créer le lieu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}