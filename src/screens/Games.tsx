import React, { useState, useEffect } from 'react';
import { Trophy, Star, ChevronRight, CheckCircle2, ArrowLeft, RefreshCcw, Brain, LayoutGrid, Gamepad2, XCircle, Volume2, VolumeX, Lock, Eye } from 'lucide-react';
import { User, Question, HangmanLevel, WordSearchLevel } from '../types';
import { MOCK_QUESTIONS, MOCK_HANGMAN_LEVELS, MOCK_WORDSEARCH_LEVELS } from '../mockData';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type GameMode = 'quiz' | 'memory' | 'hangman' | 'wordsearch';

interface WordSearchCell {
  char: string;
  row: number;
  col: number;
  isFound: boolean;
  isSelected: boolean;
}

const MEMORY_ICONS = [Star, Trophy, Brain, Gamepad2, LayoutGrid, CheckCircle2, RefreshCcw, Star];

const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
  victory: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  defeat: 'https://assets.mixkit.co/active_storage/sfx/2953/2953-preview.mp3',
};

interface MemoryCard {
  id: number;
  icon: any;
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function Games({ user, onPointsAdd }: { user: User, onPointsAdd: (p: number) => void }) {
  const [activeGame, setActiveGame] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'result'>('lobby');
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('game_muted') === 'true');

  const playSound = (type: keyof typeof SOUNDS) => {
    if (isMuted) return;
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play blocked:', e));
  };

  useEffect(() => {
    localStorage.setItem('game_muted', String(isMuted));
  }, [isMuted]);
  
  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Memory State
  const [memoryLevel, setMemoryLevel] = useState(0);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryPoints, setMemoryPoints] = useState(0);

  // Hangman State
  const [hangmanIndex, setHangmanIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [hangmanScore, setHangmanScore] = useState(0);

  // Word Search State
  const [wsLevel, setWsLevel] = useState(0);
  const [wsGrid, setWsGrid] = useState<WordSearchCell[][]>([]);
  const [wsFoundWords, setWsFoundWords] = useState<string[]>([]);
  const [wsSelection, setWsSelection] = useState<{r: number, c: number}[]>([]);
  const [wsScore, setWsScore] = useState(0);

  const handleNextQuiz = () => {
    const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    if (isCorrect) playSound('correct');
    else playSound('error');

    const newScore = quizScore + (isCorrect ? currentQuestion.points : 0);
    setQuizScore(newScore);

    if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedOption(null);
      }, 300);
    } else {
      onPointsAdd(newScore);
      setTimeout(() => {
        playSound('victory');
        setGameState('result');
      }, 500);
    }
  };

  const initWordSearch = (levelIdx: number = 0) => {
    const size = 10;
    const currentLevel = MOCK_WORDSEARCH_LEVELS[levelIdx];
    const grid: WordSearchCell[][] = Array(size).fill(null).map((_, r) => 
      Array(size).fill(null).map((_, c) => ({
        char: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
        row: r, col: c, isFound: false, isSelected: false
      }))
    );

    currentLevel.words.forEach(word => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        attempts++;
        const isHoriz = Math.random() > 0.5;
        const row = Math.floor(Math.random() * (isHoriz ? size : size - word.length));
        const col = Math.floor(Math.random() * (isHoriz ? size - word.length : size));
        
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const r = isHoriz ? row : row + i;
          const c = isHoriz ? col + i : col;
          // Simple check: if spot is already taken by a different character, can't place (or just always place if grid is empty)
          // Since it's initialization, we just avoid overlaps if they conflict
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const r = isHoriz ? row : row + i;
            const c = isHoriz ? col + i : col;
            grid[r][c].char = word[i].toUpperCase();
          }
          placed = true;
        }
      }
    });

    setWsGrid(grid);
    setWsFoundWords([]);
    setWsSelection([]);
  };

  const handleWSClick = (r: number, c: number) => {
    const newSelection = [...wsSelection, {r, c}];
    setWsSelection(newSelection);

    const selectedWord = newSelection.map(s => wsGrid[s.r][s.c].char).join('');
    const currentLevel = MOCK_WORDSEARCH_LEVELS[wsLevel];
    
    if (currentLevel.words.includes(selectedWord) && !wsFoundWords.includes(selectedWord)) {
      playSound('correct');
      const updatedFound = [...wsFoundWords, selectedWord];
      setWsFoundWords(updatedFound);
      setWsSelection([]);
      
      const newGrid = wsGrid.map(row => row.map(cell => {
        const isPart = newSelection.some(s => s.r === cell.row && s.c === cell.col);
        return isPart ? { ...cell, isFound: true } : cell;
      }));
      setWsGrid(newGrid);

      if (updatedFound.length === currentLevel.words.length) {
        const nextScore = wsScore + 20;
        setWsScore(nextScore);
        if (wsLevel < MOCK_WORDSEARCH_LEVELS.length - 1) {
          setTimeout(() => {
            setWsLevel(prev => prev + 1);
            initWordSearch(wsLevel + 1);
          }, 1000);
        } else {
          onPointsAdd(nextScore);
          setTimeout(() => {
            playSound('victory');
            setGameState('result');
          }, 500);
        }
      }
    } else if (selectedWord.length > 10) {
      playSound('error');
      setWsSelection([]);
    }
  };

  const initMemoryGame = () => {
    const deck: MemoryCard[] = [];
    MEMORY_ICONS.forEach((Icon, i) => {
      deck.push({ id: i * 2, icon: Icon, pairId: i, isFlipped: false, isMatched: false });
      deck.push({ id: i * 2 + 1, icon: Icon, pairId: i, isFlipped: false, isMatched: false });
    });
    setCards(deck.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMemoryMoves(0);
  };

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards.find(c => c.id === id)?.isFlipped || cards.find(c => c.id === id)?.isMatched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves(m => m + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard?.pairId === secondCard?.pairId) {
        playSound('correct');
        setTimeout(() => {
          const matchedCards = newCards.map(c => c.pairId === firstCard?.pairId ? { ...c, isMatched: true } : c);
          setCards(matchedCards);
          setFlippedCards([]);
          if (matchedCards.every(c => c.isMatched)) {
            const points = Math.max(10, 50 - memoryMoves);
            const nextScore = memoryPoints + points;
            setMemoryPoints(nextScore);
            if (memoryLevel < 19) {
              setTimeout(() => {
                setMemoryLevel(prev => prev + 1);
                initMemoryGame();
              }, 1000);
            } else {
              onPointsAdd(nextScore);
              setTimeout(() => {
                playSound('victory');
                setGameState('result');
              }, 500);
            }
          }
        }, 500);
      } else {
        playSound('error');
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === firstId || c.id === secondId) ? { ...c, isFlipped: false } : c));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const handleHangmanGuess = (letter: string) => {
    const currentHangman = MOCK_HANGMAN_LEVELS[hangmanIndex];
    const word = currentHangman.word;
    if (word.includes(letter)) {
      playSound('correct');
      const newGuessed = [...guessedLetters, letter];
      setGuessedLetters(newGuessed);
      if (word.split('').every(l => newGuessed.includes(l))) {
        const nextScore = hangmanScore + 15;
        setHangmanScore(nextScore);
        if (hangmanIndex < MOCK_HANGMAN_LEVELS.length - 1) {
          setTimeout(() => {
            setHangmanIndex(prev => prev + 1);
            setGuessedLetters([]);
            setWrongGuesses([]);
          }, 1500);
        } else {
          onPointsAdd(nextScore);
          setTimeout(() => {
            playSound('victory');
            setGameState('result');
          }, 500);
        }
      }
    } else {
      playSound('error');
      setHangmanScore(prev => Math.max(0, prev - 2));
      const newWrong = [...wrongGuesses, letter];
      setWrongGuesses(newWrong);
      if (newWrong.length >= 6) {
        setTimeout(() => {
          playSound('defeat');
          setGameState('result');
        }, 500);
      }
    }
  };

  const resetGame = () => {
    setActiveGame(null);
    setGameState('lobby');
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setSelectedOption(null);
    setGuessedLetters([]);
    setWrongGuesses([]);
    setHangmanIndex(0);
    setHangmanScore(0);
    setWsLevel(0);
    setWsScore(0);
    setMemoryLevel(0);
    setMemoryMoves(0);
    setMemoryPoints(0);
  };

  const leaderboard = [
    { name: 'Lucas Silva', points: 1250 },
    { name: 'Ana Souza', points: 1100 },
    { name: 'Pedro Santos', points: 950 },
    { name: user.name, points: user.points, isCurrentUser: true }
  ].sort((a, b) => b.points - a.points);

  if (gameState === 'playing') {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-4">
            <button onClick={resetGame} className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={14} /> Abandonar
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
          <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-primary">
              Nível
            </span>
            <span className="font-display text-lg text-slate-900 dark:text-white">
              {activeGame === 'quiz' ? `${currentQuestionIndex + 1}/${MOCK_QUESTIONS.length}` : 
               activeGame === 'memory' ? `${memoryLevel + 1}/20` : 
               activeGame === 'wordsearch' ? `${wsLevel + 1}/20` : 
               `${hangmanIndex + 1}/20`}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeGame === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 px-4 py-1 bg-primary/10 rounded-bl-2xl">
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary">{MOCK_QUESTIONS[currentQuestionIndex].difficulty}</span>
                </div>
                <h3 className="font-display text-3xl text-slate-900 dark:text-white tracking-tight leading-tight">{MOCK_QUESTIONS[currentQuestionIndex].text}</h3>
              </div>
              <div className="space-y-4">
                {MOCK_QUESTIONS[currentQuestionIndex].options.map((option, idx) => (
                  <button key={idx} onClick={() => setSelectedOption(idx)} className={cn("w-full p-5 flex justify-between items-center rounded-3xl font-bold text-sm border-2 transition-all", selectedOption === idx ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary scale-[1.02]" : "border-white dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 shadow-sm")}>
                    {option}
                  </button>
                ))}
              </div>
              <button disabled={selectedOption === null} onClick={handleNextQuiz} className="w-full py-5 primary-gradient text-white font-display text-xl rounded-2xl shadow-xl shadow-primary/30 disabled:opacity-50">
                {currentQuestionIndex < MOCK_QUESTIONS.length - 1 ? 'Próxima Pergunta' : 'Ver Resultado'}
              </button>
            </motion.div>
          )}

          {activeGame === 'memory' && (
            <motion.div key="memory" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
              {cards.map(card => (
                <button key={card.id} onClick={() => handleCardClick(card.id)} className={cn("aspect-square rounded-2xl flex items-center justify-center transition-all duration-500", card.isFlipped || card.isMatched ? "bg-primary text-white" : "bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 shadow-sm")}>
                  {(card.isFlipped || card.isMatched) && <card.icon size={24} />}
                </button>
              ))}
            </motion.div>
          )}

          {activeGame === 'hangman' && (
            <motion.div key="hangman" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 sm:space-y-10 text-center">
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase text-primary mb-2">Dica</p>
                <h3 className="font-display text-xl sm:text-2xl text-slate-400 dark:text-slate-500 italic">"{MOCK_HANGMAN_LEVELS[hangmanIndex].hint}"</h3>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {MOCK_HANGMAN_LEVELS[hangmanIndex].word.split('').map((letter, i) => (
                  <div key={i} className="w-8 sm:w-10 h-10 sm:h-12 bg-white dark:bg-slate-900 border-b-4 border-slate-100 dark:border-slate-800 flex items-center justify-center font-display text-xl sm:text-2xl text-slate-900 dark:text-white transition-all">
                    {guessedLetters.includes(letter) ? letter : ''}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 sm:gap-2 max-w-sm mx-auto">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
                  <button key={l} disabled={guessedLetters.includes(l) || wrongGuesses.includes(l)} onClick={() => handleHangmanGuess(l)} className={cn("aspect-square w-full rounded-xl font-black text-xs transition-all flex items-center justify-center", guessedLetters.includes(l) ? "bg-green-100 dark:bg-green-500/10 text-green-600" : wrongGuesses.includes(l) ? "bg-red-50 dark:bg-red-500/10 opacity-50" : "bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-400")}>
                    {l}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {activeGame === 'wordsearch' && (
            <motion.div key="wordsearch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-[10px] font-black uppercase text-primary mb-1">Tema</p>
                <h4 className="font-display text-xl text-slate-900 dark:text-white">{MOCK_WORDSEARCH_LEVELS[wsLevel].theme}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-10 gap-0.5 sm:gap-1 max-w-md mx-auto">
                {wsGrid.map((row, ri) => row.map((cell, ci) => {
                  const isSelected = wsSelection.some(s => s.r === ri && s.c === ci);
                  return (
                    <button 
                      key={`${ri}-${ci}`} 
                      onClick={() => handleWSClick(ri, ci)}
                      className={cn(
                        "aspect-square flex items-center justify-center text-[9px] sm:text-xs font-black rounded-md sm:rounded-lg transition-all",
                        cell.isFound ? "bg-green-500 text-white" : 
                        isSelected ? "bg-primary text-white scale-110" : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                      )}
                    >
                      {cell.char}
                    </button>
                  );
                }))}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {MOCK_WORDSEARCH_LEVELS[wsLevel].words.map(word => (
                  <span key={word} className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                    wsFoundWords.includes(word) ? "bg-green-100 dark:bg-green-500/10 text-green-600 border-green-200 dark:border-green-500/20" : "bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800"
                  )}>
                    {word}
                  </span>
                ))}
              </div>
              <button onClick={() => setWsSelection([])} className="w-full text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 hover:text-primary transition-colors">
                Limpar Seleção
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (gameState === 'result') {
    const finalScore = activeGame === 'quiz' ? quizScore : activeGame === 'memory' ? memoryPoints : activeGame === 'wordsearch' ? wsScore : hangmanScore;
    return (
      <div className="flex flex-col items-center justify-center space-y-12 py-8 text-center max-w-sm mx-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-40 h-40 bg-secondary/10 rounded-full flex items-center justify-center border-8 border-white dark:border-slate-800 shadow-xl">
          <Trophy size={64} className="text-secondary" />
        </motion.div>
        <div>
          <h2 className="font-display text-5xl text-slate-900 dark:text-white italic">Parabéns!</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest mt-3 text-[10px]">Desafio concluído com sucesso</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 w-full grid grid-cols-2 gap-8">
          <div className="text-center">
            <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">XP Ganho</p>
            <p className="font-display text-4xl text-primary">+{finalScore}</p>
          </div>
          <div className="text-center border-l border-slate-50 dark:border-slate-800">
            <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">Seu Total</p>
            <p className="font-display text-4xl text-slate-900 dark:text-white">{user.points}</p>
          </div>
        </div>
        <button onClick={resetGame} className="w-full py-5 primary-gradient text-white font-display text-xl rounded-2xl shadow-xl">
          Voltar para Arena
        </button>
      </div>
    );
  }

  const isVisitor = user.role === 'visitor';

  return (
    <div className="space-y-12">
      <header className="px-2 flex items-center justify-between">
        <div>
          <h2 className="font-display text-4xl text-slate-900 dark:text-white tracking-tight">Arena Bíblica</h2>
          <p className="text-primary font-bold text-[10px] uppercase tracking-widest">
            {isVisitor ? 'Visualização de Jogos' : 'Escolha seu jogo'}
          </p>
        </div>
        {isVisitor && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40">
            <Eye size={14} /> Modo Visitante
          </div>
        )}
      </header>

      {isVisitor && (
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Lock size={22} />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white leading-tight">
              Jogos restritos a membros da célula
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
              Para jogar o Quiz Bíblico, Jogo da Memória, Caça-Palavras e acumular pontos de XP no Hall da Fama, realize o cadastro rápido como membro na aba Perfil ou na tela inicial.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {[
          { id: 'quiz', title: 'Quiz Bíblico', desc: '20 Níveis • Crescente', icon: Brain, color: 'text-primary' },
          { id: 'memory', title: 'Memória', desc: '20 Níveis • Atenção', icon: LayoutGrid, color: 'text-secondary' },
          { id: 'wordsearch', title: 'Caça-Palavras', desc: '20 Níveis • Vocabulário', icon: Star, color: 'text-green-500' },
          { id: 'hangman', title: 'Forca Bíblica', desc: '20 Níveis • Conhecimento', icon: Gamepad2, color: 'text-orange-500' }
        ].map((game) => (
          <button 
            key={game.id} 
            disabled={isVisitor}
            onClick={() => { 
              if (isVisitor) return;
              setActiveGame(game.id as any); 
              if(game.id === 'memory') initMemoryGame();
              if(game.id === 'wordsearch') initWordSearch(0);
              if(game.id === 'hangman') {
                setHangmanIndex(0);
                setGuessedLetters([]);
                setWrongGuesses([]);
              }
              setGameState('playing'); 
            }} 
            className={cn(
              "bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group transition-all",
              isVisitor 
                ? "opacity-60 cursor-not-allowed hover:border-slate-200" 
                : "hover:scale-[1.02] cursor-pointer"
            )}
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-2xl text-slate-900 dark:text-white mb-1">{game.title}</h3>
                {isVisitor && <Lock size={15} className="text-slate-400 mb-1" />}
              </div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{game.desc}</p>
            </div>
            <game.icon className={cn("transition-colors", game.color)} size={40} />
          </button>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Hall da Fama</h2>
          <Trophy size={18} className="text-secondary" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
          {leaderboard.map((l, i) => (
            <div key={l.name} className={cn("p-6 flex items-center justify-between border-b dark:border-slate-800 last:border-0", l.isCurrentUser && "bg-primary/5 dark:bg-primary/10")}>
              <div className="flex items-center gap-4">
                <span className="font-display text-xl text-slate-200 dark:text-slate-800">{i + 1}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{l.name}</span>
              </div>
              <span className="font-display text-slate-900 dark:text-slate-100">{l.points} XP</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

