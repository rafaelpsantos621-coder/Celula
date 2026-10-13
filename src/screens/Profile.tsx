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
} from 'lucide-react';
import { User as UserType } from '../types';
import { cn } from '../lib/utils';
import { getSupabase } from '../lib/supabase';

/**
 * Compresses an image file client-side using an HTML canvas
 * Ensures fast loading, smooth responsiveness, and prevents storage quota overflow.
 */
function compressImage(file: File, maxWidth = 450, maxHeight = 450, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Erro ao decodificar a imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo da foto'));
    reader.readAsDataURL(file);
  });
}

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

  // Filter out any legacy illustrated avatars (dicebear)
  const initialPhoto =
    user.avatarUrl && !user.avatarUrl.includes('dicebear') ? user.avatarUrl : '';

  const [avatarUrl, setAvatarUrl] = useState<string>(initialPhoto);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      let finalAvatarUrl = '';

      // 1. First attempt: upload to server endpoint /api/upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            finalAvatarUrl = data.url;
          }
        }
      } catch {
        // Server endpoint unreachable or offline; fallback to compressed data URL
      }

      // 2. Resilient fallback: compress and store as optimized base64
      if (!finalAvatarUrl) {
        finalAvatarUrl = await compressImage(file, 450, 450, 0.85);
      }

      setAvatarUrl(finalAvatarUrl);

      // Automatically update profile state and localStorage
      const updatedUser: UserType = {
        ...user,
        name,
        bio,
        avatarUrl: finalAvatarUrl,
      };
      onUpdate(updatedUser);
      try {
        localStorage.setItem('cell_user', JSON.stringify(updatedUser));
      } catch {
        // Ignore quota errors if any
      }

      setPhotoNotice({
        type: 'success',
        message: 'Foto de perfil adicionada com sucesso!',
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
    </div>
  );
}
