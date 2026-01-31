import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; type?: 'duplicate' } | null>(null);
  const router = useRouter();

  // Check if an email was passed from the home page
  useEffect(() => {
    if (router.query.email) {
      setFormData(prev => ({ ...prev, email: router.query.email as string }));
    }
  }, [router.query]);

  const validateFullName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2;
  };

  const validatePassword = (pass: string) => {
    // At least 8 characters, one uppercase, one number
    const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!validateFullName(formData.fullName)) {
      setError({ message: 'Please enter your full name (at least two names).' });
      return;
    }

    if (!validatePassword(formData.password)) {
      setError({ message: 'Password must be at least 8 characters long and include at least one uppercase letter and one number.' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError({ message: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create account in your system
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await signupRes.json();

      if (!signupRes.ok) {
        if (data.error === 'User already exists' || signupRes.status === 409) {
          setError({ message: 'You already have an account.', type: 'duplicate' });
        } else {
          setError({ message: data.error || data.message || 'Signup failed' });
        }
        setIsSubmitting(false);
        return;
      }

      // Success! Redirect to login with email pre-filled
      router.push(`/login?email=${encodeURIComponent(formData.email)}&signedup=true`);

    } catch (error) {
      console.error('Signup error:', error);
      setError({ message: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <Link href="/" className="group transition-transform hover:scale-105">
            <div className="w-56 h-36 overflow-hidden rounded-2xl mx-auto mb-2">
              <img src="/logo.jpg" alt="PulseAI" className="w-full h-auto -translate-y-[5%] scale-110 brightness-110" />
            </div>
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-gray-600">Join PulseAI for job matching</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`p-4 border rounded-xl text-sm font-medium ${error.type === 'duplicate' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                {error.message}
                {error.type === 'duplicate' && (
                  <Link href={`/login?email=${encodeURIComponent(formData.email)}`} className="ml-2 font-bold underline">
                    Login here
                  </Link>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="+1 234 567 890"
                  value={formData.phone}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
