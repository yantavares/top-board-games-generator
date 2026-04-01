import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface LoginScreenProps {
  onStart: (username: string, apiToken: string, targetRank: number) => void;
  isLoading: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onStart, isLoading }) => {
  const [username, setUsername] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [targetRank, setTargetRank] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && apiToken.trim()) {
      onStart(username.trim(), apiToken.trim(), targetRank);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto px-4 z-10 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl shadow-2xl w-full text-center"
      >
        <span className="bg-primary/20 text-indigo-300 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest mb-4 inline-block">
          BGG Battles
        </span>
        <h1 className="text-3xl font-black text-white mb-2 leading-tight">
          Crie seu Ranking<br/><span className="text-primary">Definitivo</span>
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Para acessar sua coleção oficialmente, gere um <a href="https://boardgamegeek.com/applications" target="_blank" rel="noreferrer" className="text-primary hover:underline">API Token na BGG</a>.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nome de Usuário BGG"
              className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          
          <div className="relative">
            <input
              type="password"
              required
              value={apiToken}
              onChange={e => setApiToken(e.target.value)}
              placeholder="BGG API Token (Bearer)"
              className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-2 mt-2 text-left">
            <label className="text-sm font-semibold text-slate-300">Tamanho do Ranking</label>
            <div className="grid grid-cols-2 gap-2">
              {[5, 10, 20].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setTargetRank(val)}
                  className={`py-2 rounded-lg font-bold text-sm transition-all outline-none ${
                    targetRank === val 
                    ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/30' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Top {val}
                </button>
              ))}
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg focus-within:ring-2 ring-primary">
                Top
                <input 
                  type="number" 
                  min="2" 
                  max="50" 
                  value={targetRank} 
                  onChange={e => setTargetRank(Number(e.target.value))} 
                  className="bg-transparent w-full text-white font-bold outline-none" 
                  placeholder="?" 
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !apiToken}
            className="w-full mt-6 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all outline-none"
          >
            {isLoading ? (
              <span className="animate-pulse">Consultando BGG...</span>
            ) : (
              <>
                <Search size={20} />
                Buscar Coleção
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
