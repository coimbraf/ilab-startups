const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

// Remove the old hook useYoutubeDuration
const hookRegex = /\/\/ ─── Hook para pegar duração do YouTube ──────────────────────────────────────[\s\S]*?function LessonsManager\(\) \{/m;
content = content.replace(hookRegex, 'function LessonsManager() {');

// Add the Promise-based fetchYoutubeDuration right before LessonsManager
const fetchDurationCode = `
// ─── Pegar duração do YouTube sob demanda ────────────────────────────────────
const fetchYoutubeDuration = (videoId: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!videoId || videoId.length !== 11) {
      resolve('');
      return;
    }
    
    const div = document.createElement('div');
    div.id = 'yt-player-temp-' + Math.random().toString(36).substring(7);
    div.style.display = 'none';
    document.body.appendChild(div);

    let player: any = null;
    let timeout = setTimeout(() => {
       try { player?.destroy(); } catch(e){}
       if(document.body.contains(div)) div.remove();
       resolve('');
    }, 5000);

    const init = () => {
      player = new (window as any).YT.Player(div.id, {
        height: '0',
        width: '0',
        videoId: videoId,
        events: {
          onReady: (event: any) => {
            clearTimeout(timeout);
            const dur = event.target.getDuration();
            let result = '';
            if (dur > 0) {
              const minutes = Math.floor(dur / 60);
              const seconds = Math.floor(dur % 60);
              result = \`\${minutes}m \${seconds}s\`;
            }
            try { player.destroy(); } catch(e){}
            if(document.body.contains(div)) div.remove();
            resolve(result);
          },
          onError: () => {
            clearTimeout(timeout);
            try { player.destroy(); } catch(e){}
            if(document.body.contains(div)) div.remove();
            resolve('');
          }
        }
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      
      const oldReady = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (oldReady) oldReady();
        init();
      };
    } else if ((window as any).YT && (window as any).YT.Player) {
      init();
    }
  });
};

function LessonsManager() {`;

content = content.replace('function LessonsManager() {', fetchDurationCode);

// Remove the setDuration call that was left inside LessonsManager
content = content.replace('  useYoutubeDuration(youtubeId, setDuration);\r\n', '');
content = content.replace('  useYoutubeDuration(youtubeId, setDuration);\n', '');

// Update handleAdd to await fetchYoutubeDuration
const oldHandleAdd = `  const handleAdd = async () => {
    if (!title || !youtubeId) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createLesson({ title, description, youtube_id: youtubeId, duration });
      setTitle('');
      setDescription('');
      setYoutubeId('');
      setDuration('');
      await loadLessons();`;

const newHandleAdd = `  const handleAdd = async () => {
    if (!title || !youtubeId) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    try {
      const fetchedDuration = await fetchYoutubeDuration(youtubeId);
      await createLesson({ title, description, youtube_id: youtubeId, duration: fetchedDuration || '' });
      setTitle('');
      setDescription('');
      setYoutubeId('');
      setDuration('');
      await loadLessons();`;

const oldHandleAdd2 = oldHandleAdd.replace(/\n/g, '\r\n');
const newHandleAdd2 = newHandleAdd.replace(/\n/g, '\r\n');

content = content.replace(oldHandleAdd, newHandleAdd);
content = content.replace(oldHandleAdd2, newHandleAdd2);

fs.writeFileSync('src/pages/AdminPanel.tsx', content);
console.log('Hook replaced with Promise-based logic.');
