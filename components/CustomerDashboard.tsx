'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Vendor, Product, Order, Offer, Customer } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Store, ShoppingCart, MessageCircle, LogOut, Search, Phone, Heart, Tag, User, Package, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CustomerDashboardProps {
  customer: Customer;
}

const CATEGORIES = ['All', 'Grocery', 'Food & Restaurant', 'Taxi & Transport', 'Tailor & Clothing', 'Electronics', 'Hardware', 'Pharmacy', 'Beauty & Salon'];

export default function CustomerDashboard({ customer }: CustomerDashboardProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);

  useEffect(() => {
    loadVendors();
    loadOrders();
    loadOffers();
    loadFavorites();
  }, [user]);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm, categoryFilter]);

  const loadVendors = async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_online', true)
      .order('rating', { ascending: false });

    if (!error && data) setVendors(data);
  };

  const loadOrders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        vendors (
          shop_name,
          category
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data);
  };

  const loadOffers = async () => {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        vendors (
          shop_name,
          category
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) setOffers(data);
  };

  const loadFavorites = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('favorite_vendors')
      .select('vendor_id')
      .eq('customer_id', user.id);

    if (!error && data) setFavorites(data.map(f => f.vendor_id));
  };

  const filterVendors = () => {
    let filtered = vendors;

    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(v => v.category === categoryFilter);
    }

    setFilteredVendors(filtered);
  };

  const handleVendorClick = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('is_available', true);

    if (!error && data) {
      setVendorProducts(data);
      setIsVendorDialogOpen(true);
    }
  };

  const toggleFavorite = async (vendorId: string) => {
    if (!user) return;

    if (favorites.includes(vendorId)) {
      const { error } = await supabase
        .from('favorite_vendors')
        .delete()
        .eq('customer_id', user.id)
        .eq('vendor_id', vendorId);

      if (!error) {
        setFavorites(favorites.filter(id => id !== vendorId));
        toast({ title: 'Removed from favorites' });
      }
    } else {
      const { error } = await supabase
        .from('favorite_vendors')
        .insert({ customer_id: user.id, vendor_id: vendorId });

      if (!error) {
        setFavorites([...favorites, vendorId]);
        toast({ title: 'Added to favorites' });
      }
    }
  };

  const handleLogout = () => {
    signOut();
    router.push('/');
  };

  const recentOrders = orders.slice(0, 5);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12 border-2 border-blue-500">
                <AvatarImage src={customer.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {customer.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{customer.name}</h1>
                <p className="text-sm text-gray-600">{customer.saved_address}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLogout} className="border-blue-200 hover:bg-blue-50">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-blue-200 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-gray-600">Pending Orders</CardDescription>
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
              <CardTitle className="text-4xl text-orange-600 font-bold">{pendingOrders}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-blue-200 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-gray-600">Total Orders</CardDescription>
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <CardTitle className="text-4xl text-blue-600 font-bold">{orders.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-blue-200 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-gray-600">Favorite Vendors</CardDescription>
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <CardTitle className="text-4xl text-red-600 font-bold">{favorites.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="vendors" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-blue-100">
            <TabsTrigger value="vendors" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Store className="w-4 h-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <ShoppingCart className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Tag className="w-4 h-4" />
              Offers
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Heart className="w-4 h-4" />
              Favorites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendors">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-700">Discover Nearby Vendors</CardTitle>
                <CardDescription>Browse local businesses in your area</CardDescription>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search vendors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVendors.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No vendors found</p>
                    </div>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <Card key={vendor.id} className="border-blue-100 hover:shadow-lg transition-all duration-300 cursor-pointer">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-800">{vendor.shop_name}</h3>
                              <Badge className="mt-1 bg-blue-100 text-blue-700">{vendor.category}</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(vendor.id);
                              }}
                              className="hover:bg-blue-50"
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  favorites.includes(vendor.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                                }`}
                              />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{vendor.description}</p>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium text-gray-700">{vendor.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-gray-500">{vendor.total_orders} orders</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">{vendor.location_address || 'Near you'}</span>
                          </div>
                          <Button
                            onClick={() => handleVendorClick(vendor)}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          >
                            View Products
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-700">Order History</CardTitle>
                <CardDescription>Track your orders and delivery status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No orders yet. Start shopping!</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <Card key={order.id} className="border-blue-100 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-bold text-lg text-gray-800">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-sm text-gray-600">Vendor: {order.vendors?.shop_name}</p>
                              <p className="text-sm text-gray-600">Category: {order.vendors?.category}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(order.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                order.status === 'pending' ? 'default' :
                                order.status === 'accepted' ? 'secondary' :
                                order.status === 'completed' ? 'default' : 'destructive'
                              }
                              className={
                                order.status === 'completed' ? 'bg-green-600' :
                                order.status === 'accepted' ? 'bg-blue-600' :
                                order.status === 'pending' ? 'bg-orange-600' : ''
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-xl font-bold text-blue-600">₹{order.total_amount}</div>
                          {order.delivery_address && (
                            <div className="flex items-start gap-2 mt-3">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                              <p className="text-sm text-gray-600">{order.delivery_address}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-700">Special Offers & Deals</CardTitle>
                <CardDescription>Save more with exclusive discounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offers.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No active offers at the moment</p>
                    </div>
                  ) : (
                    offers.map((offer) => (
                      <Card key={offer.id} className="border-blue-100 hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-800">{offer.title}</h3>
                              <p className="text-sm text-blue-600 font-medium">{(offer as any).vendors?.shop_name}</p>
                            </div>
                            <Badge className="bg-blue-600 text-white text-lg">
                              {offer.discount_percentage}% OFF
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{offer.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Valid until: {new Date(offer.valid_until || '').toLocaleDateString()}
                            </span>
                            <Badge variant="outline" className="border-blue-300">
                              {(offer as any).vendors?.category}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-700">My Favorite Vendors</CardTitle>
                <CardDescription>Quick access to your preferred vendors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No favorite vendors yet</p>
                    </div>
                  ) : (
                    vendors
                      .filter(v => favorites.includes(v.id))
                      .map((vendor) => (
                        <Card key={vendor.id} className="border-blue-100 hover:shadow-lg transition-all duration-300">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-800">{vendor.shop_name}</h3>
                                <Badge className="mt-1 bg-blue-100 text-blue-700">{vendor.category}</Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFavorite(vendor.id)}
                                className="hover:bg-blue-50"
                              >
                                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-1 mb-3">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium text-gray-700">{vendor.rating.toFixed(1)}</span>
                            </div>
                            <Button
                              onClick={() => handleVendorClick(vendor)}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            >
                              Order Now
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-blue-700">{selectedVendor?.shop_name}</DialogTitle>
            <DialogDescription>{selectedVendor?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {vendorProducts.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-8">No products available</p>
            ) : (
              vendorProducts.map((product) => (
                <Card key={product.id} className="border-blue-100">
                  <CardContent className="pt-4">
                    <h4 className="font-bold text-gray-800">{product.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                      <Badge variant="outline" className="border-blue-300">
                        Stock: {product.stock_quantity}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
