import { supabase, UserRole, AuthUser, Vendor, Customer } from './supabase';

export interface SignUpData {
  mobile: string;
  password: string;
  role: UserRole;
  email?: string;
  name?: string;
  shop_name?: string;
  category?: string;
  description?: string;
  business_type?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
}

export interface AuthResponse {
  user: AuthUser;
  profile: Vendor | Customer;
  token: string;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signUp(data: SignUpData): Promise<AuthResponse> {
  const passwordHash = await hashPassword(data.password);

  const { data: authUser, error: authError } = await supabase
    .from('auth_users')
    .insert({
      mobile: data.mobile,
      email: data.email,
      password_hash: passwordHash,
      role: data.role,
      is_active: true,
    })
    .select()
    .single();

  if (authError) throw new Error(authError.message);

  if (data.role === 'vendor') {
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        id: authUser.id,
        shop_name: data.shop_name || 'New Shop',
        category: data.category || 'General',
        description: data.description,
        business_type: data.business_type,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        location_address: data.location_address,
        is_online: false,
        rating: 0,
        total_orders: 0,
        total_sales: 0,
        active_customers: 0,
      })
      .select()
      .single();

    if (vendorError) throw new Error(vendorError.message);

    const token = generateToken(authUser);
    return { user: authUser, profile: vendor, token };
  } else {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        id: authUser.id,
        name: data.name || 'New Customer',
        saved_address: data.location_address,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        language_preference: 'en',
      })
      .select()
      .single();

    if (customerError) throw new Error(customerError.message);

    const token = generateToken(authUser);
    return { user: authUser, profile: customer, token };
  }
}

export async function signIn(mobile: string, password: string): Promise<AuthResponse> {
  const passwordHash = await hashPassword(password);

  const { data: authUser, error: authError } = await supabase
    .from('auth_users')
    .select('*')
    .eq('mobile', mobile)
    .eq('password_hash', passwordHash)
    .eq('is_active', true)
    .maybeSingle();

  if (authError || !authUser) {
    throw new Error('Invalid credentials');
  }

  let profile: Vendor | Customer;

  if (authUser.role === 'vendor') {
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (vendorError) throw new Error(vendorError.message);
    profile = vendor;
  } else {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (customerError) throw new Error(customerError.message);
    profile = customer;
  }

  const token = generateToken(authUser);
  return { user: authUser, profile, token };
}

export async function getCurrentUser(userId: string): Promise<{ user: AuthUser; profile: Vendor | Customer } | null> {
  const { data: authUser, error: authError } = await supabase
    .from('auth_users')
    .select('*')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (authError || !authUser) return null;

  let profile: Vendor | Customer;

  if (authUser.role === 'vendor') {
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (vendorError) return null;
    profile = vendor;
  } else {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (customerError) return null;
    profile = customer;
  }

  return { user: authUser, profile };
}

function generateToken(user: AuthUser): string {
  return btoa(JSON.stringify({
    id: user.id,
    mobile: user.mobile,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  }));
}

export function decodeToken(token: string): any {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}
