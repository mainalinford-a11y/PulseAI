import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirects to signup and passes the email in the URL
    router.push(`/signup?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Head>
        <title>PulseAI | AI-Powered Job Matching</title>
        <meta name="description" content="Automate your job search with AI" />
      </Head>

      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gray-900 rounded-lg p-0.5 shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">PulseAI</span>
        </Link>
        <div className="space-x-6 flex items-center">
          <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Login</Link>
          <Link href="/signup" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Land your dream job <br />
          <span className="text-blue-600">on autopilot.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          PulseAI scans thousands of job listings, optimizes your applications, and applies for you—all while you sleep.
        </p>

        {/* The "Get Started" Form */}
        <form onSubmit={handleGetStarted} className="flex flex-col md:flex-row gap-4 justify-center max-w-lg mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 outline-none transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
          >
            Get Started Free
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500">No credit card required. Free tier available.</p>
      </main>

      {/* Features Preview */}
      <section className="bg-gray-50 py-20 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-2xl font-bold">1</div>
            <h3 className="text-xl font-bold">Set Your Preferences</h3>
            <p className="text-gray-600">Tell us your dream role, salary, and location. PulseAI does the rest.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-2xl font-bold">2</div>
            <h3 className="text-xl font-bold">AI Matching</h3>
            <p className="text-gray-600">Our engine scores every job against your profile for the perfect fit.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-2xl font-bold">3</div>
            <h3 className="text-xl font-bold">Auto-Apply</h3>
            <p className="text-gray-600">Sit back as our agents handle the application process for you.</p>
          </div>
        </div>
      </section>
    </div>
  );
}