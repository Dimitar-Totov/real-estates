export type UserRole = 'user' | 'admin' | 'agent';

export type PropertyType = 'house' | 'apartment' | 'condo' | 'townhouse' | 'land' | 'commercial';
export type PropertyStatus = 'for_sale' | 'for_rent' | 'sold' | 'rented';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  officePhone: string | null;
  mobilePhone: string | null;
  contactEmail: string | null;
}

export interface Property {
  id: number;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: string;           // numeric → string from Drizzle
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: string | null; // numeric → string from Drizzle
  lotSize: string | null;    // numeric → string from Drizzle
  yearBuilt: number | null;
  garage: boolean | null;
  pool: boolean | null;
  description: string | null;
  images: string[] | null;
  listedByAgentId: number | null;
  createdAt: string;
}

export interface Agent {
  id: number;
  userId: number;
  name: string;
  specialty: string | null;
  city: string | null;
  image: string | null;
  rating: number | null;
  reviews: number | null;
  experience: number | null;
  phone: string | null;
  email: string | null;
}

export interface AgentReview {
  id: number;
  agentId: number;
  userId: number;
  rating: number;
  comment: string | null;
  username: string;
  createdAt: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  subject: string;
  message: string;
  sentAt: string;
  seenAt: string | null;
}

export interface PropertyVisiting {
  id: number;
  userId: number;
  propertyId: number;
  visitDate: string;
  hour: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
}

export interface CreatePropertyPayload {
  title: string;
  type: string;
  status: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  garage?: boolean;
  pool?: boolean;
  description?: string;
  images?: string[];
  agentId?: number;
}
