"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/component/Navbar';
import { User, Mail, Calendar, Camera, Save, Edit3, Shield } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
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
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
        });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setIsEditing(false);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('An error occurred while updating your profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setIsUploadingImage(true);
    setError('');

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await fetch('/api/user/update-profile-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUser(prev => ({ ...prev, profilePicture: data.profilePicture }));
        setMessage('Profile picture updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setError('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-gray-400">Manage your account information and preferences</p>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
              <p className="text-green-400 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Picture Section */}
            <div className="lg:col-span-1">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-6">Profile Picture</h2>

                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-purple-600/20 border-2 border-purple-400/50 overflow-hidden flex items-center justify-center">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={48} className="text-purple-400" />
                      )}
                    </div>

                    <button
                      onClick={triggerFileInput}
                      disabled={isUploadingImage}
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                    >
                      {isUploadingImage ? (
                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Camera size={24} className="text-white" />
                      )}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    onClick={triggerFileInput}
                    disabled={isUploadingImage}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Camera size={16} />
                    {isUploadingImage ? 'Uploading...' : 'Change Photo'}
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-2">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Personal Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit3 size={16} />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Member Since
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <Calendar size={16} />
                      </div>
                      <input
                        type="text"
                        value={new Date(user.createdAt).toLocaleDateString()}
                        disabled
                        className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-400 opacity-50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Security Section */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield size={18} />
                  Security
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Password</p>
                      <p className="text-xs text-gray-500">Last updated 30 days ago</p>
                    </div>
                    <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors">
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-500">Add an extra layer of security</p>
                    </div>
                    <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors">
                      Enable
                    </button>
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