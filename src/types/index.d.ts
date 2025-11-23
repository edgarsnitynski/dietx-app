// Basic TypeScript types for DietX
export interface User {
  uid?: string;
  email?: string;
  name?: string;
  role?: 'provider' | 'patient';
}

export interface Patient {
  id: string;
  name: string;
  createdAt: string;
  notes?: Array<{ id: string; text: string; date: string }>;
  measures?: Array<any>;
  anthropometry?: any;
  plans?: any[];
  goals?: string;
}
