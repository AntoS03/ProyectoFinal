import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, List, Grid, Filter, X } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import SearchFilters from '../components/SearchFilters';
import { Property, SearchFilters as SearchFiltersType } from '../types';
import { mockProperties } from '../data/mockData';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 12;
  
  // Initialize filters from URL search parameters
  const [filters, setFilters] = useState<SearchFiltersType>({
    location: searchParams.get('location') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : 1,
  });

  useEffect(() => {
    // Simulate API call with filters
    const fetchProperties = async () => {
      setLoading(true);
      
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/search', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(filters),
        // });
        // const data = await response.json();
        
        // Simulate filtering based on location
        let filteredProperties = [...mockProperties];
        
        if (filters.location) {
          filteredProperties = filteredProperties.filter(property => 
            property.location.toLowerCase().includes(filters.location.toLowerCase())
          );
        }
        
        if (filters.priceMin) {
          filteredProperties = filteredProperties.filter(property => 
            property.price >= (filters.priceMin || 0)
          );
        }
        
        if (filters.priceMax) {
          filteredProperties = filteredProperties.filter(property => 
            property.price <= (filters.priceMax || Infinity)
          );
        }
        
        if (filters.propertyType && filters.propertyType.length > 0) {
          filteredProperties = filteredProperties.filter(property => 
            filters.propertyType?.includes(property.type)
          );
        }
        
        if (filters.rating) {
          filteredProperties = filteredProperties.filter(property => 
            property.rating >= (filters.rating || 0)
          );
        }
        
        if (filters.amenities && filters.amenities.length > 0) {
          filteredProperties = filteredProperties.filter(property => 
            filters.amenities?.some(amenity => 
              property.amenities.map(a => a.toLowerCase()).includes(amenity.toLowerCase())
            )
          );
        }
        
        setProperties(filteredProperties);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [filters]);

  const toggleView = (newView: 'grid' | 'list') => {
    setView(newView);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Pagination
  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = properties.slice(indexOfFirstProperty, indexOfLastProperty);
  const totalPages = Math.ceil(properties.length / propertiesPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">
          {loading ? (
            'Ricerca in corso...'
          ) : (
            properties.length > 0 
              ? `${properties.length} alloggi trovati${filters.location ? ` a ${filters.location}` : ''}`
              : 'Nessun alloggio trovato'
          )}
        </h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center border rounded-md">
            <button 
              className={`p-2 ${view === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600'}`}
              onClick={() => toggleView('grid')}
              aria-label="Vista griglia"
            >
              <Grid size={20} />
            </button>
            <button 
              className={`p-2 ${view === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600'}`}
              onClick={() => toggleView('list')}
              aria-label="Vista lista"
            >
              <List size={20} />
            </button>
          </div>
          
          <button 
            className="md:hidden flex items-center space-x-1 border rounded-md p-2 bg-white"
            onClick={toggleFilters}
          >
            <Filter size={20} />
            <span>Filtri</span>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters - mobile */}
        {showFilters && (
          <div className="md:hidden fixed inset-0 bg-white z-50 overflow-auto">
            <div className="p-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Filtri</h2>
              <button onClick={toggleFilters} className="p-2">
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <SearchFilters filters={filters} onFilterChange={handleFilterChange} />
              <button 
                className="btn btn-primary w-full mt-4"
                onClick={toggleFilters}
              >
                Applica filtri
              </button>
            </div>
          </div>
        )}
        
        {/* Filters - desktop */}
        <div className="hidden md:block md:w-1/4">
          <SearchFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>
        
        {/* Results */}
        <div className="md:w-3/4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-neutral-600">Ricerca in corso...</p>
            </div>
          ) : properties.length > 0 ? (
            <>
              <div className={`
                ${view === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-6'
                }
              `}>
                {currentProperties.map(property => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-md ${
                        currentPage === 1
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      Precedente
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => paginate(index + 1)}
                        className={`w-10 h-10 rounded-md ${
                          currentPage === index + 1
                            ? 'bg-primary-500 text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-md ${
                        currentPage === totalPages
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      Successiva
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <Search size={48} className="mx-auto text-neutral-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nessun alloggio trovato</h2>
              <p className="text-neutral-600 mb-4">
                Prova a modificare i filtri di ricerca o a cercare in un'altra località.
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => handleFilterChange({
                  location: '',
                  checkIn: '',
                  checkOut: '',
                  guests: 1,
                })}
              >
                Reimposta filtri
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;