import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'driver' | 'customer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  allRoles: AppRole[];
  loading: boolean;
  roleLoading: boolean;
  setActiveRole: (role: AppRole) => void;
  signUp: (email: string, password: string, fullName?: string, accountType?: 'customer' | 'driver') => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  const fetchUserRoles = async (userId: string): Promise<AppRole[]> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((d) => d.role as AppRole);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  };

  const getPriorityRole = (roles: AppRole[]): AppRole | null => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('driver')) return 'driver';
    if (roles.includes('customer')) return 'customer';
    return null;
  };

  // Allow manually setting active role (for role switching)
  const setActiveRole = useCallback((newRole: AppRole) => {
    if (allRoles.includes(newRole)) {
      setRole(newRole);
    }
  }, [allRoles]);

  useEffect(() => {
    const loadRolesForUser = (userId: string) => {
      setRoleLoading(true);
      // Defer role fetching to avoid auth state change deadlocks
      setTimeout(() => {
        fetchUserRoles(userId)
          .then((roles) => {
            setAllRoles(roles);
            // Set highest priority role as default
            setRole(getPriorityRole(roles));
          })
          .finally(() => setRoleLoading(false));
      }, 0);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          loadRolesForUser(session.user.id);
        } else {
          setRole(null);
          setAllRoles([]);
          setRoleLoading(false);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session AND revalidate it server-side.
    // getSession() only reads local storage; getUser() forces a round-trip
    // to the Auth server so a tampered/expired/revoked token cannot grant access.
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
        if (error || !verifiedUser) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setRole(null);
          setAllRoles([]);
          setRoleLoading(false);
          setLoading(false);
          return;
        }
        setSession(session);
        setUser(verifiedUser);
        loadRolesForUser(verifiedUser.id);
      } else {
        setSession(null);
        setUser(null);
        setRole(null);
        setAllRoles([]);
        setRoleLoading(false);
      }

      setLoading(false);
    })();

    return () => subscription.unsubscribe();
  }, []);

  // Inactivity timeout — sign the user out after 30 minutes of no interaction.
  useEffect(() => {
    if (!user) return;
    const TIMEOUT_MS = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;

    const logoutForIdle = async () => {
      await supabase.auth.signOut();
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('sb-') || k.includes('supabase.auth'))
          .forEach((k) => localStorage.removeItem(k));
      } catch {}
      window.location.assign('/auth?reason=timeout');
    };

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(logoutForIdle, TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user]);

  const signUp = async (email: string, password: string, fullName?: string, accountType?: 'customer' | 'driver') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || email,
          account_type: accountType || 'customer',
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') || k.includes('supabase.auth'))
        .forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
    setUser(null);
    setSession(null);
    setRole(null);
    setAllRoles([]);
    setRoleLoading(false);
    // Hard navigation prevents back-button restore of protected pages.
    window.location.replace('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, role, allRoles, loading, roleLoading, setActiveRole, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
