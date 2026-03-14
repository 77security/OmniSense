import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  User, 
  Lock, 
  Info, 
  Globe, 
  Zap, 
  Code, 
  ExternalLink,
  ChevronRight,
  Loader2,
  Github,
  X,
  AlertTriangle,
  CheckCircle,
  ShieldCheck
} from 'lucide-react';

const IDENTITY_API = "https://identity.77security.com/api/user/me";
const SEARCH_API = "https://api.omnisense.77security.com/api/ti/search";

export default function App() {
  const [session, setSession] = useState(null);
  const [query, setQuery] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  const [isClean, setIsClean] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch(IDENTITY_API, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.warn("Session check failed.");
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    if (!session) {
      setShowLoginModal(true);
      return;
    }

    setSearching(true);
    setError(null);
    setSearchResult(null);
    setIsClean(false);

    try {
      // Added mode: 'cors' - Note: Backend must still support OPTIONS preflight
      const response = await fetch(`${SEARCH_API}?q=${encodeURIComponent(cleanQuery)}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.status === 404) {
        // Handle 404 as "No threats found" rather than a failure
        setIsClean(true);
        setSearching(false);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setSearchResult(data);
      } else {
        setError(data.message || "An unexpected error occurred during the scan.");
      }
    } catch (err) {
      // This is often where CORS errors manifest in JS
      setError("Network or Security Error: Please ensure the API supports CORS and is reachable.");
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full h-16 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md z-40 flex items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-500" />
          <span className="text-white font-bold tracking-tighter text-lg uppercase">OmniSense</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <a href="https://github.com/77security" target="_blank" rel="noreferrer" className="hover:text-emerald-500 transition-colors flex items-center gap-1">
            <Github className="w-4 h-4" /> Open Source
          </a>
          {session ? (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <span className="text-white font-medium hidden sm:block">{session.email}</span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          ) : (
            <button 
              onClick={() => window.location.href = "https://www.77security.com/login"}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-1.5 px-4 rounded-lg transition-all text-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-24 px-6 flex flex-col items-center">
        <div className="absolute top-44 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col items-center mb-12 text-center max-w-2xl">
          <Shield className="w-20 h-20 text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase">OmniSense</h1>
          <p className="text-slate-400 text-lg">Universal Intelligence & Threat Analysis</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-3xl relative group">
          <div className="relative bg-[#0d0d0d] border border-white/10 hover:border-emerald-500/40 rounded-2xl p-2 flex items-center gap-2 transition-all shadow-2xl">
            <div className="pl-4">
              {searching ? <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" /> : <Search className="w-5 h-5 text-slate-500" />}
            </div>
            <input 
              type="text" 
              placeholder="URL, IP address, domain, or file hash"
              className="flex-1 bg-transparent border-none outline-none text-white p-4 font-mono text-sm tracking-wide placeholder:text-slate-600"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={searching}
            />
            <button 
              type="submit"
              disabled={searching}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black px-8 py-4 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center gap-2"
            >
              {searching ? 'Analyzing...' : 'Search'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Results Area */}
        <div className="mt-8 w-full max-w-3xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col gap-2 text-red-400 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <h3 className="font-bold uppercase tracking-tight text-sm">Communication Error</h3>
              </div>
              <p className="text-xs text-red-400/80 leading-relaxed ml-9">{error}</p>
            </div>
          )}

          {isClean && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-2xl flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tight">No Threats Detected</h3>
              <p className="text-slate-400 text-sm max-w-md">
                Our intelligence database currently has no malicious records associated with <span className="text-emerald-400 font-mono">{query}</span>.
              </p>
            </div>
          )}

          {searchResult && (
            <div className="bg-[#0d0d0d] border border-white/10 p-8 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-1 rounded mb-3 inline-block">
                    {searchResult.type || 'Entity'} Analysis
                  </span>
                  <h4 className="text-white font-mono text-sm break-all max-w-md">{query}</h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Detections</p>
                  <p className={`text-3xl font-black ${Object.keys(searchResult.data?.detections || {}).length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {Object.keys(searchResult.data?.detections || {}).length}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-white/5">
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-bold mb-2">First Observation</p>
                  <p className="text-sm text-white">{searchResult.data?.first_seen ? new Date(searchResult.data.first_seen).toLocaleDateString() : 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-bold mb-2">Global Query Count</p>
                  <p className="text-sm text-white font-mono">{searchResult.data?.query_count || '1'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase text-slate-600 font-bold mb-2">Metadata Tags</p>
                  <div className="flex gap-2 flex-wrap">
                    {(searchResult.data?.tags || []).length > 0 ? (
                      searchResult.data.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-white/5 px-2.5 py-1 rounded-md border border-white/10 font-bold text-slate-400 uppercase tracking-tighter">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No tags associated</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 px-8 text-center text-[10px] text-slate-600 uppercase tracking-[0.2em]">
        © 2026 77 Security Intelligence Protocol
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative bg-[#0d0d0d] border border-white/10 w-full max-w-md p-8 rounded-3xl shadow-2xl">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <Lock className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Identity Required</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">Intelligence scanning requires an authenticated 77 ID.</p>
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = "https://www.77security.com/login"}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl transition-all"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}