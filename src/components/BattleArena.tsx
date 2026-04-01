import { motion, useAnimation } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { Game } from '../hooks/useTournament';
import { Check, X } from 'lucide-react';

interface BattleArenaProps {
  candidate: Game;
  opponent: Game;
  onChoice: (winnerId: string) => void;
  progressPercent: number;
}

export const BattleArena: React.FC<BattleArenaProps> = ({ candidate, opponent, onChoice, progressPercent }) => {
  const controls = useAnimation();

  const dragBound = 100;

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > dragBound) {
      // Swiped Right -> Candidate wins
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
      onChoice(candidate.id);
    } else if (info.offset.x < -dragBound) {
      // Swiped Left -> Opponent wins
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
      onChoice(opponent.id);
    } else {
      controls.start({ x: 0, opacity: 1, transition: { type: 'spring', bounce: 0.5 } });
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 overflow-hidden relative">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-700 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="text-center mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          Oponente Atual
        </h2>
        <div className="mt-2 glass p-2 rounded-xl flex items-center gap-4">
          <img src={opponent.imageUrl} alt={opponent.name} className="w-16 h-16 object-cover rounded-lg" />
          <h3 className="font-bold text-lg text-white max-w-[200px] truncate">{opponent.name}</h3>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-sm">
        <h2 className="text-slate-300 font-medium mb-4 z-10 text-center">
          Deslize <span className="text-primary font-bold">DIREITA</span> para escolher o <br/>Candidato Abaixo.<br/>
          Deslize <span className="text-pink-500 font-bold">ESQUERDA</span> se prefere o Oponente.
        </h2>

        {/* Swipeable Card */}
        <motion.div
          key={candidate.id} // reset state on new candidate
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={controls}
          whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
          className="glass-card w-full aspect-[3/4] flex flex-col items-center justify-center p-4 relative cursor-grab z-20 touch-none shadow-primary/20"
        >
          <img 
            src={candidate.imageUrl} 
            alt={candidate.name} 
            className="w-full h-full object-cover rounded-xl"
            draggable="false"
          />
          <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent rounded-b-xl text-center">
            <h1 className="text-2xl font-black text-white">{candidate.name}</h1>
            <p className="text-slate-300 text-sm mt-1">Candidato</p>
          </div>
          
          {/* Swiping Indicators */}
          <div className="absolute inset-0 pointer-events-none flex justify-between px-6 items-center opacity-0 transition-opacity">
            <div className="text-pink-500 bg-pink-500/20 p-4 rounded-full backdrop-blur-md">
              <X size={40} />
            </div>
            <div className="text-primary bg-primary/20 p-4 rounded-full backdrop-blur-md">
              <Check size={40} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-8 mt-8">
        <button 
          onClick={() => {
            controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } }).then(() => onChoice(opponent.id));
          }}
          className="w-16 h-16 rounded-full glass flex items-center justify-center text-pink-500 hover:bg-pink-500/20 hover:scale-110 active:scale-95 transition-all outline-none"
        >
          <X size={32} />
        </button>
        <button 
          onClick={() => {
            controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } }).then(() => onChoice(candidate.id));
          }}
          className="w-16 h-16 rounded-full glass flex items-center justify-center text-primary hover:bg-primary/20 hover:scale-110 active:scale-95 transition-all outline-none"
        >
          <Check size={32} />
        </button>
      </div>
    </div>
  );
};
