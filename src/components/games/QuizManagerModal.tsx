import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, CheckCircle2, Shield, Brain, HelpCircle, Star } from 'lucide-react';
import { Question } from '../../types';
import { cn } from '../../lib/utils';

interface QuizManagerModalProps {
  isOpen: boolean;
  questions: Question[];
  onClose: () => void;
  onAddQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onResetQuestions: () => void;
}

export const QuizManagerModal: React.FC<QuizManagerModalProps> = ({
  isOpen,
  questions,
  onClose,
  onAddQuestion,
  onDeleteQuestion,
  onResetQuestions,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState('');
  const [option0, setOption0] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [option3, setOption3] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !option0.trim() || !option1.trim()) return;

    const options = [option0.trim(), option1.trim(), option2.trim() || 'Nenhuma das anteriores', option3.trim() || 'Todas as anteriores'];

    const newQuestion: Question = {
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      text: text.trim(),
      options,
      correctAnswer,
      difficulty,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30,
    };

    onAddQuestion(newQuestion);
    setIsAdding(false);
    setText('');
    setOption0('');
    setOption1('');
    setOption2('');
    setOption3('');
    setCorrectAnswer(0);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 relative my-6 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Brain size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-1.5">
                  Gerenciar Quiz Bíblico
                  <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full uppercase">
                    Admin
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {questions.length} perguntas cadastradas para a célula
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {!isAdding ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Perguntas Ativas
                  </p>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Plus size={14} /> Adicionar Nova Pergunta
                  </button>
                </div>

                <div className="space-y-2.5">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">
                            {q.text}
                          </p>
                        </div>
                        <button
                          onClick={() => onDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Excluir pergunta"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pl-8 text-xs">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={cn(
                              'px-2 py-1 rounded-lg truncate flex items-center gap-1',
                              oIdx === q.correctAnswer
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                            )}
                          >
                            {oIdx === q.correctAnswer && <CheckCircle2 size={12} className="shrink-0" />}
                            <span className="truncate">{opt}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pl-8 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                        <span>Dificuldade: {q.difficulty}</span>
                        <span>•</span>
                        <span>{q.points} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Cadastrar Nova Pergunta Bíblica
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                  >
                    Voltar
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">
                    Enunciado da Pergunta *
                  </label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ex: Em qual monte Moisés recebeu as tábuas da Lei?"
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">
                    4 Opções de Resposta (Selecione a Correta)
                  </label>

                  {[
                    { val: option0, set: setOption0, idx: 0, placeholder: 'Opção 1 (ex: Monte Sinai)' },
                    { val: option1, set: setOption1, idx: 1, placeholder: 'Opção 2 (ex: Monte Moriá)' },
                    { val: option2, set: setOption2, idx: 2, placeholder: 'Opção 3 (ex: Monte das Oliveiras)' },
                    { val: option3, set: setOption3, idx: 3, placeholder: 'Opção 4 (ex: Monte Carmelo)' },
                  ].map((field) => (
                    <div key={field.idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={correctAnswer === field.idx}
                        onChange={() => setCorrectAnswer(field.idx)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Marcar como resposta correta"
                      />
                      <input
                        type="text"
                        value={field.val}
                        onChange={(e) => field.set(e.target.value)}
                        placeholder={field.placeholder}
                        required={field.idx < 2}
                        className={cn(
                          'flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border text-sm font-medium focus:outline-none transition-all',
                          correctAnswer === field.idx
                            ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        )}
                      />
                    </div>
                  ))}
                  <p className="text-[10px] text-emerald-600 font-semibold pl-6">
                    A bolinha verde marca qual alternativa é a resposta correta no quiz.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">
                      Nível de Dificuldade
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="easy">Fácil (10 XP)</option>
                      <option value="medium">Médio (20 XP)</option>
                      <option value="hard">Difícil (30 XP)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Salvar Pergunta
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
            <button
              type="button"
              onClick={onResetQuestions}
              className="text-slate-400 hover:text-red-500 text-xs font-bold transition-colors cursor-pointer"
            >
              Restaurar Perguntas Padrão
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Concluído
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
