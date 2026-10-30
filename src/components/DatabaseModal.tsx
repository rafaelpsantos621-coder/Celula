import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  Users,
  Trophy,
  Image as ImageIcon,
  X,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  Star,
  Shield,
  Clock,
  Gamepad2,
  Brain,
  LayoutGrid,
  Sparkles,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, CellMember, GameHistoryEntry, StoredImage } from '../types';
import {
  getProfilesFromDB,
  deleteProfileFromDB,
  getGameHistoryFromDB,
  deleteGameHistoryFromDB,
  getImagesFromDB,
  uploadAndSaveImageToDB,
  deleteImageFromDB,
  exportDatabaseSnapshot,
  importDatabaseSnapshot,
} from '../lib/cellDatabase';
import { cn } from '../lib/utils';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  initialTab?: 'profiles' | 'games' | 'images';
  onSwitchProfile?: (member: CellMember) => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  user,
  initialTab = 'profiles',
  onSwitchProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'games' | 'images'>(initialTab);
  const [profiles, setProfiles] = useState<CellMember[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [images, setImages] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageTitle, setImageTitle] = useState('');
  const [imageFilter, setImageFilter] = useState<'all' | 'profile' | 'blog' | 'gallery'>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profList, gamesList, imgList] = await Promise.all([
        getProfilesFromDB(),
        getGameHistoryFromDB(),
        getImagesFromDB(),
      ]);
      setProfiles(profList);
      setGameHistory(gamesList);
      setImages(imgList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const showTempNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3200);
  };

  const handleUploadNewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const savedImg = await uploadAndSaveImageToDB({
        file,
        title: imageTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
        category: 'gallery',
        user,
      });
      setImages((prev) => [savedImg, ...prev]);
      setImageTitle('');
      showTempNotice('Imagem salva no banco de dados!');
    } catch {
      showTempNotice('Erro ao salvar imagem.');
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (id: string) => {
    await deleteImageFromDB(id);
    setImages((prev) => prev.filter((i) => i.id !== id));
    showTempNotice('Imagem removida.');
  };

  const handleDeleteProfile = async (id: string) => {
    await deleteProfileFromDB(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    showTempNotice('Perfil removido do banco.');
  };

  const handleDeleteGameEntry = async (id: string) => {
    await deleteGameHistoryFromDB(id);
    setGameHistory((prev) => prev.filter((g) => g.id !== id));
    showTempNotice('Registro de partida removido.');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importDatabaseSnapshot(file);
      await loadAllData();
      showTempNotice('Backup do banco de dados restaurado com sucesso!');
    } catch {
      showTempNotice('Arquivo de backup inválido.');
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  const filteredImages =
    imageFilter === 'all' ? images : images.filter((i) => i.category === imageFilter);

  const getGameBadge = (type: string) => {
    switch (type) {
      case 'quiz':
        return { label: 'Quiz Bíblico', icon: Brain, color: 'text-primary bg-primary/10' };
      case 'memory':
        return { label: 'Memória', icon: LayoutGrid, color: 'text-amber-600 bg-amber-500/10' };
      case 'wordsearch':
        return { label: 'Caça-Palavras', icon: Star, color: 'text-emerald-600 bg-emerald-500/10' };
      default:
        return { label: 'Forca Bíblica', icon: Gamepad2, color: 'text-orange-600 bg-orange-500/10' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[110] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[88vh]"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-primary flex items-center justify-center text-white shadow-md shadow-primary/25 shrink-0">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                    Banco de Dados da Célula
                  </h3>
                  <p className="text-xs text-slate-400">
                    Perfis salvos ({profiles.length}) • Partidas ({gameHistory.length}) • Imagens ({images.length})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-3 pt-3 border-b border-slate-100 dark:border-slate-800 gap-1.5 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('profiles')}
                className={cn(
                  'flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeTab === 'profiles'
                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <Users size={15} />
                <span>Perfis ({profiles.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('games')}
                className={cn(
                  'flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeTab === 'games'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <Trophy size={15} />
                <span>Jogos ({gameHistory.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('images')}
                className={cn(
                  'flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  activeTab === 'images'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <ImageIcon size={15} />
                <span>Imagens ({images.length})</span>
              </button>
            </div>

            {notice && (
              <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shrink-0">
                <CheckCircle2 size={15} />
                <span>{notice}</span>
              </div>
            )}

            {/* Content Area */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span className="text-xs font-bold">Carregando banco de dados...</span>
                </div>
              ) : (
                <>
                  {/* TAB 1: PROFILES CREATED */}
                  {activeTab === 'profiles' && (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/15 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-3">
                        <span>
                          Todos os perfis criados ficam salvos aqui com suas fotos, cargos na família e pontos de XP.
                        </span>
                      </div>

                      {profiles.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs">
                          Nenhum perfil salvo ainda.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {profiles.map((member) => {
                            const isCurrent = member.id === user.id;
                            const hasAvatar =
                              member.avatarUrl && !member.avatarUrl.includes('dicebear');
                            return (
                              <div
                                key={member.id}
                                className={cn(
                                  'p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all',
                                  isCurrent
                                    ? 'bg-primary/5 dark:bg-primary/10 border-primary/30'
                                    : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 rounded-2xl primary-gradient text-white font-display font-bold flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                    {hasAvatar ? (
                                      <img
                                        src={member.avatarUrl}
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      member.name.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                        {member.name}
                                      </h4>
                                      {member.role === 'admin' && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase flex items-center gap-0.5">
                                          <Shield size={10} /> Admin
                                        </span>
                                      )}
                                      {isCurrent && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase">
                                          Ativo
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                      {member.familyRole || 'Membro'} •{' '}
                                      <strong className="text-primary">{member.points || 0} XP</strong>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {!isCurrent && onSwitchProfile && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onSwitchProfile(member);
                                        showTempNotice(`Perfil alternado para ${member.name}!`);
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
                                      title="Usar este perfil neste aparelho"
                                    >
                                      <UserCheck size={13} />
                                      <span>Usar Perfil</span>
                                    </button>
                                  )}
                                  {user.role === 'admin' && !isCurrent && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProfile(member.id)}
                                      className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                                      title="Excluir perfil"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: GAME HISTORY */}
                  {activeTab === 'games' && (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>
                          Histórico automático de todas as partidas concluídas na Arena Bíblica.
                        </span>
                      </div>

                      {gameHistory.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs">
                          Nenhuma partida registrada ainda. Jogue um desafio na aba Games para estrear o histórico!
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {gameHistory.map((item) => {
                            const badge = getGameBadge(item.gameType);
                            const Icon = badge.icon;
                            return (
                              <div
                                key={item.id}
                                className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={cn(
                                      'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                                      badge.color
                                    )}
                                  >
                                    <Icon size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                        {item.userName}
                                      </span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                        {badge.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                      <Clock size={11} />
                                      <span>
                                        {formatDistanceToNow(item.playedAt, {
                                          addSuffix: true,
                                          locale: ptBR,
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <span className="font-display font-bold text-sm text-emerald-600 dark:text-emerald-400 block">
                                      +{item.score} XP
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Total: {item.totalPointsAfter} XP
                                    </span>
                                  </div>
                                  {user.role === 'admin' && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteGameEntry(item.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                      title="Apagar registro"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: STORED IMAGES */}
                  {activeTab === 'images' && (
                    <div className="space-y-4">
                      {/* Upload bar */}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadNewImage}
                      />
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <input
                          type="text"
                          value={imageTitle}
                          onChange={(e) => setImageTitle(e.target.value)}
                          placeholder="Legenda da imagem (ex: Reunião de Sexta)"
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          disabled={isUploadingImage}
                          onClick={() => imageInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                        >
                          {isUploadingImage ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Upload size={15} />
                          )}
                          <span>{isUploadingImage ? 'Salvando...' : 'Guardar Nova Foto'}</span>
                        </button>
                      </div>

                      {/* Category filter */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {[
                          { id: 'all', label: 'Todas' },
                          { id: 'gallery', label: 'Galeria da Célula' },
                          { id: 'profile', label: 'Fotos de Perfil' },
                          { id: 'blog', label: 'Posts / Comunidade' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setImageFilter(cat.id as any)}
                            className={cn(
                              'px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer',
                              imageFilter === cat.id
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            )}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      {filteredImages.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs">
                          Nenhuma imagem nesta categoria.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {filteredImages.map((img) => (
                            <div
                              key={img.id}
                              className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-square flex flex-col justify-end"
                            >
                              <img
                                src={img.dataUrl || img.url}
                                alt={img.title}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="relative z-10 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                                <p className="text-xs font-bold truncate">{img.title}</p>
                                <p className="text-[10px] text-slate-300 truncate">
                                  Por {img.uploadedByName}
                                </p>
                              </div>
                              {(user.role === 'admin' || img.uploadedBy === user.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(img.id)}
                                  className="absolute top-2 right-2 z-20 w-7 h-7 rounded-lg bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                                  title="Excluir imagem"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer with 1-Click Backup & Restore */}
            <input
              ref={backupInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportBackup}
            />
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportDatabaseSnapshot()}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} className="text-primary" />
                  <span>Baixar Backup (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload size={14} className="text-emerald-600" />
                  <span>Importar Backup</span>
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
