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

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
    });

    return () => subscription.unsubscribe();
  }, []);

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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setAllRoles([]);
    setRoleLoading(false);
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
