"use client";

import Link from "next/link";
import { useRef } from "react";
import { useInView } from "framer-motion";
import {
  MessageCircleHeart,
  ArrowRight,
} from "lucide-react";
import ReviewSystem from "../ReviewSystem";

const ReviewsSection = () => {
  const headerRef = useRef(null);
  const reviewsRef = useRef(null);
  const ctaRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });
  const reviewsInView = useInView(reviewsRef, { once: true, margin: "-60px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-40px" });

  return (
    <section
      id="reviews"
      className="bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div
          ref={headerRef}
          className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ease-out ${headerInView ? "opacity-100" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            What Our Guests Say
          </h2>
        </div>

        <div
          ref={reviewsRef}
          className={`transition-all duration-700 ease-out ${reviewsInView ? "opacity-100" : "opacity-0 translate-y-8"}`}
          style={{ transitionDelay: "100ms" }}
        >
          <ReviewSystem limit={8} showPagination={false} className="" />
        </div>

        <div
          ref={ctaRef}
          className={`text-center mt-10 transition-all duration-500 ease-out ${ctaInView ? "opacity-100" : "opacity-0 translate-y-8"}`}
          style={{ transitionDelay: "150ms" }}
        >
          <Link
            href="/review"
            className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl touch-manipulation"
          >
            <MessageCircleHeart className="w-5 h-5 mr-2" />
            Share Your Experience
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
