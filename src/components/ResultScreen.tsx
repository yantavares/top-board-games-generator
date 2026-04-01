import React from 'react';
import { motion } from 'framer-motion';
import type { Game } from '../hooks/useTournament';
import { Trophy, Share2, RefreshCw } from 'lucide-react';

interface ResultScreenProps {
  topX: Game[];
  onRestart: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ topX, onRestart }) => {
  return (
    <div className="w-full max-w-lg mx-auto py-8 px-4 h-full flex flex-col relative z-20">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10"
      >
        <Trophy size={48} className="mx-auto text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 drop-shadow-sm">
          Seu Top {topX.length}
        </h1>
        <p className="text-slate-400 mt-2 text-sm">A lista definitiva baseada em suas batalhas!</p>
      </motion.div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-20 custom-scrollbar">
        {topX.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-4 p-3 rounded-2xl glass transition-all hover:scale-105 cursor-pointer ${
              index === 0 ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-500/50' : 
              index === 1 ? 'bg-gradient-to-r from-slate-400/20 to-slate-300/10 border-slate-400/50' :
              index === 2 ? 'bg-gradient-to-r from-orange-700/20 to-orange-800/10 border-orange-700/50' :
              ''
            }`}
          >
            <div className="relative flex-shrink-0">
              <span className={`absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center font-black rounded-full shadow-lg ${
                index === 0 ? 'bg-amber-400 text-amber-900 border-2 border-amber-200' :
                index === 1 ? 'bg-slate-300 text-slate-800 border-2 border-white' :
                index === 2 ? 'bg-orange-600 text-orange-100 border-2 border-orange-400' :
                'bg-slate-800 text-slate-300'
              }`}>
                {index + 1}
              </span>
              <img src={game.imageUrl} alt={game.name} className="w-20 h-20 object-cover rounded-xl shadow-md border border-slate-700/50" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-100 line-clamp-2 leading-tight">
                {game.name}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 flex gap-4 w-full"
      >
        <button 
          onClick={onRestart}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors outline-none"
        >
          <RefreshCw size={20} /> Novo Rank
        </button>
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Meu Rank BGG',
                text: `Acabei de rankear meu Top ${topX.length} jogos!\n1. ${topX[0]?.name}\n2. ${topX[1]?.name}\n3. ${topX[2]?.name}`,
                url: window.location.href,
              })
            } else {
              alert('Copiado para área de transferência!');
              navigator.clipboard.writeText(`Meu Top ${topX.length}:\n1. ${topX[0]?.name}\n...`);
            }
          }}
          className="flex-1 bg-primary hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors outline-none"
        >
          <Share2 size={20} /> Compartilhar
        </button>
      </motion.div>
    </div>
  );
};
