'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const errorParam = searchParams.get('error');

        // Check for errors
        if (errorParam) {
          setError(errorParam);
          setLoading(false);
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }

        // Check if we have token and user data
        if (token && userParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userParam));
            
            // Store token and user data
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Redirect based on user role
            const userRole = userData?.role?.toLowerCase?.() || userData?.role;
            setTimeout(() => {
              if (userRole === 'admin' || userRole === 'moderator') {
                router.push('/admin/dashboard');
              } else {
                router.push('/user/dashboard/create');
              }
            }, 100);
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            setError('Failed to process authentication data');
            setLoading(false);
            setTimeout(() => {
              router.push('/login');
            }, 3000);
          }
        } else {
          setError('Missing authentication data');
          setLoading(false);
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        setLoading(false);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5CFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5CFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

