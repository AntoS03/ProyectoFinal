import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import FeaturedProperties from '../components/FeaturedProperties';
import { mockPopularProperties, mockFeaturedDestinations } from '../data/mockData';

const HomePage: React.FC = () => {
  return (
    <div>
      {/* Hero section */}
      <section className="relative bg-primary-500 text-white pt-12 pb-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Trova l'alloggio perfetto per il tuo prossimo viaggio
            </h1>
            <p className="text-lg mb-8 text-primary-50">
              Cerca tra migliaia di hotel, ostelli e case vacanza ai prezzi migliori
            </p>
          </div>
        </div>
        {/* Background pattern */}
        <div className="absolute bottom-0 right-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-primary-400"></div>
          <div className="absolute top-10 right-20 w-64 h-64 rounded-full bg-primary-400"></div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <FeaturedProperties 
        title="Offerte popolari" 
        properties={mockPopularProperties} 
      />

      {/* Featured Destinations Section */}
      <section className="py-10 bg-neutral-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Destinazioni consigliate</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockFeaturedDestinations.map((destination) => (
              <Link 
                key={destination.id} 
                to={`/search?location=${destination.location}`}
                className="group block relative rounded-lg overflow-hidden h-60 shadow-md"
              >
                <img 
                  src={destination.image} 
                  alt={destination.location} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h3 className="text-white text-xl font-bold">{destination.location}</h3>
                    <p className="text-white/80 text-sm">{destination.properties} strutture</p>
                    <span className="inline-flex items-center mt-2 text-white text-sm font-medium transition-transform group-hover:translate-x-2">
                      Scopri <ArrowRight size={16} className="ml-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Perché scegliere MyBooking</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Prenotazione Facile</h3>
              <p className="text-neutral-600">Prenota il tuo alloggio con pochi clic, in modo semplice e veloce.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Migliori Prezzi</h3>
              <p className="text-neutral-600">Garantiamo i prezzi più bassi per migliaia di strutture in tutto il mondo.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Supporto 24/7</h3>
              <p className="text-neutral-600">Il nostro team è disponibile 24/7 per assisterti durante tutto il processo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-500 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Pronto a trovare il tuo prossimo alloggio?</h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Iscriviti ora per ricevere offerte esclusive e sconti speciali su migliaia di strutture.
          </p>
          <Link to="/register" className="btn btn-primary bg-white text-primary-500 hover:bg-primary-50 px-8 py-3 text-lg">
            Inizia ora
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;