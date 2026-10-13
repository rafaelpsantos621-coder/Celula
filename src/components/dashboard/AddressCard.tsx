import React, { useState, useCallback, useMemo, memo } from 'react';
import { MapPin, Edit2, Check, X } from 'lucide-react';
import { User } from '../../types';

interface AddressCardProps {
  address: string;
  userRole: User['role'];
  onSaveAddress: (newAddress: string) => void;
}

export const AddressCard = memo(function AddressCard({
  address,
  userRole,
  onSaveAddress,
}: AddressCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempAddress, setTempAddress] = useState(address);

  const isAdmin = useMemo(() => userRole === 'admin', [userRole]);

  const handleStartEdit = useCallback(() => {
    setTempAddress(address);
    setIsEditing(true);
  }, [address]);

  const handleCancel = useCallback(() => {
    setTempAddress(address);
    setIsEditing(false);
  }, [address]);

  const handleSave = useCallback(() => {
    const trimmed = tempAddress.trim();
    if (trimmed) {
      onSaveAddress(trimmed);
    }
    setIsEditing(false);
  }, [tempAddress, onSaveAddress]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTempAddress(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  return (
    <section className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <MapPin className="text-primary" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
            Lar Anfitrião • Onde nos reunimos
          </p>
          {isEditing ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={tempAddress}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleSave}
                  className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-all cursor-pointer"
                  title="Salvar endereço"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                  title="Cancelar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate italic">
                "{address}"
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="p-1.5 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar endereço"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
