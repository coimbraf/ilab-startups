const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Update imports
content = content.replace(
  /import \{ ArrowRight, Star, Target, Building2, Send, Sparkles, AlertCircle, MessageSquare \} from "lucide-react";/,
  'import { ArrowRight, Star, Target, Building2, Send, Sparkles, AlertCircle, MessageSquare, Calendar, PlayCircle } from "lucide-react";'
);

// Replace section
const startComment = '{/* ── 3.5. Fórum CTA ─────────────────────────────────────── */}';
const startIdx = content.indexOf(startComment);
const nextSection = '{/* ── 4. Seja um Patrocinador ──────────────────────────── */}';
const endIdx = content.indexOf(nextSection);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `      {/* ── 3.5. Comunidade iLab ─────────────────────────────────────── */}
      <section id="comunidade" className="py-24 bg-[#FFFDF2] relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-playfair text-navy mb-6 leading-tight">
              Comunidade <span className="text-fox italic">iLab</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Conecte-se com fundadores, participe de eventos exclusivos e aprimore suas habilidades com nossos conteúdos sob demanda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card Fórum */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fox/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
              
              <div className="w-14 h-14 rounded-2xl bg-fox/10 flex items-center justify-center mb-6 text-fox">
                <MessageSquare className="w-7 h-7" />
              </div>
              
              <h3 className="text-2xl font-bold font-playfair text-navy mb-4">Fórum iLab</h3>
              <p className="text-gray-500 mb-8 flex-1">
                Tire dúvidas técnicas, compartilhe insights valiosos e faça networking com as mentes mais brilhantes do ecossistema.
              </p>
              
              <Link
                to="/forum"
                className="inline-flex items-center gap-2 text-fox font-bold uppercase tracking-wider text-sm group/link"
              >
                Acessar
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Card Encontros */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
              
              <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mb-6 text-gold">
                <Calendar className="w-7 h-7" />
              </div>
              
              <h3 className="text-2xl font-bold font-playfair text-navy mb-4">Encontros</h3>
              <p className="text-gray-500 mb-8 flex-1">
                Fique por dentro da agenda de eventos, masterclasses, pitches e sessões de mentoria programadas para o semestre.
              </p>
              
              <Link
                to="/encontros"
                className="inline-flex items-center gap-2 text-gold font-bold uppercase tracking-wider text-sm group/link"
              >
                Acessar
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Card Academy */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brown/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
              
              <div className="w-14 h-14 rounded-2xl bg-brown/10 flex items-center justify-center mb-6 text-brown">
                <PlayCircle className="w-7 h-7" />
              </div>
              
              <h3 className="text-2xl font-bold font-playfair text-navy mb-4">iLab Academy</h3>
              <p className="text-gray-500 mb-8 flex-1">
                Acesse gravações de eventos anteriores e conteúdos exclusivos curados para alavancar o desenvolvimento da sua startup.
              </p>
              
              <Link
                to="/aulas"
                className="inline-flex items-center gap-2 text-brown font-bold uppercase tracking-wider text-sm group/link"
              >
                Acessar
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

`;
  
  const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync('src/pages/Home.tsx', newContent);
  console.log('Successfully updated Home.tsx!');
} else {
  console.log('Could not find markers in Home.tsx', startIdx, endIdx);
}
