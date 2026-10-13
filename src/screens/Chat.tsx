import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Hash,
  MoreVertical,
  Paperclip,
  Trash2,
  X,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileAudio,
  FileVideo,
  File,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  Video,
  Sliders,
  Check,
  UploadCloud,
  Film,
  Sparkles,
  Mic,
  Square,
  MessageCircle,
  Image as ImageIcon,
  Lock,
} from 'lucide-react';
import { User, Message, ChatAttachment } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { saveMessagesToDB, loadMessagesFromDB } from '../lib/chatStorage';

// Clean initial messages: 100% real members, no bot or fake messages
const INITIAL_MESSAGES: Message[] = [];

const STORAGE_KEY = 'cell_chat_messages';
const VIDEO_LIMIT_KEY = 'chat_video_limit_mb';

// Preset options for video upload limits (in MB)
const VIDEO_LIMIT_PRESETS = [
  {
    mb: 25,
    label: '25 MB',
    desc: 'Econômico • Ideal para conexões móveis',
  },
  {
    mb: 50,
    label: '50 MB',
    desc: 'Padrão • Boa velocidade e qualidade',
  },
  {
    mb: 100,
    label: '100 MB',
    desc: 'Recomendado • Vídeos em alta resolução e testemunhos',
    recommended: true,
  },
  {
    mb: 200,
    label: '200 MB',
    desc: 'Avançado • Mensagens de pregação e louvores',
  },
  {
    mb: 250,
    label: '250 MB',
    desc: 'Máximo • Vídeos longos e gravações completas',
  },
];

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentType(file: File): ChatAttachment['type'] {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/.test(name)) {
    return 'image';
  }
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/.test(name)) {
    return 'audio';
  }
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v|3gp)$/.test(name)) {
    return 'video';
  }
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    /\.(xlsx|xls|csv|ods|numbers)$/.test(name)
  ) {
    return 'spreadsheet';
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    mime.startsWith('text/') ||
    /\.(doc|docx|txt|rtf|pages|odt|md)$/.test(name)
  ) {
    return 'document';
  }
  if (/\.(zip|rar|7z|tar|gz|bz2)$/.test(name)) {
    return 'archive';
  }

  return 'file';
}

// Upload file to server /api/upload with real-time upload progress
function uploadFileToServer(
  file: File,
  onProgress: (percent: number, loaded: number, total: number) => void
): Promise<{ url: string; name: string; size: number; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent, event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          reject(new Error('Resposta inválida do servidor'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || `Erro HTTP ${xhr.status}`));
        } catch {
          reject(new Error(`Erro HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Falha na conexão de rede com o servidor'));
    };

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

// Fallback image compression for pure client-side if needed
async function readImageDataUrl(file: File): Promise<string> {
  if (/\.(gif|svg)$/i.test(file.name)) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1280;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(mime, 0.85));
    };
    img.onerror = () => resolve(rawUrl);
    img.src = rawUrl;
  });
}

export default function Chat({ user }: { user: User }) {
  // Load configured video limit (in MB) - defaults to 100 MB
  const [videoLimitMb, setVideoLimitMb] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(VIDEO_LIMIT_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 500) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return 100; // Default 100 MB for videos
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Message[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out any mock users (Sarah, Tiago, prev, prev2, bot)
          return parsed.filter(
            (m) =>
              m.senderId !== 'bot' &&
              m.senderId !== 'prev' &&
              m.senderId !== 'prev2' &&
              m.senderName !== 'Sarah' &&
              m.senderName !== 'Tiago' &&
              !m.senderName?.toLowerCase().includes('bot')
          );
        }
      }
    } catch {
      // Ignore
    }
    return INITIAL_MESSAGES;
  });

  // Audio Voice Note Recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    percent: number;
    loaded: number;
    total: number;
    fileName: string;
  } | null>(null);
  const [fileErrorNotice, setFileErrorNotice] = useState<{
    message: string;
    canIncrease?: boolean;
    requiredMb?: number;
  } | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; name: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize with IndexedDB and shared server API for real-time multi-user communication
  useEffect(() => {
    let isMounted = true;

    // Load from local DB first for instant startup
    loadMessagesFromDB()
      .then((dbMessages) => {
        if (isMounted && dbMessages && dbMessages.length > 0) {
          const clean = dbMessages.filter(
            (m) =>
              m.senderId !== 'bot' &&
              !m.senderName?.toLowerCase().includes('bot')
          );
          if (clean.length > 0) {
            setMessages(clean);
          }
        }
      })
      .catch(() => {});

    // Sync with shared server endpoint so all cell members see each other's messages
    const syncServerMessages = async () => {
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          const serverMsgs: Message[] = await res.json();
          if (isMounted && Array.isArray(serverMsgs) && serverMsgs.length > 0) {
            setMessages((prev) => {
              const map = new Map<string, Message>();
              prev.forEach((m) => map.set(m.id, m));
              serverMsgs.forEach((m) => map.set(m.id, m));
              const merged = Array.from(map.values()).sort(
                (a, b) => a.timestamp - b.timestamp
              );
              return merged;
            });
          }
        }
      } catch {
        // Offline / server error: offline IndexedDB ensures messages stay visible
      }
    };

    syncServerMessages();
    const interval = setInterval(syncServerMessages, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingAttachment, uploadProgress]);

  // Save messages to IndexedDB and lightweight version to localStorage
  useEffect(() => {
    saveMessagesToDB(messages);

    try {
      // Keep lightweight message history in localStorage
      const safeForLocalStorage = messages.map((m) => {
        if (m.attachment && m.attachment.url && m.attachment.url.length > 2000) {
          // If large data URL, keep reference
          return {
            ...m,
            attachment: {
              ...m.attachment,
              url: m.attachment.url.substring(0, 100), // truncated reference for fallback
            },
          };
        }
        return m;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeForLocalStorage.slice(-40)));
    } catch {
      // Ignore if localStorage is full
    }
  }, [messages]);

  const handleUpdateVideoLimit = (newLimitMb: number) => {
    setVideoLimitMb(newLimitMb);
    try {
      localStorage.setItem(VIDEO_LIMIT_KEY, newLimitMb.toString());
    } catch {
      // Ignore
    }
  };

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    const type = getAttachmentType(file);
    const maxAllowedBytes = (type === 'video' ? videoLimitMb : Math.max(50, videoLimitMb)) * 1024 * 1024;

    if (file.size > maxAllowedBytes) {
      const neededMb = Math.ceil(file.size / (1024 * 1024));
      setFileErrorNotice({
        message: `O arquivo tem ${formatFileSize(file.size)} e ultrapassa seu limite configurado de ${
          type === 'video' ? videoLimitMb : Math.max(50, videoLimitMb)
        } MB.`,
        canIncrease: type === 'video' && neededMb <= 250,
        requiredMb: neededMb,
      });
      return;
    }

    setIsProcessingFile(true);
    setFileErrorNotice(null);
    setUploadProgress({
      percent: 0,
      loaded: 0,
      total: file.size,
      fileName: file.name,
    });

    try {
      // Try uploading to server endpoint /api/upload
      const uploaded = await uploadFileToServer(file, (percent, loaded, total) => {
        setUploadProgress({
          percent,
          loaded,
          total,
          fileName: file.name,
        });
      });

      setPendingAttachment({
        name: uploaded.name,
        type,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        url: uploaded.url,
      });
    } catch {
      // Fallback: If server upload fails (e.g. static preview or offline), use client-side blob/dataUrl
      try {
        let fallbackUrl = '';
        if (type === 'image') {
          fallbackUrl = await readImageDataUrl(file);
        } else {
          fallbackUrl = URL.createObjectURL(file);
        }

        setPendingAttachment({
          name: file.name,
          type,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          url: fallbackUrl,
        });
      } catch {
        setFileErrorNotice({
          message: 'Erro ao processar o arquivo. Tente novamente com outro arquivo.',
        });
      }
    } finally {
      setIsProcessingFile(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files?.[0];
    if (file) {
      e.preventDefault();
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputValue.trim();
    if (!cleanText && !pendingAttachment) return;

    const newMessage: Message = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatarUrl: user.avatarUrl,
      text: cleanText,
      timestamp: Date.now(),
      attachment: pendingAttachment || undefined,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setPendingAttachment(null);

    // Broadcast to shared server API for all cell members
    try {
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      }).catch((err) => {
        console.warn('Mensagem salva localmente, falha no envio ao servidor:', err);
      });
    } catch {
      // Local copy already saved
    }
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
    saveMessagesToDB(INITIAL_MESSAGES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES));
      fetch('/api/messages', { method: 'DELETE' }).catch(() => {});
    } catch {
      // Ignore
    }
    setShowMenu(false);
  };

  const renderAttachmentIcon = (type: ChatAttachment['type'], isMe: boolean) => {
    switch (type) {
      case 'pdf':
        return <FileText className={isMe ? 'text-red-300' : 'text-red-500'} size={24} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={isMe ? 'text-emerald-300' : 'text-emerald-500'} size={24} />;
      case 'document':
        return <FileText className={isMe ? 'text-blue-300' : 'text-blue-500'} size={24} />;
      case 'archive':
        return <FileArchive className={isMe ? 'text-amber-300' : 'text-amber-500'} size={24} />;
      case 'audio':
        return <FileAudio className={isMe ? 'text-purple-300' : 'text-purple-500'} size={24} />;
      case 'video':
        return <FileVideo className={isMe ? 'text-indigo-300' : 'text-indigo-500'} size={24} />;
      default:
        return <File className={isMe ? 'text-white/80' : 'text-slate-500'} size={24} />;
    }
  };

  // Audio Voice Note Recording Handlers
  const startAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setFileErrorNotice({
          message: 'Seu navegador não possui suporte para gravação de áudio direta.',
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setFileErrorNotice({
        message: 'Permissão de microfone necessária para gravar áudios de voz.',
      });
    }
  };

  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // Ignore
      }
    }
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const stopAndSendAudioRecording = () => {
    if (!mediaRecorderRef.current || !isRecordingAudio) return;

    const recorder = mediaRecorderRef.current;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    recorder.onstop = async () => {
      try {
        recorder.stream.getTracks().forEach((track) => track.stop());
      } catch {
        // Ignore
      }

      const mimeType = recorder.mimeType || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const nowStr = new Date().toISOString().slice(11, 19).replace(/:/g, '');
      const audioFile = new File([audioBlob], `Audio_Voz_${nowStr}.${ext}`, { type: mimeType });

      setIsRecordingAudio(false);
      setRecordingSeconds(0);
      audioChunksRef.current = [];

      setIsProcessingFile(true);
      try {
        const uploaded = await uploadFileToServer(audioFile, () => {});
        const voiceMessage: Message = {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          senderId: user.id,
          senderName: user.name,
          senderAvatarUrl: user.avatarUrl,
          text: 'Mensagem de voz 🎙️',
          timestamp: Date.now(),
          attachment: {
            name: uploaded.name,
            type: 'audio',
            mimeType: uploaded.mimeType,
            size: uploaded.size,
            url: uploaded.url,
          },
        };

        setMessages((prev) => [...prev, voiceMessage]);
        fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(voiceMessage),
        }).catch(() => {});
      } catch {
        // Fallback to data URL
        const reader = new FileReader();
        reader.onload = () => {
          const fallbackUrl = reader.result as string;
          const voiceMessage: Message = {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            senderId: user.id,
            senderName: user.name,
            senderAvatarUrl: user.avatarUrl,
            text: 'Mensagem de voz 🎙️',
            timestamp: Date.now(),
            attachment: {
              name: audioFile.name,
              type: 'audio',
              mimeType,
              size: audioBlob.size,
              url: fallbackUrl,
            },
          };
          setMessages((prev) => [...prev, voiceMessage]);
        };
        reader.readAsDataURL(audioBlob);
      } finally {
        setIsProcessingFile(false);
      }
    };

    recorder.stop();
  };

  const formatRecordingDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className="flex flex-col h-[calc(100vh-12rem)] min-h-[460px] max-h-[820px] -mx-4 sm:-mx-6 bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300 select-text"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        className="hidden"
        accept="*/*"
      />

      {/* Drag & Drop Visual Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/20 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-4 border-dashed border-primary rounded-3xl m-3 pointer-events-none"
          >
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col items-center gap-3 max-w-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-bounce">
                <UploadCloud size={32} />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-white">
                  Solte o arquivo ou vídeo aqui
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Suporte para vídeos de até {videoLimitMb} MB, fotos, áudios e documentos
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Header */}
      <div className="glass-nav px-3.5 sm:px-5 py-2.5 sm:py-3.5 flex justify-between items-center shadow-sm relative z-20 mx-3 sm:mx-6 rounded-2xl sm:rounded-[2rem] mb-2 sm:mb-3 border dark:border-slate-800">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Hash className="text-primary" size={18} />
          </div>
          <div>
            <h3 className="font-display uppercase text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-2">
              Grupo Geral
            </h3>
            <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate max-w-[130px] sm:max-w-none">
              Membros da célula • Arquivos e vídeos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Video Size Limit Quick Config Button (Responsive: icon+pill on mobile, full text on sm+) */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all border border-slate-200/60 dark:border-slate-700 active:scale-95"
            title="Ajustar limite de tamanho de vídeos e arquivos"
          >
            <Video size={13} className="text-primary shrink-0" />
            <span className="hidden sm:inline">Vídeos até {videoLimitMb} MB</span>
            <span className="inline sm:hidden text-[11px] font-bold">{videoLimitMb} MB</span>
            <Sliders size={11} className="text-slate-400 ml-0.5 shrink-0" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Opções do chat"
            >
              <MoreVertical size={20} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 top-10 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-30"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowSettingsModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between font-medium transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders size={14} className="text-primary" />
                      Limite de Vídeos
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {videoLimitMb} MB
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="w-full px-4 py-2.5 text-xs text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 font-medium transition-colors"
                  >
                    <Trash2 size={14} />
                    Limpar histórico local
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Error / File Limit Notice Banner */}
      <AnimatePresence>
        {fileErrorNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mb-2 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-800 dark:text-amber-200 shadow-sm"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold">{fileErrorNotice.message}</span>
                {fileErrorNotice.canIncrease && fileErrorNotice.requiredMb && (
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                    Você pode aumentar o limite para até 250 MB para enviar este vídeo com facilidade.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {fileErrorNotice.canIncrease && fileErrorNotice.requiredMb && (
                <button
                  type="button"
                  onClick={() => {
                    const targetPreset =
                      VIDEO_LIMIT_PRESETS.find((p) => p.mb >= (fileErrorNotice.requiredMb || 100))?.mb ||
                      250;
                    handleUpdateVideoLimit(targetPreset);
                    setFileErrorNotice(null);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] transition-colors shadow-sm"
                >
                  Aumentar para {fileErrorNotice.requiredMb <= 200 ? '200' : '250'} MB
                </button>
              )}
              <button
                type="button"
                onClick={() => setFileErrorNotice(null)}
                className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-3 space-y-4 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-4 py-8">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-3 shadow-sm">
              <MessageCircle size={32} />
            </div>
            <h4 className="font-display text-lg text-slate-800 dark:text-white">
              Comunhão da Célula Despertar
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm leading-relaxed">
              Espaço 100% limpo e pronto para receber fotos dos encontros, vídeos de testemunho, áudios e pedidos de oração.
            </p>

            <div className="flex flex-wrap gap-2 justify-center mt-5">
              <button
                type="button"
                onClick={() => setInputValue('Paz do Senhor família! 🙏 Animados para a célula?')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
              >
                🙏 "Paz do Senhor família!"
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ImageIcon size={13} className="text-primary" /> Enviar Foto
              </button>
              <button
                type="button"
                onClick={startAudioRecording}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Mic size={13} className="text-primary" /> Gravar Áudio
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
          const isMe = msg.senderId === user.id;
          const showName = i === 0 || messages[i - 1].senderId !== msg.senderId;
          const att = msg.attachment;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex gap-3 max-w-[88%]',
                isMe ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
              )}
            >
              {!isMe && (
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 mt-1 shadow-sm">
                  {msg.senderAvatarUrl && !msg.senderAvatarUrl.includes('dicebear') ? (
                    <img
                      src={msg.senderAvatarUrl}
                      alt={msg.senderName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-primary">
                      {msg.senderName.charAt(0)}
                    </span>
                  )}
                </div>
              )}
              <div
                className={cn(
                  'flex flex-col max-w-full',
                  isMe ? 'items-end' : 'items-start'
                )}
              >
                {showName && (
                  <span
                    className={cn(
                      'text-[9px] font-black uppercase tracking-widest mb-1 mx-1',
                      isMe
                        ? 'text-primary'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={cn(
                    'p-3.5 text-sm shadow-sm break-words leading-relaxed overflow-hidden',
                    isMe
                      ? 'primary-gradient text-white rounded-t-2xl rounded-l-2xl'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-t-2xl rounded-r-2xl border border-slate-100 dark:border-slate-800'
                  )}
                >
                  {/* Attachment Presentation */}
                  {att && (
                    <div className="mb-2">
                      {/* Image Attachment */}
                      {att.type === 'image' && (
                        <div className="relative group overflow-hidden rounded-xl bg-black/5 dark:bg-black/40">
                          <img
                            src={att.url}
                            alt={att.name}
                            className="max-h-72 w-full object-cover rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                            onClick={() =>
                              setPreviewImageModal({ url: att.url, name: att.name })
                            }
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImageModal({ url: att.url, name: att.name })
                              }
                              className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                              title="Visualizar imagem"
                            >
                              <Eye size={14} />
                            </button>
                            <a
                              href={att.url}
                              download={att.name}
                              className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors flex items-center justify-center"
                              title="Baixar imagem"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Video Attachment with Streaming Player */}
                      {att.type === 'video' && (
                        <div
                          className={cn(
                            'rounded-2xl overflow-hidden border shadow-sm max-w-sm sm:max-w-md',
                            isMe
                              ? 'bg-black/20 border-white/20'
                              : 'bg-slate-900 text-white border-slate-800'
                          )}
                        >
                          <div className="relative bg-black flex items-center justify-center">
                            <video
                              controls
                              preload="metadata"
                              src={att.url}
                              className="max-h-80 w-full rounded-t-2xl object-contain bg-black"
                            />
                          </div>

                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex items-center gap-2">
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                  isMe ? 'bg-white/20' : 'bg-primary/20 text-primary'
                                )}
                              >
                                <Film size={16} />
                              </div>
                              <div className="min-w-0">
                                <p
                                  className="text-xs font-bold truncate max-w-[180px] sm:max-w-[220px]"
                                  title={att.name}
                                >
                                  {att.name}
                                </p>
                                <span className="text-[10px] opacity-75 font-medium">
                                  {formatFileSize(att.size)} • Vídeo
                                </span>
                              </div>
                            </div>

                            <a
                              href={att.url}
                              download={att.name}
                              className={cn(
                                'px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0',
                                isMe
                                  ? 'bg-white/20 hover:bg-white/30 text-white'
                                  : 'bg-primary hover:bg-primary/90 text-white shadow-sm'
                              )}
                              title="Baixar vídeo"
                            >
                              <Download size={13} />
                              <span>Baixar</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Audio Attachment */}
                      {att.type === 'audio' && (
                        <div
                          className={cn(
                            'p-3 rounded-xl border flex flex-col gap-2 min-w-[240px]',
                            isMe
                              ? 'bg-black/15 border-white/20 text-white'
                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                isMe ? 'bg-white/20' : 'bg-primary/10'
                              )}
                            >
                              {renderAttachmentIcon('audio', isMe)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate" title={att.name}>
                                {att.name}
                              </p>
                              <span className="text-[10px] opacity-75 font-medium">
                                {formatFileSize(att.size)}
                              </span>
                            </div>
                            <a
                              href={att.url}
                              download={att.name}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                isMe
                                  ? 'hover:bg-white/20 text-white'
                                  : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                              )}
                              title="Baixar áudio"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                          <audio
                            controls
                            src={att.url}
                            className="w-full h-8 mt-1 rounded-md"
                          />
                        </div>
                      )}

                      {/* Documents / PDFs / Other Files */}
                      {att.type !== 'image' &&
                        att.type !== 'audio' &&
                        att.type !== 'video' && (
                          <div
                            className={cn(
                              'p-3 rounded-xl border flex items-center gap-3 min-w-[220px] max-w-sm',
                              isMe
                                ? 'bg-black/15 border-white/20 text-white'
                                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60'
                            )}
                          >
                            <div
                              className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                                isMe ? 'bg-white/20' : 'bg-white dark:bg-slate-900'
                              )}
                            >
                              {renderAttachmentIcon(att.type, isMe)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-xs font-bold truncate leading-tight"
                                title={att.name}
                              >
                                {att.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                                  {att.type}
                                </span>
                                <span className="text-[10px] opacity-75 font-medium">
                                  {formatFileSize(att.size)}
                                </span>
                              </div>
                            </div>
                            <a
                              href={att.url}
                              download={att.name}
                              className={cn(
                                'p-2 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center',
                                isMe
                                  ? 'bg-white/20 hover:bg-white/30 text-white active:scale-95'
                                  : 'bg-primary text-white hover:bg-primary/90 active:scale-95 shadow-primary/20'
                              )}
                              title="Baixar arquivo"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Text Message Content */}
                  {msg.text && (
                    <div className={cn(att ? 'mt-1.5' : '')}>{msg.text}</div>
                  )}
                </div>
                <span className="text-[8px] text-slate-300 dark:text-slate-600 font-bold mt-1 px-1 italic">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </motion.div>
          );
        }))}
      </div>

      {/* Input Area */}
      <div className="p-2 sm:p-4 bg-transparent mt-auto relative z-10">
        {user.role === 'visitor' ? (
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[2rem] shadow-xl border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Modo Visitante: Chat em modo leitura
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Cadastre-se como membro da célula para enviar mensagens, áudios e vídeos.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full shrink-0">
              Apenas Leitura
            </span>
          </div>
        ) : (
          <form
            onSubmit={handleSend}
            className="bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2"
          >
            {/* Real-time Upload Progress Bar */}
            <AnimatePresence>
              {uploadProgress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                      <Loader2 size={14} className="animate-spin text-primary" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">
                        Enviando {uploadProgress.fileName}...
                      </span>
                    </div>
                    <span className="text-primary font-bold">{uploadProgress.percent}%</span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200 ease-out"
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span>
                      {formatFileSize(uploadProgress.loaded)} de {formatFileSize(uploadProgress.total)}
                    </span>
                    <span>Otimizado para streaming</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pending attachment preview pill */}
            <AnimatePresence>
              {pendingAttachment && !uploadProgress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 pt-2 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {pendingAttachment.type === 'image' ? (
                      <img
                        src={pendingAttachment.url}
                        alt={pendingAttachment.name}
                        className="w-10 h-10 object-cover rounded-xl border dark:border-slate-700 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {renderAttachmentIcon(pendingAttachment.type, false)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {pendingAttachment.type}
                        </span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[200px]">
                          {pendingAttachment.name}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {formatFileSize(pendingAttachment.size)} • Pronto para enviar
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPendingAttachment(null)}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    title="Remover anexo"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {isRecordingAudio ? (
              /* Live Audio Recording Bar */
              <div className="flex items-center justify-between gap-3 px-3 py-2 w-full bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/50">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                    {formatRecordingDuration(recordingSeconds)}
                  </span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">
                    Gravando áudio de voz...
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelAudioRecording}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 hover:bg-red-100/50 dark:hover:bg-red-900/30 rounded-xl transition-colors cursor-pointer"
                    title="Cancelar gravação"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={stopAndSendAudioRecording}
                    className="w-10 h-10 primary-gradient text-white rounded-full flex items-center justify-center shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title="Enviar áudio gravado"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                {/* Attachment Picker */}
                <button
                  type="button"
                  disabled={isProcessingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-full transition-all shrink-0 cursor-pointer',
                    pendingAttachment
                      ? 'text-primary bg-primary/10 hover:bg-primary/20'
                      : 'text-slate-400 dark:text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                  title={`Anexar foto, áudio ou vídeo (Vídeos até ${videoLimitMb} MB)`}
                >
                  {isProcessingFile ? (
                    <Loader2 size={18} className="animate-spin text-primary" />
                  ) : (
                    <Paperclip size={20} />
                  )}
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    pendingAttachment
                      ? 'Adicione uma legenda (opcional)...'
                      : `Mensagem (vídeos até ${videoLimitMb}MB, fotos, áudios)...`
                  }
                  className="flex-1 px-2 py-3 bg-transparent focus:outline-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />

                {/* Show Microphone button when no text or pending attachment; otherwise Send button */}
                {!inputValue.trim() && !pendingAttachment ? (
                  <button
                    type="button"
                    onClick={startAudioRecording}
                    disabled={isProcessingFile}
                    className="w-11 h-11 bg-primary/10 hover:bg-primary/20 text-primary dark:text-white dark:bg-primary/20 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                    title="Gravar mensagem de voz"
                  >
                    <Mic size={19} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isProcessingFile}
                    className="w-12 h-12 primary-gradient text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-40 disabled:shadow-none hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                    title="Enviar"
                  >
                    <Send size={18} />
                  </button>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Video Size Limit Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 max-w-md w-full relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Video size={22} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white leading-tight">
                      Tamanho de Vídeo Enviado
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Escolha o limite máximo de tamanho para vídeos
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2.5 my-5">
                {VIDEO_LIMIT_PRESETS.map((preset) => {
                  const isSelected = videoLimitMb === preset.mb;
                  return (
                    <button
                      key={preset.mb}
                      type="button"
                      onClick={() => handleUpdateVideoLimit(preset.mb)}
                      className={cn(
                        'w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                            isSelected
                              ? 'border-primary bg-primary text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          )}
                        >
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {preset.label}
                            </span>
                            {preset.recommended && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                                <Sparkles size={10} /> Padrão
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {preset.desc}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {preset.mb} MB
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                💡 <strong className="text-slate-700 dark:text-slate-300">Dica:</strong> Vídeos
                maiores são enviados com streaming direto no servidor, permitindo reproduzir vídeos em
                alta definição sem travar a navegação dos participantes da célula.
              </div>

              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-3 primary-gradient text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Concluir e Salvar (Atual: {videoLimitMb} MB)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Preview Modal */}
      <AnimatePresence>
        {previewImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4"
            onClick={() => setPreviewImageModal(null)}
          >
            <div
              className="flex justify-between items-center py-2 px-4 text-white max-w-5xl mx-auto w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium truncate max-w-xs sm:max-w-md">
                {previewImageModal.name}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageModal.url}
                  download={previewImageModal.name}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Download size={16} /> Baixar
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              className="flex-1 flex items-center justify-center p-2"
              onClick={() => setPreviewImageModal(null)}
            >
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={previewImageModal.url}
                alt={previewImageModal.name}
                className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
