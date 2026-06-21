"use client";
import { useState } from "react";
import { SIGNUP_SUCCESS_DELAY_MS } from "@/app/lib/constants/timeouts";
import { supabase } from "../../supabaseClient";
import {
  FaLock,
  FaEnvelope,
  FaUser,
  FaPhone,
  FaUserPlus,
} from "react-icons/fa";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useToastHelpers } from "../Toast";
import {
  cleanPhoneForDatabase,
  formatPhoneForDisplay,
  validatePhilippinePhone,
} from "../../utils/phoneUtils";
import { cn } from "@/lib/utils";

interface SignupFormProps {
  formKey: number;
  onSignupSuccess: () => void;
}

export default function SignupForm({ formKey, onSignupSuccess }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const {
    error: showError,
    registrationSuccess,
  } = useToastHelpers();

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

  // Real-time password matching validation
  const handlePasswordChange = (value: string) => {
    setPasswordValue(value);
    if (confirmPasswordValue) {
      setPasswordsMatch(value === confirmPasswordValue);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPasswordValue(value);
    if (value && passwordValue) {
      setPasswordsMatch(passwordValue === value);
    } else {
      setPasswordsMatch(null);
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    return formatPhoneForDisplay(value);
  };

  // 🔹 Handle register with Supabase Auth
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      showError("Password Mismatch", "Passwords do not match!");
      return;
    }

    if (!validatePhilippinePhone(phone)) {
      showError(
        "Invalid Phone Number",
        "Phone number must be exactly 11 digits long!"
      );
      return;
    }

    // Clean and format phone number for database storage (international format)
    const cleanedPhone = cleanPhoneForDatabase(phone);

    if (!termsAccepted) {
      setTermsError(true);
      showError(
        "Terms Required",
        "Please accept the Terms of Service and Privacy Policy to continue."
      );
      return;
    }

    // Clear any previous terms error
    setTermsError(false);

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      showError(
        "Weak Password",
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character!"
      );
      return;
    }

    try {
      // Clear any existing session first
      await supabase.auth.signOut();

      // Check if email already exists in the database first
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email.toLowerCase())
        .single();

      // Only show error if user actually exists (ignore "not found" errors)
      if (existingUser && !checkError) {
        showError(
          "Account Exists",
          "An account with this email already exists. Please try logging in instead."
        );
        return;
      }

      // If there's a database error other than "not found", log it but continue
      if (
        checkError &&
        !checkError.message.includes("not found") &&
        checkError.code !== "PGRST116"
      ) {
        console.warn("Database check warning:", checkError);
        // Continue anyway - we'll catch duplicates in Supabase Auth
      }

      // Set a flag so we can show welcome after verification even if the hash is empty
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("awaiting_email_verification", "true");
        } catch {}
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: `${firstName} ${lastName}` },
          emailRedirectTo:
            `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://kampo-ibayo-resort.vercel.app"}/auth`,
        },
      });

      if (error) {
        console.error("Registration error:", error);

        // Handle specific registration errors - enhanced duplicate detection
        if (
          error.message.includes("User already registered") ||
          error.message.includes("already been registered") ||
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.code === "user_already_exists"
        ) {
          showError(
            "Account Exists",
            "An account with this email already exists. Please try logging in instead."
          );
        } else if (error.message.includes("Password")) {
          showError(
            "Password Issue",
            "Password is too weak. Please choose a stronger password."
          );
        } else if (
          error.message.includes("email") &&
          error.message.includes("valid")
        ) {
          showError("Invalid Email", "Please enter a valid email address.");
        } else {
          showError("Registration Failed", error.message);
        }
        return;
      }

      if (data.user) {
        try {
          // Store extra user info in your "users" table
          const { error: insertError } = await supabase.from("users").insert({
            auth_id: data.user.id,
            full_name: `${firstName} ${lastName}`,
            email: email,
            phone: cleanedPhone, // Store in international format (+63XXXXXXXXXX)
            role: "user", // Regular users are always "user" role
            created_at: new Date().toISOString(), // Convert to ISO string
          });

          if (insertError) {
            console.error("Error creating user profile:", insertError);
            // Continue anyway - auth account was created successfully
          }
        } catch (insertError) {
          console.error("Failed to create user profile:", insertError);
          // Continue anyway - auth account was created successfully
        }

        registrationSuccess();
        // 🚀 Force logout so they must sign in manually
        await supabase.auth.signOut();

        // Clear all form data and force form refresh
        setPasswordValue("");
        setConfirmPasswordValue("");
        setPasswordsMatch(null);
        setTermsAccepted(false);
        setTermsError(false);

        // Notify parent to switch to login
        setTimeout(() => onSignupSuccess(), SIGNUP_SUCCESS_DELAY_MS);
      }
    } catch (error: unknown) {
      console.error("Unexpected registration error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("refresh") || errorMessage.includes("token")) {
        await supabase.auth.signOut();
        localStorage.removeItem("supabase.auth.token");
      }

      showError(
        "Registration Error",
        "An unexpected error occurred during registration. Please try again."
      );
    }
  };

  return (
    <form
      key={`register-${formKey}`}
      onSubmit={handleRegister}
      className="space-y-3 sm:space-y-3.5"
      autoComplete="off"
    >
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="w-full sm:w-1/2">
          <label className="block text-xs sm:text-sm font-medium text-foreground/90 mb-1.5">
            First Name <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center border border-border/50 p-2.5 sm:p-3 rounded-xl bg-background/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/30 focus-within:bg-background/70">
            <FaUser className="text-primary/60 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0 transition-opacity duration-200" />
            <input
              type="text"
              name="firstName"
              placeholder="Enter your first name"
              className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm lg:text-base"
              autoComplete="new-firstname"
              required
            />
          </div>
        </div>
        <div className="w-full sm:w-1/2">
          <label className="block text-xs sm:text-sm font-medium text-foreground/90 mb-1.5">
            Last Name <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center border border-border/50 p-2.5 sm:p-3 rounded-xl bg-background/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/30 focus-within:bg-background/70">
            <FaUser className="text-primary/60 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0 transition-opacity duration-200" />
            <input
              type="text"
              name="lastName"
              placeholder="Enter your last name"
              className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm lg:text-base"
              autoComplete="new-lastname"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-foreground/90 mb-1.5">
          Email Address <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center border border-border/50 p-2.5 sm:p-3 rounded-xl bg-background/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/30 focus-within:bg-background/70">
          <FaEnvelope className="text-primary/60 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0 transition-opacity duration-200" />
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm lg:text-base"
            autoComplete="new-email"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-foreground/90 mb-1.5">
          Phone Number <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center border border-border/50 p-2.5 sm:p-3 rounded-xl bg-background/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/30 focus-within:bg-background/70">
          <FaPhone className="text-primary/60 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0 transition-opacity duration-200" />
          <input
            type="tel"
            name="phone"
            placeholder="09XX-XXX-XXXX (11 digits)"
            className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm lg:text-base"
            autoComplete="new-phone"
            onKeyDown={(e) => {
              if (e.key === "Backspace") {
                const val = e.currentTarget.value;
                if (val.endsWith("-")) {
                  e.preventDefault();
                  e.currentTarget.value = val.slice(0, -2);
                }
              }
            }}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value);
              e.target.value = formatted;
            }}
            onBlur={(e) => {
              if (
                e.target.value &&
                !validatePhilippinePhone(e.target.value)
              ) {
                e.target.setCustomValidity(
                  "Phone number must be exactly 11 digits (09XX-XXX-XXXX)"
                );
              } else {
                e.target.setCustomValidity("");
              }
            }}
            required
          />
        </div>
      </div>

      {/* Password Field - Full Width */}
      <div className="space-y-2 sm:space-y-3">
        <div className="w-full">
          <label className="block text-xs sm:text-sm font-medium text-foreground/90 mb-1.5">
            Password <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center border border-border/50 p-2.5 sm:p-3 rounded-xl bg-background/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/30 focus-within:bg-background/70">
            <FaLock className="text-primary/60 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0 transition-opacity duration-200" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={passwordValue}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm lg:text-base"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ml-3 text-muted-foreground hover:text-foreground transition-all duration-200 p-1 rounded-lg hover:bg-primary/10"
            >
              {showPassword ? (
                <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              ) : (
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              )}
            </button>
          </div>

          {/* Password Requirements & Strength */}
          <div className="mt-1.5 sm:mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-xs">
                Use 8+ characters with letters, numbers and symbols
              </span>
              {passwordValue && (
                <span className="text-muted-foreground text-xs">
                  {validatePasswordStrength(passwordValue).score <= 1
                    ? "Weak"
                    : validatePasswordStrength(passwordValue).score <= 2
                    ? "Fair"
                    : validatePasswordStrength(passwordValue).score <= 3
                    ? "Good"
                    : "Strong"}
                </span>
              )}
            </div>
            {passwordValue && (
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      "h-1.5 rounded-full flex-1 transition-all duration-300",
                      level <= validatePasswordStrength(passwordValue).score
                        ? level <= 1
                          ? "bg-destructive"
                          : level <= 2
                          ? "bg-accent"
                          : level <= 3
                          ? "bg-primary/60"
                          : "bg-success"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Confirm Password Field - Full Width */}
        <div className="w-full">
          <label className="block text-xs sm:text-sm font-medium text-foreground/90 mb-1.5">
            Confirm Password <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center border border-border/50 p-2.5 sm:p-3 rounded-xl bg-background/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/30 focus-within:bg-background/70">
            <FaLock className="text-primary/60 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0 transition-opacity duration-200" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={confirmPasswordValue}
              onChange={(e) =>
                handleConfirmPasswordChange(e.target.value)
              }
              className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm lg:text-base"
              required
            />
            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="ml-3 text-muted-foreground hover:text-foreground transition-all duration-200 p-1 rounded-lg hover:bg-primary/10"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              ) : (
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              )}
            </button>
          </div>

          {/* Password Match Validation */}
          <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-xs min-h-[14px] sm:min-h-[16px]">
            <span className="text-muted-foreground text-xs">
              Password confirmation
            </span>
            <div className="flex items-center gap-1.5">
              {confirmPasswordValue ? (
                passwordsMatch ? (
                  <>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                    <span className="text-success text-xs font-medium">Match</span>
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                    <span className="text-destructive text-xs font-medium">No match</span>
                  </>
                )
              ) : (
                <div className="w-3 h-3 sm:w-4 sm:h-4"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Privacy Policy Consent */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <input
            type="checkbox"
            id="terms-consent"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              if (e.target.checked) {
                setTermsError(false);
              }
            }}
            className="mt-0.5 sm:mt-1 w-3 h-3 sm:w-4 sm:h-4 text-primary accent-primary rounded flex-shrink-0"
            required
          />
          <label
            htmlFor="terms-consent"
            className="text-xs leading-relaxed text-muted-foreground"
          >
            I agree to Kampo Ibayo&apos;s{" "}
            <a
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline font-medium transition-colors"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline font-medium transition-colors"
            >
              Privacy Policy
            </a>
          </label>
        </div>
        {termsError && (
          <div className="flex items-center space-x-1 text-xs text-destructive ml-5 sm:ml-7">
            <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
            <span>
              You must accept the Terms of Service and Privacy Policy
              to create an account
            </span>
          </div>
        )}
      </div>

      {/* Create Account Button */}
      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground py-2.5 sm:py-3 px-4 rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 transition-all duration-300 text-sm lg:text-base flex items-center justify-center gap-2"
      >
        <FaUserPlus className="text-xs sm:text-sm lg:text-base" />
        <span>Create Account</span>
      </button>
    </form>
  );
}
