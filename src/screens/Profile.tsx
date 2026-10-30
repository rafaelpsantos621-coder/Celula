import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Save,
  Star,
  Shield,
  User as UserIcon,
  LogOut,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Share2,
  Eye,
  UserCheck,
  Phone,
  Home,
  KeyRound,
  Sparkles,
  Lock,
  X,
  Database,
} from 'lucide-react';
import { User as UserType, CellMember } from '../types';
import { cn } from '../lib/utils';
import { getSupabase } from '../lib/supabase';
import { DatabaseModal } from '../components/DatabaseModal';
import { uploadAndSaveImageToDB, saveProfileToDB } from '../lib/cellDatabase';

export default function Profile({
  user,
  onUpdate,
  onLogout,
  onOpenShare,
}: {
  user: UserType;
  onUpdate: (u: UserType) => void;
  onLogout: () => void;
  onOpenShare?: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [familyRole, setFamilyRole] = useState(user.familyRole || 'Membro da Célula');
  const [role, setRole] = useState(user.role);
  const [showDBModal, setShowDBModal] = useState(false);

  // Filter out any legacy illustrated avatars (dicebear)
  const initialPhoto =
    user.avatarUrl && !user.avatarUrl.includes('dicebear') ? user.avatarUrl : '';

  const [avatarUrl, setAvatarUrl] = useState<string>(initialPhoto);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Admin Switcher
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const handleActivateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminPin.trim().toLowerCase();
    if (clean !== 'admin123' && clean !== 'despertar2026' && clean !== '1234') {
      setAdminPinError('Senha incorreta. A senha padrão do líder é: admin123');
      return;
    }

    setRole('admin');
    const updated: UserType = {
      ...user,
      role: 'admin',
      familyRole: 'Pastor / Líder',
      bio: user.bio || 'Liderança da Célula • Acesso Total de Edição',
      points: Math.max(user.points, 100),
    };
    onUpdate(updated);
    localStorage.setItem('cell_user', JSON.stringify(updated));
    saveProfileToDB(updated).catch(() => {});
    setShowAdminPinModal(false);
    setAdminPin('');
    setAdminPinError('');
  };

  const handleDemoteToMember = () => {
    setRole('member');
    const updated: UserType = {
      ...user,
      role: 'member',
      familyRole: familyRole === 'Pastor / Líder' ? 'Membro da Célula' : familyRole,
    };
    onUpdate(updated);
    localStorage.setItem('cell_user', JSON.stringify(updated));
    saveProfileToDB(updated).catch(() => {});
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCustomPhoto = Boolean(avatarUrl && !avatarUrl.includes('dicebear'));

  const handleOpenPhotoPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoNotice({
        type: 'error',
        message: 'Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP, etc.).',
      });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setPhotoNotice({
        type: 'error',
        message: 'A foto selecionada é muito grande. Escolha uma imagem de até 25 MB.',
      });
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoNotice(null);

    try {
      const savedImg = await uploadAndSaveImageToDB({
        file,
        title: `Foto de Perfil - ${name || user.name}`,
        category: 'profile',
        user,
      });

      const finalAvatarUrl = savedImg.dataUrl || savedImg.url;
      setAvatarUrl(finalAvatarUrl);

      // Automatically update profile state, localStorage, and DB
      const updatedUser: UserType = {
        ...user,
        name,
        bio,
        avatarUrl: finalAvatarUrl,
      };
      onUpdate(updatedUser);
      await saveProfileToDB(updatedUser);
      try {
        localStorage.setItem('cell_user', JSON.stringify(updatedUser));
      } catch {
        // Ignore quota errors if any
      }

      setPhotoNotice({
        type: 'success',
        message: 'Foto salva no perfil e no Banco de Dados!',
      });

      setTimeout(() => {
        setPhotoNotice((curr) => (curr?.type === 'success' ? null : curr));
      }, 4000);
    } catch {
      setPhotoNotice({
        type: 'error',
        message: 'Falha ao processar a foto. Tente novamente com outra imagem.',
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    const updatedUser: UserType = {
      ...user,
      name,
      bio,
      avatarUrl: undefined,
    };
    onUpdate(updatedUser);
    saveProfileToDB(updatedUser).catch(() => {});
    try {
      localStorage.setItem('cell_user', JSON.stringify(updatedUser));
    } catch {
      // Ignore
    }
    setPhotoNotice({
      type: 'success',
      message: 'Foto removida.',
    });
    setTimeout(() => {
      setPhotoNotice(null);
    }, 3000);
  };

  const handleSwitchProfile = (member: CellMember) => {
    const switchedUser: UserType = {
      id: member.id,
      name: member.name,
      role: member.role,
      points: member.points || 0,
      avatarUrl: member.avatarUrl,
      bio: member.bio,
      phone: member.phone,
      familyRole: member.familyRole,
      joinedAt: member.joinedAt,
    };
    setName(switchedUser.name);
    setBio(switchedUser.bio || '');
    setPhone(switchedUser.phone || '');
    setFamilyRole(switchedUser.familyRole || 'Membro da Célula');
    setRole(switchedUser.role);
    setAvatarUrl(switchedUser.avatarUrl || '');
    onUpdate(switchedUser);
    localStorage.setItem('cell_user', JSON.stringify(switchedUser));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    const updatedUser: UserType = {
      ...user,
      name,
      bio,
      phone: phone.trim() || undefined,
      familyRole,
      role,
      avatarUrl: avatarUrl || undefined,
    };

    try {
      const supabase = getSupabase();

      if (supabase) {
        try {
          // Sync with Supabase if online and configured
          // Use Promise.race with a 3-second timeout so offline/broken endpoints don't hang
          const syncPromise = supabase
            .from('profiles')
            .upsert({
              id: user.id,
              name: name,
              avatar_url: avatarUrl || null,
              bio: bio,
              updated_at: new Date().toISOString(),
            });

          const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
            setTimeout(() => resolve({ error: { message: 'Timeout: Supabase inacessível' } }), 3000)
          );

          const result = await Promise.race([syncPromise, timeoutPromise]);
          if (result && 'error' in result && result.error) {
            console.warn('Supabase remoto inacessível ou desconectado. Dados salvos localmente.');
          }
        } catch {
          console.warn('Falha na sincronização remota com Supabase. Dados salvos localmente.');
        }
      }

      onUpdate(updatedUser);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      // In case of unexpected local error, still guarantee local state update
      onUpdate(updatedUser);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Hidden file input for uploading profile photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      <div className="text-center">
        {/* Avatar Container with interactive Camera button */}
        <div className="relative inline-block group">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenPhotoPicker}
            role="button"
            tabIndex={0}
            aria-label="Adicionar ou alterar foto de perfil"
            className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl primary-gradient flex items-center justify-center cursor-pointer relative bg-slate-100 dark:bg-slate-800"
          >
            {hasCustomPhoto ? (
              <img
                src={avatarUrl}
                alt={name}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-200',
                  isUploadingPhoto ? 'opacity-30' : 'opacity-100'
                )}
                onError={() => {
                  setAvatarUrl('');
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white select-none">
                <span className="font-display text-4xl font-bold tracking-tight">
                  {name ? name.trim().charAt(0).toUpperCase() : <UserIcon size={44} />}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-80">
                  Sem foto
                </span>
              </div>
            )}

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
              <Camera size={24} className="mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                {hasCustomPhoto ? 'Trocar Foto' : 'Adicionar Foto'}
              </span>
            </div>

            {/* Uploading Spinner */}
            {isUploadingPhoto && (
              <div className="absolute inset-0 bg-slate-900/75 flex flex-col items-center justify-center text-white">
                <Loader2 size={26} className="animate-spin text-primary mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Enviando...</span>
              </div>
            )}
          </motion.div>

          {/* Camera Button directly on avatar */}
          <button
            type="button"
            onClick={handleOpenPhotoPicker}
            disabled={isUploadingPhoto}
            title={hasCustomPhoto ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
            aria-label="Adicionar foto de perfil"
            className="absolute -bottom-1 -right-1 p-3.5 bg-primary text-white border-2 border-white dark:border-slate-900 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer z-10"
          >
            {isUploadingPhoto ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          </button>
        </div>

        {/* Quick action buttons for photo */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={handleOpenPhotoPicker}
            disabled={isUploadingPhoto}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Upload size={14} />
            {hasCustomPhoto ? 'Trocar Foto' : 'Adicionar Foto'}
          </button>

          {hasCustomPhoto && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 dark:bg-slate-800 dark:hover:bg-red-950/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Remover foto"
            >
              <Trash2 size={14} />
              Remover Foto
            </button>
          )}
        </div>

        {/* Photo Upload Notice (Success or Error) */}
        <AnimatePresence>
          {photoNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className={cn(
                'mt-3 mx-auto max-w-sm px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm',
                photoNotice.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              )}
            >
              {photoNotice.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-red-500 shrink-0" />
              )}
              <span>{photoNotice.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="mt-4 font-display text-2xl text-slate-900 dark:text-white">{user.name}</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={cn(
            "px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1",
            user.role === 'visitor' 
              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
              : user.role === 'admin'
              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
              : "bg-primary/10 text-primary"
          )}>
            {user.role === 'admin' ? <Shield size={10} /> : user.role === 'visitor' ? <Eye size={10} /> : <UserIcon size={10} />}
            {user.role === 'visitor' ? 'Visitante' : user.role === 'admin' ? 'Líder / Admin' : 'Membro'}
          </span>
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
            <Star size={10} fill="currentColor" />
            {user.points} XP
          </span>
        </div>

        {user.role === 'admin' && (
          <div className="mt-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/15 border border-amber-500/30 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Shield size={16} /> Conta de Administrador Ativa
              </div>
              <span className="text-[9px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full uppercase">
                Edição Total
              </span>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
              Com esta conta você tem acesso exclusivo para editar todas as páginas da Célula Despertar:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-1.5 p-2 bg-white/60 dark:bg-slate-800/60 rounded-xl">
                <span>✨</span> <strong>Início:</strong> Editar Banner & Devocional
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-white/60 dark:bg-slate-800/60 rounded-xl">
                <span>📅</span> <strong>Agenda:</strong> Eventos & Escalas
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-white/60 dark:bg-slate-800/60 rounded-xl">
                <span>📌</span> <strong>Comunidade:</strong> Fixar Comunicados & Moderar
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-white/60 dark:bg-slate-800/60 rounded-xl">
                <span>🧠</span> <strong>Quizzes:</strong> Adicionar Perguntas Bíblicas
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDemoteToMember}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[11px] font-bold cursor-pointer underline underline-offset-2"
              >
                Alternar para Modo Membro Comum (Teste)
              </button>
            </div>
          </div>
        )}

        {user.role !== 'admin' && (
          <div className="mt-4 p-4 rounded-3xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
                <Shield size={16} className="text-amber-500" /> Acesso de Liderança
              </div>
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                (Senha: admin123)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3 leading-snug">
              É líder ou pastor da célula? Ative a conta de administrador para ter acesso total de edição das páginas.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowAdminPinModal(true);
                setAdminPin('');
                setAdminPinError('');
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <KeyRound size={14} /> Ativar Modo Administrador
            </button>
          </div>
        )}

        {user.role === 'visitor' && (
          <div className="mt-4 p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-left">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider mb-1">
              <UserCheck size={16} /> Tornar-se Membro Oficial
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-snug">
              Cadastre-se para liberar o envio de mensagens no Chat, publicar testemunhos e jogar os quizzes bíblicos!
            </p>
            <button
              type="button"
              onClick={() => {
                setRole('member');
                const updated: UserType = {
                  ...user,
                  role: 'member',
                  name: name || user.name,
                  phone: phone.trim() || undefined,
                  familyRole,
                };
                onUpdate(updated);
                try {
                  localStorage.setItem('cell_user', JSON.stringify(updated));
                  fetch('/api/members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated),
                  }).catch(() => {});
                } catch {}
              }}
              className="w-full py-2.5 primary-gradient text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserCheck size={14} /> Ativar Conta de Membro Agora
            </button>
          </div>
        )}
      </div>

      <section className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Nome de Exibição
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-primary transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              WhatsApp / Telefone (Opcional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(DDD) 99999-9999"
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-primary transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Papel na Família / Célula
            </label>
            <select
              value={familyRole}
              onChange={(e) => setFamilyRole(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-primary transition-all text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="Pai de Família">Pai de Família</option>
              <option value="Mãe de Família">Mãe de Família</option>
              <option value="Filho(a) / Jovem">Filho(a) / Jovem</option>
              <option value="Casal">Casal</option>
              <option value="Avô / Avó">Avô / Avó</option>
              <option value="Membro da Célula">Membro da Célula</option>
              <option value="Visitante">Visitante</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Bio (Opcional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fale um pouco sobre você..."
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-primary transition-all text-slate-900 dark:text-white min-h-[100px] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              'w-full py-5 rounded-2xl font-display text-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer',
              saveStatus === 'success'
                ? 'bg-green-500 text-white shadow-green-500/30'
                : saveStatus === 'error'
                ? 'bg-red-500 text-white shadow-red-500/30'
                : 'primary-gradient text-white shadow-primary/30 active:scale-95'
            )}
          >
            {isSaving ? (
              'Salvando...'
            ) : saveStatus === 'success' ? (
              'Perfil Atualizado!'
            ) : saveStatus === 'error' ? (
              'Erro ao Salvar'
            ) : (
              <>
                <Save size={20} /> Salvar Alterações
              </>
            )}
          </button>
        </form>
      </section>

      <section className="border-t dark:border-slate-800 pt-8 space-y-3">
        <button
          onClick={() => setShowDBModal(true)}
          type="button"
          className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-indigo-500/20"
        >
          <Database size={18} /> Banco de Dados (Perfis, Jogos & Imagens)
        </button>

        {onOpenShare && (
          <button
            onClick={onOpenShare}
            type="button"
            className="w-full py-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Share2 size={18} /> Convidar Membros & Compartilhar Link
          </button>
        )}
        <button
          onClick={onLogout}
          type="button"
          className="w-full py-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all cursor-pointer"
        >
          <LogOut size={18} /> Sair da Conta
        </button>
      </section>

      <DatabaseModal
        isOpen={showDBModal}
        onClose={() => setShowDBModal(false)}
        user={user}
        initialTab="profiles"
        onSwitchProfile={handleSwitchProfile}
      />

      {/* Modal: Ativar Modo Administrador via Senha */}
      <AnimatePresence>
        {showAdminPinModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-sm relative border border-slate-100 dark:border-slate-800"
            >
              <button
                onClick={() => setShowAdminPinModal(false)}
                className="absolute top-6 right-6 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white leading-tight">
                    Acesso de Administrador
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Edição total das páginas da célula
                  </p>
                </div>
              </div>

              {adminPinError && (
                <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{adminPinError}</span>
                </div>
              )}

              <form onSubmit={handleActivateAdmin} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Senha de Líder
                    </label>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      (Use: admin123)
                    </span>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      autoFocus
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      placeholder="Digite admin123"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-600/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Shield size={16} /> Entrar como Administrador
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
