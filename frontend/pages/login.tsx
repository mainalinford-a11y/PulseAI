import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Pre-fill email from query parameter
    useEffect(() => {
        if (router.query.email) {
            setEmail(router.query.email as string);
        }
    }, [router.query.email]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                // cookie-based session set; dashboard will verify via /api/auth/me
                router.push('/dashboard');
            } else {
                alert(data.message || 'Check your email/password');
            }
        } catch (err) {
            alert('Connection error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link href="/" className="group transition-transform hover:scale-105">
                    <div className="w-56 h-36 overflow-hidden rounded-2xl mx-auto mb-6">
                        <img src="/logo.jpg" alt="PulseAI" className="w-full h-auto -translate-y-[5%] scale-110 brightness-110" />
                    </div>
                </Link>
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Welcome back</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Enter your details to access your dashboard
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 rounded-2xl sm:px-10">
                    {router.query.signedup && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
                            Account created successfully! Please sign in.
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all"
                        >
                            {isSubmitting ? 'Verifying...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            New to PulseAI? <Link href="/signup" className="text-blue-600 font-bold hover:underline">Create an account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}