import { Property, Booking } from '../types';

// Mock Properties
export const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Grand Hotel Milano',
    type: 'hotel',
    location: 'Milano',
    address: 'Via Roma 123, 20121 Milano',
    description: 'Elegante hotel nel cuore di Milano, a pochi passi dal Duomo. Offre camere lussuose, ristorante stellato e spa con piscina.',
    price: 150,
    rating: 4.7,
    reviews: 423,
    amenities: ['Wi-Fi', 'Colazione', 'Parcheggio', 'Piscina', 'Aria condizionata', 'Palestra'],
    images: [
      'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
      'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg'
    ]
  },
  {
    id: '2',
    name: 'Apartment Campo dei Fiori',
    type: 'apartment',
    location: 'Roma',
    address: 'Via del Corso 45, 00186 Roma',
    description: 'Accogliente appartamento nel centro storico di Roma, vicino a Campo dei Fiori. Perfetto per coppie o piccole famiglie.',
    price: 95,
    rating: 4.5,
    reviews: 218,
    amenities: ['Wi-Fi', 'Aria condizionata', 'Cucina completa', 'Lavatrice'],
    images: [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
      'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg',
      'https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg'
    ]
  },
  {
    id: '3',
    name: 'Bella Vista Hostel',
    type: 'hostel',
    location: 'Firenze',
    address: 'Via dei Servi 15, 50122 Firenze',
    description: 'Hostel moderno nel centro di Firenze con vista sul Duomo. Offre dormitori e camere private, cucina comune e area relax.',
    price: 30,
    rating: 4.2,
    reviews: 156,
    amenities: ['Wi-Fi', 'Cucina comune', 'Lounge', 'Armadietti'],
    images: [
      'https://images.pexels.com/photos/2467285/pexels-photo-2467285.jpeg',
      'https://images.pexels.com/photos/2029719/pexels-photo-2029719.jpeg',
      'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg'
    ]
  },
  {
    id: '4',
    name: 'Resort Amalfi Paradise',
    type: 'hotel',
    location: 'Amalfi',
    address: 'Via Marina 34, 84011 Amalfi',
    description: 'Lussuoso resort sulla costa di Amalfi con vista panoramica sul mare. Piscina a sfioro, spa, e ristorante con cucina locale.',
    price: 280,
    rating: 4.9,
    reviews: 312,
    amenities: ['Wi-Fi', 'Colazione', 'Piscina', 'Spa', 'Aria condizionata', 'Bar', 'Ristorante'],
    images: [
      'https://images.pexels.com/photos/2598638/pexels-photo-2598638.jpeg',
      'https://images.pexels.com/photos/4112236/pexels-photo-4112236.jpeg',
      'https://images.pexels.com/photos/26139/pexels-photo-26139.jpg'
    ]
  },
  {
    id: '5',
    name: 'Casa Toscana',
    type: 'apartment',
    location: 'Siena',
    address: 'Via del Capitano 8, 53100 Siena',
    description: 'Incantevole casa tradizionale toscana circondata da vigneti e uliveti. A soli 10 minuti dal centro di Siena.',
    price: 120,
    rating: 4.6,
    reviews: 184,
    amenities: ['Wi-Fi', 'Parcheggio', 'Giardino', 'Aria condizionata', 'Cucina completa'],
    images: [
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
      'https://images.pexels.com/photos/3773572/pexels-photo-3773572.png',
      'https://images.pexels.com/photos/3773575/pexels-photo-3773575.png'
    ]
  },
  {
    id: '6',
    name: 'Boutique Hotel Venice',
    type: 'hotel',
    location: 'Venezia',
    address: 'Calle Larga XXII Marzo 2399, 30124 Venezia',
    description: 'Hotel boutique raffinato a due passi da Piazza San Marco. Camere eleganti con vista sui canali e colazione gourmet.',
    price: 210,
    rating: 4.8,
    reviews: 267,
    amenities: ['Wi-Fi', 'Colazione', 'Aria condizionata', 'Bar', 'Concierge'],
    images: [
      'https://images.pexels.com/photos/2549018/pexels-photo-2549018.jpeg',
      'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg',
      'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg'
    ]
  },
  {
    id: '7',
    name: 'Napoli Backpackers',
    type: 'hostel',
    location: 'Napoli',
    address: 'Via Toledo 56, 80134 Napoli',
    description: 'Hostel vivace nel centro di Napoli, ideale per viaggiatori giovani. Offre tour guidati, cucina comune e atmosfera internazionale.',
    price: 25,
    rating: 4.1,
    reviews: 132,
    amenities: ['Wi-Fi', 'Cucina comune', 'Armadietti', 'Area relax'],
    images: [
      'https://images.pexels.com/photos/5137980/pexels-photo-5137980.jpeg',
      'https://images.pexels.com/photos/6394537/pexels-photo-6394537.jpeg',
      'https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg'
    ]
  },
  {
    id: '8',
    name: 'Majestic Palace Hotel',
    type: 'hotel',
    location: 'Como',
    address: 'Lungo Lago Mafalda di Savoia 22, 22100 Como',
    description: 'Hotel di lusso con vista mozzafiato sul Lago di Como. Dispone di giardino privato, piscina, spa e ristorante stellato.',
    price: 240,
    rating: 4.7,
    reviews: 289,
    amenities: ['Wi-Fi', 'Colazione', 'Parcheggio', 'Piscina', 'Spa', 'Ristorante', 'Bar'],
    images: [
      'https://images.pexels.com/photos/261169/pexels-photo-261169.jpeg',
      'https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg',
      'https://images.pexels.com/photos/3201763/pexels-photo-3201763.jpeg'
    ]
  }
];

// Mock Popular Properties
export const mockPopularProperties: Property[] = mockProperties.slice(0, 4);

// Mock Featured Destinations
export const mockFeaturedDestinations = [
  {
    id: '1',
    location: 'Roma',
    properties: 243,
    image: 'https://images.pexels.com/photos/532263/pexels-photo-532263.jpeg'
  },
  {
    id: '2',
    location: 'Firenze',
    properties: 186,
    image: 'https://images.pexels.com/photos/4179480/pexels-photo-4179480.jpeg'
  },
  {
    id: '3',
    location: 'Venezia',
    properties: 127,
    image: 'https://images.pexels.com/photos/5007530/pexels-photo-5007530.jpeg'
  },
  {
    id: '4',
    location: 'Milano',
    properties: 315,
    image: 'https://images.pexels.com/photos/10839762/pexels-photo-10839762.jpeg'
  },
  {
    id: '5',
    location: 'Napoli',
    properties: 158,
    image: 'https://images.pexels.com/photos/4388165/pexels-photo-4388165.jpeg'
  },
  {
    id: '6',
    location: 'Amalfi',
    properties: 92,
    image: 'https://images.pexels.com/photos/5259954/pexels-photo-5259954.jpeg'
  }
];

// Mock Bookings
export const mockBookings: Booking[] = [
  {
    id: '1001',
    propertyId: '1',
    userId: '1',
    checkIn: '2025-07-15',
    checkOut: '2025-07-20',
    guests: 2,
    totalPrice: 750,
    status: 'confirmed',
    createdAt: '2025-05-10T14:30:00Z',
    property: mockProperties.find(p => p.id === '1')
  },
  {
    id: '1002',
    propertyId: '3',
    userId: '1',
    checkIn: '2025-08-05',
    checkOut: '2025-08-10',
    guests: 1,
    totalPrice: 150,
    status: 'pending',
    createdAt: '2025-06-20T09:15:00Z',
    property: mockProperties.find(p => p.id === '3')
  },
  {
    id: '1003',
    propertyId: '5',
    userId: '1',
    checkIn: '2025-09-12',
    checkOut: '2025-09-15',
    guests: 2,
    totalPrice: 360,
    status: 'cancelled',
    createdAt: '2025-07-05T11:45:00Z',
    property: mockProperties.find(p => p.id === '5')
  },
  {
    id: '1004',
    propertyId: '2',
    userId: '1',
    checkIn: '2024-11-20',
    checkOut: '2024-11-25',
    guests: 3,
    totalPrice: 475,
    status: 'confirmed',
    createdAt: '2024-10-01T16:20:00Z',
    property: mockProperties.find(p => p.id === '2')
  }
];