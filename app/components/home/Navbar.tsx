"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  BookOpen,
  Calendar,
  MessageCircleHeart,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../ThemeToggle";

const Navbar = ({ onBookCTA }: { onBookCTA?: (e?: React.MouseEvent) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [profileMenu, setProfileMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Transparent on home hero, solid everywhere else / after scroll
  const [scrolled, setScrolled] = useState(pathname !== "/");
  const isHome = pathname === "/";

  const { user, userRole, loading: isLoadingAuth } = useAuth();

  const menuItems = useMemo(
    () => [
      { name: "Home", href: "#home" },
      { name: "About", href: "#about" },
      { name: "Amenities", href: "#amenities" },
      { name: "Gallery", href: "#gallery" },
      { name: "Reviews", href: "#reviews" },
      { name: "Contact", href: "#contact" },
    ],
    [],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll listener — transparent only on home page
  useEffect(() => {
    if (!isHome) return;
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // Active section tracker
  useEffect(() => {
    const handleScroll = () => {
      const sections = menuItems.map((item) =>
        document.getElementById(item.href.substring(1)),
      );
      const scrollPos = window.scrollY + 200;
      for (const section of sections) {
        if (section) {
          if (
            scrollPos >= section.offsetTop &&
            scrollPos < section.offsetTop + section.offsetHeight
          ) {
            setActiveSection(section.id);
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuItems]);

  const transparent = isHome && !scrolled;

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] transition-all duration-500 ease-out ${
        transparent
          ? "top-3 sm:top-4 max-w-6xl rounded-2xl bg-background/80 backdrop-blur-md border border-border/50 shadow-lg"
          : "top-2 sm:top-3 max-w-5xl rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-[0_8px_30px_rgba(0,0,0,0.25),0_0_24px_hsl(160_65%_48%/0.12)] ring-1 ring-white/5"
      }`}
    >
      <div className={`px-4 sm:px-5 lg:px-6 flex justify-between items-center transition-all duration-500 ${transparent ? "h-12 sm:h-14" : "h-10 sm:h-11"}`}>

        {/* Logo */}
        <Link href="#home" className="flex items-center space-x-2 flex-shrink-0">
          <div className="w-8 h-8 relative">
            <Image
              src="/logo.png"
              alt="Kampo Ibayo Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold text-primary">Kampo</span>
            <span className="text-lg sm:text-xl font-bold text-foreground transition-colors duration-300">
              Ibayo
            </span>
          </div>
        </Link>

        {/* Desktop nav links — center */}
        <div className="hidden md:flex items-center space-x-5 lg:space-x-7">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`text-[11px] lg:text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ${
                activeSection === item.href.substring(1)
                  ? "text-primary"
                  : transparent
                    ? "text-foreground/70 hover:text-foreground"
                    : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Desktop right — ThemeToggle + Book Now + Auth */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          <ThemeToggle />

          {/* Book Now — always visible */}
          <button
            type="button"
            onClick={onBookCTA}
            className="px-3 lg:px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-[11px] lg:text-xs font-bold uppercase tracking-[0.08em] hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Book Now
          </button>

          {/* Auth */}
          {!isMounted || isLoadingAuth ? (
            <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenu(!profileMenu)}
                className={`px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-semibold transition-colors border ${
                  transparent
                    ? "border-border text-foreground/80 hover:bg-muted/60"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {userRole === "admin" ? "👑 Admin" : userRole === "staff" ? "👨‍💼 Staff" : "Account"}
              </button>

              {profileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-xl shadow-xl overflow-hidden border border-border">
                  {(userRole === "admin" || userRole === "staff") && (
                    <Link
                      href="/admin"
                      className="flex items-center px-4 py-2.5 hover:bg-muted text-sm font-semibold border-b border-border"
                    >
                      {userRole === "admin" ? "👑 Admin Panel" : "👨‍💼 Staff Panel"}
                    </Link>
                  )}
                  <Link href="/profile" className="flex items-center px-4 py-2.5 hover:bg-muted text-sm">
                    <UserIcon className="w-4 h-4 mr-2" /> Profile
                  </Link>
                  <Link href="/bookings" className="flex items-center px-4 py-2.5 hover:bg-muted text-sm">
                    <BookOpen className="w-4 h-4 mr-2" /> My Bookings
                  </Link>
                  <Link href="/review" className="flex items-center px-4 py-2.5 hover:bg-muted text-sm">
                    <MessageCircleHeart className="w-4 h-4 mr-2" /> Leave Review
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await supabase.auth.signOut();
                        localStorage.clear();
                        sessionStorage.clear();
                        setProfileMenu(false);
                        setTimeout(() => window.location.reload(), 100);
                      } catch {
                        localStorage.clear();
                        sessionStorage.clear();
                        setProfileMenu(false);
                        setTimeout(() => window.location.reload(), 100);
                      }
                    }}
                    className="flex items-center w-full text-left px-4 py-2.5 hover:bg-muted text-sm border-t border-border"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className={`px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-semibold transition-colors border ${
                transparent
                  ? "border-border text-foreground/80 hover:bg-muted/60"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors ${
            transparent ? "text-foreground hover:bg-muted/60" : "text-foreground hover:bg-muted"
          }`}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-md px-4 pb-4 space-y-1 border-t border-border">
          {/* Book Now — mobile */}
          <div className="pt-3 pb-2">
            <button
              type="button"
              onClick={(e) => { setIsOpen(false); onBookCTA?.(e); }}
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Book Now
            </button>
          </div>

          <div className="py-1 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 px-1 pt-2">
              Navigation
            </p>
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`block py-2 px-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === item.href.substring(1)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </div>

          {!isMounted || isLoadingAuth ? (
            <div className="border-t border-border pt-3">
              <div className="px-2 py-2 bg-muted rounded animate-pulse h-10" />
            </div>
          ) : user ? (
            <div className="border-t border-border pt-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 px-1">Account</p>
              {(userRole === "admin" || userRole === "staff") && (
                <Link href="/admin" className="flex items-center px-2 py-2.5 hover:text-primary hover:bg-muted rounded-lg text-sm font-semibold" onClick={() => setIsOpen(false)}>
                  <span className="mr-2">{userRole === "admin" ? "👑" : "👨‍💼"}</span>
                  {userRole === "admin" ? "Admin Dashboard" : "Staff Dashboard"}
                </Link>
              )}
              <Link href="/profile" className="flex items-center px-2 py-2.5 hover:text-primary hover:bg-muted rounded-lg text-sm text-muted-foreground" onClick={() => setIsOpen(false)}>
                <UserIcon className="w-4 h-4 mr-2" /> My Profile
              </Link>
              <Link href="/bookings" className="flex items-center px-2 py-2.5 hover:text-primary hover:bg-muted rounded-lg text-sm text-muted-foreground" onClick={() => setIsOpen(false)}>
                <BookOpen className="w-4 h-4 mr-2" /> My Bookings
              </Link>
              <Link href="/review" className="flex items-center px-2 py-2.5 hover:text-primary hover:bg-muted rounded-lg text-sm text-muted-foreground" onClick={() => setIsOpen(false)}>
                <MessageCircleHeart className="w-4 h-4 mr-2" /> Leave Review
              </Link>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    localStorage.clear(); sessionStorage.clear();
                    setIsOpen(false);
                    setTimeout(() => window.location.reload(), 100);
                  } catch {
                    localStorage.clear(); sessionStorage.clear();
                    setIsOpen(false);
                    setTimeout(() => window.location.reload(), 100);
                  }
                }}
                className="flex items-center w-full px-2 py-2.5 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="border-t border-border pt-3">
              <Link href="/auth" onClick={() => setIsOpen(false)}>
                <button type="button" className="w-full py-2.5 px-4 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                  Sign In / Register
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
