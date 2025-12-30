
import React, { useState, useEffect } from 'react';
import { GeminiService } from './services/geminiService';
import { AppState, AgentStep } from './types';
import Button from './components/Button';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [state, setState] = useState<AppState>({
    step: 'idle',
    problem: null,
    error: null,
    vaultName: localStorage.getItem('obsidian_vault_name') || 'Main Vault',
    autoSync: localStorage.getItem('auto_sync') === 'true',
    history: JSON.parse(localStorage.getItem('sync_history') || '[]')
  });

  const gemini = new GeminiService();

  const handleOpenInObsidian = (problemData: any) => {
    const content = encodeURIComponent(problemData.markdown);
    const fileName = encodeURIComponent(problemData.title);
    const vault = encodeURIComponent(state.vaultName);
    const uri = `obsidian://new?vault=${vault}&name=${fileName}&content=${content}`;
    window.location.href = uri;
  };

  const deployAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || state.step !== 'idle') return;

    setState(prev => ({ ...prev, step: 'searching', error: null, problem: null }));

    try {
      // Step: Analyzing
      setTimeout(() => setState(prev => ({ ...prev, step: 'analyzing' })), 1500);
      
      const data = await gemini.generateLeetCodeNote(input);
      
      // Step: Formatting
      setState(prev => ({ ...prev, step: 'formatting', problem: data }));

      // Finish & Optional Sync
      setTimeout(() => {
        setState(prev => {
          const newHistory = [data.title, ...prev.history.slice(0, 4)];
          localStorage.setItem('sync_history', JSON.stringify(newHistory));
          
          if (prev.autoSync) {
            handleOpenInObsidian(data);
            return { ...prev, step: 'syncing', history: newHistory };
          }
          return { ...prev, step: 'completed', history: newHistory };
        });
      }, 800);

    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, step: 'idle' }));
    }
  };

  const resetAgent = () => {
    setState(prev => ({ ...prev, step: 'idle', problem: null, error: null }));
    setInput('');
  };

  const toggleAutoSync = () => {
    const newVal = !state.autoSync;
    setState(prev => ({ ...prev, autoSync: newVal }));
    localStorage.setItem('auto_sync', String(newVal));
  };

  const getStepIcon = (s: AgentStep) => {
    switch(s) {
      case 'searching': return 'fa-solid fa-satellite-dish animate-pulse text-blue-400';
      case 'analyzing': return 'fa-solid fa-microchip animate-spin text-purple-400';
      case 'formatting': return 'fa-solid fa-wand-magic-sparkles text-pink-400';
      case 'syncing': return 'fa-solid fa-cloud-arrow-up animate-bounce text-green-400';
      case 'completed': return 'fa-solid fa-circle-check text-green-500';
      default: return 'fa-solid fa-robot text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-vault text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LEETVAULT <span className="text-blue-500 text-xs font-mono ml-1">v2.0 AGENT</span></h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Obsidian Automation Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className={`px-3 py-1 rounded-full border ${state.step === 'idle' ? 'border-gray-700 text-gray-500' : 'border-blue-500/50 text-blue-400 bg-blue-500/5'}`}>
              STATUS: {state.step.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar Controls */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-gray-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2 uppercase tracking-wider">
                <i className="fa-solid fa-terminal text-blue-500"></i> Command Input
              </h3>
              <form onSubmit={deployAgent} className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={state.step !== 'idle'}
                    placeholder="Problem name or LeetCode URL..."
                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-2">
                    <i className={`fa-solid fa-bolt ${state.autoSync ? 'text-yellow-500' : 'text-gray-600'}`}></i>
                    <span className="text-xs font-medium">Auto-Sync to Vault</span>
                  </div>
                  <button 
                    type="button"
                    onClick={toggleAutoSync}
                    className={`w-10 h-5 rounded-full transition-colors relative ${state.autoSync ? 'bg-blue-600' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.autoSync ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>

                {state.step === 'idle' ? (
                  <Button type="submit" className="w-full py-3 shadow-xl">
                    Deploy Agent
                  </Button>
                ) : (
                  <Button type="button" variant="secondary" onClick={resetAgent} className="w-full py-3">
                    Abort & Reset
                  </Button>
                )}
              </form>
            </section>

            <section className="bg-gray-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2 uppercase tracking-wider">
                <i className="fa-solid fa-folder-tree text-purple-500"></i> Target Vault
              </h3>
              <input 
                type="text" 
                value={state.vaultName}
                onChange={(e) => {
                  const val = e.target.value;
                  setState(prev => ({ ...prev, vaultName: val }));
                  localStorage.setItem('obsidian_vault_name', val);
                }}
                className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
              <p className="mt-2 text-[10px] text-gray-500">The vault name must match exactly in Obsidian.</p>
            </section>

            {state.history.length > 0 && (
              <section className="bg-gray-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Recent Syncs</h3>
                <div className="space-y-2">
                  {state.history.map((h, i) => (
                    <div key={i} className="text-xs text-gray-500 flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                      <i className="fa-solid fa-check text-green-500/50"></i>
                      {h}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Main Agent Visualization */}
          <div className="lg:col-span-8">
            <div className="bg-gray-900/80 border border-white/5 rounded-3xl overflow-hidden min-h-[600px] flex flex-col relative shadow-2xl">
              
              {/* Status Header */}
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${state.step === 'idle' ? 'bg-gray-800' : 'bg-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]'}`}>
                    <i className={getStepIcon(state.step)}></i>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-tight">
                      {state.step === 'idle' ? 'Agent Ready' : state.step.toUpperCase() + '...'}
                    </h2>
                    <p className="text-xs text-gray-500 font-mono">
                      {state.step === 'searching' && 'Accessing LeetCode via Search Grounding'}
                      {state.step === 'analyzing' && 'Extracting logic patterns and constraints'}
                      {state.step === 'formatting' && 'Constructing high-fidelity Markdown'}
                      {state.step === 'syncing' && 'Dispatching to Obsidian URI handler'}
                      {state.step === 'completed' && 'Operation successful'}
                      {state.step === 'idle' && 'Waiting for instructions'}
                    </p>
                  </div>
                </div>
                
                {state.problem && state.step === 'completed' && (
                  <Button variant="primary" onClick={() => handleOpenInObsidian(state.problem)} className="text-xs">
                    <i className="fa-solid fa-arrow-up-right-from-square mr-2"></i>
                    Sync Now
                  </Button>
                )}
              </div>

              {/* Console/Preview Content */}
              <div className="flex-1 p-8 overflow-y-auto">
                {state.error ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <i className="fa-solid fa-triangle-exclamation text-red-500 text-5xl mb-6"></i>
                    <h3 className="text-xl font-bold mb-2">Execution Halted</h3>
                    <p className="text-gray-500 max-w-sm">{state.error}</p>
                    <Button variant="secondary" onClick={resetAgent} className="mt-6">Restart Terminal</Button>
                  </div>
                ) : state.problem ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
                    <div className="bg-black/50 p-6 rounded-2xl border border-white/5 font-mono text-xs leading-relaxed text-gray-300">
                      {state.problem.markdown}
                    </div>
                    
                    {state.problem.sources.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {state.problem.sources.slice(0, 2).map((s, i) => (
                          <a key={i} href={s.uri} target="_blank" className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl hover:bg-blue-500/10 transition-colors">
                            <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Source Verified</p>
                            <p className="text-xs text-gray-400 truncate">{s.title}</p>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-40">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="w-16 h-1 bg-gray-800 rounded-full animate-pulse"></div>
                      <div className="w-16 h-1 bg-gray-800 rounded-full animate-pulse delay-75"></div>
                      <div className="w-16 h-1 bg-gray-800 rounded-full animate-pulse delay-150"></div>
                    </div>
                    <p className="text-sm font-mono tracking-widest uppercase">System Standby</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
