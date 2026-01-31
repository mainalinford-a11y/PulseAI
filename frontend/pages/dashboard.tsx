import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [tier, setTier] = useState<'free' | 'starter' | 'pro' | 'premium'>('free');
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'applied' | 'saved'>('new');
  const [isGeneratingCL, setIsGeneratingCL] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploadedCvs, setUploadedCvs] = useState<Array<{ filename: string; url: string }>>([]);
  const [selectedCvUrl, setSelectedCvUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    jobTitle: '',
    location: '',
    cvText: '',
  });

  const [authError, setAuthError] = useState<string | null>(null);

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
          setTier(u.tier || 'free');
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
        setStatus({ type: 'success', msg: `Search started! AI Agents are hunting. This usually takes 2-3 minutes...` });
        setFile(null);
        setFormData({ ...formData, cvText: '' });
        fetchMatches();
      } else {
        throw new Error(result.error || `Server Error ${response.status}`);
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: `Search Failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/jobs/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status: newStatus })
      });
      if (res.ok) fetchMatches();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleGenerateCL = async (matchId: string) => {
    if (tier === 'free' || tier === 'starter') return;
    setIsGeneratingCL(matchId);
    try {
      const res = await fetch('/api/jobs/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Cover Letter Generated Successfully!\n\n" + data.content);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to generate cover letter");
    } finally {
      setIsGeneratingCL(null);
    }
  };

  const handleTierChange = async (newTier: string) => {
    try {
      const res = await fetch('/api/user/update-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier })
      });
      if (res.ok) {
        setTier(newTier as any);
        fetchMatches();
      }
    } catch (err) { }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Tier Logic - Filter and Limit
  const filteredMatches = tier === 'free' ? matches.slice(0, 10) : matches;
  const newMatches = filteredMatches.filter(m => (!m.user_status || m.user_status === 'new') && m.user_status !== 'not_interested');
  const appliedMatches = filteredMatches.filter(m => m.user_status === 'applied');
  const savedMatches = filteredMatches.filter(m => m.user_status === 'saved');

  const displayMatches = activeTab === 'new' ? newMatches : activeTab === 'applied' ? appliedMatches : savedMatches;

  if (authError) return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-red-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-200 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Session Expired</h1>
        <p className="text-gray-600 mb-6 font-medium">Your session has timed out. Please sign in again.</p>
        <button onClick={() => router.push('/login')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Sign In</button>
      </div>
    </div>
  );

  if (!userName) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/70">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="group transition-transform hover:scale-105">
            <div className="w-32 h-12">
              <img src="/logo.jpg" alt="PulseAI" className="w-full h-full object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {(['free', 'starter', 'pro'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTierChange(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tier === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-none">{userName}</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">{tier} Plan</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                title="Sign Out"
              >
                <span className="text-xl">⏻</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        {/* Left Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <h2 className="text-lg font-bold">Job Agent</h2>
              <p className="text-blue-100 text-xs mt-1">AI-powered hunt configuration</p>
            </div>

            <form onSubmit={handleStartSearch} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Target Role</label>
                  <input
                    type="text"
                    placeholder="Senior React Developer"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Location preference</label>
                  <input
                    type="text"
                    placeholder="Remote, Worldwide"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <input
                  type="checkbox"
                  id="test-mode"
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-0 bg-white rounded focus:ring-blue-500"
                />
                <label htmlFor="test-mode" className="text-xs font-bold text-gray-500 cursor-pointer uppercase tracking-wider">
                  Debug Mode
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold shadow-xl shadow-gray-200 transition-all flex justify-center items-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Start Hunt</span>}
              </button>

              {status && (
                <div className={`p-4 rounded-2xl text-xs font-bold ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {status.msg}
                </div>
              )}
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">Resume Data</h3>
            {uploadedCvs.length > 0 ? (
              <div className="p-4 bg-blue-50 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-lg">📄</div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs text-gray-900 truncate max-w-[120px]">{uploadedCvs[0].filename}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Verified AI Ready</p>
                  </div>
                </div>
                <button onClick={() => { setUploadedCvs([]); setSelectedCvUrl(null); }} className="text-gray-300 hover:text-red-500 transition-colors">✕</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-all">
                <span className="text-2xl mb-2">📁</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Upload PDF Resume</span>
                <input type="file" className="hidden" accept=".pdf" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
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
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Intelligence Feed</h2>
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
              {(['new', 'saved', 'applied'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {displayMatches.length === 0 ? (
              <div className="bg-white rounded-3xl p-20 text-center border border-gray-50 shadow-sm">
                <span className="text-5xl block mb-6 grayscale opacity-20">📡</span>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No signals detected yet</p>
                {tier === 'free' && matches.length > 10 && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-700">You have more matches! Upgrade to Starter or Pro to unlock the full feed.</p>
                  </div>
                )}
              </div>
            ) : (
              displayMatches.map((job) => (
                <div key={job.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.01] transition-all group relative">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`w-2 h-2 rounded-full ${job.match_score >= 80 ? 'bg-green-500 animate-pulse' : job.match_score >= 60 ? 'bg-amber-400' : 'bg-gray-300'}`} />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{job.company_name}</span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors uppercase leading-tight">{job.job_title}</h3>
                      <p className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2">📍 {job.location || 'Distributed'}</p>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => { window.open(job.job_url, '_blank'); updateJobStatus(job.id, 'applied'); }}
                          className="px-6 py-3 bg-gray-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95"
                        >
                          Apply Now
                        </button>

                        {activeTab === 'new' && (
                          <>
                            <button
                              onClick={() => updateJobStatus(job.id, 'saved')}
                              className="px-4 py-3 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => updateJobStatus(job.id, 'not_interested')}
                              className="px-4 py-3 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all"
                            >
                              Dismiss
                            </button>
                          </>
                        )}

                        <button
                          disabled={tier === 'free' || tier === 'starter' || isGeneratingCL === job.id}
                          onClick={() => handleGenerateCL(job.id)}
                          className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${tier === 'free' || tier === 'starter' ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                          {isGeneratingCL === job.id ? 'Thinking...' : (tier === 'free' || tier === 'starter') ? 'Pro: Cover Letter' : 'AI Cover Letter ✨'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center border-4 ${job.match_score >= 80 ? 'border-green-100 bg-green-50 text-green-700' : job.match_score >= 60 ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
                        <span className="text-2xl font-black">{job.match_score}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter">Score</span>
                      </div>
                      {job.match_score >= 80 && <span className="mt-2 text-[9px] font-black text-green-600 uppercase tracking-widest">High Fit</span>}
                    </div>
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