"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isMaintenanceMode } from "./utils/maintenanceMode";
import { supabase } from "./supabaseClient";
import { useAuth } from "./contexts/AuthContext";
import DynamicGallery from "./components/DynamicGallery";
import Chatbot from "./components/Chatbot";
import BookingAuthModal from "./components/BookingAuthModal";
import Navbar from "./components/home/Navbar";
import HeroSection from "./components/home/HeroSection";
import AboutSection from "./components/home/AboutSection";
import AmenitiesSection from "./components/home/AmenitiesSection";
import ReviewsSection from "./components/home/ReviewsSection";
import ContactSection from "./components/home/ContactSection";
import AvailabilityModal from "./components/home/AvailabilityModal";
import { RESORT_PHONE, RESORT_PHONE_RAW, RESORT_FACEBOOK_URL } from "./lib/constants/business";
import { MAINTENANCE_CHECK_INTERVAL_MS } from "./lib/constants/timeouts";

// ----------------- Home Page -----------------
function Home() {
  const router = useRouter();
  const { user, loading: isLoadingAuth } = useAuth();
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showBookingAuthModal, setShowBookingAuthModal] = useState(false);

  const [maintenanceActive, setMaintenanceActive] = useState(false);

  // Live rating from guest_reviews
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState(true);


  const handleBookCTA = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!isLoadingAuth && !user) {
      setShowBookingAuthModal(true);
    } else {
      router.push('/book');
    }
  };

  // Fetch live average rating from guest_reviews
  useEffect(() => {
    const fetchLiveRating = async () => {
      try {
        const { data, error } = await supabase
          .from("guest_reviews")
          .select("rating")
          .eq("approved", true);
        if (!error && data && data.length > 0) {
          const avg = data.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / data.length;
          setLiveRating(Math.round(avg * 10) / 10);
          setRatingCount(data.length);
        }
      } catch {
        setLiveRating(null);
      } finally {
        setRatingLoading(false);
      }
    };
    fetchLiveRating();
  }, []);

  // Load maintenance mode settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("maintenanceSettings");
      localStorage.removeItem("maintenance_settings");
    }

    let lastKnownState: boolean = false;

    const checkMaintenanceMode = async () => {
      try {
        const isActive = await isMaintenanceMode();
        if (isActive !== lastKnownState) {
          setMaintenanceActive(isActive);
          lastKnownState = isActive;
        }
      } catch (error) {
        console.error("Error checking maintenance mode:", error);
      }
    };

    checkMaintenanceMode();

    const handleSettingsChange = () => {
      checkMaintenanceMode();
    };

    const interval = setInterval(checkMaintenanceMode, MAINTENANCE_CHECK_INTERVAL_MS);
    window.addEventListener("maintenanceSettingsChanged", handleSettingsChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "maintenanceSettingsChanged",
        handleSettingsChange,
      );
    };
  }, []);

  return (
    <>
      <div>
        <Navbar onBookCTA={handleBookCTA} />

        {/* Simple Maintenance Banner - Resort Style */}
        {maintenanceActive && (
          <div className="bg-orange-600 text-white py-3 px-4 shadow-lg border-b-2 border-orange-500 relative z-50">
            <div className="max-w-7xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">⚠️</span>
                <p className="font-semibold">
                  Kampo Ibayo is temporarily closed for maintenance
                </p>
              </div>
              <p className="text-sm mt-1 text-orange-100">
                For assistance, please call{" "}
                <a
                  href={`tel:${RESORT_PHONE_RAW}`}
                  className="font-bold text-white hover:underline"
                >
                  {RESORT_PHONE}
                </a>{" "}
                or message us on{" "}
                <a
                  href={RESORT_FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white hover:underline"
                >
                  Facebook
                </a>
              </p>
            </div>
          </div>
        )}

        <HeroSection
          maintenanceActive={maintenanceActive}
          onCheckAvailability={() => setShowAvailabilityModal(true)}
          onBookCTA={handleBookCTA}
        />

        <AboutSection
          liveRating={liveRating}
          ratingCount={ratingCount}
          ratingLoading={ratingLoading}
        />

        <AmenitiesSection
          maintenanceActive={maintenanceActive}
          onBookCTA={handleBookCTA}
        />

        {/* Gallery Section */}
        <DynamicGallery />

        <ReviewsSection />

        <ContactSection user={user} isLoadingAuth={isLoadingAuth} />

        <AvailabilityModal
          isOpen={showAvailabilityModal}
          onClose={() => setShowAvailabilityModal(false)}
        />
      </div>

      <Chatbot />

      <BookingAuthModal
        isOpen={showBookingAuthModal}
        onClose={() => setShowBookingAuthModal(false)}
      />
    </>
  );
}

export default Home;
