import React, { useState, useEffect, useRef } from 'react';
import { Play, Clock, BookOpen, CheckCircle, Tag, Trophy, ArrowLeft, MessageSquare } from 'lucide-react';
import { Lesson, ForumPost, Course, CourseEpisode } from '../data/mockData';
import { ListVideo } from 'lucide-react';
import { getLessons, getLessonProgress, markLessonCompleted, getForumPosts, getCourses, getCourseProgress, markCourseEpisodeCompleted } from '../data/supabaseService';
import { motion } from 'motion/react';

// --- Player Component ---
function YoutubePlayerTracker({ 
  youtubeId, 
  onProgress 
}: { 
  youtubeId: string, 
  onProgress: (percent: number) => void 
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const watchedTimeRef = useRef(0);

  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    
    // Clear wrapper to guarantee no ghost iframes from Strict Mode
    wrapperRef.current.innerHTML = '';
    
    // Create the container manually
    const container = document.createElement('div');
    wrapperRef.current.appendChild(container);
    
    let player: any = null;
    let interval: any = null;
    let isMounted = true;
    watchedTimeRef.current = 0; // Reset na troca de vídeo

    const init = () => {
      if (!isMounted) return;
      player = new (window as any).YT.Player(container, {
        height: '100%',
        width: '100%',
        videoId: youtubeId,
        playerVars: { autoplay: 1 },
        events: {
          onReady: () => {
            // Verifica a cada 5 segundos se está tocando e acumula
            interval = setInterval(() => {
              if (player && player.getPlayerState && player.getDuration) {
                const state = player.getPlayerState();
                if (state === (window as any).YT.PlayerState.PLAYING) {
                  const duration = player.getDuration();
                  if (duration > 0) {
                    const rate = player.getPlaybackRate ? player.getPlaybackRate() : 1;
                    watchedTimeRef.current += 5 * rate;
                    onProgressRef.current(watchedTimeRef.current / duration);
                  }
                }
              }
            }, 5000);
          },
          onStateChange: () => {}
        }
      });
    };

    if (!(window as any).YT) {
      // Prevent adding multiple script tags if one is already loading
      let tag = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!tag) {
        tag = document.createElement('script');
        (tag as HTMLScriptElement).src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
      
      const oldReady = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (oldReady) oldReady();
        if (isMounted) init();
      };
    } else if ((window as any).YT && (window as any).YT.Player) {
      init();
    } else {
      // YT is loaded but YT.Player is not ready yet? Fallback to polling or just waiting for the callback
      const oldReady = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (oldReady) oldReady();
        if (isMounted) init();
      };
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      try { if (player && player.destroy) player.destroy(); } catch(e){}
      
      if (wrapperRef.current) {
        wrapperRef.current.innerHTML = '';
      }
    };
  }, [youtubeId]);

  return <div ref={wrapperRef} className="w-full h-full absolute inset-0"></div>;
}

export default function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [totalXp, setTotalXp] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<Lesson | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<{episode: CourseEpisode, courseId: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'cursos'>('videos');
  const [courses, setCourses] = useState<Course[]>([]);
  const [completedEpisodes, setCompletedEpisodes] = useState<Set<string>>(new Set());
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [currentProgressPercent, setCurrentProgressPercent] = useState(0);
  
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);

  useEffect(() => {
    Promise.all([
      getLessons(),
      getLessonProgress(),
      getForumPosts()
    ]).then(([lessonsData, progressData, forumData]) => {
      setLessons(lessonsData);
      
      const compIds = new Set<string>();
      let xp = 0;
      progressData.forEach((p: any) => {
        if (p.completed) {
          compIds.add(p.aula_id);
          xp += p.xp_earned || 0;
        }
      });
      setCompletedIds(compIds);
      setTotalXp(xp);
      setForumPosts(forumData);
      setIsLoading(false);
    });
  }, []);

  // Extraction of all unique tags
  const allTags = Array.from(new Set(lessons.flatMap(l => l.tags || []))).sort();

  // Filtering
  const filteredLessons = lessons.filter(l => {
    if (selectedType && l.type !== selectedType) return false;
    if (selectedTag && (!l.tags || !l.tags.includes(selectedTag))) return false;
    return true;
  });

  
  const handleEpisodeProgress = async (episode: CourseEpisode, courseId: string, percent: number) => {
    setCurrentProgressPercent(Math.min(percent, 1));
    if (percent > 0.85 && !completedEpisodes.has(episode.id)) {
      setCompletedEpisodes(prev => new Set(prev).add(episode.id));
      setTotalXp(prev => prev + episode.xp);
      await markCourseEpisodeCompleted(episode.id, courseId, episode.xp);
    }
  };

  const handleProgress = async (lesson: Lesson, percent: number) => {
    setCurrentProgressPercent(Math.min(percent, 1));
    if (percent > 0.85 && !completedIds.has(lesson.id)) {
      setCompletedIds(prev => new Set(prev).add(lesson.id));
      const earned = lesson.type === 'externo' && lesson.xp ? lesson.xp : 0;
      setTotalXp(prev => prev + earned);
      await markLessonCompleted(lesson.id, earned);
      // Optional: add a small toast/confetti here
    }
  };

  
  if (playingEpisode) {
    const { episode, courseId } = playingEpisode;
    return (
      <div className="min-h-screen bg-sand text-navy pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <button 
            onClick={() => { setPlayingEpisode(null); setCurrentProgressPercent(0); }}
            className="flex items-center gap-2 text-gray-500 hover:text-fox mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o Curso
          </button>
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 mb-8">
            <div className="relative aspect-video bg-black w-full">
              <YoutubePlayerTracker 
                youtubeId={episode.youtube_id} 
                onProgress={(p) => handleEpisodeProgress(episode, courseId, p)} 
              />
            </div>
            <div className="bg-gray-100 h-1.5 w-full relative">
               <div 
                 className="absolute top-0 left-0 h-full bg-fox transition-all duration-1000 ease-linear" 
                 style={{ width: `${Math.min(currentProgressPercent * 100, 100)}%` }}
               />
            </div>
            <div className="px-8 pt-4 pb-2 flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
               <span>Progresso Real Assistido <span className="normal-case font-normal ml-2 opacity-70">(Mín. 85% para concluir)</span></span>
               <span className={currentProgressPercent >= 0.85 ? "text-green-500" : ""}>
                 {Math.round(Math.min(currentProgressPercent * 100, 100))}% {currentProgressPercent >= 0.85 ? "(Concluído)" : ""}
               </span>
            </div>
            <div className="p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <Trophy className="w-3 h-3" /> +{episode.xp} XP
                </span>
                {completedEpisodes.has(episode.id) && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3" /> Concluído
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-navy mb-4">Ep {episode.order_index + 1}: {episode.title}</h1>
              <p className="text-gray-600 mb-6">{episode.description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  if (activeCourse) {
    const totalEps = activeCourse.episodes?.length || 0;
    const completedCount = activeCourse.episodes?.filter(e => completedEpisodes.has(e.id)).length || 0;
    const isFullyCompleted = totalEps > 0 && completedCount === totalEps;

    return (
      <div className="min-h-screen bg-sand text-navy pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <button 
            onClick={() => setActiveCourse(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-fox mb-6 transition-colors font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para Trilhas
          </button>
          
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${activeCourse.level === 'iniciante' ? 'bg-green-100 text-green-700' : activeCourse.level === 'intermediario' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  Nível {activeCourse.level}
                </span>
                {isFullyCompleted && (
                  <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Curso Concluído (+{activeCourse.bonus_xp} XP Bônus)
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold font-playfair text-navy mb-4">{activeCourse.title}</h1>
              <p className="text-gray-600 mb-8 text-lg">{activeCourse.description}</p>
              
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-gray-500 text-sm">Progresso do Curso</span>
                  <span className="font-black text-navy text-xl">{completedCount} <span className="text-gray-400 text-sm">/ {totalEps}</span></span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-fox transition-all" style={{ width: `${totalEps > 0 ? (completedCount / totalEps) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold font-playfair text-navy mb-6">Episódios</h3>
          <div className="space-y-4">
            {activeCourse.episodes?.map((ep, idx) => {
              const isCompleted = completedEpisodes.has(ep.id);
              return (
                <div key={ep.id} onClick={() => setPlayingEpisode({ episode: ep, courseId: activeCourse.id })} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6 cursor-pointer hover:border-fox hover:shadow-md transition-all group">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-fox/10 transition-colors relative overflow-hidden">
                    <img src={`https://img.youtube.com/vi/${ep.youtube_id}/mqdefault.jpg`} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                    <PlayCircle className="w-8 h-8 text-white z-10 drop-shadow-md" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-fox mb-1">Episódio {idx + 1}</p>
                    <h4 className="text-lg font-bold text-navy mb-1 group-hover:text-fox transition-colors">{ep.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{ep.description}</p>
                  </div>
                  <div className="flex flex-row md:flex-col gap-3 items-center shrink-0 text-right">
                    <div className="text-xs font-bold text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {ep.duration_minutes} min</div>
                    <div className="text-xs font-bold text-gold flex items-center gap-1"><Trophy className="w-3 h-3" /> +{ep.xp} XP</div>
                    {isCompleted && <div className="text-xs font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg uppercase tracking-wider">Concluído</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    );
  }

  if (playingVideo) {
    const relatedPosts = forumPosts.filter(p => 
      playingVideo.tags?.some(tag => p.tags.includes(tag) || p.title.toLowerCase().includes(tag.toLowerCase()))
    );

    return (
      <div className="min-h-screen bg-sand text-navy pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <button 
            onClick={() => { setPlayingVideo(null); setCurrentProgressPercent(0); }}
            className="flex items-center gap-2 text-gray-500 hover:text-fox mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para a iLab Academy
          </button>
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 mb-8">
            <div className="relative aspect-video bg-black w-full">
              <YoutubePlayerTracker 
                youtubeId={playingVideo.youtube_id} 
                onProgress={(p) => handleProgress(playingVideo, p)} 
              />
            </div>
            <div className="bg-gray-100 h-1.5 w-full relative">
               <div 
                 className="absolute top-0 left-0 h-full bg-fox transition-all duration-1000 ease-linear" 
                 style={{ width: `${Math.min(currentProgressPercent * 100, 100)}%` }}
               />
            </div>
            <div className="px-8 pt-4 pb-2 flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
               <span>Progresso Real Assistido <span className="normal-case font-normal ml-2 opacity-70">(Mín. 85% para concluir)</span></span>
               <span className={currentProgressPercent >= 0.85 ? "text-green-500" : ""}>
                 {Math.round(Math.min(currentProgressPercent * 100, 100))}% {currentProgressPercent >= 0.85 ? "(Concluído)" : ""}
               </span>
            </div>
            <div className="p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {playingVideo.type === 'externo' && playingVideo.xp ? (
                  <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                    <Trophy className="w-3 h-3" /> +{playingVideo.xp} XP
                  </span>
                ) : (
                  <span className="bg-fox/10 text-fox px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                    Gravação iLab
                  </span>
                )}
                {completedIds.has(playingVideo.id) && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3" /> Concluído
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-navy mb-4">{playingVideo.title}</h1>
              <p className="text-gray-600 mb-6">{playingVideo.description}</p>
              
              {playingVideo.tags && playingVideo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-100">
                  {playingVideo.tags.map(t => (
                    <span key={t} className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related Forum Posts */}
          <div className="mb-12">
            <h3 className="text-xl font-bold font-playfair text-navy mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-fox" /> Discussões Relacionadas
            </h3>
            {relatedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedPosts.map(post => (
                  <div key={post.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-fox/30 transition-all">
                    <h4 className="font-bold text-navy mb-2 line-clamp-1">{post.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{post.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhuma discussão encontrada no fórum com essas tags. Seja o primeiro a criar!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand text-navy pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-fox/10 p-3 rounded-2xl">
                <BookOpen className="w-8 h-8 text-fox" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black font-playfair tracking-tight text-navy">
                  iLab <span className="text-fox">Academy</span>
                </h1>
              </div>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Conteúdos curados e gravações exclusivas. Assista, participe das discussões e ganhe XP.
            </p>
          </div>
          
          <div className="flex items-center gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Vídeos Concluídos</p>
              <p className="text-2xl font-bold text-navy flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> {completedIds.size} <span className="text-sm text-gray-400 font-normal">/ {lessons.length}</span>
              </p>
            </div>
            <div className="w-px h-12 bg-gray-100"></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">XP Total</p>
              <p className="text-2xl font-bold text-gold flex items-center gap-2">
                <Trophy className="w-5 h-5" /> {totalXp}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 overflow-x-auto">
            <button 
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${!selectedType ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setSelectedType('gravacao')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedType === 'gravacao' ? 'bg-fox text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Gravações iLab
            </button>
            <button 
              onClick={() => setSelectedType('externo')}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedType === 'externo' ? 'bg-gold text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Conteúdos Externos
            </button>
          </div>

          <div className="flex-1 bg-white px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2 overflow-x-auto">
            <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <button 
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${!selectedTag ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              #todas
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${selectedTag === tag ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Carregando...</div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-bold font-playfair text-navy mb-2">Nenhuma aula encontrada</h3>
            <p className="text-gray-500">Tente limpar os filtros acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLessons.map((lesson, idx) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col group cursor-pointer"
                onClick={() => setPlayingVideo(lesson)}
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-video bg-gray-900 overflow-hidden">
                  <img 
                    src={`https://img.youtube.com/vi/${lesson.youtube_id}/maxresdefault.jpg`} 
                    alt={lesson.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${lesson.youtube_id}/hqdefault.jpg`;
                    }}
                  />
                  
                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {lesson.type === 'externo' && lesson.xp ? (
                      <div className="bg-gold/90 text-white px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase flex items-center gap-1 backdrop-blur-sm shadow-sm">
                        <Trophy className="w-3 h-3" /> +{lesson.xp} XP
                      </div>
                    ) : (
                      <div className="bg-fox/90 text-white px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase backdrop-blur-sm shadow-sm">
                        Gravação iLab
                      </div>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    {completedIds.has(lesson.id) && (
                      <div className="bg-green-500 text-white px-2 py-1 rounded-md shadow-sm">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
                      <Play className="w-8 h-8 ml-1 text-white" />
                    </div>
                  </div>
                  
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[10px] font-bold tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {lesson.duration}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {lesson.level && lesson.type === 'externo' && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-navy bg-navy/5 px-2 py-0.5 rounded">
                        {lesson.level}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-navy leading-snug mb-3 group-hover:text-fox transition-colors line-clamp-2">
                    {lesson.title}
                  </h3>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-gray-50">
                    {lesson.tags?.map(t => (
                      <span key={t} className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
