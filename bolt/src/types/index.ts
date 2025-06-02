export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

export interface Property {
  id: string;
  name: string;
  type: 'hotel' | 'hostel' | 'apartment';
  location: string;
  address: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  amenities: string[];
  images: string[];
}

export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface SearchFilters {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string[];
  amenities?: string[];
  rating?: number;
}