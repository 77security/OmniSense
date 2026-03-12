import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Globe, 
  Lock, 
  AlertTriangle, 
  User, 
  ChevronRight, 
  Terminal,
  ExternalLink,
  Loader2,
  Zap
} from 'lucide-react';

// Configuration
const IDENTITY_API = "https://identity.77security.com/api/user/me";
const OMNISENSE_API = "https://api.omnisense.77security.com/api/v1/telemetry";

const App = () => {
  const [session, setSession] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Identity Session
        const identityRes = await fetch(IDENTITY_API, { credentials: 'include' });
        if (!identityRes.ok) {
          throw new Error("UNAUTHORIZED: No valid session found at .77security.com");
        }
        const sessionData = await identityRes.json();
        setSession(sessionData);

        // 2. Fetch OmniSense Product Data
        const telemetryRes = await fetch(OMNISENSE_API, { credentials: 'include' });
        if (telemetryRes.ok) {
          const data = await telemetryRes.json();
          setTelemetry(data);
        }
      } catch (err) {
        console.error("Initialization failed:", err);
        setError(err.message);
        // Redirect to login after a short delay if unauthorized
        if (err.message.includes("UNAUTHORIZED")) {
          setTimeout(() => {
            window.location.href = "https://www.77security.com/login";
          }, 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-emerald-500/60 font-mono text-sm tracking-widest uppercase">Initializing OmniSense Security Context...</p>
      </div>
    );
  }

  if (error && error.includes("UNAUTHORIZED")) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-950/10 border border-red-500/20 p-8 rounded-2xl text-center">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-red-400/80 mb-6 text-sm">Valid session not found. Redirecting to 77 Security login portal...</p>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full animate-[progress_3s_ease-in-out]" style={{width: '100%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-emerald-500/30">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-20 border-r border-white/5 bg-[#080808] flex flex-col items-center py-8 gap-8">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <Shield className="w-8 h-8 text-emerald-500" />
        </div>
        <nav className="flex flex-col gap-6">
          <div className="p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
            <Globe className="w-6 h-6 text-slate-400" />
          </div>
          <div className="p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
          <div className="p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
            <Terminal className="w-6 h-6 text-slate-400" />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pl-20">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-bold tracking-tighter text-xl">OMNISENSE <span className="text-emerald-500 font-mono text-sm ml-2">v1.0.4</span></h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-white text-sm font-medium">{session?.email || "Guest Operator"}</span>
              <span className="text-[10px] text-emerald-500 font-mono tracking-tighter uppercase">{session?.industry_name || "Public Sector"} Agent</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Status Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatusCard 
              icon={<Zap className="w-5 h-5" />} 
              label="System Integrity" 
              value="Optimized" 
              color="emerald" 
            />
            <StatusCard 
              icon={<Activity className="w-5 h-5" />} 
              label="Active Nodes" 
              value={telemetry?.active_nodes || "2,481"} 
              color="blue" 
            />
            <StatusCard 
              icon={<AlertTriangle className="w-5 h-5" />} 
              label="Global Threat Level" 
              value={telemetry?.threat_level || "ELEVATED"} 
              color="orange" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Telemetry Feed */}
            <section className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Real-time Threat Stream
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded uppercase tracking-widest font-bold">Live</span>
              </div>
              <div className="p-6 space-y-4">
                {telemetry?.recent_events?.map((event, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all group">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-white font-medium capitalize">{event.type.replace('_', ' ')} Detected</p>
                        <span className="text-[10px] font-mono text-slate-500 italic">2m ago</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Origin: <span className="text-emerald-500/80 font-mono">{event.source}</span></p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 transition-colors self-center" />
                  </div>
                )) || (
                  <p className="text-center py-20 text-slate-500 text-sm italic">Waiting for telemetry ingress from AKS...</p>
                )}
              </div>
            </section>

            {/* Sidebar Stats */}
            <div className="space-y-8">
              <section className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white relative overflow-hidden group">
                <Shield className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 group-hover:scale-110 transition-transform duration-700" />
                <h3 className="text-lg font-bold mb-2">Zero-Trust Active</h3>
                <p className="text-sm opacity-80 mb-6">Your session is protected by 77 Security identity standards.</p>
                <button className="w-full bg-black/20 hover:bg-black/40 backdrop-blur-md py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/10">
                  Security Audit <ExternalLink className="w-3 h-3" />
                </button>
              </section>

              <section className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6">
                <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-slate-500">Node Configuration</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-slate-500 uppercase tracking-tighter">Backend Root</span>
                    <span className="text-emerald-500 font-mono">api.omnisense.77security.com</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-slate-500 uppercase tracking-tighter">Cluster Node</span>
                    <span className="text-slate-300 font-mono">aks-prod-021</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-slate-500 uppercase tracking-tighter">Identity Scope</span>
                    <span className="text-slate-300 font-mono">{session?.id?.substring(0,8)}...</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatusCard = ({ icon, label, value, color }) => {
  const colors = {
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  };
  
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl flex items-center gap-5 hover:border-white/10 transition-colors group">
      <div className={`p-4 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{label}</p>
        <p className="text-xl text-white font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export default App;
