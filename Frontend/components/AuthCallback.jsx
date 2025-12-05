import React, { useEffect } from 'react';
import { Loader } from 'lucide-react';

const AuthCallback = () => {
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const error = params.get('error');

      if (error) {
        console.error('OAuth error:', error);
        alert('Authentication failed. Please try again.');
        window.location.href = '/';
        return;
      }

      if (token) {
        try {
          // Store token in localStorage
          localStorage.setItem('token', token);
          
          // Redirect to main app - AuthContext will auto-load user
          window.location.href = '/';
        } catch (err) {
          console.error('Failed to store token:', err);
          alert('Authentication failed. Please try again.');
          window.location.href = '/';
        }
      } else {
        // No token, redirect to home
        window.location.href = '/';
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-300 text-lg">Completing sign in...</p>
        <p className="text-slate-500 text-sm mt-2">Please wait</p>
      </div>
    </div>
  );
};

export default AuthCallback;
