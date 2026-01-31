import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({
                    type: 'success',
                    message: 'If an account exists with this email, you will receive a reset link shortly.'
                });
            } else {
                setStatus({
                    type: 'error',
                    message: data.error || 'Something went wrong. Please try again.'
                });
            }
        } catch (err) {
            setStatus({
                type: 'error',
                message: 'Connection error. Please check your internet.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link href="/" className="group transition-transform hover:scale-105">
                    <div className="w-56 h-36 overflow-hidden rounded-2xl mx-auto mb-6">
                        <img src="/logo.jpg" alt="PulseAI" className="w-full h-auto -translate-y-[5%] scale-110 brightness-110" />
                    </div>
                </Link>
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Reset Password</h2>
                <p className="mt-2 text-sm text-gray-600">
                    We'll send you a link to get back into your account
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 rounded-2xl sm:px-10">
                    {status?.type === 'success' ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <span className="text-green-600 text-2xl">✓</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Check your email</h3>
                            <p className="text-sm text-gray-600">{status.message}</p>
                            <Link href="/login" className="block w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {status?.type === 'error' && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                                    {status.message}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                            </button>

                            <div className="text-center">
                                <Link href="/login" className="text-sm font-bold text-blue-600 hover:underline">
                                    Return to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
