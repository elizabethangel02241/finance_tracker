import { useState, useEffect } from 'react';
import { User, Bell, Lock, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    setProfile(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Profile</h3>
              <p className="text-sm text-gray-500">Your account information</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                {profile?.full_name || 'Not set'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                {profile?.email || user?.email || 'Not set'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                {profile?.currency || 'INR'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <div className="px-4 py-3 bg-emerald-50 rounded-lg text-emerald-700 font-medium capitalize">
                {profile?.plan_type || 'Free'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <Bell className="text-amber-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Notifications</h3>
                <p className="text-sm text-gray-500">Manage alert preferences</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Budget alerts</span>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Transaction alerts</span>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Goal reminders</span>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <Lock className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Security</h3>
                <p className="text-sm text-gray-500">Protect your account</p>
              </div>
            </div>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition">
                Change password
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition">
                Enable two-factor authentication
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Database className="text-gray-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Data Management</h3>
            <p className="text-sm text-gray-500">Export or delete your data</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">
            Export Data
          </button>
          <button className="px-6 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
