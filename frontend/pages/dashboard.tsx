import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'applied'>('new');

  const [file, setFile] = useState<File | null>(null);
  const [uploadedCvs, setUploadedCvs] = useState<Array<{ filename: string; url: string }>>([]);
  const [selectedCvUrl, setSelectedCvUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    jobTitle: '',
    location: '',
    cvText: '',
  });

  const [authError, setAuthError] = useState<string | null>(null);

  // Get user from localStorage or API
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          const u = json.user;
          setUserName(u.name || '');
          setUserEmail(u.email || '');
          setUserId(u.id || '');
          if (u.cv_url) {
            setUploadedCvs([{ filename: u.cv_url.split('/').pop() || 'cv', url: u.cv_url }]);
            setSelectedCvUrl(u.cv_url);
          }
          return;
        } else {
          const errData = await res.json().catch(() => ({}));
          setAuthError(`Auth Failed: ${res.status} - ${JSON.stringify(errData)}`);
        }
      } catch (err: any) {
        setAuthError(`Connection Error: ${err.message}`);
      }
      // router.push('/login');
    };
    loadUser();
  }, [router]);

  const fetchMatches = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/n8n/matches?userId=${userId}&type=all`);
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        setMatches(data.matches);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMatches();
      const interval = setInterval(fetchMatches, 15000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const data = new FormData();
    data.append('job_title', formData.jobTitle);
    data.append('location', formData.location);
    data.append('email', userEmail);
    data.append('name', userName);
    data.append('test_mode', testMode ? 'true' : 'false');

    if (selectedCvUrl) {
      data.append('cv_url', selectedCvUrl);
    } else if (file) {
      data.append('cv_file', file);
    } else if (formData.cvText) {
      data.append('cv_text', formData.cvText);
    } else {
      setStatus({ type: 'error', msg: 'Please upload a CV or paste your resume text.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/n8n/start-matching', {
        method: 'POST',
        body: data,
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Invalid response from server: ${text.substring(0, 100)}...`);
      }

      if (response.ok && result.success) {
        setStatus({ type: 'success', msg: `Search started (ID: ${result.searchId || 'pending'})! Our AI Agents are hunting. This usually takes 2-3 minutes...` });
        setFile(null);
        setFormData({ ...formData, cvText: '' });
        fetchMatches();
      } else {
        throw new Error(result.error || `Server Error ${response.status}: ${text.substring(0, 100)}`);
      }
    } catch (err: any) {
      console.error("Search Trigger Error:", err);
      setStatus({ type: 'error', msg: `Search Failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const markAsApplied = async (jobId: string, url: string) => {
    // Open in new tab
    window.open(url, '_blank');

    // Update status in DB
    try {
      await fetch('/api/jobs/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status: 'applied' })
      });
      // Refresh matches to move it to 'applied' tab
      fetchMatches();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Filter matches
  const newMatches = matches.filter(m => m.user_status === 'new' || !m.user_status);
  const appliedMatches = matches.filter(m => m.user_status === 'applied');
  const displayMatches = activeTab === 'new' ? newMatches : appliedMatches;

  if (authError) return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-red-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-200">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-700 bg-gray-50 p-4 rounded-xl font-mono text-sm break-all mb-6">
          {authError}
        </p>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
        >
          Go Back to Login
        </button>
      </div>
    </div>
  );

  if (!userName) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="group transition-transform hover:scale-105">
            <div className="w-32 h-12">
              <img src="/logo.jpg" alt="PulseAI" className="w-full h-full object-contain brightness-110" />
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">Welcome, {userName}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Sidebar: Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Search Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <h2 className="text-lg font-bold">Start New Search</h2>
              <p className="text-blue-100 text-sm mt-1">Configure your agent parameters</p>
            </div>

            <form onSubmit={handleStartSearch} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Product Designer"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Remote, London"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="test-mode"
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="test-mode" className="text-sm font-medium text-gray-600 cursor-pointer">
                  Enable Test Mode (n8n Debug)
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 group"
                >
                  {loading ? (
                    'Agent Working...'
                  ) : (
                    <>
                      <span>Launch Agent</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </>
                  )}
                </button>
              </div>

              {status && (
                <div className={`p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {status.msg}
                </div>
              )}
            </form>
          </div>

          {/* CV Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📄</span> Resume
            </h3>

            <div className="space-y-4">
              {uploadedCvs.length > 0 ? (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg text-lg shadow-sm">📄</div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-sm text-gray-900 truncate max-w-[150px]">{uploadedCvs[0].filename}</p>
                        <p className="text-xs text-blue-600">Active Resume</p>
                      </div>
                    </div>
                    <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded-full">Ready</span>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedCvs([]);
                      setSelectedCvUrl(null);
                      setFile(null);
                    }}
                    className="w-full text-xs font-bold text-gray-500 hover:text-blue-600 py-2 border-t border-blue-100 transition-colors"
                  >
                    Change Resume
                  </button>
                </div>
              ) : (
                <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-sm text-gray-500 mb-2">No resume uploaded</p>
                  <label className="text-blue-600 font-bold text-sm cursor-pointer hover:underline">
                    Upload PDF/DOCX
                    <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFile(f);
                        // Auto upload logic here similar to before
                        const form = new FormData();
                        form.append('cv_file', f);
                        form.append('email', userEmail);
                        try {
                          const res = await fetch('/api/user/upload-cv', { method: 'POST', body: form });
                          if (res.ok) {
                            const j = await res.json();
                            setUploadedCvs([{ filename: j.filename, url: j.cvUrl }]);
                            setSelectedCvUrl(j.cvUrl);
                          }
                        } catch (e) { }
                      }
                    }} />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Content: Matches */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Job Matches</h2>

            {/* Tabs */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'new' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                New Matches ({newMatches.length})
              </button>
              <button
                onClick={() => setActiveTab('applied')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'applied' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Applied ({appliedMatches.length})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {displayMatches.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {activeTab === 'new' ? 'No new jobs found yet' : 'No applications tracked yet'}
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'new' ? 'Start a search to let our agents find the best opportunities for you.' : 'When you apply to jobs, they will appear here.'}
                </p>
              </div>
            ) : (
              displayMatches.map((job) => (
                <div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                  {/* Match Score Indicator */}
                  <div className="absolute top-0 right-0 p-4">
                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl ${job.match_score > 80 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                      <span className="text-xl font-bold">{job.match_score}%</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider">Match</span>
                    </div>
                  </div>

                  <div className="pr-20">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{job.job_title}</h3>
                    <p className="text-gray-600 font-medium mb-1">{job.company_name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">📍 {job.location || 'Remote'}</span>
                      <span className="flex items-center gap-1">🕒 {new Date(job.evaluated_at || Date.now()).toLocaleDateString()}</span>
                    </div>

                    {activeTab === 'new' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => markAsApplied(job.id, job.job_url)}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                          Go & Apply
                          <span>↗</span>
                        </button>
                        <button className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all">
                          View Details
                        </button>
                      </div>
                    )}

                    {activeTab === 'applied' && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold">
                        <span>✓</span> Applied on {new Date(job.applied_at || Date.now()).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}