'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Shield, Calendar, Heart, Search } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="grid gap-6">
          {/* User Info Card */}
          <div className="bg-card rounded-2xl shadow-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {user.name?.[0] || user.email?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{user.name || 'User'}</h2>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                {user.role === 'admin' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Administrator
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground mt-3">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Member since {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/favorites">
              <div className="bg-card rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Favorite Properties</p>
                    <p className="text-3xl font-bold mt-1">0</p>
                  </div>
                  <Heart className="w-10 h-10 text-primary/20" />
                </div>
              </div>
            </Link>

            <Link href="/properties">
              <div className="bg-card rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Saved Searches</p>
                    <p className="text-3xl font-bold mt-1">0</p>
                  </div>
                  <Search className="w-10 h-10 text-primary/20" />
                </div>
              </div>
            </Link>
          </div>

          {/* Actions */}
          <div className="bg-card rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
            <div className="space-y-3">
              <Link href="/settings/profile">
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between">
                  <span>Edit Profile</span>
                  <span className="text-muted-foreground">→</span>
                </button>
              </Link>
              <Link href="/settings/password">
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between">
                  <span>Change Password</span>
                  <span className="text-muted-foreground">→</span>
                </button>
              </Link>
              <Link href="/settings/notifications">
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between">
                  <span>Email Notifications</span>
                  <span className="text-muted-foreground">→</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}