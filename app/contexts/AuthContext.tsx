"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { User, Session } from "@supabase/supabase-js";
import { SESSION_TIMEOUT_MS, RETRY_DELAY_MS, MAX_AUTH_RETRIES } from "../lib/constants/timeouts";
interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fix hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Get initial session with retry logic
    const getInitialSession = async () => {
      try {
        // Check if we're in password reset mode - only block if explicitly set
        const inPasswordReset =
          typeof window !== "undefined" &&
          localStorage.getItem("in_password_reset") === "true";

        if (inPasswordReset) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        // 🛡️ SAFE FIX: Add retry logic with timeout
        let session = null;
        for (let attempt = 1; attempt <= MAX_AUTH_RETRIES; attempt++) {
          try {

            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Session timeout")), SESSION_TIMEOUT_MS)
            );

            const result = (await Promise.race([
              sessionPromise,
              timeoutPromise,
            ])) as { data: { session: Session | null } };
            session = result.data?.session;
            break; // Success - exit retry loop
          } catch (retryError) {
            if (attempt === MAX_AUTH_RETRIES) {
              throw retryError; // Final attempt failed
            }
            // Wait 1 second before retry
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          }
        }

        if (session?.user) {
          setUser(session.user);

          // 🛡️ SAFE FIX: Add error recovery for role query
          try {
            const { data: userData } = await supabase
              .from("users")
              .select("role")
              .eq("auth_id", session.user.id)
              .single();

            setUserRole(userData?.role || "user");
          } catch (roleError) {
            console.warn(
              "AuthContext: Role query failed, defaulting to user:",
              roleError
            );
            setUserRole("user"); // Safe fallback
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("AuthContext: All session attempts failed:", error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // ✅ THROTTLED: Listen for auth changes (prevent navigation blocking)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      // ✅ TOKEN_REFRESHED: silently update user object but skip role re-fetch and welcome toast
      if (event === "TOKEN_REFRESHED") {
        if (session?.user) {
          setUser(session.user);
          // Re-stamp cookies so middleware doesn't redirect after idle
          if (typeof document !== 'undefined' && userRole) {
            const maxAge = 7 * 24 * 60 * 60;
            document.cookie = `kb_authenticated=true; path=/; max-age=${maxAge}; SameSite=Lax`;
            document.cookie = `kb_role=${userRole}; path=/; max-age=${maxAge}; SameSite=Lax`;
          }
        }
        return;
      }

      // Always handle SIGNED_OUT events
      if (event === "SIGNED_OUT") {
        setUser(null);
        setUserRole(null);
        return;
      }

      // Check if we're in password reset mode
      const inPasswordReset =
        typeof window !== "undefined" &&
        localStorage.getItem("in_password_reset") === "true";

      // During password reset, ignore all auth events except SIGNED_OUT
      if (inPasswordReset) {
        return;
      }

      // Handle normal sign in events
      if (session?.user) {
        setUser(session.user);

        // ✅ NON-BLOCKING: Fetch user role without blocking navigation
        setTimeout(async () => {
          try {
            const { data: userData } = await supabase
              .from("users")
              .select("role")
              .eq("auth_id", session.user.id)
              .single();

            setUserRole(userData?.role || "user");
          } catch (error) {
            console.error("❌ AuthContext: Failed to fetch user role:", error);
            setUserRole("user");
          }
        }, 50); // 50ms delay to not block navigation
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isHydrated]);

  // 🛡️ COMPLETELY DISABLED: Auto-refresh was causing 30-second navigation hanging
  useEffect(() => {
    // All auto-refresh logic removed to prevent navigation issues
  }, []); // Empty dependency array, no auto-refresh

  // Sync auth state to cookies for server-side middleware (UX layer only)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (user && userRole) {
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `kb_authenticated=true; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `kb_role=${userRole}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else if (!loading && !user) {
      // Only clear cookies when user is truly signed out
      document.cookie = 'kb_authenticated=; path=/; max-age=0';
      document.cookie = 'kb_role=; path=/; max-age=0';
    }
  }, [user, userRole, loading]);

  return (
    <AuthContext.Provider value={{ user, userRole, loading: loading || !isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
