import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Startup, mockStartups } from '../data/mockData';
import { fetchStartupsFromSupabase, fetchStartupById, supabase } from '../data/supabaseService';
import { useAuth } from './AuthContext';

const CACHE_KEY = '@sanfranilab:startups';

interface StartupsContextType {
  startups: Startup[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const StartupsContext = createContext<StartupsContextType>({
  startups: [],
  isLoading: true,
  error: null,
  refetch: async () => {},
});

export function StartupsProvider({ children }: { children: ReactNode }) {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Com RLS, o SELECT anônimo é negado — os dados precisam ser (re)carregados
  // quando o usuário loga/desloga, não só no mount.
  const { user } = useAuth();

  const loadData = useCallback(async () => {
    // Sem sessão, a RLS nega o SELECT — não adianta bater no banco nem poluir
    // o console com erro. O RootLayout já redireciona para /login.
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }
    }

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setStartups(JSON.parse(cached));
        setIsLoading(false);
      } catch (e) {
        // ignore parse error
      }
    } else {
      setIsLoading(true);
    }

    setError(null);
    try {
      if (supabase) {
        // Fonte única de verdade: Supabase
        const data = await fetchStartupsFromSupabase();
        if (data.length === 0) {
          // Se o banco estiver vazio, usa os dados de exemplo para mostrar o design
          setStartups(mockStartups);
        } else {
          setStartups(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
      } else {
        // Fallback de desenvolvimento
        setStartups(mockStartups);
      }
    } catch (err) {
      console.error('[StartupsProvider] Erro ao carregar:', err);
      setError('Não foi possível carregar os dados. Exibindo dados de exemplo.');
      if (!cached) setStartups(mockStartups);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Atualiza UMA startup no estado (em vez de recarregar a lista inteira).
  // Cobre insert (adiciona), update (substitui) e delete (remove) e re-ordena.
  const refreshOne = useCallback(async (startupId: string) => {
    try {
      const updated = await fetchStartupById(startupId);
      setStartups(prev => {
        let next: Startup[];
        if (!updated) {
          next = prev.filter(s => s.id !== startupId);
        } else if (prev.some(s => s.id === startupId)) {
          next = prev.map(s => (s.id === startupId ? updated : s));
        } else {
          next = [...prev, updated];
        }
        next.sort((a, b) => b.totalScore - a.totalScore);
        localStorage.setItem(CACHE_KEY, JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error('[Realtime] Falha ao atualizar startup, recarregando tudo:', err);
      loadData();
    }
  }, [loadData]);

  // Debounce por startup: rajadas de eventos (ex.: aprovação + notificação)
  // viram UMA busca, em vez de N reloads completos como antes.
  const pendingRefresh = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const queueRefresh = useCallback((startupId?: string) => {
    if (!startupId) {
      loadData(); // sem id no payload (ex.: DELETE sem replica identity) → reload completo
      return;
    }
    const pending = pendingRefresh.current;
    const existing = pending.get(startupId);
    if (existing) clearTimeout(existing);
    pending.set(startupId, setTimeout(() => {
      pending.delete(startupId);
      refreshOne(startupId);
    }, 300));
  }, [loadData, refreshOne]);

  useEffect(() => {
    loadData();

    if (supabase) {
      // Extrai o id relevante do payload do realtime (new no insert/update, old no delete)
      const idFrom = (payload: { new?: unknown; old?: unknown }, key: string): string | undefined => {
        const rec = (payload.new ?? payload.old) as Record<string, unknown> | null;
        const value = rec?.[key];
        return typeof value === 'string' ? value : undefined;
      };

      const channel = supabase.channel('startups-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'startups' }, (payload) => {
          queueRefresh(idFrom(payload, 'id'));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'startup_members' }, (payload) => {
          queueRefresh(idFrom(payload, 'startup_id'));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'startup_deliverables' }, (payload) => {
          queueRefresh(idFrom(payload, 'startup_id'));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        pendingRefresh.current.forEach(t => clearTimeout(t));
        pendingRefresh.current.clear();
      };
    }
    // user?.id nas deps: refaz a busca (agora autenticada) e re-assina o
    // realtime após login/logout — sem isso, com RLS o app fica nos mocks.
  }, [loadData, queueRefresh, user?.id]);

  return (
    <StartupsContext.Provider value={{ startups, isLoading, error, refetch: loadData }}>
      {children}
    </StartupsContext.Provider>
  );
}

export const useStartups = () => useContext(StartupsContext);
