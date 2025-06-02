import React from 'react';
import PropertyCard from './PropertyCard';
import { Property } from '../types';

interface FeaturedPropertiesProps {
  title: string;
  properties: Property[];
}

const FeaturedProperties: React.FC<FeaturedPropertiesProps> = ({ title, properties }) => {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;