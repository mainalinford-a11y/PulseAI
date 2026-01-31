import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const router = useRouter();
    const { token } = router.query;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const validatePassword = (pass: string) => {
        // At least 8 characters, one uppercase, one number
        const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        return regex.test(pass);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePassword(password)) {
            setStatus({ type: 'error', message: 'Password must be at least 8 characters long and include at least one uppercase letter and one number.' });
            return;
        }

        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        setIsSubmitting(true);
        setStatus(null);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({
                    type: 'success',
                    message: 'Your password has been reset successfully.'
                });
            } else {
                setStatus({
                    type: 'error',
                    message: data.error || 'Something went wrong.'
                });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Connection error.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <Link href="/" className="group transition-transform hover:scale-110 mb-6">
                        <div className="w-56 h-36 mx-auto">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain brightness-110" />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
                    <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
                    <Link href="/forgot-password" title="" className="block w-full py-3 bg-blue-600 text-white rounded-xl font-bold">
                        Request a new link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link href="/" className="group transition-transform hover:scale-105">
                    <div className="w-64 h-40 mx-auto mb-4">
                        <img src="/logo.jpg" alt="PulseAI" className="w-full h-full object-contain brightness-110" />
                    </div>
                </Link>
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Set New Password</h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 rounded-2xl sm:px-10">
                    {status?.type === 'success' ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <span className="text-green-600 text-2xl">✓</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">All Set!</h3>
                            <p className="text-sm text-gray-600">{status.message}</p>
                            <Link href="/login" className="block w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                                Go to Login
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
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 transition-all font-mono"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 transition-all font-mono"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all"
                            >
                                {isSubmitting ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
