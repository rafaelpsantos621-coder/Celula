import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, X, Share2, ShieldCheck, UserCheck, Sparkles, Trash2, Search } from 'lucide-react';
import { CellMember, User } from '../../types';

interface MemberListItemProps {
  member: CellMember;
  isMe: boolean;
  isLeader: boolean;
  canRemove: boolean;
  onRemove?: (id: string) => void;
}

export const MemberListItem = memo(function MemberListItem({
  member,
  isMe,
  isLeader,
  canRemove,
  onRemove,
}: MemberListItemProps) {
  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove(member.id);
    }
  }, [member.id, onRemove]);

  const initials = useMemo(() => {
    return member.name ? member.name.charAt(0).toUpperCase() : '?';
  }, [member.name]);

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 transition-all hover:border-primary/20">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-sm font-display font-bold text-primary text-base">
          {member.avatarUrl && !member.avatarUrl.includes('dicebear') ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {member.name}
            </p>
            {isMe && (
              <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-black uppercase tracking-wider">
                Você
              </span>
            )}
            {isLeader && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                <Sparkles size={10} /> Líder
              </span>
            )}
            {member.familyRole && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-semibold">
                {member.familyRole}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {member.points || 0} XP • Ativo na célula
          </p>
        </div>
      </div>

      {canRemove && onRemove && (
        <button
          onClick={handleRemove}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Remover membro"
          aria-label={`Remover ${member.name}`}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
});

interface MembersModalProps {
  isOpen: boolean;
  members: CellMember[];
  currentUser: User;
  onClose: () => void;
  onShare?: () => void;
  onRemoveMember?: (id: string) => void;
}

export const MembersModal = memo(function MembersModal({
  isOpen,
  members,
  currentUser,
  onClose,
  onShare,
  onRemoveMember,
}: MembersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = useMemo(() => currentUser.role === 'admin', [currentUser.role]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleShareClick = useCallback(() => {
    onClose();
    if (onShare) onShare();
  }, [onClose, onShare]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      (m.role && m.role.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  const stats = useMemo(() => {
    const total = members.length;
    const leaders = members.filter((m) => m.role === 'admin').length;
    const totalXP = members.reduce((sum, m) => sum + (m.points || 0), 0);
    return { total, leaders, totalXP };
  }, [members]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-7 relative my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg sm:text-xl text-slate-900 dark:text-white">
                    Membros da Célula
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    {stats.total} {stats.total === 1 ? 'Membro' : 'Membros'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                  Membros 100% reais cadastrados • {stats.totalXP} XP acumulados
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Bar if multiple members */}
          {members.length > 2 && (
            <div className="pt-3 pb-1 shrink-0">
              <div className="relative flex items-center">
                <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Buscar membro por nome..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    aria-label="Limpar busca"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <Users size={28} />
                </div>
                <p className="font-display text-slate-800 dark:text-white text-base">
                  {searchQuery ? 'Nenhum membro encontrado' : 'Nenhum membro registrado'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {searchQuery
                    ? `Não encontramos ninguém com "${searchQuery}". Verifique a digitação.`
                    : 'Envie o convite para a sua célula para que os irmãos façam login e entrem na lista!'}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isMe = member.id === currentUser.id;
                const isLeader = member.role === 'admin';

                return (
                  <MemberListItem
                    key={member.id}
                    member={member}
                    isMe={isMe}
                    isLeader={isLeader}
                    canRemove={isAdmin && !isMe}
                    onRemove={onRemoveMember}
                  />
                );
              })
            )}
          </div>

          {/* Footer Call-to-Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <UserCheck size={15} className="text-primary shrink-0" />
              <span>Conexão direta com toda a célula</span>
            </div>

            {onShare && (
              <button
                onClick={handleShareClick}
                className="w-full sm:w-auto py-3 px-5 primary-gradient text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Share2 size={14} />
                Convidar Membros
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});
