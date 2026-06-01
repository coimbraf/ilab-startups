import { Building2, Rocket, Zap, Brain, Shield, Globe, Cpu } from "lucide-react";
import { cn } from "../lib/utils";

interface SmartImageProps {
  src?: string;
  name: string;
  className?: string;
}

export default function SmartImage({ src, name, className }: SmartImageProps) {
  // Logic to determine a "representative" icon based on name
  const getIcon = () => {
    const n = name.toLowerCase();
    if (n.includes('alpha') || n.includes('tech')) return <Cpu className="w-1/2 h-1/2" />;
    if (n.includes('beta') || n.includes('growth')) return <Zap className="w-1/2 h-1/2" />;
    if (n.includes('gama') || n.includes('legal')) return <Shield className="w-1/2 h-1/2" />;
    if (n.includes('data') || n.includes('ai')) return <Brain className="w-1/2 h-1/2" />;
    if (n.includes('global') || n.includes('world')) return <Globe className="w-1/2 h-1/2" />;
    if (n.includes('lab') || n.includes('ilab')) return <Rocket className="w-1/2 h-1/2" />;
    return <Building2 className="w-1/2 h-1/2" />;
  };

  // Check if src is a generic placeholder or missing
  const isGeneric = !src || src.includes('unsplash.com') || src.includes('placeholder');

  if (isGeneric) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gradient-to-br from-fox to-fox/60 text-white shadow-inner",
        className
      )}>
        {getIcon()}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={name} 
      className={cn("object-cover", className)}
      onError={(e) => {
        // Fallback if image fails to load
        e.currentTarget.style.display = 'none';
        e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-fox', 'to-fox/60', 'flex', 'items-center', 'justify-center');
      }}
    />
  );
}
