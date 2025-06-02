import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Calendar, Users, ChevronLeft, ChevronRight, CreditCard, Wifi, Coffee, Car, Waves, DumbbellIcon, Wine, Snowflake, AlertCircle } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { Property } from '../types';
import { mockProperties } from '../data/mockData';

const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [checkIn, setCheckIn] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  const [guests, setGuests] = useState(2);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  
  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/properties/${id}`);
        // const data = await response.json();
        
        // Simulate API call with mock data
        const foundProperty = mockProperties.find(p => p.id === id);
        
        if (foundProperty) {
          setProperty(foundProperty);
        } else {
          navigate('/search');
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        navigate('/search');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [id, navigate]);

  const handleNextImage = () => {
    if (property) {
      setActiveImage((prev) => (prev + 1) % property.images.length);
    }
  };

  const handlePrevImage = () => {
    if (property) {
      setActiveImage((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setIsBooking(true);
    setBookingError('');
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/bookings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     propertyId: id,
      //     checkIn,
      //     checkOut,
      //     guests,
      //     totalPrice: calculateTotalPrice(),
      //   }),
      // });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful booking
      setBookingSuccess(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      setBookingError('Si è verificato un errore durante la prenotazione. Riprova più tardi.');
    } finally {
      setIsBooking(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!property) return 0;
    
    const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
    const nightlyPrice = property.price;
    const subtotal = nightlyPrice * nights;
    const taxes = subtotal * 0.1; // 10% tax
    
    return {
      nightlyPrice,
      nights,
      subtotal,
      taxes,
      total: subtotal + taxes
    };
  };

  const renderAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    
    if (amenityLower.includes('wifi')) return <Wifi size={20} />;
    if (amenityLower.includes('colazione') || amenityLower.includes('breakfast')) return <Coffee size={20} />;
    if (amenityLower.includes('parcheggio') || amenityLower.includes('parking')) return <Car size={20} />;
    if (amenityLower.includes('piscina') || amenityLower.includes('pool')) return <Waves size={20} />;
    if (amenityLower.includes('palestra') || amenityLower.includes('gym')) return <DumbbellIcon size={20} />;
    if (amenityLower.includes('bar')) return <Wine size={20} />;
    if (amenityLower.includes('aria') || amenityLower.includes('condizionata')) return <Snowflake size={20} />;
    
    return <Star size={20} />;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-neutral-600">Proprietà non trovata.</p>
      </div>
    );
  }

  const priceDetails = calculateTotalPrice();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-neutral-500 mb-6">
        <button 
          onClick={() => navigate('/search')}
          className="hover:text-primary-500 transition-colors flex items-center"
        >
          <ChevronLeft size={16} />
          <span>Torna alla ricerca</span>
        </button>
        <span>/</span>
        <span className="truncate">{property.name}</span>
      </div>
      
      {bookingSuccess ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Prenotazione confermata!</h2>
          <p className="text-neutral-600 mb-6">
            La tua prenotazione presso {property.name} è stata confermata. 
            Abbiamo inviato tutti i dettagli alla tua email.
          </p>
          <div className="bg-primary-50 rounded-lg p-4 mb-6 inline-block">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Check-in:</span>
              <span>{format(new Date(checkIn), 'dd MMMM yyyy', { locale: it })}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Check-out:</span>
              <span>{format(new Date(checkOut), 'dd MMMM yyyy', { locale: it })}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Ospiti:</span>
              <span>{guests}</span>
            </div>
          </div>
          <div className="space-x-4">
            <button 
              onClick={() => navigate('/account')}
              className="btn btn-primary"
            >
              Visualizza le tue prenotazioni
            </button>
            <button 
              onClick={() => navigate('/')}
              className="btn btn-outline"
            >
              Torna alla home
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Property details */}
          <div className="lg:w-2/3">
            <h1 className="text-2xl font-bold mb-2">{property.name}</h1>
            <div className="flex items-center space-x-1 mb-4">
              <Star size={18} className="text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{property.rating.toFixed(1)}</span>
              <span className="text-neutral-500">({property.reviews} recensioni)</span>
              <span className="mx-2">•</span>
              <span className="text-neutral-600">{property.location}</span>
            </div>
            
            {/* Image gallery */}
            <div className="relative mb-8 rounded-lg overflow-hidden shadow-md">
              <img 
                src={property.images[activeImage]} 
                alt={property.name} 
                className="w-full h-80 object-cover"
              />
              <button 
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-white transition-colors"
                aria-label="Immagine precedente"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-white transition-colors"
                aria-label="Immagine successiva"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {property.images.map((_, index) => (
                  <button 
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === activeImage ? 'bg-white' : 'bg-white/50'
                    }`}
                    onClick={() => setActiveImage(index)}
                  />
                ))}
              </div>
            </div>
            
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Informazioni</h2>
              <p className="text-neutral-700 mb-6">
                {property.description}
              </p>
              
              <h3 className="text-lg font-semibold mb-3">Servizi</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {renderAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Location */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Posizione</h2>
              <p className="mb-4">{property.address}</p>
              <div className="bg-neutral-100 h-60 rounded-lg flex items-center justify-center">
                <p className="text-neutral-500">Mappa non disponibile</p>
              </div>
            </div>
          </div>
          
          {/* Booking form */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Prenota</h2>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">{property.price} €</span>
                  <span className="text-neutral-500">a notte</span>
                </div>
                
                <div className="border rounded-lg overflow-hidden mb-4">
                  <div className="grid grid-cols-2 divide-x">
                    <div className="p-3">
                      <label htmlFor="check-in" className="block text-xs text-neutral-500 mb-1">
                        <Calendar size={14} className="inline mr-1" />
                        Check-in
                      </label>
                      <input
                        type="date"
                        id="check-in"
                        className="w-full border-none p-0 focus:ring-0"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    <div className="p-3">
                      <label htmlFor="check-out" className="block text-xs text-neutral-500 mb-1">
                        <Calendar size={14} className="inline mr-1" />
                        Check-out
                      </label>
                      <input
                        type="date"
                        id="check-out"
                        className="w-full border-none p-0 focus:ring-0"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        min={checkIn}
                      />
                    </div>
                  </div>
                  <div className="border-t p-3">
                    <label htmlFor="guests" className="block text-xs text-neutral-500 mb-1">
                      <Users size={14} className="inline mr-1" />
                      Ospiti
                    </label>
                    <select
                      id="guests"
                      className="w-full border-none p-0 focus:ring-0"
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'ospite' : 'ospiti'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Price details */}
              <div className="border-t border-b py-4 mb-6 space-y-2">
                <div className="flex justify-between">
                  <span>{property.price} € x {priceDetails.nights} notti</span>
                  <span>{priceDetails.subtotal} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasse (10%)</span>
                  <span>{priceDetails.taxes.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Totale</span>
                  <span>{priceDetails.total.toFixed(2)} €</span>
                </div>
              </div>
              
              {bookingError && (
                <div className="bg-error-500/10 text-error-500 p-3 rounded-md text-sm mb-4 flex items-start">
                  <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p>{bookingError}</p>
                </div>
              )}
              
              <button
                onClick={handleBooking}
                className={`btn btn-primary w-full ${isBooking ? 'btn-disabled' : ''}`}
                disabled={isBooking}
              >
                {isBooking ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                      <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Prenotazione in corso...
                  </span>
                ) : (
                  'Conferma prenotazione'
                )}
              </button>
              
              <p className="text-xs text-neutral-500 text-center mt-4">
                Non ti verrà addebitato nulla fino alla conferma della prenotazione
              </p>
              
              <div className="mt-6 flex items-center justify-center">
                <CreditCard size={16} className="text-neutral-500 mr-2" />
                <span className="text-sm text-neutral-600">Pagamento sicuro</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;