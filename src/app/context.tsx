import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Profile, Repository, Snapshot } from '../types/domain';
import { DemoRepository } from '../services/demo';
import { isDemo, supabase, SupabaseRepository } from '../services/supabase';
import { createSeed } from '../data/seed';

const demoRepository = new DemoRepository(localStorage);
const repository = isDemo ? demoRepository : supabase ? new SupabaseRepository(supabase) : null;
const empty: Snapshot = {
  profiles: [],
  requests: [],
  assignments: [],
  collections: [],
  history: [],
};
interface AppContextValue {
  actor: Profile | null;
  setActor: (p: Profile | null) => void;
  data: Snapshot;
  loading: boolean;
  error: string | null;
  repository: Repository | null;
  demo: boolean;
  demoProfiles: Profile[];
  switchDemo: (id: string) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  reset: () => Promise<void>;
  notice: { text: string; error: boolean } | null;
  notify: (text: string, error?: boolean) => void;
}
const AppContext = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const [actor, setActor] = useState<Profile | null>(() =>
    isDemo
      ? (createSeed().profiles.find((p) => p.id === localStorage.getItem('ecosort-demo-actor')) ??
        null)
      : null,
  );
  const [notice, setNotice] = useState<AppContextValue['notice']>(null);
  const [authLoading, setAuthLoading] = useState(!isDemo && !!supabase);
  const [authError, setAuthError] = useState<string | null>(null);
  const notify = useCallback((text: string, error = false) => setNotice({ text, error }), []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!supabase) return;
    let alive = true,
      generation = 0,
      sessionUser: string | null = null;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = ++generation;
      if (!session) {
        sessionUser = null;
        setActor(null);
        setAuthLoading(false);
        return;
      }
      // Background token refresh/sign-in notifications for this same identity
      // must not unmount protected forms and silently discard their input.
      if (sessionUser !== session.user.id) {
        setAuthLoading(true);
        setActor(null);
      }
      sessionUser = session.user.id;
      // Do not await a Supabase query inside the synchronous auth callback.
      window.setTimeout(() => {
        void (async () => {
          if (!alive || current !== generation) return;
          const result = await supabase!
            .from('profiles')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single();
          if (!alive || current !== generation) return;
          if (result.error) {
            setAuthError(
              'Your account profile is unavailable. Ask the project administrator to check the database migration.',
            );
            setActor(null);
          } else {
            setActor(result.data as Profile);
            setAuthError(null);
          }
          setAuthLoading(false);
        })();
      }, 0);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  const query = useQuery({
    queryKey: ['workspace', actor?.id, actor?.role],
    queryFn: () => repository!.load(actor!),
    enabled: !!actor && !!repository,
    networkMode: isDemo ? 'always' : 'online',
    refetchInterval: isDemo ? false : 10000,
  });
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === 'ecosort-demo-v1')
        void cache.invalidateQueries({ queryKey: ['workspace'] });
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, [cache]);
  const refresh = useCallback(async () => {
    await cache.invalidateQueries({ queryKey: ['workspace'] });
  }, [cache]);
  const switchDemo = (id: string) => {
    if (!isDemo) return;
    const profile = createSeed().profiles.find((p) => p.id === id);
    if (profile) {
      localStorage.setItem('ecosort-demo-actor', id);
      cache.removeQueries({ queryKey: ['workspace'] });
      setActor(profile);
    }
  };
  const logout = async () => {
    if (isDemo) localStorage.removeItem('ecosort-demo-actor');
    else await supabase?.auth.signOut();
    setActor(null);
    cache.clear();
  };
  const reset = async () => {
    if (!isDemo) return;
    demoRepository.reset();
    await refresh();
    notify('Demo restored. All examples are fictional.');
  };
  const current = query.data?.profiles.find((p) => p.id === actor?.id) ?? actor;
  return (
    <AppContext.Provider
      value={{
        actor: current,
        setActor,
        data: query.data ?? empty,
        loading: authLoading || (!!actor && query.isPending),
        error:
          authError ||
          (query.error?.message ??
            (!isDemo && !supabase
              ? 'Connected mode needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Configure .env and restart the server.'
              : null)),
        repository,
        demo: isDemo,
        demoProfiles: createSeed().profiles.filter(
          (p) => p.role !== 'resident' || p.id.endsWith('1'),
        ),
        switchDemo,
        refresh,
        logout,
        reset,
        notice,
        notify,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider is missing');
  return context;
}
export function homeFor(role: Profile['role']) {
  return `/${role}`;
}
