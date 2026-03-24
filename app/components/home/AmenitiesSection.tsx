"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useInView } from "framer-motion";
import {
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { FaHome, FaGamepad, FaUtensils, FaMapMarkedAlt } from "react-icons/fa";
import { TrustBadges } from "../EnhancedComponents";
import { BASE_RATE_WEEKDAY, BASE_RATE_WEEKEND, INCLUDED_GUESTS } from "../../lib/constants/pricing";

interface AmenitiesSectionProps {
  maintenanceActive: boolean;
  onBookCTA: (e?: React.MouseEvent) => void;
}

const AmenitiesSection = ({
  maintenanceActive,
  onBookCTA,
}: AmenitiesSectionProps) => {
  // Amenities accordion state - null means all closed on mobile
  const [openAmenityIndex, setOpenAmenityIndex] = useState<number | null>(null);

  const headerRef = useRef(null);
  const pricingRef = useRef(null);
  const amenitiesGridRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });
  const pricingInView = useInView(pricingRef, { once: true, margin: "-60px" });
  const amenitiesGridInView = useInView(amenitiesGridRef, { once: true, margin: "-60px" });

  return (
        <section
          id="amenities"
          className="bg-background text-foreground py-6 px-4 sm:py-8 sm:px-6 lg:py-12 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div
              ref={headerRef}
              className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ease-out ${headerInView ? "opacity-100" : "opacity-0 translate-y-8"}`}
            >
              <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                Our Amenities
              </h2>
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg max-w-2xl mx-auto">
                Complete resort facilities for up to {INCLUDED_GUESTS} guests with modern
                comforts in a natural setting
              </p>
            </div>

            {/* Pricing Cards */}
            {/* Mobile: Side-by-side compact comparison */}
            <div className="grid grid-cols-2 gap-3 mb-6 sm:hidden">
              {/* Weekday - Mobile (Featured) */}
              <div className="bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-3 rounded-xl overflow-hidden shadow-lg ring-1 ring-primary/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-primary-foreground">Weekday</h3>
                  <span className="bg-primary-foreground text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    -₱3K
                  </span>
                </div>
                <p className="text-xl font-extrabold text-primary-foreground mb-0.5">
                  {`₱${BASE_RATE_WEEKDAY.toLocaleString()}`}
                </p>
                <p className="text-primary-foreground/60 text-[10px] line-through mb-1">
                  {`₱${BASE_RATE_WEEKEND.toLocaleString()}`}
                </p>
                <p className="text-primary-foreground/75 text-[10px] mb-3">Mon–Thu</p>
                {maintenanceActive ? (
                  <div className="bg-muted/30 text-primary-foreground/50 px-2 py-2 rounded-lg font-medium text-[10px] text-center">
                    Unavailable
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onBookCTA}
                    className="bg-background/20 hover:bg-background/30 text-primary-foreground px-2 py-2 rounded-lg font-semibold text-xs w-full text-center touch-manipulation min-h-[40px] flex items-center justify-center gap-1"
                  >
                    <span>Book</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Weekend Rate - Mobile (Standard) */}
              <div className="bg-card p-3 rounded-xl overflow-hidden shadow-lg shadow-primary/15 border-2 border-primary/40">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-foreground">Weekend</h3>
                  <span className="bg-muted text-muted-foreground text-[8px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    Fri–Sun
                  </span>
                </div>
                <p className="text-xl font-extrabold text-primary mb-0.5">
                  {`₱${BASE_RATE_WEEKEND.toLocaleString()}`}
                </p>
                <p className="text-muted-foreground text-[10px] mb-1">Standard Rate</p>
                <p className="text-muted-foreground text-[10px] mb-3">& Holidays</p>
                {maintenanceActive ? (
                  <div className="bg-muted/50 text-muted-foreground px-2 py-2 rounded-lg font-medium text-[10px] text-center">
                    Unavailable
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onBookCTA}
                    className="bg-primary/10 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-2 py-2 rounded-lg font-semibold text-xs w-full text-center touch-manipulation min-h-[40px] flex items-center justify-center gap-1 transition-all"
                  >
                    <span>Reserve</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Desktop: Full pricing cards */}
            <div
              ref={pricingRef}
              className={`hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10 items-start transition-all duration-700 ease-out ${pricingInView ? "opacity-100" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: "100ms" }}
            >
              {/* Weekday Card — Featured/Hero */}
              <div className="bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-xl shadow-primary/20 ring-1 ring-primary/30 hover:-translate-y-1 transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 right-4 bg-primary-foreground text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  SAVE ₱3K
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-primary-foreground">
                      Weekday Special
                    </h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <p className="text-2xl sm:text-3xl font-extrabold text-primary-foreground">
                        {`₱${BASE_RATE_WEEKDAY.toLocaleString()}`}
                      </p>
                      <span className="text-primary-foreground/60 text-sm line-through">
                        {`₱${BASE_RATE_WEEKEND.toLocaleString()}`}
                      </span>
                    </div>
                    <p className="text-primary-foreground/75 text-sm">
                      {`22 hours stay • Up to ${INCLUDED_GUESTS} guests • Monday to Thursday`}
                    </p>
                  </div>
                  <div className="w-full">
                    {maintenanceActive ? (
                      <div className="bg-muted/30 text-primary-foreground/50 px-6 py-3 rounded-xl font-semibold text-sm cursor-not-allowed opacity-50 w-full text-center">
                        Temporarily Unavailable
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onBookCTA}
                        className="group bg-background/20 backdrop-blur-sm hover:bg-background/30 text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 w-full text-center touch-manipulation min-h-[48px] flex items-center justify-center gap-2 hover:scale-[1.02]"
                      >
                        <span>Book This Deal</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekend Card — Standard */}
              <div className="bg-card p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-xl shadow-primary/15 border-2 border-primary/40 hover:border-primary/60 hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 right-4 bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-full">
                  Fri–Sun & Holidays
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                      Weekend & Holidays
                    </h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                        {`₱${BASE_RATE_WEEKEND.toLocaleString()}`}
                      </p>
                      <span className="text-muted-foreground text-sm">/ 22 hrs</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {`22 hours stay • Up to ${INCLUDED_GUESTS} guests • Friday to Sunday`}
                    </p>
                  </div>
                  <div className="w-full">
                    {maintenanceActive ? (
                      <div className="bg-muted/50 text-muted-foreground px-6 py-3 rounded-xl font-semibold text-sm cursor-not-allowed opacity-50 w-full text-center border border-border">
                        Temporarily Unavailable
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onBookCTA}
                        className="group bg-primary/10 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 w-full text-center touch-manipulation min-h-[48px] flex items-center justify-center gap-2 hover:scale-[1.02]"
                      >
                        <span>Reserve Weekend</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities - Accordion on Mobile, Grid on Desktop */}
            {/* Mobile Accordion View */}
            <div className="sm:hidden space-y-2 mb-6">
              {[
                {
                  icon: <FaHome className="text-primary" />,
                  title: "Accommodation",
                  items: [
                    "2 poolside AC family rooms (8 pax each)",
                    "Private bathrooms with bidet & hot/cold shower",
                    "Camping area with full-sized campfire",
                    "Treehouse with electricity & extra space",
                    "Open shower area near pool with comfort room",
                  ],
                },
                {
                  icon: <FaGamepad className="text-primary" />,
                  title: "Entertainment & Fun",
                  items: [
                    "Swimming pool & poolside lounge",
                    "Videoke & arcade machine",
                    "Board games & gazebo dining area",
                    "Function hall/stage for events",
                    "Adventure hanging bridge access",
                  ],
                },
                {
                  icon: <FaUtensils className="text-primary" />,
                  title: "Kitchen & More",
                  items: [
                    "Fully-equipped kitchen with appliances",
                    "Grill area & complete cooking utensils",
                    "Hot/cold water dispenser (1st gallon FREE)",
                    "8-vehicle parking & WiFi access",
                    "Pet-friendly facility - all furbabies welcome",
                  ],
                },
                {
                  icon: <FaMapMarkedAlt className="text-primary" />,
                  title: "Special Features",
                  items: [
                    "Adventure hanging bridge (safe & secure)",
                    "Nestled in peaceful farmlands",
                    "Caretaker assistance & guided walk",
                    "Easy landmark access (Dali Grocery)",
                    "Exclusive countryside experience",
                  ],
                },
              ].map((amenity, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAmenityIndex(
                        openAmenityIndex === index ? null : index,
                      )
                    }
                    className="w-full flex items-center justify-between p-3 touch-manipulation min-h-[52px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center text-lg">
                        {amenity.icon}
                      </div>
                      <h4 className="text-sm font-bold text-primary">
                        {amenity.title}
                      </h4>
                    </div>
                    <div
                      className={`w-6 h-6 flex items-center justify-center text-muted-foreground transition-transform duration-200 ${
                        openAmenityIndex === index ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openAmenityIndex === index
                        ? "max-h-64 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <ul className="text-muted-foreground text-xs space-y-1.5 px-3 pb-3">
                      {amenity.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop/Tablet Grid View */}
            <div
              ref={amenitiesGridRef}
              className={`hidden sm:grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:mb-8 transition-all duration-700 ease-out ${amenitiesGridInView ? "opacity-100" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: "150ms" }}
            >
              {/* Accommodation */}
              <div className="bg-card p-4 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-xl sm:p-6 sm:rounded-2xl">
                <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform sm:w-12 sm:h-12 sm:rounded-xl sm:text-2xl">
                    <FaHome className="text-primary" />
                  </div>
                  <h4 className="text-base font-bold text-primary sm:text-lg">
                    Accommodation
                  </h4>
                </div>
                <ul className="text-muted-foreground text-xs space-y-1.5 sm:text-sm sm:space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>2 poolside AC family
                    rooms (8 pax each)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Private bathrooms with bidet & hot/cold shower
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Camping area with full-sized campfire
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Treehouse with electricity & extra space
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Open shower area near pool with comfort room
                  </li>
                </ul>
              </div>

              {/* Entertainment & Facilities */}
              <div className="bg-card p-4 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-xl sm:p-6 sm:rounded-2xl">
                <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform sm:w-12 sm:h-12 sm:rounded-xl sm:text-2xl">
                    <FaGamepad className="text-primary" />
                  </div>
                  <h4 className="text-base font-bold text-primary sm:text-lg">
                    Entertainment & Fun
                  </h4>
                </div>
                <ul className="text-muted-foreground text-xs space-y-1.5 sm:text-sm sm:space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Swimming pool & poolside lounge
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Videoke & arcade machine
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Board games & gazebo dining area
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Function hall/stage for events
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Adventure hanging bridge access
                  </li>
                </ul>
              </div>

              {/* Kitchen & Amenities */}
              <div className="bg-card p-4 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-xl sm:p-6 sm:rounded-2xl">
                <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform sm:w-12 sm:h-12 sm:rounded-xl sm:text-2xl">
                    <FaUtensils className="text-primary" />
                  </div>
                  <h4 className="text-base font-bold text-primary sm:text-lg">
                    Kitchen & More
                  </h4>
                </div>
                <ul className="text-muted-foreground text-xs space-y-1.5 sm:text-sm sm:space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Fully-equipped kitchen with appliances
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Grill area & complete cooking utensils
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Hot/cold water dispenser (1st gallon FREE)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    8-vehicle parking & WiFi access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Pet-friendly facility - all furbabies welcome
                  </li>
                </ul>
              </div>

              {/* Special Location Features */}
              <div className="bg-card p-4 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-xl sm:p-6 sm:rounded-2xl">
                <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform sm:w-12 sm:h-12 sm:rounded-xl sm:text-2xl">
                    <FaMapMarkedAlt className="text-primary" />
                  </div>
                  <h4 className="text-base font-bold text-primary sm:text-lg">
                    Special Features
                  </h4>
                </div>
                <ul className="text-muted-foreground text-xs space-y-1.5 sm:text-sm sm:space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Adventure hanging bridge (safe & secure)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Nestled in peaceful farmlands
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Caretaker assistance & guided walk
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Easy landmark access (Dali Grocery)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Exclusive countryside experience
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Note */}
            <div className="bg-primary/10 border border-primary/30 p-3 rounded-xl mb-6 sm:p-4 sm:mb-8">
              <p className="text-foreground text-xs text-center sm:text-sm">
                <span className="text-primary font-semibold">
                  All-inclusive experience
                </span>{" "}
                • No hidden fees • Pet-friendly •
                <span className="text-primary font-semibold"> Bring:</span> Food,
                drinks & personal items
              </p>
            </div>

            {/* Trust Badges inside Amenities */}
            <TrustBadges />
          </div>
        </section>
  );
};

export default AmenitiesSection;
