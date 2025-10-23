'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Product, Order, Offer, Vendor, Chat } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Plus, Package, ShoppingCart, MessageCircle, LogOut, TrendingUp, BarChart, Tag, DollarSign, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface VendorDashboardProps {
  vendor: Vendor;
}

export default function VendorDashboard({ vendor: initialVendor }: VendorDashboardProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor>(initialVendor);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
  });
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    discount_percentage: '',
    valid_until: '',
  });

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadOffers();
    loadChats();
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setProducts(data);
  };

  const loadOrders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          name,
          saved_address
        )
      `)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data);
  };

  const loadOffers = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setOffers(data);
  };

  const loadChats = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        sender:sender_id (id, mobile),
        receiver:receiver_id (id, mobile)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) setChats(data);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data, error } = await supabase
      .from('products')
      .insert({
        vendor_id: user.id,
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        stock_quantity: parseInt(newProduct.stock_quantity) || 0,
        is_available: true,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setProducts([data, ...products]);
    toast({
      title: 'Success',
      description: 'Product added successfully',
    });
    setIsAddProductOpen(false);
    setNewProduct({ name: '', description: '', price: '', category: '', stock_quantity: '' });
  };

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { data, error } = await supabase
      .from('offers')
      .insert({
        vendor_id: user.id,
        title: newOffer.title,
        description: newOffer.description,
        discount_percentage: parseFloat(newOffer.discount_percentage),
        valid_until: newOffer.valid_until,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setOffers([data, ...offers]);
    toast({
      title: 'Success',
      description: 'Offer created successfully',
    });
    setIsAddOfferOpen(false);
    setNewOffer({ title: '', description: '', discount_percentage: '', valid_until: '' });
  };

  const toggleProductAvailability = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !currentStatus })
      .eq('id', productId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setProducts(products.map(p =>
      p.id === productId ? { ...p, is_available: !currentStatus } : p
    ));
    toast({
      title: 'Success',
      description: 'Product availability updated',
    });
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setOrders(orders.map(o =>
      o.id === orderId ? { ...o, status } : o
    ));
    toast({
      title: 'Success',
      description: `Order ${status}`,
    });

    if (status === 'completed') {
      await supabase
        .from('vendors')
        .update({
          total_orders: vendor.total_orders + 1,
          total_sales: vendor.total_sales + (orders.find(o => o.id === orderId)?.total_amount || 0),
        })
        .eq('id', user!.id);
    }
  };

  const toggleOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('vendors')
      .update({ is_online: isOnline })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setVendor({ ...vendor, is_online: isOnline });
    toast({
      title: 'Success',
      description: `You are now ${isOnline ? 'online' : 'offline'}`,
    });
  };

  const handleLogout = () => {
    signOut();
    router.push('/');
  };

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const activeOrders = orders.filter(o => o.status === 'accepted').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <nav className="bg-white border-b border-green-100 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12 border-2 border-green-500">
                <AvatarImage src={vendor.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  {vendor.shop_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{vendor.shop_name}</h1>
                <p className="text-sm text-gray-600">{vendor.category}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-700 font-medium">Status:</span>
                <Switch
                  checked={vendor.is_online}
                  onCheckedChange={toggleOnlineStatus}
                />
                <span className={`text-sm font-semibold ${vendor.is_online ? 'text-green-600' : 'text-gray-400'}`}>
                  {vendor.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
              <Button variant="outline" onClick={handleLogout} className="border-green-200 hover:bg-green-50">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-green-200 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-gray-600">Pending Orders</CardDescription>
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
              <CardTitle className="text-4xl text-orange-600 font-bold">{pendingOrders}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-200 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-gray-600">Total Orders</CardDescription>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <CardTitle className="text-4xl text-blue-600 font-bold">{vendor.total_orders}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-200 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-gray-600">Total Sales</CardDescription>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <CardTitle className="text-4xl text-green-600 font-bold">₹{vendor.total_sales.toFixed(0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-green-200 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-gray-600">Active Customers</CardDescription>
                <Users className="w-5 h-5 text-teal-500" />
              </div>
              <CardTitle className="text-4xl text-teal-600 font-bold">{vendor.active_customers}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-green-100">
            <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <ShoppingCart className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Package className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Tag className="w-4 h-4" />
              Offers
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <MessageCircle className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <BarChart className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Order Management</CardTitle>
                <CardDescription>View and manage customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No orders yet</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <Card key={order.id} className="border-green-100 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-bold text-lg text-gray-800">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-sm text-gray-600">Customer: {order.customers?.name}</p>
                              <p className="text-sm text-gray-600">Address: {order.customers?.saved_address || order.delivery_address}</p>
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
                          <div className="text-xl font-bold text-green-600 mb-4">₹{order.total_amount}</div>
                          {order.notes && (
                            <p className="text-sm text-gray-600 mb-4 italic">Note: {order.notes}</p>
                          )}
                          {order.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'accepted')}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Accept Order
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateOrderStatus(order.id, 'rejected')}
                              >
                                Reject Order
                              </Button>
                            </div>
                          )}
                          {order.status === 'accepted' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark as Completed
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-700">Inventory Management</CardTitle>
                    <CardDescription>Add and manage your products</CardDescription>
                  </div>
                  <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>Add a new product to your inventory</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddProduct} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-name">Product Name *</Label>
                          <Input
                            id="product-name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="product-price">Price (₹) *</Label>
                            <Input
                              id="product-price"
                              type="number"
                              step="0.01"
                              value={newProduct.price}
                              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="product-stock">Stock Quantity *</Label>
                            <Input
                              id="product-stock"
                              type="number"
                              value={newProduct.stock_quantity}
                              onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-category">Category</Label>
                          <Input
                            id="product-category"
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-description">Description</Label>
                          <Textarea
                            id="product-description"
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-700">
                          Add Product
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No products yet. Add your first product!</p>
                    </div>
                  ) : (
                    products.map((product) => (
                      <Card key={product.id} className="border-green-100 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                              <div className="flex items-center gap-3 mt-3">
                                <span className="text-green-600 font-bold text-lg">₹{product.price}</span>
                                {product.category && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">{product.category}</Badge>
                                )}
                                <Badge variant="outline">Stock: {product.stock_quantity}</Badge>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={product.is_available}
                                  onCheckedChange={() => toggleProductAvailability(product.id, product.is_available)}
                                />
                                <span className={`text-sm font-medium ${product.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                                  {product.is_available ? 'Available' : 'Unavailable'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <Card className="border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-700">Offers & Discounts</CardTitle>
                    <CardDescription>Create special deals for customers</CardDescription>
                  </div>
                  <Dialog open={isAddOfferOpen} onOpenChange={setIsAddOfferOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Offer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Offer</DialogTitle>
                        <DialogDescription>Add a special discount or promotion</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddOffer} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="offer-title">Offer Title *</Label>
                          <Input
                            id="offer-title"
                            value={newOffer.title}
                            onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                            placeholder="e.g., Weekend Special"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="offer-description">Description *</Label>
                          <Textarea
                            id="offer-description"
                            value={newOffer.description}
                            onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                            placeholder="Describe the offer details"
                            rows={3}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="offer-discount">Discount % *</Label>
                            <Input
                              id="offer-discount"
                              type="number"
                              step="0.1"
                              value={newOffer.discount_percentage}
                              onChange={(e) => setNewOffer({ ...newOffer, discount_percentage: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="offer-valid">Valid Until *</Label>
                            <Input
                              id="offer-valid"
                              type="date"
                              value={newOffer.valid_until}
                              onChange={(e) => setNewOffer({ ...newOffer, valid_until: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-700">
                          Create Offer
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {offers.length === 0 ? (
                    <div className="text-center py-12">
                      <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No offers yet. Create your first offer!</p>
                    </div>
                  ) : (
                    offers.map((offer) => (
                      <Card key={offer.id} className="border-green-100 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-800">{offer.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                              <div className="flex items-center gap-3 mt-3">
                                <Badge className="bg-green-600 text-white">
                                  {offer.discount_percentage}% OFF
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Valid until: {new Date(offer.valid_until || '').toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Badge variant={offer.is_active ? 'default' : 'secondary'} className={offer.is_active ? 'bg-green-600' : ''}>
                              {offer.is_active ? 'Active' : 'Inactive'}
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

          <TabsContent value="messages">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Customer Messages</CardTitle>
                <CardDescription>Chat with your customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chats.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  ) : (
                    chats.map((chat) => (
                      <Card key={chat.id} className="border-green-100">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-green-100 text-green-700">
                                {chat.sender_id === user?.id ? 'ME' : 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {chat.sender_id === user?.id ? 'You' : 'Customer'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(chat.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{chat.message}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Business Analytics</CardTitle>
                <CardDescription>Track your performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-green-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Products</p>
                          <p className="text-3xl font-bold text-gray-800">{products.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Orders</p>
                          <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                          <BarChart className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Average Rating</p>
                          <p className="text-3xl font-bold text-gray-800">{vendor.rating.toFixed(1)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Success Rate</p>
                          <p className="text-3xl font-bold text-gray-800">
                            {orders.length > 0 ? ((completedOrders / orders.length) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
