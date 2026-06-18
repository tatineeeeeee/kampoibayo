"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../supabaseClient"; // adjust path if needed
import { useToastHelpers } from "../components/Toast";
import Image from "next/image";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import { ForgotPasswordModal, PasswordResetForm } from "../components/auth/ForgotPasswordForm";
import AuthTestimonials from "../components/auth/AuthTestimonials";
import { cn } from "@/lib/utils";

function AuthPageContent() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('tab') !== 'signup');
  const [isLoading, setIsLoading] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formKey, setFormKey] = useState(0); // Force form refresh
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [forcePasswordReset, setForcePasswordReset] = useState(() => {
    // Check localStorage on initial load for password reset state with validation
    if (typeof window !== "undefined") {
      const hasPasswordResetFlag =
        sessionStorage.getItem("in_password_reset") === "true";

      // Only trust the flag if we also have indicators of a real password reset flow
      if (hasPasswordResetFlag) {
        const hash = window.location.hash.slice(1);
        const hashParams = new URLSearchParams(hash);
        const hasRecoveryTokens =
          hashParams.get("access_token") ||
          hashParams.get("type") === "recovery";

        if (!hasRecoveryTokens) {
          // Clear potentially stale flag immediately
          sessionStorage.removeItem("in_password_reset");
          return false;
        }
      }

      return hasPasswordResetFlag;
    }
    return false;
  });
  const router = useRouter();
  const {
    error: showError,
    warning,
    info,
    verificationSuccess,
  } = useToastHelpers();

  // Prevent infinite loops in recovery detection
  const recoveryHandled = useRef(false);
  const verifiedToastShown = useRef(false);
  const authStateChangeDebounce = useRef<NodeJS.Timeout | null>(null);

  // Utility function to completely clear all password reset related storage
  const clearPasswordResetState = () => {
    sessionStorage.removeItem("in_password_reset");
    sessionStorage.removeItem("recovery_access_token");
    sessionStorage.removeItem("recovery_refresh_token");
    sessionStorage.removeItem("recovery-info-shown");
    setForcePasswordReset(false);
    setIsPasswordReset(false);
  };

  // Password strength validation
  const validatePasswordStrength = (
    password: string
  ): {
    isValid: boolean;
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
    score: number;
  } => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const isValid = score === 5;

    return { isValid, requirements, score };
  };

  // Show verification success toast when redirected from email confirmation
  useEffect(() => {
    if (searchParams.get("verified") === "true" && typeof window !== "undefined" && !verifiedToastShown.current) {
      verifiedToastShown.current = true;
      verificationSuccess();
      // Clean URL params so toast doesn't re-show on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      url.searchParams.delete("tab");
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle password recovery properly with Supabase's built-in flow
  useEffect(() => {
    const handleRecovery = async () => {
      if (typeof window === "undefined" || recoveryHandled.current) return;

      const hash = window.location.hash.slice(1);
      const search = window.location.search;


      if (!hash && !search) return;

      // Check hash parameters (new format)
      const hashParams = new URLSearchParams(hash);
      const hashType = hashParams.get("type");

      // Check search parameters (fallback)
      const searchParams = new URLSearchParams(search);
      const searchMode = searchParams.get("mode");

      // Handle password recovery the correct way
      if (hashType === "recovery" || searchMode === "recovery") {
        recoveryHandled.current = true; // Prevent infinite loops


        // Check if we have recovery tokens in the hash
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {

          try {
            // Set recovery state immediately
            setForcePasswordReset(true);
            setIsPasswordReset(true);
            sessionStorage.setItem("in_password_reset", "true");

            // Clear the URL hash immediately to prevent reprocessing
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );

            // Set the session with recovery tokens
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

            if (sessionError) {
              console.error("❌ Failed to set recovery session:", sessionError);
              clearPasswordResetState();
              showError(
                "Invalid Reset Link",
                "This password reset link is invalid or expired. Please request a new password reset."
              );
              setIsLoading(false);
              return;
            }

            if (sessionData.session) {
              setIsLoading(false);
              info("Ready!", "Please set your new password below.");
            } else {
              console.error("❌ No session created from recovery tokens");
              clearPasswordResetState();
              showError(
                "Invalid Reset Link",
                "Failed to establish reset session. Please request a new password reset."
              );
              setIsLoading(false);
            }
          } catch (error) {
            console.error("❌ Error setting recovery session:", error);
            // Reset states on error
            clearPasswordResetState();
            showError(
              "Reset Error",
              "An error occurred while processing your reset link. Please try again."
            );
            setIsLoading(false);
          }
        } else {
          showError(
            "Invalid Reset Link",
            "This password reset link is invalid or expired. Please request a new password reset."
          );
          setIsLoading(false);
        }
      }
    };

    handleRecovery();
  }, [info, showError]);

  // Handle session recovery and cleanup on component mount
  useEffect(() => {
    const handleSessionRecovery = async () => {
      try {
        // FIRST PRIORITY: Check if we're in password reset mode from localStorage or state
        const inPasswordReset =
          sessionStorage.getItem("in_password_reset") === "true";

        // SAFETY CHECK: If password reset flag exists but no session, it might be stale
        if (
          (forcePasswordReset || inPasswordReset) &&
          typeof window !== "undefined"
        ) {
          // Check if we actually have recovery tokens or a valid reset session
          const hash = window.location.hash.slice(1);
          const hashParams = new URLSearchParams(hash);
          const hasValidRecoveryTokens =
            hashParams.get("access_token") ||
            hashParams.get("type") === "recovery";

          // If no recovery tokens in URL, check if we have a valid session
          if (!hasValidRecoveryTokens) {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            // If no valid session and no recovery tokens, clear the stale password reset state
            if (!session) {
              clearPasswordResetState();
              // Continue with normal flow instead of returning
            } else {
              setIsPasswordReset(true);
              setForcePasswordReset(true);
              setIsLoading(false);
              return;
            }
          } else {
            setIsPasswordReset(true);
            setForcePasswordReset(true);
            setIsLoading(false);
            return;
          }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get("mode");

        // Check if we already have recovery tokens stored (from the first useEffect)
        const hasStoredTokens =
          sessionStorage.getItem("recovery_access_token") &&
          sessionStorage.getItem("recovery_refresh_token");

        if (mode === "recovery" && !hasStoredTokens) {
          setIsPasswordReset(true);
          // Only show this message once, not repeatedly
          if (!sessionStorage.getItem("recovery-info-shown")) {
            info(
              "Check Your Email",
              "Please use the reset link sent to your email to set a new password."
            );
            sessionStorage.setItem("recovery-info-shown", "true");
          }
        } else if (hasStoredTokens) {
          setIsPasswordReset(true);
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          await supabase.auth.signOut();
          localStorage.removeItem("supabase.auth.token");
        }

        // IMPORTANT: Only proceed with normal login flow if NOT in password reset mode
        if (session?.user && !forcePasswordReset && !inPasswordReset) {
          const hashParams =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.hash.slice(1))
              : null;
          const inRecoveryMode =
            hashParams?.get("type") === "recovery" ||
            hashParams?.get("access_token");

          // If URL indicates recovery mode, don't auto-login
          if (inRecoveryMode) {
            setIsPasswordReset(true);
            setForcePasswordReset(true);
            sessionStorage.setItem("in_password_reset", "true");
            setIsLoading(false);
            return;
          }

          // Normal login flow - only if no recovery indicators
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("auth_id", session.user.id)
            .single();

          if (userData?.role === "admin" || userData?.role === "staff") {
            router.push("/admin");
          } else {
            router.push("/");
          }
          return;
        }
      } catch (error) {
        await supabase.auth.signOut();
      }

      setIsLoading(false);
    };

    handleSessionRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Debounce auth state changes to prevent conflicts
      if (authStateChangeDebounce.current) {
        clearTimeout(authStateChangeDebounce.current);
      }

      authStateChangeDebounce.current = setTimeout(async () => {

        try {
          // IMMEDIATE RECOVERY CHECK - Before processing any events
          if (typeof window !== "undefined") {
            const hash = window.location.hash.slice(1);
            const search = window.location.search;
            const hashParams = new URLSearchParams(hash);
            const searchParams = new URLSearchParams(search);
            const hasRecoveryTokens =
              hashParams.get("access_token") ||
              hashParams.get("type") === "recovery" ||
              searchParams.get("mode") === "recovery" ||
              hashParams.get("refresh_token");

            const inPasswordResetStorage =
              sessionStorage.getItem("in_password_reset") === "true";

            if (
              (hasRecoveryTokens || inPasswordResetStorage) &&
              (event === "SIGNED_IN" || event === "INITIAL_SESSION")
            ) {

              // Set state and persist to localStorage to prevent any auto-login
              setForcePasswordReset(true);
              setIsPasswordReset(true);
              sessionStorage.setItem("in_password_reset", "true");

              // Clean URL after setting state (only if we have recovery tokens in URL)
              if (hasRecoveryTokens) {
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname
                );
              }

              return; // Exit immediately to prevent any redirect
            }
          }

          if (event === "SIGNED_OUT") {
            localStorage.removeItem("supabase.auth.token");
          } else if (event === "PASSWORD_RECOVERY") {
            setForcePasswordReset(true);
            setIsPasswordReset(true);
            info("Password Reset", "Please set a new password to continue.");
          } else if (event === "SIGNED_IN" && session) {
            // COMPREHENSIVE AUTO-LOGIN PREVENTION CHECK
            const hash =
              typeof window !== "undefined"
                ? window.location.hash.slice(1)
                : "";
            const search =
              typeof window !== "undefined" ? window.location.search : "";
            const hashParams = new URLSearchParams(hash);
            const searchParams = new URLSearchParams(search);
            const isRecoveryMode =
              hashParams.get("type") === "recovery" ||
              searchParams.get("mode") === "recovery" ||
              hashParams.get("access_token") ||
              hashParams.get("refresh_token");


            // Check all possible password reset indicators
            const inPasswordReset =
              sessionStorage.getItem("in_password_reset") === "true";
            const shouldBlockLogin =
              isRecoveryMode ||
              forcePasswordReset ||
              isPasswordReset ||
              inPasswordReset;

            if (shouldBlockLogin) {

              // Ensure password reset state is set
              setForcePasswordReset(true);
              setIsPasswordReset(true);
              sessionStorage.setItem("in_password_reset", "true");

              // Clean the URL if we have recovery tokens
              if (isRecoveryMode && (hash || search.includes("recovery"))) {
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname
                );
              }

              return; // CRITICAL: Exit here to prevent auto-login redirect
            }

            // Normal login flow - only proceed if no password reset indicators
            const { data: userData } = await supabase
              .from("users")
              .select("role")
              .eq("auth_id", session.user.id)
              .single();

            if (userData?.role === "admin" || userData?.role === "staff") {
              router.push("/admin");
            } else {
              router.push("/");
            }
          }
        } catch (error: unknown) {
          console.error("Auth state change error:", error);
          // Handle authentication errors gracefully
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes("refresh") ||
            errorMessage.includes("token")
          ) {
            await supabase.auth.signOut();
            localStorage.removeItem("supabase.auth.token");
            warning("Session Expired", "Please try logging in again.");
          } else {
            showError(
              "Unexpected Error",
              "An unexpected error occurred. Please try again."
            );
          }
        }
      }, 300); // 300ms debounce
    });

    return () => {
      subscription.unsubscribe();
      // Clean up recovery info when component unmounts
      if (!isPasswordReset && !forcePasswordReset) {
        sessionStorage.removeItem("recovery-info-shown");
      }
    };
  }, [router, info, forcePasswordReset, isPasswordReset, showError, warning]);

  // 🔹 Handle password update (for password reset) - SIMPLE & ROBUST VERSION
  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmNewPassword = formData.get("confirmNewPassword") as string;

    if (!newPassword.trim()) {
      showError("Missing Password", "Please enter a new password");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showError("Password Mismatch", "Passwords do not match");
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      showError("Weak Password", "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character!");
      return;
    }

    setIsUpdatingPassword(true);

    try {

      // Simple password update
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("❌ Password update error:", error);

        // Check if the error indicates the user no longer exists (account was deleted)
        if (
          error.message.includes("not found") ||
          error.message.includes("User not found") ||
          error.message.includes("invalid") ||
          error.message.includes("expired")
        ) {

          // Clear all password reset flags and storage
          clearPasswordResetState();
          localStorage.clear();
          sessionStorage.clear();

          // Sign out and redirect to fresh auth page
          await supabase.auth.signOut();

          showError(
            "Account Not Found",
            "This account may have been deleted. Please create a new account or contact support."
          );

          // Reset all states and redirect to clean auth page
          setTimeout(() => {
            clearPasswordResetState();
            window.location.href = "/auth";
          }, 3000);

          setIsUpdatingPassword(false);
          return;
        }

        showError("Update Failed", error.message || "Please try again.");
        setIsUpdatingPassword(false);
        return;
      }


      // Show success message
      info(
        "Success!",
        "Password updated successfully! Redirecting to login..."
      );

      // Clear all password reset states and storage
      clearPasswordResetState();

      // Sign out completely to clear session
      await supabase.auth.signOut();

      // Clear browser storage completely
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to fresh login page after a short delay
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
    } catch (error: unknown) {
      console.error("Password update error:", error);
      showError("Error", "Failed to update password. Please try again.");
      setIsUpdatingPassword(false);
    }
  };

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-2 sm:p-4 relative overflow-hidden">
      {/* Page-level ambient glow — teal top, blue bottom */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-info/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative w-full max-w-6xl flex flex-col lg:flex-row rounded-2xl sm:rounded-2xl lg:rounded-3xl shadow-2xl shadow-primary/15 overflow-hidden border border-primary/20 backdrop-blur-xl">
        {/* Left Side - Hidden on mobile, shown on desktop */}
        <AuthTestimonials />

        {/* Right Side - Main content on mobile, right side on desktop */}
        <div className="w-full lg:w-1/2 bg-card/90 backdrop-blur-xl text-foreground p-4 sm:p-6 lg:p-8 xl:p-10 flex flex-col overflow-y-auto max-h-screen">
          <div className="flex-1 flex flex-col justify-center min-h-0">
            {/* Mobile Header - Only shown on mobile */}
            <div className="lg:hidden text-center mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                {/* Home/Back Button - Mobile */}
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors p-1 sm:p-2 rounded-lg hover:bg-muted"
                  title="Back to Home"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium">Home</span>
                </button>

                {/* Logo and Title */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 relative">
                    <Image
                      src="/logo.png"
                      alt="Kampo Ibayo Logo"
                      fill
                      className="object-contain drop-shadow-lg rounded-lg"
                      priority
                    />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight">
                    <span className="text-primary">Kampo</span>{" "}
                    <span className="text-foreground">Ibayo</span>
                  </h1>
                </div>

                {/* Spacer to center the logo */}
                <div className="w-12 sm:w-16"></div>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Where adventure meets comfort
              </p>
            </div>

            {/* Welcome heading — changes based on active tab */}
            {!isPasswordReset && (
              <div className="mb-3 sm:mb-4 lg:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold tracking-tight text-foreground">
                  {isLogin ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-1.5">
                  {isLogin
                    ? "Sign in to manage your bookings and reservations"
                    : "Join us and start your tropical adventure today"}
                </p>
              </div>
            )}

            {/* Pill-style tab switcher */}
            {!isPasswordReset && (
              <div className="relative flex mb-3 sm:mb-4 lg:mb-6 rounded-full bg-muted/50 p-1 border border-border/50">
                {/* Sliding pill background */}
                <div
                  className={cn(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full transition-all duration-300 ease-in-out shadow-lg shadow-primary/25",
                    isLogin ? "left-1" : "left-[calc(50%+2px)]"
                  )}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    // Clear form when switching to login
                    setFormKey((prev) => prev + 1);
                  }}
                  className={cn(
                    "relative z-10 w-1/2 py-2.5 sm:py-3 font-semibold rounded-full transition-all duration-300 text-xs sm:text-sm lg:text-base",
                    isLogin
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    // Clear form when switching to register
                    setFormKey((prev) => prev + 1);
                  }}
                  className={cn(
                    "relative z-10 w-1/2 py-2.5 sm:py-3 font-semibold rounded-full transition-all duration-300 text-xs sm:text-sm lg:text-base",
                    !isLogin
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Form container */}
            <div className="flex flex-col justify-start">
              {isPasswordReset ? (
                <PasswordResetForm
                  isUpdatingPassword={isUpdatingPassword}
                  onSubmit={handlePasswordUpdate}
                />
              ) : isLogin ? (
                <LoginForm
                  formKey={formKey}
                  onForgotPassword={() => setShowForgotPassword(true)}
                />
              ) : (
                <SignupForm
                  formKey={formKey}
                  onSignupSuccess={() => {
                    setFormKey((prev) => prev + 1);
                    setIsLogin(true);
                  }}
                />
              )}
            </div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
              showForgotPassword={showForgotPassword}
              onClose={() => setShowForgotPassword(false)}
            />

            {/* Footer - Mobile optimized spacing */}
            <div className="mt-4 sm:mt-6 lg:mt-8 text-center"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-foreground text-xl">Loading...</div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
