import React from 'react';
import { Star, Wifi, Coffee, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  showDetailLink?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, showDetailLink = true }) => {
  const { id, name, location, price, rating, reviews, images, amenities } = property;

  // Function to render amenities icons
  const renderAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi size={16} className="text-primary-500" />;
      case 'breakfast':
      case 'colazione':
        return <Coffee size={16} className="text-primary-500" />;
      default:
        return <Check size={16} className="text-primary-500" />;
    }
  };

  // Display only first 3 amenities
  const displayedAmenities = amenities.slice(0, 3);

  return (
    <div className="card group transition-all duration-300 hover:shadow-lg">
      {/* Image container with overlay on hover */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={images[0]}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold line-clamp-1">{name}</h3>
          <div className="flex items-center space-x-1 text-sm">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-neutral-500">({reviews})</span>
          </div>
        </div>
        
        <p className="text-neutral-500 text-sm mt-1">{location}</p>
        
        {/* Amenities */}
        <div className="flex items-center space-x-3 mt-3">
          {displayedAmenities.map((amenity, index) => (
            <div key={index} className="flex items-center space-x-1 text-xs text-neutral-600">
              {renderAmenityIcon(amenity)}
              <span>{amenity}</span>
            </div>
          ))}
          {amenities.length > 3 && (
            <span className="text-xs text-neutral-500">+{amenities.length - 3} altro</span>
          )}
        </div>
        
        {/* Price and action */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-lg font-bold">{price} €</p>
            <p className="text-neutral-500 text-xs">a notte</p>
          </div>
          {showDetailLink && (
            <Link 
              to={`/booking/${id}`} 
              className="btn btn-primary"
            >
              Visualizza
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;