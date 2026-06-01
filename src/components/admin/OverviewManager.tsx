import React, { useState, useEffect } from 'react';
import { supabase, getPendingDeliverables } from '../../data/supabaseService';
import { PieChart, Users, Loader2, CheckCircle, Clock, Rocket, Trophy, Play } from 'lucide-react';
import { motion } from 'motion/react';

export default function OverviewManager() {
  const [metrics, setMetrics] = useState({
    activeMembers: 0,
    activeSquads: 0,
    totalXP: 0,
    pendingDeliverables: 0,
    completedLessons: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      setIsLoading(true);
      try {
        // Fetch pending deliverables
        const pending = await getPendingDeliverables();
        
        // Fetch active squads
        const { count: squadsCount } = await supabase
          .from('startups')
          .select('*', { count: 'exact', head: true })
          .eq('archived', false);
          
        // Fetch active members
        const { count: membersCount } = await supabase
          .from('startup_members')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
          
        // Fetch total XP distributed
        const { data: xpData } = await supabase
          .from('startup_members')
          .select('xp');
        const totalXP = xpData ? xpData.reduce((acc, curr) => acc + (curr.xp || 0), 0) : 0;
        
        // Fetch completed lessons (from user_progress, but let's just count global interactions for now, or total lessons watched if we have tracking)
        // Since we don't have user_progress easily queried for total completion without user context, we will sum the lessons watched from a hypothetical table
        // Or if we don't have it, we just fetch total lessons available for now. Let's try checking 'user_progress' table if it exists.
        const { count: lessonsCount, error: lessonsError } = await supabase
          .from('user_progress')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
          
        setMetrics({
          activeMembers: membersCount || 0,
          activeSquads: squadsCount || 0,
          totalXP,
          pendingDeliverables: pending.length,
          completedLessons: lessonsError ? 0 : (lessonsCount || 0)
        });
      } catch (err) {
        console.error('Error fetching metrics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 text-fox animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-white rounded-3xl p-6 border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-50 p-4 rounded-2xl">
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Membros Ativos</p>
            <h3 className="text-3xl font-black text-navy">{metrics.activeMembers}</h3>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-50 p-4 rounded-2xl">
            <Rocket className="w-8 h-8 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Squads Ativos</p>
            <h3 className="text-3xl font-black text-navy">{metrics.activeSquads}</h3>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 border border-gray-100 flex items-center gap-4">
          <div className="bg-gold/10 p-4 rounded-2xl">
            <Trophy className="w-8 h-8 text-gold" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">XP Distribuído</p>
            <h3 className="text-3xl font-black text-navy">{metrics.totalXP}</h3>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-6 border border-gray-100 flex items-center gap-4">
          <div className="bg-fox/10 p-4 rounded-2xl">
            <Clock className="w-8 h-8 text-fox" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Entregáveis Pendentes</p>
            <h3 className="text-3xl font-black text-navy">{metrics.pendingDeliverables}</h3>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-3xl p-6 border border-gray-100 flex items-center gap-4">
          <div className="bg-teal/10 p-4 rounded-2xl">
            <Play className="w-8 h-8 text-teal" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aulas Concluídas</p>
            <h3 className="text-3xl font-black text-navy">{metrics.completedLessons}</h3>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
