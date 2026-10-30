import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Eye,
  Sparkles,
  Shield,
  ArrowRight,
  Sun,
  Moon,
  UserCheck,
  Lock,
  Database,
} from 'lucide-react';
import { User, UserRole, CellMember } from '../types';
import { cn } from '../lib/utils';
import { PWAInstallButton } from './PWAInstallButton';
import { getProfilesFromDB, saveProfileToDB } from '../lib/cellDatabase';

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
  'Pastor / Líder',
];

const ADMIN_DEFAULT_PIN = 'admin123';
const ADMIN_ALT_PIN = 'despertar2026';

export const AuthModal: React.FC<AuthModalProps> = ({ isDark, onToggleTheme, onSuccess }) => {
  // Tab: 'choose' | 'member' | 'admin' | 'visitor'
  const [activeTab, setActiveTab] = useState<'choose' | 'member' | 'admin' | 'visitor'>('choose');

  // Saved profiles from DB for 1-click login
  const [savedProfiles, setSavedProfiles] = useState<CellMember[]>([]);

  useEffect(() => {
    getProfilesFromDB().then((list) => setSavedProfiles(list)).catch(() => {});
  }, []);

  // Member Registration Fields
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [familyRole, setFamilyRole] = useState(FAMILY_ROLES[0]);

  // Admin Registration Fields
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Visitor Quick Entry Fields
  const [visitorName, setVisitorName] = useState('');

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = memberName.trim();
    if (!trimmed) return;

    // Check if profile with same name already exists in DB to restore points/photo
    const existing = savedProfiles.find(
      (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    const isAdm = trimmed.toLowerCase().includes('adm') || trimmed.toLowerCase().includes('pastor');
    const role: UserRole = existing ? existing.role : isAdm ? 'admin' : 'member';

    const newUser: User = {
      id: existing ? existing.id : 'm_' + Math.random().toString(36).substring(2, 9),
      name: trimmed,
      role,
      points: existing ? existing.points : 0,
      avatarUrl: existing?.avatarUrl,
      bio: existing?.bio,
      phone: memberPhone.trim() || existing?.phone || undefined,
      familyRole: familyRole || existing?.familyRole,
      joinedAt: existing?.joinedAt || Date.now(),
    };

    saveProfileToDB(newUser).catch(() => {});
    onSuccess(newUser);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const trimmed = adminName.trim();
    if (!trimmed) {
      setAdminError('Informe o seu nome de líder.');
      return;
    }

    const cleanPass = adminPassword.trim().toLowerCase();
    if (cleanPass !== ADMIN_DEFAULT_PIN && cleanPass !== ADMIN_ALT_PIN && cleanPass !== '1234') {
      setAdminError(`Senha incorreta. A senha padrão do líder é: ${ADMIN_DEFAULT_PIN}`);
      return;
    }

    const newUser: User = {
      id: 'adm_' + Math.random().toString(36).substring(2, 9),
      name: trimmed,
      role: 'admin',
      points: 50,
      familyRole: 'Pastor / Líder',
      bio: 'Liderança da Célula Despertar • Acesso Total de Edição',
      joinedAt: Date.now(),
    };

    onSuccess(newUser);
  };

  const handleQuickAdminLogin = () => {
    const newUser: User = {
      id: 'adm_leader',
      name: 'Pastor / Líder da Célula',
      role: 'admin',
      points: 100,
      familyRole: 'Pastor / Líder',
      bio: 'Conta de Liderança Oficial • Acesso Total às Páginas',
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
        className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md relative overflow-hidden border border-slate-100 dark:border-slate-800"
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
        <div className="text-center mb-5 pt-2">
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

        {/* Fast PWA Installer Banner on Auth Screen */}
        <PWAInstallButton variant="auth" />

        {/* Choose Tab / Options Selector (3 Tabs) */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('member')}
            className={cn(
              'py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate',
              activeTab === 'member'
                ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Users size={14} />
            <span>Membro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={cn(
              'py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate',
              activeTab === 'admin'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Shield size={14} />
            <span>Líder / Admin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visitor')}
            className={cn(
              'py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate',
              activeTab === 'visitor'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Eye size={14} />
            <span>Visitante</span>
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
              className="space-y-3"
            >
              <div
                onClick={() => setActiveTab('admin')}
                className="p-4 rounded-3xl border-2 border-amber-500/25 hover:border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                    <Shield size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display font-bold text-base text-slate-900 dark:text-white leading-tight">
                        Conta de Líder / Admin
                      </h3>
                      <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        Edição Total
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Acesso completo para editar lema, devocionais, escalas, membros e avisos.
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('member')}
                className="p-4 rounded-3xl border-2 border-primary/20 hover:border-primary bg-primary/5 dark:bg-primary/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl primary-gradient text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
                    <Users size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white leading-tight">
                      Entrar como Membro
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Para interagir no chat, postar na comunidade, jogos bíblicos e eventos.
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('visitor')}
                className="p-4 rounded-3xl border-2 border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                    <Eye size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display font-bold text-base text-slate-900 dark:text-white leading-tight">
                        Acesso Visitante
                      </h3>
                      <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        Sem Cadastro
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Entrada direta para ler devocionais, agenda e local da célula.
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CONTA ADMIN / LÍDER */}
          {activeTab === 'admin' && (
            <motion.form
              key="admin"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleAdminSubmit}
              className="space-y-4"
            >
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                  <Shield size={16} /> Acesso de Edição e Liderança
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Permite editar o <strong>Lema da Célula</strong>, alterar <strong>Devocionais</strong>, gerenciar <strong>Escalas e Eventos</strong>, moderar o Chat e a lista de membros.
                </p>
                <div className="pt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  🔑 Senha padrão de liderança: <code className="bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded font-mono font-bold">admin123</code>
                </div>
              </div>

              {adminError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 font-semibold">
                  {adminError}
                </div>
              )}

              {/* Nome do Líder */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  Seu Nome ou Título de Liderança *
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Ex: Pastor Rafael, Líder Débora..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-sm text-slate-900 dark:text-white font-medium transition-all"
                  required
                  autoFocus
                />
              </div>

              {/* Senha do Líder */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Senha de Administrador *
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    (Use admin123)
                  </span>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Digite admin123"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-sm text-slate-900 dark:text-white font-medium transition-all"
                    required
                  />
                </div>
              </div>

              {/* Botão de Entrar como Admin */}
              <button
                type="submit"
                className="w-full py-4 mt-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-display text-lg rounded-2xl shadow-lg shadow-amber-600/25 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Shield size={18} />
                <span>Entrar como Administrador</span>
              </button>

              {/* Botão de Entrada Rápida Pré-configurada */}
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-500" />
                <span>Entrar direto como "Pastor / Líder da Célula"</span>
              </button>
            </motion.form>
          )}

          {/* TAB 3: CADASTRO SIMPLES DO MEMBRO */}
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
                onClick={() => setActiveTab('admin')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium py-1"
              >
                É o líder da célula? <span className="text-amber-600 font-bold underline">Entrar como Administrador</span>
              </button>
            </motion.form>
          )}

          {/* TAB 4: ENTRADA DIRETA COMO VISITANTE */}
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
