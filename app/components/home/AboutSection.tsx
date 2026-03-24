"use client";

import Image from "next/image";
import { useRef } from "react";
import { useInView } from "framer-motion";
import {
  Leaf,
  Mountain,
  Star,
  Shield,
  Users,
  Award,
} from "lucide-react";
import { INCLUDED_GUESTS } from "../../lib/constants/pricing";

interface AboutSectionProps {
  liveRating: number | null;
  ratingCount: number;
  ratingLoading: boolean;
}

const featureCards = [
  {
    icon: <Leaf className="w-4 h-4 xs:w-5 xs:h-5 text-success" />,
    bg: "bg-success/20",
    border: "hover:border-success/50",
    title: "Eco-Friendly",
    sub: "Sustainable practices",
  },
  {
    icon: <Mountain className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />,
    bg: "bg-primary/20",
    border: "hover:border-primary/50",
    title: "Scenic Views",
    sub: "Nature's panorama",
  },
  {
    icon: <Users className="w-4 h-4 xs:w-5 xs:h-5 text-warning" />,
    bg: "bg-warning/20",
    border: "hover:border-warning/50",
    title: "Family-Friendly",
    sub: "Perfect for all ages",
  },
  {
    icon: <Award className="w-4 h-4 xs:w-5 xs:h-5 text-warning" />,
    bg: "bg-warning/20",
    border: "hover:border-warning/50",
    title: "Premium Quality",
    sub: "Exceptional service",
  },
];

const AboutSection = ({
  liveRating,
  ratingCount,
  ratingLoading,
}: AboutSectionProps) => {
  const headerRef = useRef(null);
  const imageRef = useRef(null);
  const textRef = useRef(null);
  const cardsRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });
  const imageInView = useInView(imageRef, { once: true, margin: "-80px" });
  const textInView = useInView(textRef, { once: true, margin: "-80px" });
  const cardsInView = useInView(cardsRef, { once: true, margin: "-60px" });

  return (
    <section
      id="about"
      className="bg-card text-foreground py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center mb-6 sm:mb-8 lg:mb-10 transition-all duration-700 ease-out ${headerInView ? "opacity-100" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
            About <span className="text-primary">Kampo Ibayo</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Where comfort meets adventure in the heart of Cavite&apos;s
            natural beauty
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Image */}
          <div
            ref={imageRef}
            className={`order-2 lg:order-1 transition-all duration-700 ease-out ${imageInView ? "opacity-100" : "opacity-0 -translate-x-10"}`}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="relative overflow-hidden rounded-xl shadow-2xl">
              <Image
                src="/pool.jpg"
                alt="Resort Pool and Nature View"
                width={600}
                height={400}
                className="w-full h-48 xs:h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              <div className="absolute top-4 left-4 bg-success/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Safe &amp; Secure
              </div>

              {ratingLoading ? (
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-foreground px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span className="w-16 h-4 bg-muted rounded animate-pulse inline-block"></span>
                </div>
              ) : liveRating !== null && ratingCount > 0 ? (
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-foreground px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span>{liveRating} Guest Rating</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Text content */}
          <div
            ref={textRef}
            className={`order-1 lg:order-2 space-y-6 transition-all duration-700 ease-out ${textInView ? "opacity-100" : "opacity-0 translate-x-10"}`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="space-y-4">
              <p className="text-muted-foreground text-lg leading-relaxed">
                Located in the peaceful farmlands of Barangay Tapia, General
                Trias, Cavite,
                <span className="text-foreground font-medium">
                  {" "}Kampo Ibayo
                </span>{" "}
                is a family-friendly camping resort that accommodates up to
                {INCLUDED_GUESTS} guests in modern comfort.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Featuring two air-conditioned poolside family rooms, a
                refreshing swimming pool, and complete amenities including a
                fully-equipped kitchen, videoke, and adventure hanging bridge,
                we offer the perfect blend of{" "}
                <span className="text-primary font-medium">
                  relaxation and adventure
                </span>
                .
              </p>
            </div>

            <div ref={cardsRef} className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 pt-4">
              {featureCards.map((card, i) => (
                <div
                  key={card.title}
                  className={`flex flex-col xs:flex-row items-center xs:items-start gap-2 xs:gap-3 p-2 xs:p-3 bg-muted/50 rounded-lg border border-border ${card.border} transition-all duration-500 ease-out text-center xs:text-left ${cardsInView ? "opacity-100" : "opacity-0 translate-y-5"}`}
                  style={{ transitionDelay: cardsInView ? `${300 + i * 80}ms` : "0ms" }}
                >
                  <div className={`w-8 h-8 xs:w-10 xs:h-10 ${card.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-foreground font-medium text-xs xs:text-sm sm:text-base">
                      {card.title}
                    </h4>
                    <p className="text-muted-foreground text-[10px] xs:text-xs sm:text-sm hidden xs:block">
                      {card.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
