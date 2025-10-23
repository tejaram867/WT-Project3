'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Store, Lock, Phone, Mail, MapPin, FileText } from 'lucide-react';

const CATEGORIES = [
  'Grocery',
  'Food & Restaurant',
  'Taxi & Transport',
  'Tailor & Clothing',
  'Electronics',
  'Hardware',
  'Pharmacy',
  'Beauty & Salon',
  'Home Services',
  'Other',
];

export default function VendorSignup() {
  const [formData, setFormData] = useState({
    mobile: '',
    password: '',
    email: '',
    shop_name: '',
    category: '',
    description: '',
    location_address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp({
        ...formData,
        role: 'vendor',
      });
      router.push('/vendor/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 p-4 py-12">
      <Card className="w-full max-w-2xl shadow-2xl border-green-100 hover:shadow-green-200/50 transition-all duration-300">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-700">Join as Vendor</CardTitle>
          <CardDescription className="text-gray-600">
            Create your business account and start selling
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shop_name" className="text-gray-700 font-medium">
                  Shop Name *
                </Label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="shop_name"
                    placeholder="Your Shop Name"
                    value={formData.shop_name}
                    onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-700 font-medium">
                  Business Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                    <SelectValue placeholder="Select category" />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-gray-700 font-medium">
                  Mobile Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+1234567890"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email (Optional)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_address" className="text-gray-700 font-medium">
                Shop Address *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="location_address"
                  placeholder="123 Main St, City"
                  value={formData.location_address}
                  onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700 font-medium">
                Description (Optional)
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="description"
                  placeholder="Tell customers about your business"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Vendor Account'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/vendor-login" className="text-green-600 hover:text-green-700 font-semibold hover:underline">
                Sign In
              </Link>
            </div>

            <div className="text-center text-sm text-gray-500">
              Want to sign up as a customer?{' '}
              <Link href="/customer-signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                Customer Signup
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
