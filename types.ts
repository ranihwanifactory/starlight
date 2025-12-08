export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export interface JournalEntry {
  id?: string;
  title: string;
  date: string;
  location: string;
  coordinates?: { // Added for Map View
    lat: number;
    lng: number;
  };
  equipment: string;
  target: string;
  description: string;
  imageUrl?: string;
  observers: string;
  createdAt: number;
  userId: string;
  authorName: string;
  // Social Features
  likes?: string[]; // Array of user UIDs
  comments?: Comment[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  equipment?: string;
  region?: string;
  // Social Features
  followers?: string[];
  following?: string[];
}

export enum ViewState {
  HOME = 'HOME',
  MAP = 'MAP', // Added Map View
  CREATE = 'CREATE',
  DETAIL = 'DETAIL',
}