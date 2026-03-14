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
  CheckCircle
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

  // Check session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch(IDENTITY_API, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.warn("Session check failed, proceeding as guest.");
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!session) {
      setShowLoginModal(true);
      return;
    }

    setSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const response = await fetch(`${SEARCH_API}?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (response.ok) {
        setSearchResult(data);
      } else {
        setError(data.message || data.error || "Intelligence not found.");
      }
    } catch (err) {
      setError("Unable to connect to intelligence API. Please try again later.");
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
          <a href="#philosophy" className="hover:text-emerald-500 transition-colors">Philosophy</a>
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

      {/* Hero Section (VT Style) */}
      <section className="relative pt-44 pb-24 px-6 flex flex-col items-center">
        {/* Subtle Background Glow */}
        <div className="absolute top-44 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col items-center mb-12 text-center max-w-2xl">
          <Shield className="w-20 h-20 text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase">OmniSense</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Universal threat intelligence powered by transparency and decentralized analysis.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-3xl relative group">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
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
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black px-8 py-4 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center gap-2"
            >
              {searching ? 'Scanning...' : 'Scan'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Intelligence results feedback */}
        {(error || searchResult) && (
          <div className="mt-6 w-full max-w-3xl animate-in fade-in slide-in-from-top-4 duration-500">
            {error ? (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            ) : (
              <div className="bg-[#0d0d0d] border border-emerald-500/30 p-6 rounded-2xl shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded mb-2 inline-block">
                      {searchResult.type} Found
                    </span>
                    <h4 className="text-white font-mono text-sm break-all">{query}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-500 font-bold">Detections</p>
                    <p className={`text-2xl font-black ${Object.keys(searchResult.data.detections || {}).length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {Object.keys(searchResult.data.detections || {}).length}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
                   <div>
                     <p className="text-[10px] uppercase text-slate-600 font-bold mb-1">First Seen</p>
                     <p className="text-xs text-white">{searchResult.data.first_seen ? new Date(searchResult.data.first_seen).toLocaleDateString() : 'N/A'}</p>
                   </div>
                   <div>
                     <p className="text-[10px] uppercase text-slate-600 font-bold mb-1">Global Hits</p>
                     <p className="text-xs text-white">{searchResult.data.query_count || 1}</p>
                   </div>
                   <div className="col-span-2">
                     <p className="text-[10px] uppercase text-slate-600 font-bold mb-1">Classification Tags</p>
                     <div className="flex gap-2 flex-wrap">
                       {(searchResult.data.tags || []).length > 0 ? searchResult.data.tags.map(tag => (
                         <span key={tag} className="text-[9px] bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase font-bold text-slate-400">{tag}</span>
                       )) : <span className="text-xs text-slate-500 italic">Unclassified</span>}
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex gap-8 text-[10px] uppercase tracking-widest font-bold text-slate-500">
          <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> 2.4B Records</span>
          <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> Real-time Feed</span>
          <span className="flex items-center gap-2"><Code className="w-3 h-3" /> Open API</span>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="max-w-6xl mx-auto py-24 px-6 border-t border-white/5">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-8 h-px bg-emerald-500" /> Our Creed
            </h2>
            <h3 className="text-4xl font-bold text-white tracking-tight mb-6">
              Security is a Human Right, <br />
              Not a Proprietary Secret.
            </h3>
            <p className="text-slate-400 leading-relaxed mb-8">
              OmniSense is built on the <strong>77 Security Protocol</strong>. We believe that for threat intelligence to be truly effective, the methodology must be open-source, the data exchange must be fair, and privacy must be absolute through zero-knowledge encryption.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="mt-1"><Zap className="w-4 h-4 text-emerald-500" /></div>
                <p className="text-sm"><span className="text-white font-bold">Fair Exchange:</span> Contribute your telemetry to earn high-tier analysis credits. One for one.</p>
              </li>
              <li className="flex gap-3">
                <div className="mt-1"><Code className="w-4 h-4 text-emerald-500" /></div>
                <p className="text-sm"><span className="text-white font-bold">Open Source:</span> Every scanner, every scraper, and every proxy is open to public audit.</p>
              </li>
              <li className="flex gap-3">
                <div className="mt-1"><Lock className="w-4 h-4 text-emerald-500" /></div>
                <p className="text-sm"><span className="text-white font-bold">Zero Knowledge:</span> We store your API keys and private signatures, but we never see them.</p>
              </li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-3xl p-8 flex flex-col justify-end group hover:border-emerald-500/20 transition-colors">
              <Globe className="w-8 h-8 text-emerald-500 mb-4" />
              <h4 className="text-white font-bold">Decentralized</h4>
            </div>
            <div className="aspect-square bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-3xl p-8 flex flex-col justify-end group hover:border-emerald-500/20 transition-colors translate-y-8">
              <Shield className="w-8 h-8 text-emerald-500 mb-4" />
              <h4 className="text-white font-bold">Verified</h4>
            </div>
            <div className="aspect-square bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-3xl p-8 flex flex-col justify-end group hover:border-emerald-500/20 transition-colors -translate-y-8">
              <Search className="w-8 h-8 text-emerald-500 mb-4" />
              <h4 className="text-white font-bold">Transparent</h4>
            </div>
            <div className="aspect-square bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-3xl p-8 flex flex-col justify-end group hover:border-emerald-500/20 transition-colors">
              <Lock className="w-8 h-8 text-emerald-500 mb-4" />
              <h4 className="text-white font-bold">Sovereign</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 px-8 text-center">
        <div className="flex justify-center gap-6 mb-8">
          <a href="#" className="text-slate-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
          <a href="#" className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-tighter">Documentation</a>
          <a href="#" className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-tighter">API Status</a>
        </div>
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">© 2026 77 Security. All rights reserved.</p>
      </footer>

      {/* Login Gate Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative bg-[#0d0d0d] border border-white/10 w-full max-w-md p-8 rounded-3xl shadow-2xl">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <Lock className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Authentication Required</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                To prevent automated scraping and maintain fair exchange limits, scanning requires a valid 77 Security ID.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = "https://www.77security.com/login"}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl transition-all"
                >
                  Sign In with 77 ID
                </button>
                <button 
                  onClick={() => window.location.href = "https://www.77security.com/signup"}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/5"
                >
                  Create New ID
                </button>
              </div>
              <p className="mt-6 text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                Identity provided by identity.77security.com
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}