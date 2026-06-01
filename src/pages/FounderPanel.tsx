import React, { useState, useEffect, useCallback } from 'react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { Startup, StartupPost, StartupDocument, deliverableTypes } from '../data/mockData';
import { fetchStartupById, getPosts, createPost, updatePost, deletePost, getDocuments, createDocument, deleteDocument, submitDeliverable } from '../data/supabaseService';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Loader2, CheckCircle, Clock, FileText, Image as ImageIcon, Plus, Edit3, Trash2, ExternalLink, X, Navigation } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { cn } from '../lib/utils';
import { Link, Navigate } from 'react-router-dom';

export default function FounderPanel() {
  const { toast, confirm } = useUI();

  const { user } = useAuth();

  const [startup, setStartup] = useState<Startup | null>(null);
  const [posts, setPosts] = useState<StartupPost[]>([]);
  const [documents, setDocuments] = useState<StartupDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jornada' | 'documentos' | 'posts'>('jornada');
  const [error, setError] = useState<string | null>(null);

  // States for Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<StartupPost> | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [selectedDeliverableType, setSelectedDeliverableType] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user || user.role !== 'founder' || !user.startupId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const s = await fetchStartupById(user.startupId);
      setStartup(s);
      if (s) {
        const [p, d] = await Promise.all([
          getPosts(s.id),
          getDocuments(s.id)
        ]);
        setPosts(p);
        setDocuments(d);
      }
    } catch (err: any) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user || user.role !== 'founder') {
    return <Navigate to="/" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF2]">
        <Loader2 className="w-8 h-8 text-fox animate-spin" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-[#FFFDF2]">
        <AlertTriangle className="w-12 h-12 text-fox mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-playfair text-navy mb-2">Startup não encontrada</h2>
        <p className="text-gray-500 mb-6">Sua conta não parece estar vinculada a uma startup válida.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFDF2] min-h-screen pb-20">
      {/* Header */}
      <div className="bg-navy pt-8 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6">
            {startup.logoUrl ? (
              <img src={startup.logoUrl} alt={startup.name} className="w-20 h-20 rounded-2xl object-cover bg-white shadow-xl border-4 border-white" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white text-navy flex items-center justify-center font-bold text-2xl shadow-xl border-4 border-white">
                {startup.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold font-playfair text-white">{startup.name}</h1>
              <p className="text-cream/80 text-sm mt-1">{startup.sector || 'Setor não definido'}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
               <Link to={`/startup/${startup.id}`} className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2">
                 <Navigation className="w-4 h-4" /> Ver Perfil Público
               </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        {/* Tabs */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto">
          {(['jornada', 'documentos', 'posts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-bold rounded-xl capitalize transition-all whitespace-nowrap",
                activeTab === tab ? "bg-navy text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'jornada' && (
            <JornadaTab startup={startup} onOpenSubmit={(typeId) => { setSelectedDeliverableType(typeId); setIsDeliverableModalOpen(true); }} />
          )}
          {activeTab === 'documentos' && (
            <DocumentosTab documents={documents} onRefresh={loadData} startupId={startup.id} />
          )}
          {activeTab === 'posts' && (
            <PostsTab posts={posts} onOpenModal={(p) => { setEditingPost(p || {}); setIsPostModalOpen(true); }} onDelete={async (id) => { await deletePost(id); loadData(); }} />
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isPostModalOpen && (
          <PostModal
            post={editingPost}
            startupId={startup.id}
            onClose={() => { setIsPostModalOpen(false); setEditingPost(null); }}
            onSaved={loadData}
          />
        )}
        {isDeliverableModalOpen && selectedDeliverableType && (
          <DeliverableModal
            typeId={selectedDeliverableType}
            startupId={startup.id}
            onClose={() => { setIsDeliverableModalOpen(false); setSelectedDeliverableType(null); }}
            onSaved={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Aba: Jornada ─────────────────────────────────────────────────────────────
function JornadaTab({ startup, onOpenSubmit }: { startup: Startup, onOpenSubmit: (t: string) => void }) {
  const allTypes = Object.values(deliverableTypes).sort((a, b) => a.sortOrder - b.sortOrder);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-navy mb-4">Minha Jornada</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {allTypes.map(type => {
          const submission = startup.deliverables?.find(d => d.typeId === type.id);
          const status = submission?.status || 'pending';
          
          return (
            <div key={type.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
               <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", 
                 status === 'approved' ? 'bg-teal/10 text-teal' :
                 status === 'submitted' ? 'bg-yellow-50 text-yellow-500' :
                 status === 'rejected' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
               )}>
                 {status === 'approved' ? <CheckCircle className="w-6 h-6" /> :
                  status === 'submitted' ? <Clock className="w-6 h-6" /> :
                  <FileText className="w-6 h-6" />}
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-graphite truncate">{type.title}</h3>
                 <p className="text-xs text-gray-500 line-clamp-2 mt-1">{type.description}</p>
                 <div className="mt-3">
                   {status === 'approved' ? (
                     <span className="text-xs font-bold text-teal bg-teal/10 px-2 py-1 rounded-md">Aprovado (+{type.xpValue} XP)</span>
                   ) : status === 'submitted' ? (
                     <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">Em análise</span>
                   ) : (
                     <button onClick={() => onOpenSubmit(type.id)} className="text-xs font-bold text-white bg-navy hover:bg-navy/90 px-3 py-1.5 rounded-lg transition-colors">
                       Enviar Evidência
                     </button>
                   )}
                   {status === 'rejected' && (
                     <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                       <p className="text-xs text-red-600 font-bold mb-1">Rejeitado</p>
                       <p className="text-xs text-red-500">{submission?.evidenceNotes}</p>
                     </div>
                   )}
                 </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Aba: Documentos ──────────────────────────────────────────────────────────
function DocumentosTab({ documents, onRefresh, startupId }: { documents: StartupDocument[], onRefresh: () => void, startupId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-navy">Documentos</h2>
        <button onClick={() => setIsUploading(!isUploading)} className="text-xs font-bold text-white bg-fox px-3 py-1.5 rounded-lg flex items-center gap-1">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {isUploading && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-bold text-graphite mb-3">Upload de Documento Geral</h3>
          <FileUploader 
            bucket="startup-docs" 
            folder={`startups/${startupId}`} 
            onUpload={async (url, file) => {
               await createDocument({ startupId, name: file.name, fileUrl: url, fileType: file.type.split('/')[0], description: 'Documento Geral' });
               setIsUploading(false);
               onRefresh();
            }} 
          />
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum documento anexado.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map(doc => (
            <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="bg-gray-50 p-3 rounded-lg"><FileText className="w-5 h-5 text-gray-400" /></div>
              <div className="flex-1 min-w-0">
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-navy hover:underline truncate block">
                  {doc.name}
                </a>
                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(doc.createdAt!).toLocaleDateString()}</p>
              </div>
              <button onClick={async () => { await deleteDocument(doc.id); onRefresh(); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Aba: Posts ───────────────────────────────────────────────────────────────
function PostsTab({ posts, onOpenModal, onDelete }: { posts: StartupPost[], onOpenModal: (p?: Partial<StartupPost>) => void, onDelete: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-navy">Divulgações e Posts</h2>
        <button onClick={() => onOpenModal()} className="text-xs font-bold text-white bg-fox px-3 py-1.5 rounded-lg flex items-center gap-1">
          <Plus className="w-4 h-4" /> Novo Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Sua startup ainda não publicou nenhuma novidade.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              {post.coverImageUrl && <img src={post.coverImageUrl} alt={post.title} className="w-full h-32 object-cover" />}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-graphite text-lg mb-1">{post.title}</h3>
                <p className="text-xs text-gray-400 mb-4">{new Date(post.createdAt!).toLocaleDateString()}</p>
                <div className="mt-auto flex justify-end gap-2">
                  <button onClick={() => onOpenModal(post)} className="text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button onClick={() => onDelete(post.id)} className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal de Submissão de Entregável ──────────────────────────────────────────
function DeliverableModal({ typeId, startupId, onClose, onSaved }: { typeId: string, startupId: string, onClose: () => void, onSaved: () => void }) {
  const { isSessionValid } = useAuth();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const type = deliverableTypes[typeId];

  const handleSubmit = async () => {
    if (type.requiresLink && !url) {
      setError('Link da evidência é obrigatório.');
      return;
    }

    // Check session validity before submission
    const sessionValid = await isSessionValid();
    if (!sessionValid) {
      setError('Sua sessão expirou. Por favor, faça login novamente.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitDeliverable(startupId, typeId, url, description);
      onSaved();
      onClose();
    } catch (err: any) {
      const errorMsg = err.message || err.toString();

      // Handle RLS/Auth specific errors
      if (errorMsg.includes('row-level security policy') || errorMsg.includes('policy')) {
        setError('Erro: Sua conta não tem permissão para enviar entregáveis. Verifique se você está vinculado como founder da startup.');
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        setError('Erro: Sua sessão expirou. Por favor, faça login novamente.');
      } else {
        setError(`Erro ao enviar: ${errorMsg}`);
      }
      console.error("[DeliverableModal] Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <h3 className="font-bold text-xl text-navy mb-1">Submeter: {type.title}</h3>
        <p className="text-sm text-gray-500 mb-6">{type.description}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Link da Evidência {type.requiresLink ? '*' : '(Opcional)'}</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Descrição Breve (Opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Explique o que foi feito..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold bg-gray-50 hover:bg-gray-100 rounded-xl text-sm">Cancelar</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 text-white font-bold bg-navy hover:bg-navy/90 rounded-xl text-sm flex items-center justify-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Post ────────────────────────────────────────────────────────────
function PostModal({ post, startupId, onClose, onSaved }: { post: Partial<StartupPost> | null, startupId: string, onClose: () => void, onSaved: () => void }) {
  const { user } = useAuth();
  const { toast } = useUI();
  const [title, setTitle] = useState(post?.title || '');
  const [body, setBody] = useState(post?.body || '');
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !body) return toast('Título e conteúdo são obrigatórios.', 'info');
    setIsSubmitting(true);
    try {
      if (post?.id) {
        await updatePost(post.id, { title, body, coverImageUrl });
      } else {
        await createPost({ startupId, authorId: user?.id || '', title, body, coverImageUrl, tags: [] });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast('Erro: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-bold text-xl text-navy">{post?.id ? 'Editar Post' : 'Criar Novo Post'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-navy"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Título</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Capa do Post</label>
              <FileUploader bucket="startup-media" folder={`posts/${startupId}`} accept="image/*" currentUrl={coverImageUrl} onUpload={(url) => setCoverImageUrl(url)} onClear={() => setCoverImageUrl('')} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Conteúdo (Markdown suportado)</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none font-mono" />
            </div>
          </div>
          
          <div className="hidden md:block border-l border-gray-100 pl-6">
             <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Preview</label>
             <div className="bg-gray-50 p-4 rounded-xl h-full overflow-y-auto max-h-[500px]">
                {coverImageUrl && <img src={coverImageUrl} className="w-full h-32 object-cover rounded-lg mb-4" />}
                <h1 className="text-2xl font-bold font-playfair mb-4">{title || 'Título do Post'}</h1>
                {body ? <MarkdownRenderer>{body}</MarkdownRenderer> : <p className="text-gray-400 text-sm italic">Comece a escrever para ver o preview...</p>}
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-500 font-bold bg-gray-50 hover:bg-gray-100 rounded-xl text-sm">Cancelar</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 text-white font-bold bg-fox hover:bg-fox/90 rounded-xl text-sm flex items-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} {post?.id ? 'Salvar Alterações' : 'Publicar Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
