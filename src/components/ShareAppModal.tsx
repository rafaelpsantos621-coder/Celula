import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Sparkles,
  QrCode,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageCircle,
} from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'share' | 'domain' | 'bitly' | 'install'>('share');
  const [customInput, setCustomInput] = useState('Célula Despertar');

  // Determine current active URL safely (clean URL without hash or extra query)
  const currentUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : 'https://celuladespertar.com';

  const defaultMessage = `✨ Olá, família da Célula Despertar!\n\nEste é o nosso aplicativo oficial para estarmos juntos durante a semana: devocionais diários, avisos, pedidos de oração, chat e comunhão.\n\nAcesse pelo link oficial:\n${currentUrl}\n\n(Dica: salve na tela inicial do seu celular para usar como aplicativo!)`;

  // Sanitizer for Bitly slugs: removes accents, converts to lowercase, replaces spaces with hyphens
  const sanitizeSlug = (text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const currentSlug = sanitizeSlug(customInput) || 'celula-despertar';

  const handleCopy = (text: string, type: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(defaultMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
    currentUrl
  )}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary/25">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                    Convidar & Compartilhar
                  </h3>
                  <p className="text-xs text-slate-400">Célula Despertar</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex px-2 sm:px-3 pt-3 border-b border-slate-100 dark:border-slate-800 gap-1 bg-slate-50/50 dark:bg-slate-950/40 overflow-x-auto">
              <button
                onClick={() => setActiveTab('share')}
                className={`flex-1 py-2.5 px-1.5 sm:px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'share'
                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <MessageCircle size={14} />
                <span className="truncate">WhatsApp & QR</span>
              </button>
              <button
                onClick={() => setActiveTab('domain')}
                className={`flex-1 py-2.5 px-1.5 sm:px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'domain'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Globe size={14} />
                <span className="truncate">Domínio</span>
              </button>
              <button
                onClick={() => setActiveTab('bitly')}
                className={`flex-1 py-2.5 px-1.5 sm:px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer relative ${
                  activeTab === 'bitly'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                <span className="truncate">Encurtar</span>
              </button>
              <button
                onClick={() => setActiveTab('install')}
                className={`flex-1 py-2.5 px-1.5 sm:px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTab === 'install'
                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone size={14} />
                <span className="truncate">Como App</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* TAB 1: WhatsApp & QR Code */}
              {activeTab === 'share' && (
                <div className="space-y-5">
                  {/* Notice about direct link and activation */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-amber-900 dark:text-amber-200">
                        Como liberar o acesso para todos os membros:
                      </p>
                      <p className="text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                        No canto superior direito da tela do <strong>Google AI Studio</strong>, clique no botão <strong>"Share" (Compartilhar)</strong>. Isso ativa o link público oficial para qualquer irmão abrir sem pedir senha e sem dar erro 404!
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp Quick Action */}
                  <button
                    onClick={handleWhatsAppShare}
                    className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <MessageCircle size={18} />
                    Enviar Convite no WhatsApp
                  </button>

                  {/* Short Link Ready to Use */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Link Curto Oficial para Membros
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        tinyurl.com/24eu8jez
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-1.5 pl-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                      <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 truncate flex-1 select-all">
                        https://tinyurl.com/24eu8jez
                      </span>
                      <button
                        onClick={() => handleCopy('https://tinyurl.com/24eu8jez', 'short_ready')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          copiedType === 'short_ready'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {copiedType === 'short_ready' ? (
                          <>
                            <Check size={14} /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Copy Link Input Bar */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Link Direto do Aplicativo
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 pl-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate flex-1 select-all">
                        {currentUrl}
                      </span>
                      <button
                        onClick={() => handleCopy(currentUrl, 'official')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          copiedType === 'official'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                      >
                        {copiedType === 'official' ? (
                          <>
                            <Check size={14} /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* QR Code Presentation */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code Célula Despertar"
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <QrCode size={15} className="text-primary" />
                        QR Code para a Reunião
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Abra na reunião da célula ou projete na TV: os irmãos só precisam apontar a câmera do celular para entrar na hora!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB DOMAIN: Custom Domain Instructions & DNS Records */}
              {activeTab === 'domain' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200/60 dark:border-indigo-900/40 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                      <Globe size={18} className="shrink-0" />
                      Como usar o seu próprio domínio (ex: celuladespertar.com.br)
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Você pode conectar qualquer domínio que comprou no <strong>Registro.br</strong>, <strong>Hostinger</strong>, <strong>GoDaddy</strong> ou <strong>Cloudflare</strong> para que sua célula acesse por um endereço exclusivo e profissional.
                    </p>
                  </div>

                  {/* Destination Host Info */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Endereço de Destino do App (Para apontamento DNS / CNAME):
                    </label>
                    <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs">
                      <span className="flex-1 truncate text-slate-800 dark:text-slate-200 select-all font-semibold">
                        {typeof window !== 'undefined' ? window.location.host : 'ais-pre-wvbzmm3fs4ipmunchtjlst-538767211913.us-east1.run.app'}
                      </span>
                      <button
                        onClick={() => handleCopy(typeof window !== 'undefined' ? window.location.host : 'ais-pre-wvbzmm3fs4ipmunchtjlst-538767211913.us-east1.run.app', 'domain_target')}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedType === 'domain_target' ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedType === 'domain_target' ? 'Copiado!' : 'Copiar Destino'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Step-by-Step Practical Paths */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">1</span>
                          Opção Mais Rápida: Redirecionamento Web (Registro.br / GoDaddy)
                        </span>
                        <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          2 minutos
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        No painel onde comprou o domínio (ex: Registro.br ou GoDaddy), procure a opção <strong>"Redirecionamento de Domínio"</strong> ou <strong>"Encaminhamento de URL"</strong>. Basta colar a URL oficial do app e salvar. Quem digitar seu domínio entrará direto no app com certificado SSL ativo!
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">2</span>
                          Apontamento CNAME com Cloudflare (Domínio Fixo na Barra)
                        </span>
                        <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Adicione seu domínio gratuitamente no <strong>Cloudflare</strong>. No menu <strong>DNS</strong>, adicione um registro do tipo <strong>CNAME</strong>:
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                        <div><strong>Tipo:</strong> CNAME</div>
                        <div><strong>Nome:</strong> <span className="text-primary font-bold">app</span> (ou @)</div>
                        <div><strong>Destino:</strong> <span className="text-primary font-bold">{typeof window !== 'undefined' ? window.location.host : 'ais-pre-wvbzmm3fs4ipmunchtjlst-538767211913.us-east1.run.app'}</span></div>
                        <div><strong>Proxy:</strong> Ativado (Nuvem Laranja)</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">3</span>
                          Deploy em Vercel / Railway / Render
                        </span>
                        <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                          Completo
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        O projeto já possui scripts prontos de compilação (<code className="text-primary font-mono text-[10px]">npm run build</code>) e servidor Express (<code className="text-primary font-mono text-[10px]">npm run start</code>). Você pode conectar seu repositório no Vercel ou Render e vincular seu domínio nas configurações com emissão automática de SSL.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Bitly Error 403 Solution & Short Links */}
              {activeTab === 'bitly' && (
                <div className="space-y-4">
                  {/* Alert Card explaining 403 */}
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-sm">
                      <XCircle size={18} className="shrink-0" />
                      Por que "bit.ly/Célula-Despertar" dá Erro 403?
                    </div>
                    <p className="text-xs text-red-700/90 dark:text-red-300/90 leading-relaxed">
                      O Bitly <strong>NÃO ACEITA ACENTOS</strong> (como a letra <strong>é</strong> ou <strong>ç</strong>). Quando você tenta abrir um link com acento, o navegador envia caracteres codificados (<code className="bg-red-100 dark:bg-red-900/60 px-1 py-0.5 rounded">%C3%A9</code>), o que faz o servidor do Bitly bloquear a conexão com <strong>Erro 403 Forbidden</strong>.
                    </p>
                  </div>

                  {/* Right vs Wrong Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 bg-red-50/60 dark:bg-red-950/20 border border-red-200/70 dark:border-red-900/40 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <XCircle size={12} /> Errado (Dá Erro 403)
                      </span>
                      <p className="text-xs font-mono line-through text-red-500">
                        bit.ly/Célula-Despertar
                      </p>
                      <p className="text-[10px] text-red-500/80">Contém acento "é"</p>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Correto (100% Funciona)
                      </span>
                      <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        bit.ly/celula-despertar
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Sem acento, letras minúsculas</p>
                    </div>
                  </div>

                  {/* Sanitizer generator tool */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>Gerador de Link sem Erro:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Remove acentos automaticamente</span>
                    </label>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Ex: Celula Despertar"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                      />

                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Apelido Seguro para Encurtador:</span>
                          <span className="text-xs font-mono font-bold text-primary truncate">
                            bit.ly/{currentSlug}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(`https://bit.ly/${currentSlug}`, 'slug')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors flex items-center gap-1 ${
                            copiedType === 'slug'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {copiedType === 'slug' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedType === 'slug' ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3 Step Tutorial */}
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-white dark:bg-slate-900">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles size={14} className="text-primary" />
                      Como Criar o Link sem Erro no Bitly ou Abre.ai:
                    </span>

                    <ol className="list-decimal pl-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <li>
                        Copie o <strong>Link Oficial do App</strong>:
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(currentUrl, 'official_bitly_step')}
                            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
                          >
                            {copiedType === 'official_bitly_step' ? <Check size={12} /> : <Copy size={12} />}
                            {copiedType === 'official_bitly_step' ? 'Link Copiado!' : 'Copiar Link Oficial'}
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                            {currentUrl}
                          </span>
                        </div>
                      </li>
                      <li>
                        Abra o <strong>Bitly</strong> ou <strong>Abre.ai</strong> (o Abre.ai é brasileiro e não precisa nem de cadastro!).
                      </li>
                      <li>
                        Cole o link oficial no campo de URL e no nome do link escreva <strong>sem acento</strong>:
                        <span className="font-mono font-bold text-primary ml-1">celula-despertar</span>.
                      </li>
                    </ol>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <a
                        href="https://abre.ai"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        Abrir Abre.ai (Grátis) <ExternalLink size={12} />
                      </a>
                      <a
                        href="https://bitly.com"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        Abrir Bitly <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Install as App on Mobile */}
              {activeTab === 'install' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <Sparkles size={28} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Funciona como App no Celular!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Os membros não precisam baixar na Play Store ou App Store. Eles podem fixar direto na tela de início.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Android Instructions */}
                    <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        No Android (Chrome):
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 pl-4">
                        Toque nos <strong>3 pontinhos</strong> no topo do Chrome e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                      </p>
                    </div>

                    {/* iPhone Instructions */}
                    <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        No iPhone (Safari):
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 pl-4">
                        Toque no botão de <strong>Compartilhar</strong> (quadrado com seta para cima) e escolha <strong>"Adicionar à Tela de Início"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 pt-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Célula Despertar • Todos conectados
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
