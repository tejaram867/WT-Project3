import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'vendor' | 'customer';

export interface AuthUser {
  id: string;
  email?: string;
  mobile: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  shop_name: string;
  category: string;
  description?: string;
  profile_image?: string;
  business_type?: string;
  contact_info?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  is_online: boolean;
  rating: number;
  total_orders: number;
  total_sales: number;
  active_customers: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  profile_image?: string;
  saved_address?: string;
  location_lat?: number;
  location_lng?: number;
  preferences?: any;
  language_preference: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  category?: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  vendor_id: string;
  customer_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  total_amount: number;
  items: any[];
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  discount_percentage?: number;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

export interface Chat {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface FavoriteVendor {
  id: string;
  customer_id: string;
  vendor_id: string;
  created_at: string;
}
