import React, { useEffect, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, MessageSquare, Send, ThumbsUp, User, Pencil, Trash2, X, Check } from 'lucide-react';
import { getForumPostById, createForumComment, toggleForumPostVote, updateForumPost, deleteForumPost } from '../data/supabaseService';
import { ForumPost, FORUM_CATEGORIES, getCategoryStyle } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { GooeyFilter } from '../components/GooeyFilter';

export default function ForumPostDetail() {
  const { toast, confirm } = useUI();

  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editCategory, setEditCategory] = useState('Geral');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function loadPost() {
      if (!id) return;
      try {
        const data = await getForumPostById(id, user?.id);
        setPost(data);
        if (data) {
          setEditTitle(data.title);
          setEditBody(data.body);
          setEditCategory(data.category || 'Geral');
        }
      } catch (err) {
        console.error('Error loading post', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPost();
  }, [id, user?.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await createForumComment({
        postId: id,
        authorId: user.id,
        authorName: user.name,
        body: newComment
      });
      // Recarregar o post para ver o novo comentário
      const updatedPost = await getForumPostById(id);
      setPost(updatedPost);
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment', error);
      toast('Erro ao enviar comentário.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    if (!id || !post) return;
    if (!user) {
      toast("Você precisa estar logado para votar.", 'info');
      return;
    }
    try {
      // Otimisticamente atualiza a UI
      const isAddingVote = !post.userHasVoted;
      setPost({ 
        ...post, 
        userHasVoted: isAddingVote,
        upvotes: isAddingVote ? post.upvotes + 1 : Math.max(0, post.upvotes - 1)
      });
      
      const newStatus = await toggleForumPostVote(id, user.id);
      
      // Se por acaso a API divergir, não reverte silenciosamente mas aqui
      // ignoramos o rollback pq assumimos sucesso (idealmente teríamos tratamento)
    } catch (err) {
      console.error('Error toggling vote', err);
      // Rollback na UI em caso de erro
      const isAddingVote = !post.userHasVoted;
      setPost({ 
        ...post, 
        userHasVoted: !isAddingVote,
        upvotes: !isAddingVote ? post.upvotes + 1 : Math.max(0, post.upvotes - 1)
      });
      toast('Erro ao processar voto.', 'error');
    }
  };

  const handleDeletePost = async () => {
    if (!id) return;
    if (!await confirm('Tem certeza que deseja deletar este tópico? Esta ação não pode ser desfeita.')) return;
    
    try {
      await deleteForumPost(id);
      navigate('/forum');
    } catch (err) {
      console.error('Error deleting post', err);
      toast('Erro ao deletar tópico.', 'error');
    }
  };

  const handleUpdatePost = async () => {
    if (!id || !post || !editTitle.trim() || !editBody.trim()) return;
    
    setIsUpdating(true);
    try {
      await updateForumPost(id, editTitle, editBody, editCategory);
      setPost({ ...post, title: editTitle, body: editBody, category: editCategory });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating post', err);
      toast('Erro ao salvar as edições.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const canEditOrDelete = user && post && (user.id === post.authorId || user.role === 'admin');

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#FFFDF2] flex items-center justify-center">
        <div className="skeleton w-32 h-32 rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#FFFDF2] flex flex-col items-center justify-center p-4">
        <h2 className="text-3xl font-playfair font-bold text-brown mb-4">Post não encontrado</h2>
        <Link to="/forum" className="text-fox hover:underline font-bold flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Fórum
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#FFFDF2] relative overflow-hidden">
      <GooeyFilter id="forum-detail-goo" strength={15} />
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-fox/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative z-10 max-w-4xl">
        <Link to="/forum" className="inline-flex items-center gap-2 text-brown/50 hover:text-fox text-sm font-bold uppercase tracking-wider mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Fórum
        </Link>

        {/* Post Main Content */}
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl p-6 md:p-10 mb-8"
        >
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-brown/5 text-brown/60 text-[10px] uppercase font-bold tracking-widest rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-b border-brown/5 pb-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-fox/10 flex items-center justify-center text-fox">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-brown text-lg">{post.authorName}</div>
                <div className="text-xs text-brown/50 uppercase tracking-wider font-semibold">
                  {post.authorRole || 'Membro'} {post.startupName && `• ${post.startupName}`}
                </div>
              </div>
              <div className="text-sm text-brown/40 font-medium ml-2">
                {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </div>
            </div>
            
            {canEditOrDelete && !isEditing && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-brown/40 hover:text-fox hover:bg-fox/10 rounded-full transition-colors"
                  aria-label="Editar tópico"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleDeletePost}
                  className="p-2 text-brown/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Deletar tópico"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 mb-8 bg-brown/5 p-6 rounded-2xl border border-brown/10">
              <div>
                <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-2">Título</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-brown/10 rounded-xl text-brown font-bold text-xl outline-none focus:ring-2 focus:ring-fox/20 focus:border-fox transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-2">Categoria</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-brown/10 rounded-xl text-brown font-semibold outline-none focus:ring-2 focus:ring-fox/20 focus:border-fox transition-all cursor-pointer"
                >
                  {FORUM_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brown/50 uppercase tracking-widest mb-2">Conteúdo</label>
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-white border border-brown/10 rounded-xl text-brown outline-none focus:ring-2 focus:ring-fox/20 focus:border-fox resize-none transition-all"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(post.title);
                    setEditBody(post.body);
                    setEditCategory(post.category || 'Geral');
                  }}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-brown/50 hover:bg-white hover:text-brown transition-colors"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button
                  onClick={handleUpdatePost}
                  disabled={isUpdating || !editTitle.trim() || !editBody.trim()}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-sm font-bold bg-fox text-white hover:bg-fox/90 shadow-md transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Salvando...' : <><Check className="w-4 h-4" /> Salvar Alterações</>}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full", getCategoryStyle(post.category))}>
                  {post.category || 'Geral'}
                </span>
                {post.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-brown/5 text-brown/60 text-[10px] uppercase font-bold tracking-widest rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl md:text-5xl font-playfair font-bold text-brown mb-6 leading-tight">
                {post.title}
              </h1>
              <div className="prose prose-brown max-w-none text-brown/80 leading-relaxed mb-8">
                {post.body.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center gap-4 pt-4">
            <button 
              onClick={handleUpvote}
              className={cn(
                "group flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all",
                post.userHasVoted
                  ? "bg-fox text-white hover:bg-fox/90 shadow-md"
                  : "bg-brown/5 hover:bg-fox/10 text-brown hover:text-fox"
              )}
            >
              <ThumbsUp className="w-5 h-5 group-active:scale-90 transition-transform" />
              <span className="tabular-nums">{post.upvotes} {post.upvotes === 1 ? 'voto' : 'votos'}</span>
            </button>
            <div className="flex items-center gap-2 text-brown/50 font-bold px-4 py-2">
              <MessageSquare className="w-5 h-5" />
              <span>{post.commentsCount} {post.commentsCount === 1 ? 'resposta' : 'respostas'}</span>
            </div>
          </div>
        </motion.article>

        {/* Comments Section */}
        <section className="space-y-8">
          <h3 className="text-2xl font-playfair font-bold text-brown">Respostas</h3>

          {/* Comment Form */}
          {user ? (
            <motion.form 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onSubmit={handleCommentSubmit}
              className="bg-white/60 p-6 rounded-2xl border border-brown/10 shadow-sm"
            >
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Escreva sua resposta..."
                className="w-full bg-white border border-brown/10 rounded-xl p-4 text-brown focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none resize-none min-h-[120px] transition-all"
                disabled={isSubmitting}
                required
              />
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="flex items-center gap-2 bg-fox text-white px-6 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-fox/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Enviando...' : 'Responder'}
                </button>
              </div>
            </motion.form>
          ) : (
            <div className="bg-brown/5 p-6 rounded-2xl text-center border border-brown/10">
              <p className="text-brown/60 mb-4 font-medium">Faça login para participar da discussão.</p>
              <Link to="/login" className="inline-block bg-fox text-white px-6 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-fox/90 active:scale-95 transition-all">
                Fazer Login
              </Link>
            </div>
          )}

          {/* Comment List */}
          <div className="space-y-6">
            {post.comments?.map(comment => (
              <motion.div 
                key={comment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-white"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-brown/10 flex items-center justify-center text-brown text-xs font-bold">
                    {comment.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-brown text-sm">{comment.authorName}</div>
                    <div className="text-[10px] text-brown/40 uppercase tracking-widest">
                      {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-brown/80 text-sm leading-relaxed">
                  {comment.body}
                </div>
              </motion.div>
            ))}
            
            {(!post.comments || post.comments.length === 0) && (
              <p className="text-center text-brown/40 py-8">
                Ainda não há respostas. Seja o primeiro a comentar!
              </p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
