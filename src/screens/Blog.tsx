import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Video, Mic, Heart, MessageSquare, Share2, Plus, X, Trash2, Eye, Lock, Edit2, Pin, Shield, Check, Upload, Loader2 } from 'lucide-react';
import { User, BlogPost } from '../types';
import { MOCK_POSTS } from '../mockData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { notificationService } from '../lib/notificationService';
import { uploadAndSaveImageToDB } from '../lib/cellDatabase';

export default function Blog({ user }: { user: User }) {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('cell_posts');
    return saved ? JSON.parse(saved) : MOCK_POSTS;
  });
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  // Edit Post State (Admin or Author)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editIsPinned, setEditIsPinned] = useState(false);

  const handleSelectPostImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const saved = await uploadAndSaveImageToDB({
        file,
        title: title.trim() || `Post de ${user.name}`,
        category: 'blog',
        user,
      });
      setUploadedImageUrl(saved.dataUrl || saved.url);
      setMediaType('image');
    } catch {
      // Ignore
    } finally {
      setIsUploadingImage(false);
      if (postImageInputRef.current) postImageInputRef.current.value = '';
    }
  };

  // Sync with shared server API so posts are visible to all members
  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const serverPosts: BlogPost[] = await res.json();
          if (isMounted && Array.isArray(serverPosts) && serverPosts.length > 0) {
            setPosts(serverPosts);
            localStorage.setItem('cell_posts', JSON.stringify(serverPosts));
          }
        }
      } catch {
        // Offline / fallback to localStorage
      }
    };

    fetchPosts();
    const interval = setInterval(fetchPosts, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: BlogPost = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: user.id,
      authorName: user.name,
      authorAvatarUrl: user.avatarUrl,
      title: title.trim(),
      content: content.trim(),
      createdAt: Date.now(),
      isPinned: user.role === 'admin' ? isPinned : false,
      imageUrl: uploadedImageUrl || (mediaType === 'image' ? 'https://images.unsplash.com/photo-1544427928-c49cdfebf194?w=800' : undefined)
    };
    const updated = [newPost, ...posts.filter(p => p.id !== newPost.id)];
    setPosts(updated);
    localStorage.setItem('cell_posts', JSON.stringify(updated));

    // Send to shared server
    try {
      fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      }).catch(() => {});
    } catch {
      // Local copy saved
    }
    
    if (user.role === 'admin') {
      notificationService.send('Novo post na comunidade!', `${user.name} postou: ${title}`);
    }

    setShowCreate(false);
    setTitle('');
    setContent('');
    setIsPinned(false);
    setMediaType(null);
    setUploadedImageUrl('');
  };

  const handleStartEdit = (post: BlogPost) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditIsPinned(Boolean(post.isPinned));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    const updatedPost: BlogPost = {
      ...editingPost,
      title: editTitle.trim(),
      content: editContent.trim(),
      isPinned: user.role === 'admin' ? editIsPinned : editingPost.isPinned,
    };

    const updated = posts.map(p => p.id === updatedPost.id ? updatedPost : p);
    setPosts(updated);
    localStorage.setItem('cell_posts', JSON.stringify(updated));

    try {
      fetch(`/api/posts/${updatedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPost),
      }).catch(() => {});
    } catch {}

    setEditingPost(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Deseja realmente excluir este post?')) return;
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem('cell_posts', JSON.stringify(updated));

    try {
      fetch(`/api/posts/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {
      // Local copy updated
    }
  };

  // Sort posts: Pinned posts first, then newest to oldest
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-4xl text-slate-900 dark:text-white tracking-tight">Comunidade</h2>
          <p className="text-primary font-bold text-[10px] uppercase tracking-widest mt-1">Espalhe a palavra</p>
        </div>
        {user.role !== 'visitor' ? (
          <button 
            onClick={() => setShowCreate(true)}
            className="primary-gradient w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 hover:scale-110 transition-transform cursor-pointer"
            title="Publicar na comunidade"
          >
            <Plus size={24} />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40">
            <Eye size={14} /> Modo Leitura
          </div>
        )}
      </div>

      {user.role === 'visitor' && (
        <div className="p-4 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Lock size={18} />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
            <strong>Bem-vindo(a) à nossa Comunidade!</strong> Como visitante, você pode ler todas as publicações e testemunhos. Para publicar o seu relato, faça o cadastro simples de membro.
          </p>
        </div>
      )}

      <div className="space-y-6 sm:space-y-8">
        {sortedPosts.map(post => {
          const canEditOrDelete = user.role === 'admin' || post.authorId === user.id;

          return (
            <article
              key={post.id}
              className={cn(
                "bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 shadow-sm border flex flex-col relative transition-all",
                post.isPinned
                  ? "border-amber-400/50 dark:border-amber-500/40 bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-md shadow-amber-500/5"
                  : "border-slate-100 dark:border-slate-800"
              )}
            >
              {/* Action Buttons (Edit & Delete) for Admin or Author */}
              {canEditOrDelete && (
                <div className="absolute top-5 right-5 flex items-center gap-1 z-10">
                  <button 
                    onClick={() => handleStartEdit(post)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title={user.role === 'admin' ? "Editar Post (Admin)" : "Editar Meu Post"}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                    title={user.role === 'admin' ? "Excluir Post (Admin)" : "Excluir Meu Post"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Pinned Leadership Badge */}
              {post.isPinned && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider mb-4 w-fit border border-amber-500/30">
                  <Pin size={11} className="rotate-45" />
                  <Shield size={11} />
                  <span>Comunicado Oficial da Liderança</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-6 pr-16">
                <div className="w-12 h-12 primary-gradient rounded-2xl flex items-center justify-center text-white font-display text-xl border-4 border-white dark:border-slate-800 shadow-sm overflow-hidden shrink-0">
                  {post.authorAvatarUrl ? (
                    <img src={post.authorAvatarUrl} alt={post.authorName} className="w-full h-full object-cover" />
                  ) : (
                    post.authorName.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{post.authorName}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                    {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>

              {post.imageUrl && (
                <div className="mb-6 rounded-2xl overflow-hidden shadow-inner bg-slate-50 dark:bg-slate-800">
                  <img src={post.imageUrl} alt={post.title} className="w-full h-56 object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              )}

              <h3 className="font-display text-2xl text-slate-900 dark:text-white mb-3 leading-tight tracking-tight">
                {post.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              <div className="flex items-center gap-4 pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-auto">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-colors cursor-pointer">
                  <Heart size={16} /> 24
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-primary/10 hover:text-primary rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-colors cursor-pointer">
                  <MessageSquare size={16} /> 5
                </button>
                <button className="ml-auto p-2 text-slate-300 dark:text-slate-600 hover:text-primary cursor-pointer">
                  <Share2 size={18} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal: Editar Post (Admin ou Autor) */}
      <AnimatePresence>
        {editingPost && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md relative border border-slate-100 dark:border-slate-800 my-auto"
            >
              <button 
                onClick={() => setEditingPost(null)} 
                className="absolute top-6 right-6 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-slate-900 dark:text-white tracking-tight">Editar Postagem</h3>
                  <p className="text-[11px] text-slate-400">
                    {user.role === 'admin' ? 'Moderação de Administrador' : 'Edição da sua postagem'}
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleSaveEdit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Assunto / Título *</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Conteúdo da Mensagem *</label>
                  <textarea 
                    rows={4}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {user.role === 'admin' && (
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs font-bold text-amber-800 dark:text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsPinned}
                      onChange={e => setEditIsPinned(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                    />
                    <Pin size={14} className="rotate-45 text-amber-600" />
                    <span>Fixar no topo como Comunicado Oficial</span>
                  </label>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPost(null)}
                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-600/25 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check size={16} /> Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Novo Post */}
      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md relative border dark:border-slate-800 my-auto"
            >
              <button onClick={() => setShowCreate(false)} className="absolute top-6 right-6 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-2 mb-6">
                <h3 className="font-display text-3xl text-slate-900 dark:text-white tracking-tight italic">Novo Post</h3>
                {user.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-bold uppercase">
                    Admin
                  </span>
                )}
              </div>
              
              <form onSubmit={handleCreatePost} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Assunto</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Título do seu post ou testemunho"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:outline-none focus:border-primary transition-all font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Sua Mensagem</label>
                  <textarea 
                    rows={4}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="O que você quer compartilhar com a célula hoje?"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:outline-none focus:border-primary transition-all resize-none text-slate-900 dark:text-white"
                    required
                  />
                </div>

                {user.role === 'admin' && (
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs font-bold text-amber-800 dark:text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={e => setIsPinned(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                    />
                    <Pin size={14} className="rotate-45 text-amber-600" />
                    <span>Fixar no topo como Comunicado Oficial da Liderança</span>
                  </label>
                )}

                <div className="flex gap-4">
                  {[
                    { icon: ImageIcon, type: 'image', label: 'Foto' },
                    { icon: Video, type: 'video', label: 'Vídeo' },
                    { icon: Mic, type: 'audio', label: 'Áudio' }
                  ].map((btn) => (
                    <button 
                      key={btn.type}
                      type="button"
                      onClick={() => setMediaType(btn.type as any)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        mediaType === btn.type 
                          ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary" 
                          : "border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-700"
                      )}
                    >
                      <btn.icon size={20} />
                      <span className="text-[8px] font-black uppercase tracking-widest">{btn.label}</span>
                    </button>
                  ))}
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 primary-gradient text-white font-display text-xl rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 cursor-pointer"
                >
                  Postar Agora
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
