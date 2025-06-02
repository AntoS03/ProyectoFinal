import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash, Search, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Hotel, RefreshCw } from 'lucide-react';
import { Property, Booking } from '../types';
import { mockProperties, mockBookings } from '../data/mockData';

type PropertyFormData = {
  id?: string;
  name: string;
  type: 'hotel' | 'hostel' | 'apartment';
  location: string;
  address: string;
  description: string;
  price: number;
  amenities: string[];
  images: string[];
};

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'properties' | 'bookings'>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyFormData, setPropertyFormData] = useState<PropertyFormData>({
    name: '',
    type: 'hotel',
    location: '',
    address: '',
    description: '',
    price: 0,
    amenities: [],
    images: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const availableAmenities = [
    'Wi-Fi', 'Colazione', 'Parcheggio', 'Piscina', 
    'Aria condizionata', 'Palestra', 'Bar', 'Animali ammessi'
  ];
  
  useEffect(() => {
    if (activeTab === 'properties') {
      fetchProperties();
    } else {
      fetchBookings();
    }
  }, [activeTab]);
  
  const fetchProperties = async () => {
    setLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/properties');
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProperties(mockProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBookings = async () => {
    setLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/bookings');
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBookings(mockBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const openAddPropertyModal = () => {
    setPropertyFormData({
      name: '',
      type: 'hotel',
      location: '',
      address: '',
      description: '',
      price: 0,
      amenities: [],
      images: [],
    });
    setIsEditing(false);
    setFormError('');
    setShowPropertyModal(true);
  };
  
  const openEditPropertyModal = (property: Property) => {
    setPropertyFormData({
      id: property.id,
      name: property.name,
      type: property.type,
      location: property.location,
      address: property.address,
      description: property.description,
      price: property.price,
      amenities: property.amenities,
      images: property.images,
    });
    setIsEditing(true);
    setFormError('');
    setShowPropertyModal(true);
  };
  
  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPropertyFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setPropertyFormData(prev => ({ ...prev, price: isNaN(value) ? 0 : value }));
  };
  
  const handleAmenityToggle = (amenity: string) => {
    setPropertyFormData(prev => {
      const currentAmenities = [...prev.amenities];
      
      if (currentAmenities.includes(amenity)) {
        return {
          ...prev,
          amenities: currentAmenities.filter(a => a !== amenity)
        };
      } else {
        return {
          ...prev,
          amenities: [...currentAmenities, amenity]
        };
      }
    });
  };
  
  const handleAddImage = () => {
    const url = prompt('Inserisci URL dell\'immagine:');
    if (url) {
      setPropertyFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }));
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setPropertyFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  
  const validatePropertyForm = () => {
    if (!propertyFormData.name) return 'Nome struttura richiesto';
    if (!propertyFormData.location) return 'Località richiesta';
    if (!propertyFormData.address) return 'Indirizzo richiesto';
    if (!propertyFormData.description) return 'Descrizione richiesta';
    if (propertyFormData.price <= 0) return 'Prezzo deve essere maggiore di 0';
    if (propertyFormData.images.length === 0) return 'Aggiungi almeno un\'immagine';
    
    return '';
  };
  
  const handleSubmitProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validatePropertyForm();
    if (error) {
      setFormError(error);
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    
    try {
      if (isEditing) {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/admin/properties/${propertyFormData.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(propertyFormData),
        // });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        setProperties(prev => prev.map(p => 
          p.id === propertyFormData.id ? { ...p, ...propertyFormData, rating: p.rating, reviews: p.reviews } : p
        ));
        
        setActionSuccess('Struttura aggiornata con successo');
      } else {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/admin/properties', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(propertyFormData),
        // });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add to local state with mock ID and empty ratings
        const newProperty: Property = {
          ...propertyFormData,
          id: Date.now().toString(),
          rating: 0,
          reviews: 0,
        };
        
        setProperties(prev => [...prev, newProperty]);
        setActionSuccess('Struttura aggiunta con successo');
      }
      
      // Close modal after success
      setShowPropertyModal(false);
      
      // Clear success message after a delay
      setTimeout(() => {
        setActionSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error saving property:', error);
      setFormError('Si è verificato un errore. Riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa struttura?')) {
      return;
    }
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/properties/${id}`, {
      //   method: 'DELETE',
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setProperties(prev => prev.filter(p => p.id !== id));
      setActionSuccess('Struttura eliminata con successo');
      
      // Clear success message after a delay
      setTimeout(() => {
        setActionSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };
  
  const handleUpdateBookingStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/bookings/${id}/status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status }),
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === id ? { ...b, status } : b
      ));
      
      setActionSuccess(`Stato prenotazione aggiornato a "${status === 'confirmed' ? 'confermato' : 'annullato'}"`);
      
      // Clear success message after a delay
      setTimeout(() => {
        setActionSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };
  
  const filteredProperties = properties.filter(property => 
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredBookings = bookings.filter(booking => 
    booking.id.includes(searchTerm) ||
    (booking.property?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-primary-500 text-white p-6">
          <h1 className="text-2xl font-bold">Pannello di amministrazione</h1>
        </div>
        
        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'properties'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
              onClick={() => setActiveTab('properties')}
            >
              Gestione strutture
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'bookings'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
              onClick={() => setActiveTab('bookings')}
            >
              Gestione prenotazioni
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {actionSuccess && (
            <div className="bg-success-500/10 text-success-500 p-3 rounded-md text-sm mb-6 flex items-start">
              <CheckCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <p>{actionSuccess}</p>
            </div>
          )}
          
          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <button
                  onClick={openAddPropertyModal}
                  className="btn btn-primary flex items-center"
                >
                  <PlusCircle size={18} className="mr-2" />
                  Aggiungi struttura
                </button>
                
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cerca strutture..."
                    className="form-input pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : filteredProperties.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Struttura
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Località
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Prezzo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Valutazione
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Azioni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {filteredProperties.map((property) => (
                        <tr key={property.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 mr-3">
                                <img
                                  className="h-10 w-10 rounded-md object-cover"
                                  src={property.images[0]}
                                  alt={property.name}
                                />
                              </div>
                              <div className="truncate max-w-xs">
                                <div className="text-sm font-medium text-neutral-900 truncate">
                                  {property.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-500">{property.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                              {property.type === 'hotel' && 'Hotel'}
                              {property.type === 'hostel' && 'Ostello'}
                              {property.type === 'apartment' && 'Appartamento'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {property.price} €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm text-neutral-900 mr-1">{property.rating.toFixed(1)}</div>
                              <svg className="h-4 w-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                              <div className="text-xs text-neutral-500 ml-1">({property.reviews})</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditPropertyModal(property)}
                              className="text-primary-500 hover:text-primary-700 mr-3"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteProperty(property.id)}
                              className="text-error-500 hover:text-error-700"
                            >
                              <Trash size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Hotel size={48} className="mx-auto text-neutral-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nessuna struttura trovata</h3>
                  <p className="text-neutral-500 mb-6">
                    {searchTerm ? 'Nessun risultato per la ricerca corrente' : 'Non hai ancora aggiunto strutture'}
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={openAddPropertyModal}
                  >
                    Aggiungi struttura
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={fetchBookings}
                  className="btn btn-secondary flex items-center"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Aggiorna
                </button>
                
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Cerca prenotazioni..."
                    className="form-input pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : filteredBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Struttura
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Utente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Check-in/out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Prezzo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Stato
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Azioni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-500">{booking.id.substring(0, 8)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0 mr-3">
                                <img
                                  className="h-8 w-8 rounded-md object-cover"
                                  src={booking.property?.images[0]}
                                  alt={booking.property?.name}
                                />
                              </div>
                              <div className="truncate max-w-xs">
                                <div className="text-sm font-medium text-neutral-900 truncate">
                                  {booking.property?.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">Mario Rossi</div>
                            <div className="text-sm text-neutral-500">mario.rossi@example.com</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">
                              {new Date(booking.checkIn).toLocaleDateString('it-IT')}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {new Date(booking.checkOut).toLocaleDateString('it-IT')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            {booking.totalPrice} €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'confirmed' 
                                ? 'bg-success-500/10 text-success-500' 
                                : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-error-500/10 text-error-500'
                            }`}>
                              {booking.status === 'confirmed' && 'Confermato'}
                              {booking.status === 'pending' && 'In attesa'}
                              {booking.status === 'cancelled' && 'Annullato'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                  className="text-success-500 hover:text-success-700 mr-3"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                  className="text-error-500 hover:text-error-700"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                className="text-error-500 hover:text-error-700"
                              >
                                <X size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">Nessuna prenotazione trovata</h3>
                  <p className="text-neutral-500">
                    {searchTerm ? 'Nessun risultato per la ricerca corrente' : 'Non ci sono prenotazioni da gestire al momento'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Modifica struttura' : 'Aggiungi struttura'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmitProperty} className="px-6 py-4">
              {formError && (
                <div className="bg-error-500/10 text-error-500 p-3 rounded-md text-sm mb-4 flex items-start">
                  <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p>{formError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="form-label">
                    Nome struttura
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    value={propertyFormData.name}
                    onChange={handlePropertyInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="type" className="form-label">
                    Tipo struttura
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="form-input"
                    value={propertyFormData.type}
                    onChange={handlePropertyInputChange}
                    required
                  >
                    <option value="hotel">Hotel</option>
                    <option value="hostel">Ostello</option>
                    <option value="apartment">Appartamento</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="location" className="form-label">
                    Località
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className="form-input"
                    value={propertyFormData.location}
                    onChange={handlePropertyInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="price" className="form-label">
                    Prezzo per notte (€)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    className="form-input"
                    value={propertyFormData.price}
                    onChange={handlePriceChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="address" className="form-label">
                  Indirizzo
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="form-input"
                  value={propertyFormData.address}
                  onChange={handlePropertyInputChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="form-label">
                  Descrizione
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="form-input"
                  value={propertyFormData.description}
                  onChange={handlePropertyInputChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Servizi</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {availableAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                        checked={propertyFormData.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="form-label">Immagini</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {propertyFormData.images.map((image, index) => (
                    <div key={index} className="relative rounded-md overflow-hidden group">
                      <img 
                        src={image} 
                        alt={`Immagine ${index + 1}`} 
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} className="text-error-500" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="border-2 border-dashed border-neutral-300 rounded-md h-32 flex items-center justify-center text-neutral-500 hover:text-primary-500 hover:border-primary-500 transition-colors"
                  >
                    <PlusCircle size={24} className="mr-2" />
                    <span>Aggiungi immagine</span>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPropertyModal(false)}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting ? 'btn-disabled' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                        <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvataggio...
                    </span>
                  ) : (
                    isEditing ? 'Aggiorna struttura' : 'Aggiungi struttura'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;