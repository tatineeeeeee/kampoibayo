"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { CalendarDays, ArrowRight, Users, Waves, MapPin, PawPrint, Star, Wifi, Car, Shield, Clock } from "lucide-react";

import { BASE_RATE_WEEKDAY, BASE_RATE_WEEKEND } from "../../lib/constants/pricing";
import { CHECK_IN_TIME } from "../../lib/constants/booking";
import { supabase } from "../../supabaseClient";

interface HeroSectionProps {
  maintenanceActive: boolean;
  onCheckAvailability: () => void;
  onBookCTA?: (e?: React.MouseEvent) => void;
}

const statsBar = [
  { icon: <Users className="w-4 h-4" />, label: "Max Guests", value: "25 Pax" },
  { icon: <Waves className="w-4 h-4" />, label: "Swimming Pool", value: "Included" },
  { icon: <MapPin className="w-4 h-4" />, label: "Check-in", value: CHECK_IN_TIME },
  { icon: <PawPrint className="w-4 h-4" />, label: "Pet Policy", value: "Friendly" },
];

const featureChips = [
  { icon: <Waves className="w-3 h-3" />, label: "Private Pool" },
  { icon: <Wifi className="w-3 h-3" />, label: "Free WiFi" },
  { icon: <Car className="w-3 h-3" />, label: "Free Parking" },
  { icon: <Shield className="w-3 h-3" />, label: "DOT Certified" },
  { icon: <Clock className="w-3 h-3" />, label: "22-Hr Stay" },
];

type HeroReview = { name: string; text: string; rating: number };

const HeroSection = ({ maintenanceActive, onCheckAvailability }: HeroSectionProps) => {
  const [reviews, setReviews] = useState<HeroReview[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewVisible, setReviewVisible] = useState(true);

  useEffect(() => {
    supabase
      .from("guest_reviews")
      .select("guest_name, rating, review_text")
      .eq("approved", true)
      .gte("rating", 4)
      .not("review_text", "is", null)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const valid = data.filter((r) => r.review_text && r.review_text.length > 20);
          setReviews(valid.map((r) => ({ name: r.guest_name, rating: r.rating, text: r.review_text! })));
        }
      });
  }, []);

  // Auto-rotate every 5 seconds with fade transition
  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setReviewVisible(false);
      setTimeout(() => {
        setReviewIndex((i) => (i + 1) % reviews.length);
        setReviewVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  const review = reviews[reviewIndex] ?? null;

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col bg-background overflow-hidden"
    >
      {/* Ambient radial glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_25%_50%,hsl(var(--primary)/0.11),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_35%_40%_at_82%_55%,hsl(var(--primary)/0.07),transparent)] pointer-events-none" />

      {/* ── SPLIT AREA ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">

        {/* LEFT PANEL */}
        <div className="order-2 lg:order-1 lg:w-[58%] relative flex flex-col justify-start px-8 sm:px-12 lg:px-16 xl:px-24 pt-10 pb-6 lg:pt-20 lg:pb-8">

          {/* Decorative soft circles (desktop only) */}
          <div className="absolute top-1/3 right-[5%] w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none hidden lg:block" />
          <div className="absolute bottom-1/3 left-6 w-52 h-52 bg-primary/6 rounded-full blur-2xl pointer-events-none hidden lg:block" />

          {/* ── SINGLE CONTENT GROUP ── */}
          <div className="relative z-10 max-w-xl">

            {/* Thin accent line + location pill */}
            <div
              className="flex flex-col gap-3 mb-5 sm:mb-6"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="w-10 h-0.5 bg-primary/70 rounded-full" />
              <div className="inline-flex items-center gap-2 bg-muted/50 backdrop-blur-sm border border-border rounded-full px-4 py-1.5 self-start">
                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="text-foreground/80 text-[11px] xs:text-xs font-medium tracking-wider uppercase">
                  Brgy. Tapia · General Trias, Cavite
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="leading-none mb-4 sm:mb-5"
              style={{ animationDelay: "0.35s" }}
            >
              <span className="block text-base xs:text-lg sm:text-xl md:text-2xl font-light text-foreground/70 tracking-[0.25em] uppercase mb-2">
                Your Exclusive
              </span>
              <span className="block font-display font-black text-foreground tracking-tight leading-[0.9] whitespace-nowrap text-[5.8vw] lg:text-[3vw] xl:text-[3.2vw] 2xl:text-[3.5vw]">
                Nature Escape
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-sm sm:text-base text-foreground/70 max-w-md leading-relaxed font-light mb-4 sm:mb-5"
              style={{ animationDelay: "0.55s" }}
            >
              Your own private tropical retreat — perfect for families, barkada,
              and celebrations. Own the whole resort for 22 unforgettable hours.
            </p>

            {/* Micro-stats */}
            <div
              className="flex items-center gap-5 sm:gap-8 mb-4 sm:mb-5"
              style={{ animationDelay: "0.7s" }}
            >
              {[
                { value: "500+", label: "Happy Guests" },
                { value: "4.2★", label: "Guest Rating" },
                { value: "Est. 2019", label: "General Trias" },
              ].map((stat, i) => (
                <div key={stat.label} className={`${i > 0 ? "border-l border-border pl-5 sm:pl-8" : ""}`}>
                  <p className="text-foreground font-bold text-lg sm:text-xl leading-none">{stat.value}</p>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Trust highlights — flows directly after stats, no gap */}
            <div
              className="hidden lg:flex flex-col gap-2 mb-5"
              style={{ animationDelay: "0.9s" }}
            >
              <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em]">Included in every booking</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { icon: <Waves className="w-3.5 h-3.5" />, text: "Private Swimming Pool" },
                  { icon: <Users className="w-3.5 h-3.5" />, text: "Up to 25 Guests" },
                  { icon: <Shield className="w-3.5 h-3.5" />, text: "DOT Certified Resort" },
                  { icon: <Clock className="w-3.5 h-3.5" />, text: "22-Hour Full Access" },
                  { icon: <Wifi className="w-3.5 h-3.5" />, text: "Free WiFi & Parking" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-1.5 text-foreground/65">
                    <span className="text-primary/60">{item.icon}</span>
                    <span className="text-[11px] tracking-wide">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div
              className="flex flex-col xs:flex-row gap-3 mb-5"
              style={{ animationDelay: "0.85s" }}
            >
              <button
                type="button"
                onClick={() => !maintenanceActive && onCheckAvailability()}
                disabled={maintenanceActive}
                className={`group w-full xs:w-auto min-w-[190px] px-7 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 min-h-[52px] touch-manipulation shadow-xl ${
                  maintenanceActive
                    ? "bg-muted/40 text-muted-foreground cursor-not-allowed border border-border"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-primary/30"
                }`}
              >
                <CalendarDays className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {maintenanceActive ? "Unavailable" : "Check Availability"}
                </span>
                {!maintenanceActive && (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                )}
              </button>

              <a
                href="#about"
                className="group w-full xs:w-auto min-w-[160px] px-7 py-3.5 bg-muted border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary rounded-full font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 min-h-[52px] touch-manipulation shadow-lg shadow-primary/15 hover:shadow-primary/30"
              >
                <span className="whitespace-nowrap">Explore Resort</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </a>
            </div>

            {/* Price line */}
            <div
              className="flex items-baseline gap-2 mb-3"
              style={{ animationDelay: "1.0s" }}
            >
              <span className="text-muted-foreground text-[11px] uppercase tracking-widest">Starting from</span>
              <span className="text-foreground font-bold text-base">₱{BASE_RATE_WEEKDAY.toLocaleString()}</span>
              <span className="text-muted-foreground text-[11px]">/ weekday · ₱{BASE_RATE_WEEKEND.toLocaleString()} peak &amp; weekends</span>
            </div>

            {/* Feature chips */}
            <div
              className="flex flex-wrap gap-1.5 mb-4"
              style={{ animationDelay: "1.1s" }}
            >
              {featureChips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 bg-muted/40 border border-border text-muted-foreground text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm shadow-primary/20"
                >
                  <span className="text-primary">{chip.icon}</span>
                  {chip.label}
                </span>
              ))}
            </div>

            {/* Guest review snippet — auto-rotating live reviews */}
            {review && (
              <div
                className="hidden [@media(min-height:900px)]:flex bg-card border border-border rounded-2xl p-3.5 max-w-md min-h-[104px] flex-col justify-between shadow-sm"
                style={{ animationDelay: "1.2s" }}
              >
                <div className={`flex items-start gap-3 transition-opacity duration-[400ms] ${reviewVisible ? "opacity-100" : "opacity-0"}`}>
                  <div className="w-9 h-9 rounded-full bg-primary/25 border border-primary/35 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-0.5 mb-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-warning fill-warning" />
                      ))}
                      {Array.from({ length: 5 - review.rating }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-border" />
                      ))}
                      <span className="text-muted-foreground text-[10px] ml-1">· Verified Guest</span>
                    </div>
                    <p className="text-foreground/70 text-xs leading-relaxed line-clamp-2">
                      &ldquo;{review.text}&rdquo;
                    </p>
                    <p className="text-muted-foreground text-[10px] mt-1 font-medium">
                      {review.name.split(" ")[0]} {review.name.split(" ").slice(-1)[0]}
                    </p>
                  </div>
                </div>
                {/* Dot indicators */}
                {reviews.length > 1 && (
                  <div className="flex items-center gap-1.5 mt-2.5 pl-12">
                    {reviews.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        title={`View review ${i + 1}`}
                        onClick={() => { setReviewVisible(false); setTimeout(() => { setReviewIndex(i); setReviewVisible(true); }, 400); }}
                        className={`rounded-full transition-all duration-300 ${i === reviewIndex ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-border hover:bg-muted-foreground"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — resort photo */}
        <div className="order-1 lg:order-2 lg:w-[42%] flex items-center justify-center px-6 sm:px-10 lg:pl-10 lg:pr-12 xl:pl-12 xl:pr-16 pt-20 sm:pt-24 lg:pt-0 pb-4 lg:py-10">
          <div
            className="relative w-full max-w-sm sm:max-w-md lg:max-w-none"
            style={{ animationDelay: "0.3s" }}
          >
            {/* Dot grid — bottom-left */}
            <div className="absolute -bottom-5 -left-5 z-0 hidden lg:grid grid-cols-6 gap-[7px]">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/22" />
              ))}
            </div>

            {/* Dot grid — top-right */}
            <div className="absolute -top-4 -right-4 z-0 hidden lg:grid grid-cols-5 gap-[7px]">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/16" />
              ))}
            </div>

            {/* Static ambient glow behind frame */}
            <div className="absolute inset-0 rounded-2xl lg:rounded-[2rem] bg-primary/10 blur-2xl pointer-events-none -z-10" />

            {/* Image frame */}
            <div className="group relative h-[260px] sm:h-[340px] lg:h-[520px] xl:h-[560px] rounded-2xl lg:rounded-[2rem] overflow-hidden ring-2 ring-primary/30 shadow-2xl shadow-primary/20">
              <Image
                src="/pool.jpg"
                alt="Kampo Ibayo Resort pool and grounds"
                fill
                priority
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              {/* Bottom vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

              {/* Live status badge — inside image top-left */}
              <div
                className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-card/90 backdrop-blur-md border border-border rounded-full px-3 py-1.5 shadow-lg"
                style={{ animationDelay: "1.4s" }}
              >
                <span className="relative flex w-2 h-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-foreground text-[11px] font-medium tracking-wide">Open for Bookings</span>
              </div>
            </div>

            {/* Corner bracket — top-left */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-tl-xl hidden lg:block" />
            {/* Corner bracket — bottom-right */}
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-br-xl hidden lg:block" />

            {/* Badge — 22 Hrs Private (left-center) */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-5 hidden lg:block z-20">
              <div
                className="animate-fadeInUp"
                style={{ animationDelay: "1.0s" }}
              >
                <div className="hero-badge flex bg-card/95 backdrop-blur-md border border-border rounded-xl px-3 py-3 shadow-xl flex-col items-center gap-0.5">
                  <span className="text-primary font-black text-xl leading-none">22</span>
                  <span className="text-muted-foreground text-[9px] uppercase tracking-wider font-medium leading-tight">Hrs</span>
                  <span className="text-muted-foreground text-[9px] uppercase tracking-wider font-medium leading-tight">Private</span>
                </div>
              </div>
            </div>

            {/* Badge — Resort Rating (bottom-left) */}
            <div className="absolute -bottom-3 left-6 lg:left-4 z-20">
              <div
                className="animate-fadeInUp"
                style={{ animationDelay: "0.9s" }}
              >
                <div className="hero-badge flex bg-card/95 backdrop-blur-md border border-border rounded-xl px-3 py-2 shadow-xl items-center gap-2.5">
                  <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                  </div>
                  <div>
                    <p className="text-foreground font-bold text-sm leading-none">4.2</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">Resort Rating</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge — Location (top-right) */}
            <div className="absolute -top-3 right-0 z-20">
              <div
                className="animate-fadeInUp"
                style={{ animationDelay: "0.9s" }}
              >
                <div className="hero-badge flex bg-primary rounded-xl px-3 py-2 shadow-xl items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-primary-foreground flex-shrink-0" />
                  <span className="text-primary-foreground font-semibold text-xs whitespace-nowrap">Cavite, PH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div
        className="relative z-20 px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6 pt-2"
        style={{ animationDelay: "1.1s" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="backdrop-blur-md bg-card/80 border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 divide-x divide-border">
              {statsBar.map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center py-3.5 sm:py-4 px-2 sm:px-4 gap-1"
                >
                  <div className="text-primary/70 hidden sm:block">{stat.icon}</div>
                  <span className="text-muted-foreground text-[8px] xs:text-[9px] sm:text-[10px] uppercase tracking-widest font-medium text-center leading-tight">
                    {stat.label}
                  </span>
                  <span className="text-foreground font-bold text-xs xs:text-sm sm:text-base leading-none">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
