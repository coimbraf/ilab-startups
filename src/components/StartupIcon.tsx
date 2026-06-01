import { Rocket, Lightbulb, Brain, Cpu, Target, Globe, Layers, Command, Workflow, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

const startupIconList = [Rocket, Lightbulb, Brain, Cpu, Target, Globe, Layers, Command, Workflow, Sparkles];

interface StartupIconProps {
  name: string;
  className?: string;
  iconClassName?: string;
  variant?: 'gold' | 'fox' | 'white' | 'navy';
}

export default function StartupIcon({ name, className, iconClassName, variant = 'white' }: StartupIconProps) {
  const index = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % startupIconList.length;
  const Icon = startupIconList[index];

  const variants = {
    gold: "from-gold to-[#B8860B]",
    fox: "from-fox to-orange-600",
    white: "from-white to-gray-50",
    navy: "from-navy to-[#1e2a4a]"
  };

  const iconColors = {
    gold: "text-white",
    fox: "text-white",
    white: "text-fox",
    navy: "text-gold"
  };

  return (
    <div className={cn(
      "flex items-center justify-center bg-gradient-to-br", 
      variants[variant],
      className
    )}>
      <Icon className={cn(iconColors[variant], iconClassName)} />
    </div>
  );
}
