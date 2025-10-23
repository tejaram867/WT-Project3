'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Store, Lock, Phone } from 'lucide-react';

export default function VendorLogin() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(mobile, password);
      router.push('/vendor/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-green-100 hover:shadow-green-200/50 transition-all duration-300">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-700">Vendor Login</CardTitle>
          <CardDescription className="text-gray-600">
            Access your business dashboard and manage your shop
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-gray-700 font-medium">
                Mobile Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="+1234567890"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
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
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/vendor-signup" className="text-green-600 hover:text-green-700 font-semibold hover:underline">
                Create Vendor Account
              </Link>
            </div>

            <div className="text-center text-sm text-gray-500">
              Are you a customer?{' '}
              <Link href="/customer-login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                Customer Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
