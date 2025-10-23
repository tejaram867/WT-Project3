/*
  # Grow Community App - Complete Database Schema

  ## Overview
  This migration creates a comprehensive database structure for the Grow Community App with 
  separate role-based authentication and functionality for vendors and customers.

  ## 1. New Tables

  ### auth_users
  Base authentication table for all users (both vendors and customers)
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email address
  - `mobile` (text, unique, required) - Primary login credential
  - `password_hash` (text, required) - Hashed password
  - `role` (text, required) - User role: 'vendor' or 'customer'
  - `is_active` (boolean) - Account active status
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### vendors
  Vendor-specific profile and business information
  - `id` (uuid, primary key) - Links to auth_users.id
  - `shop_name` (text, required) - Business/shop name
  - `category` (text, required) - Business category (Grocery, Taxi, Tailor, Food, etc.)
  - `description` (text) - Business description
  - `profile_image` (text) - Profile photo URL
  - `business_type` (text) - Type of business
  - `contact_info` (text) - Additional contact details
  - `location_lat` (numeric) - GPS latitude
  - `location_lng` (numeric) - GPS longitude
  - `location_address` (text) - Physical address
  - `is_online` (boolean) - Current online status
  - `rating` (numeric) - Average rating (0-5)
  - `total_orders` (integer) - Total completed orders
  - `total_sales` (numeric) - Total sales amount
  - `active_customers` (integer) - Number of active customers
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### customers
  Customer-specific profile and preferences
  - `id` (uuid, primary key) - Links to auth_users.id
  - `name` (text, required) - Customer full name
  - `profile_image` (text) - Profile photo URL
  - `saved_address` (text) - Default delivery address
  - `location_lat` (numeric) - GPS latitude
  - `location_lng` (numeric) - GPS longitude
  - `preferences` (jsonb) - Customer preferences (dietary, interests, etc.)
  - `language_preference` (text) - Preferred language
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### products
  Vendor inventory management
  - `id` (uuid, primary key) - Product identifier
  - `vendor_id` (uuid, foreign key) - References vendors.id
  - `name` (text, required) - Product/service name
  - `description` (text) - Product description
  - `price` (numeric, required) - Product price
  - `image_url` (text) - Product image URL
  - `category` (text) - Product category
  - `is_available` (boolean) - Current availability
  - `stock_quantity` (integer) - Available quantity
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### orders
  Order management and tracking
  - `id` (uuid, primary key) - Order identifier
  - `vendor_id` (uuid, foreign key) - References vendors.id
  - `customer_id` (uuid, foreign key) - References customers.id
  - `status` (text, required) - Order status: 'pending', 'accepted', 'rejected', 'completed', 'cancelled'
  - `total_amount` (numeric, required) - Total order amount
  - `items` (jsonb, required) - Order items array
  - `delivery_address` (text) - Delivery address
  - `delivery_lat` (numeric) - Delivery GPS latitude
  - `delivery_lng` (numeric) - Delivery GPS longitude
  - `notes` (text) - Customer notes
  - `created_at` (timestamptz) - Order creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### offers
  Vendor promotions and discounts
  - `id` (uuid, primary key) - Offer identifier
  - `vendor_id` (uuid, foreign key) - References vendors.id
  - `title` (text, required) - Offer title
  - `description` (text, required) - Offer details
  - `discount_percentage` (numeric) - Discount percentage
  - `valid_until` (timestamptz) - Offer expiration date
  - `is_active` (boolean) - Offer active status
  - `created_at` (timestamptz) - Creation timestamp

  ### chats
  Real-time messaging between vendors and customers
  - `id` (uuid, primary key) - Message identifier
  - `sender_id` (uuid, foreign key) - References auth_users.id
  - `receiver_id` (uuid, foreign key) - References auth_users.id
  - `message` (text, required) - Message content
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz) - Message timestamp

  ### favorite_vendors
  Customer's saved favorite vendors
  - `id` (uuid, primary key) - Favorite record identifier
  - `customer_id` (uuid, foreign key) - References customers.id
  - `vendor_id` (uuid, foreign key) - References vendors.id
  - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security (Row Level Security)

  ### RLS Policies
  All tables have RLS enabled with restrictive policies:
  
  - **auth_users**: Users can only view and update their own profile
  - **vendors**: Public can view vendors, vendors can manage their own profile
  - **customers**: Public can view customers, customers can manage their own profile
  - **products**: Public can view, vendors can manage their own products
  - **orders**: Vendors and customers can view/manage their own orders
  - **offers**: Public can view, vendors can manage their own offers
  - **chats**: Users can view messages they sent or received
  - **favorite_vendors**: Customers can manage their own favorites

  ## 3. Indexes
  Performance indexes on frequently queried columns:
  - auth_users: mobile, email
  - vendors: category, location (lat/lng)
  - products: vendor_id, category
  - orders: vendor_id, customer_id, status
  - chats: sender_id, receiver_id

  ## 4. Important Notes
  - All tables use UUID for primary keys
  - Timestamps use timestamptz for timezone awareness
  - Foreign keys ensure referential integrity
  - Cascading deletes protect data consistency
  - RLS ensures data security at database level
*/

-- Create auth_users table
CREATE TABLE IF NOT EXISTS auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  mobile text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('vendor', 'customer')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  shop_name text NOT NULL,
  category text NOT NULL,
  description text,
  profile_image text,
  business_type text,
  contact_info text,
  location_lat numeric,
  location_lng numeric,
  location_address text,
  is_online boolean DEFAULT false,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_orders integer DEFAULT 0,
  total_sales numeric DEFAULT 0,
  active_customers integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  profile_image text,
  saved_address text,
  location_lat numeric,
  location_lng numeric,
  preferences jsonb DEFAULT '{}',
  language_preference text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  image_url text,
  category text,
  is_available boolean DEFAULT true,
  stock_quantity integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  items jsonb NOT NULL DEFAULT '[]',
  delivery_address text,
  delivery_lat numeric,
  delivery_lng numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  discount_percentage numeric CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create favorite_vendors table
CREATE TABLE IF NOT EXISTS favorite_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, vendor_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_mobile ON auth_users(mobile);
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_location ON vendors(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_chats_sender ON chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_receiver ON chats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_offers_vendor ON offers(vendor_id);

-- Enable Row Level Security
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_vendors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auth_users
CREATE POLICY "Users can view own profile"
  ON auth_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON auth_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for vendors
CREATE POLICY "Anyone can view vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can insert own profile"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for customers
CREATE POLICY "Anyone can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can insert own profile"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can update own profile"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for products
CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  );

CREATE POLICY "Vendors can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  );

CREATE POLICY "Vendors can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  );

-- RLS Policies for orders
CREATE POLICY "Vendors can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  );

CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers WHERE customers.id = auth.uid() AND customers.id = customer_id
    )
  );

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers WHERE customers.id = auth.uid() AND customers.id = customer_id
    )
  );

CREATE POLICY "Vendors can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  );

CREATE POLICY "Customers can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers WHERE customers.id = auth.uid() AND customers.id = customer_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers WHERE customers.id = auth.uid() AND customers.id = customer_id
    )
  );

-- RLS Policies for offers
CREATE POLICY "Anyone can view active offers"
  ON offers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can create own offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  );

CREATE POLICY "Vendors can update own offers"
  ON offers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  );

CREATE POLICY "Vendors can delete own offers"
  ON offers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = auth.uid() AND vendors.id = vendor_id
    )
  );

-- RLS Policies for chats
CREATE POLICY "Users can view own messages"
  ON chats FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own received messages"
  ON chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- RLS Policies for favorite_vendors
CREATE POLICY "Customers can view own favorites"
  ON favorite_vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers WHERE customers.id = auth.uid() AND customers.id = customer_id
    )
  );

CREATE POLICY "Customers can add favorites"
  ON favorite_vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers WHERE customers.id = auth.uid() AND customers.id = customer_id
    )
  );

CREATE POLICY "Customers can remove favorites"
  ON favorite_vendors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers WHERE customers.id = auth.uid() AND customers.id = customer_id
    )
  );
