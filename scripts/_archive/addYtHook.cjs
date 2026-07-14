const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

const hookCode = `
// ─── Hook para pegar duração do YouTube ──────────────────────────────────────
function useYoutubeDuration(youtubeId: string, setDuration: (d: string) => void) {
  useEffect(() => {
    if (!youtubeId || youtubeId.length !== 11) return;
    
    const div = document.createElement('div');
    div.id = 'yt-player-hidden-' + youtubeId;
    div.style.display = 'none';
    document.body.appendChild(div);

    let player: any = null;

    const init = () => {
      player = new (window as any).YT.Player(div.id, {
        height: '0',
        width: '0',
        videoId: youtubeId,
        events: {
          onReady: (event: any) => {
            const dur = event.target.getDuration();
            if (dur > 0) {
              const minutes = Math.floor(dur / 60);
              const seconds = Math.floor(dur % 60);
              setDuration(\`\${minutes}m \${seconds}s\`);
            }
            try { player.destroy(); } catch(e){}
            if (document.body.contains(div)) document.body.removeChild(div);
          },
          onError: () => {
            try { player.destroy(); } catch(e){}
            if (document.body.contains(div)) document.body.removeChild(div);
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

    return () => {
      try { if (player && player.destroy) player.destroy(); } catch(e){}
      if (document.body.contains(div)) document.body.removeChild(div);
    };
  }, [youtubeId, setDuration]);
}
`;

if (!content.includes('useYoutubeDuration')) {
  content = content.replace('function LessonsManager() {', hookCode + '\nfunction LessonsManager() {');
}

const hookUsage = `  const [isSubmitting, setIsSubmitting] = useState(false);

  useYoutubeDuration(youtubeId, setDuration);`;

content = content.replace('  const [isSubmitting, setIsSubmitting] = useState(false);', hookUsage);

// Update placeholder to say "Gerado automaticamente"
content = content.replace(
  'placeholder="Ex: 45m" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-fox/20 focus:border-fox outline-none transition-all"',
  'placeholder="Calculado automaticamente" readOnly className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 outline-none transition-all cursor-not-allowed"'
);

fs.writeFileSync('src/pages/AdminPanel.tsx', content);
console.log("Added useYoutubeDuration successfully.");
