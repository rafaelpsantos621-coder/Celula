import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Mic, Heart, MessageSquare, Share2, Plus, X, Trash2, Eye, Lock } from 'lucide-react';
import { User, BlogPost } from '../types';
import { MOCK_POSTS } from '../mockData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { notificationService } from '../lib/notificationService';

export default function Blog({ user }: { user: User }) {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('cell_posts');
    return saved ? JSON.parse(saved) : MOCK_POSTS;
  });
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);

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
      title: title,
      content: content,
      createdAt: Date.now(),
      imageUrl: mediaType === 'image' ? 'https://images.unsplash.com/photo-1544427928-c49cdfebf194?w=800' : undefined
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
    setMediaType(null);
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
        {posts.map(post => (
          <article key={post.id} className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col relative transition-all">
            {user.role === 'admin' && (
              <button 
                onClick={() => handleDelete(post.id)}
                className="absolute top-6 right-6 p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                title="Excluir Post (Admin)"
              >
                <Trash2 size={18} />
              </button>
            )}
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 primary-gradient rounded-2xl flex items-center justify-center text-white font-display text-xl border-4 border-white dark:border-slate-800 shadow-sm overflow-hidden">
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
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              {post.content}
            </p>

            <div className="flex items-center gap-4 pt-1">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-colors">
                <Heart size={16} /> 24
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-primary/10 hover:text-primary rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-colors">
                <MessageSquare size={16} /> 5
              </button>
              <button className="ml-auto p-2 text-slate-300 dark:text-slate-600 hover:text-primary">
                <Share2 size={18} />
              </button>
            </div>
          </article>
        ))}
      </div>

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
              <button onClick={() => setShowCreate(false)} className="absolute top-6 right-6 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
              
              <h3 className="font-display text-3xl text-slate-900 dark:text-white mb-8 tracking-tight italic">Novo Post</h3>
              
              <form onSubmit={handleCreatePost} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Assunto</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Título do seu post"
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
                    placeholder="O que você quer compartilhar hoje?"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:outline-none focus:border-primary transition-all resize-none text-slate-900 dark:text-white"
                    required
                  />
                </div>

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
                        "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
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
                  className="w-full py-5 primary-gradient text-white font-display text-xl rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
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
