import React, { useState } from 'react';
import { SearchFilters as SearchFiltersType } from '../types';
import { Filter, Star, X } from 'lucide-react';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFilterChange: (filters: SearchFiltersType) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onFilterChange }) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const propertyTypes = [
    { id: 'hotel', label: 'Hotel' },
    { id: 'hostel', label: 'Ostello' },
    { id: 'apartment', label: 'Appartamento' },
  ];

  const amenitiesList = [
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'breakfast', label: 'Colazione' },
    { id: 'parking', label: 'Parcheggio' },
    { id: 'pool', label: 'Piscina' },
    { id: 'gym', label: 'Palestra' },
    { id: 'pet-friendly', label: 'Animali ammessi' },
    { id: 'air-conditioning', label: 'Aria condizionata' },
  ];

  const handlePropertyTypeChange = (type: string) => {
    const currentTypes = filters.propertyType || [];
    let newTypes;
    
    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter(t => t !== type);
    } else {
      newTypes = [...currentTypes, type];
    }
    
    onFilterChange({
      ...filters,
      propertyType: newTypes
    });
  };

  const handleAmenityChange = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    let newAmenities;
    
    if (currentAmenities.includes(amenity)) {
      newAmenities = currentAmenities.filter(a => a !== amenity);
    } else {
      newAmenities = [...currentAmenities, amenity];
    }
    
    onFilterChange({
      ...filters,
      amenities: newAmenities
    });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...filters,
      rating: filters.rating === rating ? undefined : rating
    });
  };

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'min' | 'max'
  ) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    
    onFilterChange({
      ...filters,
      [type === 'min' ? 'priceMin' : 'priceMax']: value
    });
  };

  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const resetFilters = () => {
    onFilterChange({
      location: filters.location,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      guests: filters.guests,
    });
  };

  // Check if any filters are active (beyond the basic search criteria)
  const hasActiveFilters = !!(
    filters.priceMin || 
    filters.priceMax || 
    (filters.propertyType && filters.propertyType.length > 0) ||
    (filters.amenities && filters.amenities.length > 0) ||
    filters.rating
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      {/* Mobile toggle button */}
      <button 
        className="md:hidden w-full flex items-center justify-between p-4 border-b border-neutral-200"
        onClick={toggleFilters}
      >
        <div className="flex items-center space-x-2">
          <Filter size={18} />
          <span className="font-medium">Filtri</span>
          {hasActiveFilters && (
            <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
              Attivi
            </span>
          )}
        </div>
        <span>{isFiltersOpen ? 'Nascondi' : 'Mostra'}</span>
      </button>

      <div className={`md:block ${isFiltersOpen ? 'block' : 'hidden'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filtri</h3>
            {hasActiveFilters && (
              <button 
                onClick={resetFilters}
                className="text-sm text-primary-500 hover:text-primary-600 flex items-center"
              >
                <X size={14} className="mr-1" />
                Resetta filtri
              </button>
            )}
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Prezzo per notte</h4>
            <div className="flex space-x-3">
              <div className="w-1/2">
                <label htmlFor="min-price" className="block text-xs text-neutral-500 mb-1">
                  Min (€)
                </label>
                <input
                  type="number"
                  id="min-price"
                  min="0"
                  className="form-input"
                  value={filters.priceMin || ''}
                  onChange={(e) => handlePriceChange(e, 'min')}
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="max-price" className="block text-xs text-neutral-500 mb-1">
                  Max (€)
                </label>
                <input
                  type="number"
                  id="max-price"
                  min="0"
                  className="form-input"
                  value={filters.priceMax || ''}
                  onChange={(e) => handlePriceChange(e, 'max')}
                />
              </div>
            </div>
          </div>

          {/* Property Types */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Tipo di alloggio</h4>
            <div className="space-y-2">
              {propertyTypes.map((type) => (
                <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                    checked={(filters.propertyType || []).includes(type.id)}
                    onChange={() => handlePropertyTypeChange(type.id)}
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Valutazione</h4>
            <div className="flex space-x-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    filters.rating === rating 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                  onClick={() => handleRatingChange(rating)}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h4 className="font-medium mb-3">Servizi</h4>
            <div className="space-y-2">
              {amenitiesList.map((amenity) => (
                <label key={amenity.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                    checked={(filters.amenities || []).includes(amenity.id)}
                    onChange={() => handleAmenityChange(amenity.id)}
                  />
                  <span>{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;