"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/component/Navbar';
import { BarChart3, TrendingUp, Shield, Users, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const recentActivity = [
    { id: 1, type: 'verification', status: 'completed', title: 'Document Verification', time: '2 hours ago' },
    { id: 2, type: 'analysis', status: 'processing', title: 'Data Analysis Report', time: '4 hours ago' },
    { id: 3, type: 'verification', status: 'completed', title: 'Identity Check', time: '1 day ago' },
    { id: 4, type: 'team', status: 'completed', title: 'New Team Member Added', time: '2 days ago' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400">Monitor your verification activities and team performance</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
                <span className="text-2xl font-bold">1,247</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300">Total Verifications</p>
                <p className="text-xs text-green-400">↗ +12% from last month</p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Activity size={20} className="text-blue-400" />
                </div>
                <span className="text-2xl font-bold">94.7%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300">Success Rate</p>
                <p className="text-xs text-blue-400">↗ +2.3% from last month</p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-purple-400" />
                </div>
                <span className="text-2xl font-bold">2.3s</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300">Avg Response Time</p>
                <p className="text-xs text-purple-400">↘ -0.5s from last month</p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-orange-400" />
                </div>
                <span className="text-2xl font-bold">8</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300">Team Members</p>
                <p className="text-xs text-orange-400">→ No change</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Activity size={20} />
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        {activity.status === 'completed' ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : activity.status === 'processing' ? (
                          <Clock size={16} className="text-yellow-400" />
                        ) : (
                          <XCircle size={16} className="text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-300">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        activity.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        activity.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {activity.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={18} />
                  Performance
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Verification Speed</span>
                      <span className="text-green-400">95%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Accuracy Rate</span>
                      <span className="text-blue-400">94%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Team Efficiency</span>
                      <span className="text-purple-400">88%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield size={18} />
                  Security Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-sm text-gray-300">SSL Certificate Valid</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-sm text-gray-300">Two-Factor Authentication</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-sm text-gray-300">Data Encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}