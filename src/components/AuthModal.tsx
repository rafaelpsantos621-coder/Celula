import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Eye, Sparkles, Heart, Shield, ArrowRight, Sun, Moon, CheckCircle2, UserCheck } from 'lucide-react';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onSuccess: (user: User) => void;
}

const FAMILY_ROLES = [
  'Pai de Família',
  'Mãe de Família',
  'Filho(a) / Jovem',
  'Casal',
  'Avô / Avó',
  'Membro da Célula',
];

export const AuthModal: React.FC<AuthModalProps> = ({ isDark, onToggleTheme, onSuccess }) => {
  // Tab: 'choose' | 'member' | 'visitor'
  const [activeTab, setActiveTab] = useState<'choose' | 'member' | 'visitor'>('choose');

  // Member Registration Fields
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [familyRole, setFamilyRole] = useState(FAMILY_ROLES[0]);

  // Visitor Quick Entry Fields
  const [visitorName, setVisitorName] = useState('');

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = memberName.trim();
    if (!trimmed) return;

    const isAdm = trimmed.toLowerCase().includes('adm') || trimmed.toLowerCase().includes('pastor');
    const role: UserRole = isAdm ? 'admin' : 'member';

    const newUser: User = {
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      name: trimmed,
      role,
      points: 0,
      phone: memberPhone.trim() || undefined,
      familyRole,
      joinedAt: Date.now(),
    };

    onSuccess(newUser);
  };

  const handleVisitorEnter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = visitorName.trim() || 'Visitante Especial';

    const newUser: User = {
      id: 'v_' + Math.random().toString(36).substring(2, 9),
      name: finalName,
      role: 'visitor',
      points: 0,
      bio: 'Visitante conhecendo a Célula Despertar',
      joinedAt: Date.now(),
    };

    onSuccess(newUser);
  };

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative',
        isDark ? 'bg-slate-950' : 'bg-slate-50'
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-900 p-6 sm:p-9 rounded-[2.5rem] shadow-2xl w-full max-w-md relative overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className="absolute top-0 left-0 w-full h-2 primary-gradient" />

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          type="button"
          aria-label="Alternar tema"
          className="absolute top-6 right-6 w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-primary dark:hover:text-primary flex items-center justify-center transition-all cursor-pointer"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider mb-2">
            <Sparkles size={12} /> Célula Despertar
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            Seja bem-vindo<span className="text-primary italic">!</span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium mt-1">
            Edificando famílias, fortalecendo lares no propósito de Deus
          </p>
        </div>

        {/* Choose Tab / Options Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('member')}
            className={cn(
              'py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeTab === 'member'
                ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Users size={15} />
            <span>Sou Membro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visitor')}
            className={cn(
              'py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeTab === 'visitor'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Eye size={15} />
            <span>Sou Visitante</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* TAB 1: SELETOR INICIAL CASO NÃO TENHA SELECIONADO */}
          {activeTab === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div
                onClick={() => setActiveTab('member')}
                className="p-4 sm:p-5 rounded-3xl border-2 border-primary/20 hover:border-primary bg-primary/5 dark:bg-primary/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl primary-gradient text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
                    <Users size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                      Entrar como Membro
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Cadastro rápido para participar do chat, posts na comunidade, jogos e escalas.
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('visitor')}
                className="p-4 sm:p-5 rounded-3xl border-2 border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                    <Eye size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                        Acesso Visitante
                      </h3>
                      <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        Sem Cadastro
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Entrada direta para conhecer nossos devocionais, agenda e locais sem editar nada.
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CADASTRO SIMPLES DO MEMBRO */}
          {activeTab === 'member' && (
            <motion.form
              key="member"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleMemberSubmit}
              className="space-y-4"
            >
              <div className="bg-primary/5 dark:bg-primary/10 p-3 rounded-2xl border border-primary/15 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <UserCheck size={18} className="text-primary shrink-0" />
                <span>Cadastro exclusivo para a família e membros da nossa célula.</span>
              </div>

              {/* Nome */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  Seu Nome ou Apelido *
                </label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Ex: Rafael Santos, Maria..."
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary text-sm text-slate-900 dark:text-white font-medium transition-all"
                  required
                  autoFocus
                />
              </div>

              {/* Telefone / WhatsApp Opcional */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    WhatsApp / Telefone
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold">(Opcional)</span>
                </div>
                <input
                  type="tel"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="(DDD) 99999-9999"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary text-sm text-slate-900 dark:text-white transition-all"
                />
              </div>

              {/* Papel no Lar / Célula */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  Na Família / Célula
                </label>
                <select
                  value={familyRole}
                  onChange={(e) => setFamilyRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary text-sm text-slate-900 dark:text-white font-medium transition-all cursor-pointer"
                >
                  {FAMILY_ROLES.map((role) => (
                    <option key={role} value={role} className="dark:bg-slate-900">
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botão de Finalizar */}
              <button
                type="submit"
                disabled={!memberName.trim()}
                className="w-full py-4 mt-2 primary-gradient text-white font-display text-lg rounded-2xl shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                Concluir Cadastro & Entrar
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('visitor')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium py-1"
              >
                Apenas visitando? <span className="text-emerald-600 font-bold underline">Entre como visitante</span>
              </button>
            </motion.form>
          )}

          {/* TAB 3: ENTRADA DIRETA COMO VISITANTE */}
          {activeTab === 'visitor' && (
            <motion.div
              key="visitor"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-3xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wide">
                  <Eye size={16} /> Modo Visitante Ativo
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Você terá acesso completo para conhecer os <strong>devocionais diários</strong>, 
                  <strong> versículo do dia</strong>, <strong>agenda de encontros</strong> e <strong>local das reuniões</strong>.
                </p>
                <div className="pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-slate-500 dark:text-slate-400">
                  🔒 Recursos de escrita (chat, postar na comunidade e jogos) ficam restritos aos membros cadastrados.
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Como podemos te chamar?
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold">(Opcional)</span>
                </div>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Ex: Visitante Amigo (ou deixe em branco)"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 text-sm text-slate-900 dark:text-white transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => handleVisitorEnter()}
                className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-display text-lg rounded-2xl shadow-lg shadow-emerald-600/25 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Entrar Direto no App</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('member')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium py-1"
              >
                Já faz parte da célula? <span className="text-primary font-bold underline">Faça seu cadastro de membro</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
