"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useInView } from "../../hooks/useInView";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  CreditCard,
  Facebook,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { RESORT_PHONE, RESORT_EMAIL, RESORT_FACEBOOK_URL } from "../../lib/constants/business";
import { CHECK_IN_TIME, CHECK_OUT_TIME } from "../../lib/constants/booking";
import type { User } from "@supabase/supabase-js";

const ResortMap = dynamic(() => import("./ResortMap"), { ssr: false });

interface ContactSectionProps {
  user: User | null;
  isLoadingAuth: boolean;
}

const ContactSection = ({ user, isLoadingAuth }: ContactSectionProps) => {
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });
  const contentInView = useInView(contentRef, { once: true, margin: "-60px" });

  return (
    <>
      {/* Contact Section */}
      <section
        id="contact"
        className="bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div
            ref={headerRef}
            className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ease-out ${headerInView ? "opacity-100" : "opacity-0 translate-y-8"}`}
          >
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Contact Us
            </h2>
            <p className="text-muted-foreground text-sm xs:text-base sm:text-lg max-w-2xl mx-auto">
              Get in touch to book your stay or ask any questions about our
              resort
            </p>
          </div>
          <div
            ref={contentRef}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 transition-all duration-700 ease-out ${contentInView ? "opacity-100" : "opacity-0 translate-y-8"}`}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="order-2 lg:order-1">
              <div className="relative isolate overflow-hidden rounded-xl shadow-2xl h-64 sm:h-80 lg:h-96 xl:h-[500px]">
                <ResortMap />
              </div>

              {/* Enhanced Important Booking Terms */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl overflow-hidden mt-6">
                <div className="px-3 sm:px-4 py-2 border-b border-primary/20">
                  <h4 className="text-primary font-semibold text-xs xs:text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="truncate">Important Booking Terms</span>
                    <span className="ml-auto bg-primary/20 text-primary text-[10px] xs:text-xs px-1.5 xs:px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                      Required
                    </span>
                  </h4>
                </div>
                <div className="p-3">
                  <div className="space-y-2 text-xs xs:text-sm">
                    <div className="flex items-center gap-2 hover:bg-primary/5 px-2 py-1 rounded-md transition-colors duration-150 group">
                      <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                        <span className="text-primary text-xs font-bold">
                          1
                        </span>
                      </div>
                      <span className="text-foreground/80 group-hover:text-foreground transition-colors font-medium">
                        50% downpayment required to secure booking
                      </span>
                    </div>
                    <div className="flex items-center gap-2 hover:bg-primary/5 px-2 py-1 rounded-md transition-colors duration-150 group">
                      <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                        <span className="text-primary text-xs font-bold">
                          2
                        </span>
                      </div>
                      <span className="text-foreground/80 group-hover:text-foreground transition-colors font-medium">
                        No same-day cancellations allowed
                      </span>
                    </div>
                    <div className="flex items-center gap-2 hover:bg-primary/5 px-2 py-1 rounded-md transition-colors duration-150 group">
                      <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                        <span className="text-primary text-xs font-bold">
                          3
                        </span>
                      </div>
                      <span className="text-foreground/80 group-hover:text-foreground transition-colors font-medium">
                        Remaining balance due at check-in
                      </span>
                    </div>
                    <div className="flex items-center gap-2 hover:bg-primary/5 px-2 py-1 rounded-md transition-colors duration-150 group">
                      <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                        <span className="text-primary text-xs font-bold">
                          4
                        </span>
                      </div>
                      <span className="text-foreground/80 group-hover:text-foreground transition-colors font-medium">
                        48-hour advance notice required for changes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6 sm:space-y-8">
              <div className="bg-card p-4 sm:p-6 rounded-xl border border-border">
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  Location
                </h3>
                <p className="text-muted-foreground text-sm xs:text-base sm:text-lg leading-relaxed">
                  132 Ibayo Brgy Tapia 4107 General Trias, Philippines
                </p>
              </div>

              <div className="bg-card p-4 sm:p-6 rounded-xl border border-border">
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  Contact Details
                </h3>
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3 text-sm xs:text-base sm:text-lg min-h-[44px] px-2 -mx-2 text-muted-foreground">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    {RESORT_PHONE}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-sm xs:text-base sm:text-lg min-h-[44px] px-2 -mx-2 text-muted-foreground">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    {RESORT_EMAIL}
                  </div>
                  <a
                    href={RESORT_FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 sm:gap-3 text-sm xs:text-base sm:text-lg hover:text-primary transition-colors group min-h-[44px] touch-manipulation rounded-lg hover:bg-muted/50 px-2 -mx-2 text-muted-foreground"
                  >
                    <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                    Kampo Ibayo (Facebook)
                  </a>
                </div>
              </div>

              <div className="bg-card p-4 sm:p-6 rounded-xl border border-border">
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  Operating Hours
                </h3>
                <div className="space-y-2 sm:space-y-3 text-muted-foreground">
                  <div className="flex items-center justify-between min-h-[40px] text-sm xs:text-base sm:text-lg">
                    <span>Daily Operations</span>
                    <span className="text-green-500 font-semibold text-right">
                      8:00 AM - 8:00 PM
                    </span>
                  </div>
                  <div className="flex items-center justify-between min-h-[40px] text-sm xs:text-base sm:text-lg">
                    <span>Check-in</span>
                    <span className="text-primary font-semibold">
                      {CHECK_IN_TIME}
                    </span>
                  </div>
                  <div className="flex items-center justify-between min-h-[40px] text-sm xs:text-base sm:text-lg">
                    <span>Check-out</span>
                    <span className="text-orange-400 font-semibold">
                      {CHECK_OUT_TIME}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href={RESORT_FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-4 sm:mt-6 px-4 sm:px-6 py-3 sm:py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 sm:gap-3 text-sm xs:text-base sm:text-lg shadow-lg hover:shadow-xl touch-manipulation min-h-[48px]"
              >
                <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                Message us on Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Booking Site Footer */}
      <footer className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xl lg:text-2xl font-bold text-primary">
                    Kampo
                  </span>
                  <span className="text-xl lg:text-2xl font-bold text-foreground">
                    Ibayo
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm lg:text-base text-center lg:text-left max-w-md mx-auto lg:mx-0 mb-6 lg:mb-0">
                Your premier eco-friendly camping resort in General Trias,
                Cavite. Experience nature&apos;s tranquility with modern
                comfort.
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-3 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
                <div className="text-center sm:text-left">
                  <h4 className="text-foreground font-semibold mb-2 sm:mb-4 text-[10px] xs:text-xs sm:text-sm uppercase tracking-wide">
                    Resort
                  </h4>
                  <ul className="space-y-1 sm:space-y-2">
                    <li>
                      <a
                        href="#about"
                        className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                      >
                        About
                      </a>
                    </li>
                    <li>
                      <a
                        href="#amenities"
                        className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                      >
                        Amenities
                      </a>
                    </li>
                    <li>
                      <a
                        href="#gallery"
                        className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                      >
                        Gallery
                      </a>
                    </li>
                    <li>
                      <a
                        href="#reviews"
                        className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                      >
                        Reviews
                      </a>
                    </li>
                    <li>
                      <a
                        href="#contact"
                        className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                      >
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="text-center sm:text-left">
                  {user && !isLoadingAuth ? (
                    <>
                      <h4 className="text-foreground font-semibold mb-2 sm:mb-4 text-[10px] xs:text-xs sm:text-sm uppercase tracking-wide">
                        Account
                      </h4>
                      <ul className="space-y-1 sm:space-y-2">
                        <li>
                          <a
                            href="/bookings"
                            className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                          >
                            My Bookings
                          </a>
                        </li>
                        <li>
                          <a
                            href="/profile"
                            className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                          >
                            Profile
                          </a>
                        </li>
                        <li>
                          <a
                            href="/settings"
                            className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                          >
                            Settings
                          </a>
                        </li>
                        <li>
                          <a
                            href="/legal"
                            className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                          >
                            Legal
                          </a>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={async () => {
                              try {

                                // Sign out from Supabase
                                await supabase.auth.signOut();

                                // Clear all storage
                                if (typeof window !== "undefined") {
                                  localStorage.clear();
                                  sessionStorage.clear();
                                }

                                // Force page refresh to clear any remaining state
                                window.location.href = "/";
                              } catch (error) {
                                console.error("Logout error:", error);
                                // Still clear storage and redirect even on error
                                if (typeof window !== "undefined") {
                                  localStorage.clear();
                                  sessionStorage.clear();
                                  window.location.href = "/";
                                }
                              }
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1 text-center sm:text-left w-full"
                          >
                            Logout
                          </button>
                        </li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <h4 className="text-foreground font-semibold mb-2 sm:mb-4 text-[10px] xs:text-xs sm:text-sm uppercase tracking-wide">
                        Get Started
                      </h4>
                      <ul className="space-y-1 sm:space-y-2">
                        <li>
                          <a
                            href="/auth"
                            className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                          >
                            Login / Sign Up
                          </a>
                        </li>
                      </ul>
                    </>
                  )}
                </div>

                <div className="text-center sm:text-left">
                  <h4 className="text-foreground font-semibold mb-2 sm:mb-4 text-[10px] xs:text-xs sm:text-sm uppercase tracking-wide">
                    Policies
                  </h4>
                  <ul className="space-y-1 sm:space-y-2">
                    <li>
                      <a
                        href="/legal/faq"
                        className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                      >
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a
                        href="/legal/terms"
                        className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                      >
                        Terms
                      </a>
                    </li>
                    <li>
                      <a
                        href="/legal/cancellation"
                        className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                      >
                        Cancellation
                      </a>
                    </li>
                    <li>
                      <a
                        href="/legal/house-rules"
                        className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                      >
                        House Rules
                      </a>
                    </li>
                    <li>
                      <a
                        href="/legal/help"
                        className="text-muted-foreground hover:text-foreground transition-colors text-[10px] xs:text-xs sm:text-sm block py-0.5 sm:py-1"
                      >
                        Help
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border pb-safe">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center sm:text-left order-2 sm:order-1">
                <p className="text-muted-foreground text-sm">
                  © 2025 Kampo Ibayo Resort. All rights reserved.
                </p>
                <p className="text-muted-foreground/70 text-xs mt-1">
                  Eco-friendly camping resort in General Trias, Cavite
                </p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 order-1 sm:order-2">
                <span className="text-muted-foreground text-xs hidden sm:block">
                  Follow us:
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href={RESORT_FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Follow Kampo Ibayo on Facebook"
                    aria-label="Follow Kampo Ibayo on Facebook"
                    className="w-9 h-9 sm:w-8 sm:h-8 bg-muted hover:bg-primary rounded-lg flex items-center justify-center transition-all duration-300 group touch-manipulation"
                  >
                    <Facebook className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default ContactSection;
