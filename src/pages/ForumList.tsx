import React, { useEffect, useState, useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageSquare, ArrowRight, TrendingUp, Plus, Clock, ThumbsUp } from 'lucide-react';
import { getForumPosts } from '../data/supabaseService';
import { ForumPost, FORUM_CATEGORIES, getCategoryStyle } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { GooeyFilter } from '../components/GooeyFilter';

export default function ForumList() {
  const { toast, confirm } = useUI();

  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Geral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const data = await getForumPosts();
      setPosts(data);
    } catch (err) {
      console.error('Error loading forum posts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostTitle.trim() || !newPostBody.trim()) return;

    setIsSubmitting(true);
    try {
      // Assuming getForumPosts might fail if we don't handle local mock appropriately
      // But we will try createForumPost
      const { createForumPost } = await import('../data/supabaseService');
      await createForumPost({
        title: newPostTitle,
        body: newPostBody,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        category: newPostCategory,
        tags: [], // Could add tag input later
      });
      setIsCreateModalOpen(false);
      setNewPostTitle('');
      setNewPostBody('');
      setNewPostCategory('Geral');
      await loadPosts();
    } catch (error) {
      console.error('Failed to create post', error);
      toast('Erro ao criar tópico. Tente novamente mais tarde.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const recentPosts = useMemo(() => {
    let filtered = posts;
    if (selectedCategory !== 'Todos') {
      filtered = posts.filter(p => p.category === selectedCategory);
    }
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, selectedCategory]);

  const topPosts = useMemo(() => {
    return [...posts].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5);
  }, [posts]);

  return (
    <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#FFFDF2] relative overflow-hidden">
      <GooeyFilter id="forum-goo" strength={15} />
      
      {/* Background Decor */}
      <div className="absolute -left-32 top-0 w-[500px] h-[500px] bg-fox/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative z-10 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl sm:text-6xl font-bold font-playfair text-brown mb-4 tracking-tight leading-tight">
              Fórum <span className="text-fox italic">iLab</span>
            </h1>
            <p className="text-lg text-brown/65">
              Conecte-se com fundadores, tire dúvidas e compartilhe conhecimentos no ecossistema Sanfran iLab.
            </p>
          </motion.div>
          
          {user && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="group inline-flex items-center gap-2 bg-fox text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm shadow-[0_8px_20px_rgba(255,107,0,0.3)] hover:shadow-[0_12px_28px_rgba(255,107,0,0.4)] hover:bg-fox/95 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Tópico
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          
          {/* Main Content - Recent Posts */}
          <div className="space-y-6">
            <h2 className="flex items-center gap-2 text-2xl font-bold font-playfair text-brown mb-6">
              <Clock className="w-5 h-5 text-fox" />
              Tópicos Recentes
            </h2>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                onClick={() => setSelectedCategory('Todos')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                  selectedCategory === 'Todos' 
                    ? "bg-fox text-white shadow-md" 
                    : "bg-white/50 text-brown/60 hover:bg-white hover:text-brown"
                )}
              >
                Todos
              </button>
              {FORUM_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                    selectedCategory === cat.id 
                      ? "bg-fox text-white shadow-md" 
                      : "bg-white/50 text-brown/60 hover:bg-white hover:text-brown"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/60 p-6 rounded-2xl border border-brown/5 skeleton h-32" />
                ))}
              </div>
            ) : recentPosts.length > 0 ? (
              <div className="space-y-4">
                {recentPosts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      to={`/forum/${post.id}`}
                      className="block bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md hover:border-fox/20 group transition-all"
                    >
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 shrink-0 pr-4 pl-2 text-brown/30 group-hover:text-fox transition-colors">
                          <ThumbsUp className="w-5 h-5" />
                          <span className="font-bold tabular-nums text-lg">{post.upvotes}</span>
                        </div>
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest", getCategoryStyle(post.category))}>
                              {post.category || 'Geral'}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold font-playfair text-brown group-hover:text-fox transition-colors mb-2">
                            {post.title}
                          </h3>
                          <p className="text-brown/60 text-sm line-clamp-2 mb-4">
                            {post.body}
                          </p>
                          <div className="flex items-center gap-4 text-xs font-semibold text-brown/40 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-brown/10 flex items-center justify-center text-[10px] text-brown font-bold">
                                {post.authorName.charAt(0)}
                              </div>
                              <span className="text-brown/60">{post.authorName}</span>
                              {post.startupName && (
                                <>
                                  <span>•</span>
                                  <span className="text-fox">{post.startupName}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 ml-auto">
                              <MessageSquare className="w-4 h-4" />
                              {post.commentsCount}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white/50 border border-brown/5 rounded-2xl p-12 text-center">
                <MessageSquare className="w-12 h-12 text-brown/20 mx-auto mb-4" />
                <h3 className="text-xl font-playfair font-bold text-brown mb-2">Nenhum tópico encontrado</h3>
                <p className="text-brown/50">Seja o primeiro a iniciar uma discussão!</p>
              </div>
            )}
          </div>

          {/* Sidebar - Trending Posts */}
          <div className="space-y-6">
            <div className="bg-brown/5 rounded-[24px] p-6 border border-brown/10 sticky top-24">
              <h2 className="flex items-center gap-2 text-xl font-bold font-playfair text-brown mb-6">
                <TrendingUp className="w-5 h-5 text-gold" />
                Em Alta
              </h2>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
                </div>
              ) : topPosts.length > 0 ? (
                <div className="space-y-4">
                  {topPosts.map((post, idx) => (
                    <Link
                      key={post.id}
                      to={`/forum/${post.id}`}
                      className="group flex gap-4 p-3 -mx-3 rounded-xl hover:bg-white/50 transition-colors"
                    >
                      <div className="font-playfair font-black text-2xl text-brown/15 group-hover:text-gold transition-colors w-6 tabular-nums">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-brown text-sm line-clamp-2 group-hover:text-fox transition-colors mb-1">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-brown/40 font-bold">
                          <span>{post.upvotes} {post.upvotes === 1 ? 'voto' : 'votos'}</span>
                          <span>{post.commentsCount} {post.commentsCount === 1 ? 'resposta' : 'respostas'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-brown/50">Ainda não há tópicos em alta.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#FFFDF2] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20"
          >
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-playfair font-bold text-brown">Criar Novo Tópico</h2>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-brown/5 flex items-center justify-center text-brown/50 hover:text-brown hover:bg-brown/10 transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-brown/70 mb-1.5">Título do Tópico</label>
                  <input
                    type="text"
                    required
                    value={newPostTitle}
                    onChange={e => setNewPostTitle(e.target.value)}
                    placeholder="Ex: Dúvida sobre o Pitch Deck..."
                    className="w-full bg-white border border-brown/10 rounded-xl px-4 py-3 text-brown focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-brown/70 mb-1.5">Categoria</label>
                  <select
                    value={newPostCategory}
                    onChange={e => setNewPostCategory(e.target.value)}
                    className="w-full bg-white border border-brown/10 rounded-xl px-4 py-3 text-brown font-semibold focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none transition-all cursor-pointer"
                  >
                    {FORUM_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-brown/70 mb-1.5">Conteúdo</label>
                  <textarea
                    required
                    value={newPostBody}
                    onChange={e => setNewPostBody(e.target.value)}
                    placeholder="Descreva sua dúvida, ideia ou dica em detalhes..."
                    className="w-full bg-white border border-brown/10 rounded-xl p-4 text-brown focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none resize-none min-h-[200px] transition-all"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-brown/5 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-6 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs text-brown/60 hover:text-brown hover:bg-brown/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newPostTitle.trim() || !newPostBody.trim()}
                    className="bg-fox text-white px-8 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-[0_8px_20px_rgba(255,107,0,0.4)] hover:bg-fox/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Publicando...' : 'Publicar Tópico'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
