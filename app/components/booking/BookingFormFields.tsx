"use client";

import {
  FaUser,
  FaInfoCircle,
  FaPaw,
  FaCheck,
  FaDog,
  FaCat,
} from "react-icons/fa";
import { Rabbit, Bird } from "lucide-react";
import { GiRat } from "react-icons/gi";
import { EXTRA_GUEST_FEE, INCLUDED_GUESTS, MAX_GUESTS } from "../../lib/constants/pricing";

interface BookingFormFieldsProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    guests: string;
    pet: boolean;
    request: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    phone: string;
    guests: string;
    checkIn: Date | null;
    checkOut: Date | null;
    pet: boolean;
    request: string;
  }>>;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
}

export default function BookingFormFields({
  formData,
  setFormData,
  handleChange,
}: BookingFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <FaUser className="w-4 h-4 text-primary flex-shrink-0" />
        <h2 className="text-lg font-bold text-foreground">Guest Details</h2>
      </div>

      {/* Full Name - Read Only */}
      <div>
        <label className="block text-xs font-semibold mb-1 text-muted-foreground">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          readOnly
          className="w-full rounded-xl border px-3 py-2 transition-all duration-200 bg-muted/50 border-border text-muted-foreground cursor-not-allowed placeholder:text-muted-foreground"
          placeholder="Loading from your profile..."
        />
      </div>

      {/* Email + Mobile - Read Only */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-muted-foreground">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            readOnly
            className="w-full rounded-xl border px-3 py-2 transition-all duration-200 bg-muted/50 border-border text-muted-foreground cursor-not-allowed placeholder:text-muted-foreground"
            placeholder="Loading from your profile..."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-muted-foreground">
            Mobile Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            readOnly
            className="w-full rounded-xl border px-3 py-2 transition-all duration-200 bg-muted/50 border-border text-muted-foreground cursor-not-allowed placeholder:text-muted-foreground"
            placeholder="Loading from your profile..."
          />
        </div>
      </div>

      {/* Guests */}
      <div>
        <label className="block text-xs font-semibold mb-1 text-muted-foreground">
          Number of Guests <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
          <FaInfoCircle className="w-3 h-3 text-primary flex-shrink-0" />
          Up to {INCLUDED_GUESTS} guests included · ₱{EXTRA_GUEST_FEE}/night per extra · Max {MAX_GUESTS}
        </p>

        {/* Counter */}
        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-card/50">
          <button
            type="button"
            aria-label="Decrease number of guests"
            onClick={() => {
              const current = parseInt(formData.guests) || 1;
              if (current > 1) {
                setFormData((prev) => ({
                  ...prev,
                  guests: String(current - 1),
                }));
              }
            }}
            className="w-10 h-10 rounded-lg bg-muted hover:bg-secondary text-foreground font-bold text-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={
              !formData.guests || parseInt(formData.guests) <= 1
            }
          >
            −
          </button>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              {formData.guests || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.guests
                ? `guest${parseInt(formData.guests) > 1 ? "s" : ""}`
                : "Select"}
            </div>
          </div>
          <button
            type="button"
            aria-label="Increase number of guests"
            onClick={() => {
              const current = parseInt(formData.guests) || 0;
              if (current < MAX_GUESTS) {
                setFormData((prev) => ({
                  ...prev,
                  guests: String(current + 1),
                }));
              }
            }}
            className="w-10 h-10 rounded-lg bg-muted hover:bg-secondary text-foreground font-bold text-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={
              !!(formData.guests && parseInt(formData.guests) >= MAX_GUESTS)
            }
          >
            +
          </button>
        </div>
      </div>

      {/* Pet Section - Enhanced UI */}
      <div
        className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${
          formData.pet
            ? "bg-success/10 border-success/40"
            : "bg-muted/30 border-border hover:border-muted-foreground/40"
        }`}
      >
        {/* Main Toggle */}
        <label className="flex items-center gap-4 p-4 cursor-pointer">
          <div
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              formData.pet
                ? "bg-success border-success"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            {formData.pet && (
              <FaCheck className="w-3.5 h-3.5 text-white" />
            )}
          </div>
          <input
            type="checkbox"
            name="pet"
            checked={formData.pet}
            onChange={handleChange}
            className="sr-only"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <FaPaw
                className={`w-5 h-5 ${
                  formData.pet ? "text-success" : "text-muted-foreground"
                }`}
              />
              <span
                className={`font-semibold ${
                  formData.pet ? "text-success" : "text-foreground"
                }`}
              >
                I&apos;m bringing a pet
              </span>
            </div>
          </div>
          {/* Pet icons preview */}
          <div className="flex items-center gap-1.5">
            <FaDog className={`w-4 h-4 ${formData.pet ? "text-success" : "text-muted-foreground"}`} />
            <FaCat className={`w-4 h-4 ${formData.pet ? "text-success" : "text-muted-foreground"}`} />
            <Rabbit className={`w-4 h-4 ${formData.pet ? "text-success" : "text-muted-foreground"}`} />
            <GiRat className={`w-4 h-4 ${formData.pet ? "text-success" : "text-muted-foreground"}`} />
            <Bird className={`w-4 h-4 ${formData.pet ? "text-success" : "text-muted-foreground"}`} />
          </div>
        </label>

        {/* Expanded Info - Only shows when pet is checked */}
        {formData.pet && (
          <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Divider */}
            <div className="h-px bg-green-600/30"></div>

            {/* Allowed pets */}
            <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
              <FaInfoCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-success font-medium mb-2">Domestic Pets Welcome</p>
                <div className="flex flex-wrap gap-2">
                  {["Dogs", "Cats", "Rabbits", "Hamsters", "Birds"].map((pet) => (
                    <span key={pet} className="inline-flex items-center px-2 py-1 bg-success/15 rounded-full text-xs text-success">
                      {pet}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pet guidelines */}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {["No additional fees", "Pet-friendly spaces", "Please keep on leash", "Clean up after pet"].map((rule) => (
                <div key={rule} className="flex items-center gap-2">
                  <FaCheck className="w-3 h-3 text-success flex-shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed hint - Only shows when pet is NOT checked */}
        {!formData.pet && (
          <div className="px-4 pb-3 -mt-1">
            <p className="text-xs text-muted-foreground">
              Dogs, cats, and small domestic pets welcome at no extra
              cost
            </p>
          </div>
        )}
      </div>

      {/* Special Request */}
      <div>
        <label className="block text-xs font-semibold mb-1 text-muted-foreground">
          Special Requests
        </label>
        <textarea
          name="request"
          value={formData.request}
          onChange={handleChange}
          rows={3}
          placeholder="Tell us about any special accommodations or requests..."
          className={`w-full rounded-xl border-2 px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 resize-none ${
            formData.request
              ? "bg-green-900/20 border-green-600 focus:border-green-500 focus:ring-green-500/30 text-foreground"
              : "bg-card/50 border-border focus:border-primary focus:ring-primary/30 text-foreground"
          } placeholder:text-muted-foreground`}
        />
      </div>

    </div>
  );
}
