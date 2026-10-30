import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Smartphone,
  Check,
  Copy,
  Share,
  PlusSquare,
  MoreVertical,
  Sparkles,
  X,
  MessageCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'auth';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install, installerUrl } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Automatically open the fast installer modal when user visits /?instalar=1
  useEffect(() => {
    if (typeof window === 'undefined' || isInstalled) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('instalar') === '1' || params.get('install') === '1') {
      setShowModal(true);
    }
  }, [isInstalled]);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          setInstallSuccess(false);
        }, 1800);
        return;
      }
    }
    setShowModal(true);
  };

  const handleCopyInstallerLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(installerUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const whatsappInstallMessage = `📲 *Instale o App da Célula Despertar no seu celular!*\n\nToque no link instalador rápido abaixo para fixar o nosso aplicativo oficial (funciona até sem internet para o devocional do dia):\n👉 ${installerUrl}`;
  const whatsappShareHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    whatsappInstallMessage
  )}`;

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          type="button"
          title="Instalar Aplicativo no Celular"
          aria-label="Instalar Aplicativo"
          className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Download size={15} />
          <span className="hidden xs:inline sm:inline">Instalar App</span>
        </button>
      )}

      {variant === 'auth' && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-primary/10 border border-emerald-500/25 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Smartphone size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                Instalador Rápido Disponível
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Baixe na tela inicial em 1 clique
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Instalar</span>
          </button>
        </div>
      )}

      {variant === 'banner' && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-600/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
              <Smartphone size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  Instalador Rápido
                </span>
              </div>
              <h4 className="font-display font-bold text-sm sm:text-base mt-0.5 leading-snug">
                Tenha o App da Célula na tela do seu celular
              </h4>
              <p className="text-xs text-emerald-50/90">
                Acesso em 1 toque e devocional diário disponível mesmo sem internet.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download size={15} />
              <span>Instalar Agora</span>
            </button>
            <button
              type="button"
              onClick={handleCopyInstallerLink}
              className="px-3 py-2.5 bg-emerald-700/60 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
              title="Copiar Link Instalador"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copiado!' : 'Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Fast Installer Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl sm:rounded-[2.25rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-auto"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 text-white relative">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  aria-label="Fechar instalador"
                  className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={17} />
                </button>

                <div className="flex items-center gap-3.5">
                  <img
                    src="/pwa-192x192.png"
                    alt="Ícone Célula Despertar"
                    className="w-14 h-14 rounded-2xl shadow-lg border-2 border-white/20 bg-slate-900 object-cover shrink-0"
                  />
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-md mb-1">
                      <Sparkles size={11} /> App Oficial • Leve & Offline
                    </span>
                    <h3 className="font-display font-bold text-lg sm:text-xl leading-tight">
                      Instalar Célula Despertar
                    </h3>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      Sem ocupar memória e com devocional offline
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {installSuccess ? (
                  <div className="py-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={30} />
                    </div>
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Instalando na sua Tela Inicial!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      O ícone da Célula Despertar já vai aparecer junto aos seus aplicativos.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Direct 1-Click Install Button when browser supports beforeinstallprompt */}
                    {isInstallable && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleInstallClick}
                          className="w-full py-4 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <Download size={20} />
                          <span>Instalar Aplicativo em 1 Clique</span>
                        </button>
                        <p className="text-[11px] text-center text-slate-400">
                          Clique acima para confirmar a instalação automática no seu aparelho.
                        </p>
                      </div>
                    )}

                    {/* Platform-Specific Visual Step-by-Step */}
                    {isIOS ? (
                      <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                          <Smartphone size={16} className="text-primary shrink-0" />
                          <span>Como instalar no seu iPhone / iPad (2 toques):</span>
                        </div>
                        <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                          <li className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-lg bg-primary text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              1
                            </span>
                            <span>
                              Toque no ícone <strong>Compartilhar</strong>{' '}
                              <Share size={13} className="inline text-primary mx-0.5" /> na barra inferior do Safari.
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-lg bg-primary text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              2
                            </span>
                            <span>
                              Role para baixo e toque em{' '}
                              <strong>
                                "Adicionar à Tela de Início"{' '}
                                <PlusSquare size={13} className="inline text-primary mx-0.5" />
                              </strong>
                              .
                            </span>
                          </li>
                        </ol>
                      </div>
                    ) : (
                      !isInstallable && (
                        <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                            <Smartphone size={16} className="text-emerald-600 shrink-0" />
                            <span>
                              {isAndroid
                                ? 'Como instalar no seu Android rapidamente:'
                                : 'Como instalar no Celular ou Computador:'}
                            </span>
                          </div>
                          <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                1
                              </span>
                              <span>
                                Abra o link instalador direto no navegador <strong>Chrome</strong> ou{' '}
                                <strong>Safari</strong>.
                              </span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                2
                              </span>
                              <span>
                                Toque no menu{' '}
                                <MoreVertical size={13} className="inline text-emerald-600 mx-0.5" /> (3 pontinhos) e selecione{' '}
                                <strong>"Instalar aplicativo"</strong> ou{' '}
                                <strong>"Adicionar à tela inicial"</strong>.
                              </span>
                            </li>
                          </ol>
                          <a
                            href={installerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span>Abrir em Nova Guia para Instalar</span>
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      )
                    )}

                    {/* Fast Installer Link Copy & WhatsApp Share */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Link Instalador Rápido para enviar no grupo:
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 pl-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate flex-1 select-all">
                          {installerUrl}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyInstallerLink}
                          className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                        >
                          {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>

                      <a
                        href={whatsappShareHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all"
                      >
                        <MessageCircle size={16} />
                        <span>Enviar Link Instalador no WhatsApp</span>
                      </a>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
