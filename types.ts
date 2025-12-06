export interface JournalEntry {
  id?: string;
  title: string;
  date: string;
  location: string;
  equipment: string;
  target: string; // e.g., Jupiter, Orion Nebula
  description: string;
  imageUrl?: string;
  observers: string; // e.g., "Dad & Son"
  createdAt: number;
  userId: string;
  authorName: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  equipment?: string; // Added field
  region?: string;    // Added field
}

export enum ViewState {
  HOME = 'HOME',
  CREATE = 'CREATE',
  DETAIL = 'DETAIL',
}