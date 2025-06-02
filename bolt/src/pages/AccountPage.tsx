import React, { useState, useEffect } from 'react';
import { User, Edit, CheckCircle, X, LogOut, Clock, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Booking } from '../types';
import { mockBookings } from '../data/mockData';

const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);
  
  const fetchBookings = async () => {
    setLoadingBookings(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/bookings/user');
      // const data = await response.json();
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBookings(mockBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/user/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setIsEditing(false);
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Sei sicuro di voler annullare questa prenotazione?')) {
      return;
    }
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
      //   method: 'PUT'
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      );
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-primary-500 text-white p-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
            <p className="text-primary-100">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 transition-colors py-2 px-3 rounded-md"
          >
            <LogOut size={16} />
            <span>Esci</span>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              Profilo
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'bookings'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
              onClick={() => setActiveTab('bookings')}
            >
              Le mie prenotazioni
            </button>
          </div>
        </div>
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">I miei dati</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1 text-primary-500 hover:text-primary-600 transition-colors"
                >
                  <Edit size={16} />
                  <span>Modifica</span>
                </button>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="firstName" className="form-label">
                      Nome
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="form-input"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="form-label">
                      Cognome
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="form-input"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                {updateSuccess && (
                  <div className="bg-success-500/10 text-success-500 p-3 rounded-md text-sm mb-4 flex items-start">
                    <CheckCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p>Profilo aggiornato con successo!</p>
                  </div>
                )}
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className={`btn btn-primary ${isUpdating ? 'btn-disabled' : ''}`}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                          <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvataggio...
                      </span>
                    ) : (
                      'Salva modifiche'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Annulla
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Nome</h3>
                    <p>{user?.firstName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Cognome</h3>
                    <p>{user?.lastName}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-1">Email</h3>
                  <p>{user?.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-1">Ruolo</h3>
                  <p>{user?.isAdmin ? 'Amministratore' : 'Utente'}</p>
                </div>
              </div>
            )}
            
            {/* Security section */}
            <div className="mt-12">
              <h2 className="text-xl font-semibold mb-6">Sicurezza</h2>
              <button className="btn btn-secondary">
                Cambia password
              </button>
            </div>
          </div>
        )}
        
        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Le mie prenotazioni</h2>
            
            {loadingBookings ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-6">
                {/* Upcoming bookings */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Prenotazioni future</h3>
                  <div className="space-y-4">
                    {bookings
                      .filter(booking => 
                        booking.status !== 'cancelled' && 
                        new Date(booking.checkIn) >= new Date()
                      )
                      .map(booking => (
                        <div key={booking.id} className="border rounded-lg overflow-hidden shadow-sm">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/4">
                              <img 
                                src={booking.property?.images[0]} 
                                alt={booking.property?.name} 
                                className="h-full w-full object-cover md:h-40"
                              />
                            </div>
                            <div className="p-4 md:w-3/4 flex flex-col md:flex-row justify-between">
                              <div>
                                <h4 className="font-semibold text-lg mb-1">{booking.property?.name}</h4>
                                <div className="flex items-center text-sm text-neutral-500 mb-2">
                                  <MapPin size={14} className="mr-1" />
                                  <span>{booking.property?.location}</span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center">
                                    <Calendar size={14} className="mr-1 text-primary-500" />
                                    <span>
                                      Check-in: {format(new Date(booking.checkIn), 'dd MMM yyyy', { locale: it })}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar size={14} className="mr-1 text-primary-500" />
                                    <span>
                                      Check-out: {format(new Date(booking.checkOut), 'dd MMM yyyy', { locale: it })}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                                </div>
                              </div>
                              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                                <div className="text-right">
                                  <p className="text-lg font-bold">{booking.totalPrice} €</p>
                                  <p className="text-sm text-neutral-500">Totale</p>
                                </div>
                                <div className="mt-4 space-x-2">
                                  <button 
                                    className="btn btn-outline text-sm py-1"
                                    onClick={() => navigate(`/booking/${booking.propertyId}`)}
                                  >
                                    Dettagli
                                  </button>
                                  {booking.status !== 'cancelled' && (
                                    <button 
                                      className="btn btn-secondary text-sm py-1 text-error-500 border-error-500 hover:bg-error-50"
                                      onClick={() => handleCancelBooking(booking.id)}
                                    >
                                      Annulla
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {bookings.filter(booking => 
                      booking.status !== 'cancelled' && 
                      new Date(booking.checkIn) >= new Date()
                    ).length === 0 && (
                      <p className="text-neutral-500 italic">Nessuna prenotazione futura.</p>
                    )}
                  </div>
                </div>
                
                {/* Past bookings */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Prenotazioni passate</h3>
                  <div className="space-y-4">
                    {bookings
                      .filter(booking => 
                        new Date(booking.checkIn) < new Date()
                      )
                      .map(booking => (
                        <div key={booking.id} className="border rounded-lg overflow-hidden shadow-sm bg-neutral-50">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/4">
                              <img 
                                src={booking.property?.images[0]} 
                                alt={booking.property?.name}
                                className="h-full w-full object-cover md:h-40 opacity-80"
                              />
                            </div>
                            <div className="p-4 md:w-3/4 flex flex-col md:flex-row justify-between">
                              <div>
                                <h4 className="font-semibold text-lg mb-1">{booking.property?.name}</h4>
                                <div className="flex items-center text-sm text-neutral-500 mb-2">
                                  <MapPin size={14} className="mr-1" />
                                  <span>{booking.property?.location}</span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center">
                                    <Calendar size={14} className="mr-1 text-primary-500" />
                                    <span>
                                      Check-in: {format(new Date(booking.checkIn), 'dd MMM yyyy', { locale: it })}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar size={14} className="mr-1 text-primary-500" />
                                    <span>
                                      Check-out: {format(new Date(booking.checkOut), 'dd MMM yyyy', { locale: it })}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    booking.status === 'cancelled'
                                      ? 'bg-error-500/10 text-error-500'
                                      : 'bg-neutral-200 text-neutral-700'
                                  }`}>
                                    {booking.status === 'cancelled' ? 'Annullato' : 'Completato'}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                                <div className="text-right">
                                  <p className="text-lg font-bold">{booking.totalPrice} €</p>
                                  <p className="text-sm text-neutral-500">Totale</p>
                                </div>
                                <button 
                                  className="mt-4 btn btn-outline text-sm py-1"
                                  onClick={() => navigate(`/booking/${booking.propertyId}`)}
                                >
                                  Prenota di nuovo
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {bookings.filter(booking => 
                      new Date(booking.checkIn) < new Date()
                    ).length === 0 && (
                      <p className="text-neutral-500 italic">Nessuna prenotazione passata.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock size={48} className="mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nessuna prenotazione trovata</h3>
                <p className="text-neutral-500 mb-6">
                  Non hai ancora effettuato prenotazioni. Inizia a cercare alloggi!
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/search')}
                >
                  Cerca alloggi
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;