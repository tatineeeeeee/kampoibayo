import { supabase } from "../../supabaseClient";
import { TablesInsert, TablesUpdate } from "@/database.types";
import { BOOKING_STATUS, PAYMENT_STATUS } from "../constants/booking";

/**
 * Booking Service - Wraps all client-side Supabase queries for the bookings table.
 * Queries are unchanged from their original inline usage; only relocated here.
 */
export const bookingService = {
  /** Fetch all bookings ordered by creation date (admin) */
  async fetchAll() {
    return supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
  },

  /** Fetch a single booking by ID */
  async fetchById(id: number) {
    return supabase.from("bookings").select("*").eq("id", id).single();
  },

  /** Fetch all bookings for a specific user */
  async fetchByUserId(userId: string) {
    return supabase.from("bookings").select("*").eq("user_id", userId);
  },

  /** Fetch booking dates for availability calendar (confirmed + pending) */
  async fetchBookedDates() {
    return supabase
      .from("bookings")
      .select("check_in_date, check_out_date, status")
      .in("status", [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING]);
  },

  /** Fetch booked dates with a limit (for book page) */
  async fetchBookedDatesWithLimit(limit: number = 100) {
    return supabase
      .from("bookings")
      .select("id, check_in_date, check_out_date, status")
      .in("status", [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING])
      .limit(limit);
  },

  /** Fetch booking statuses and amounts for admin dashboard */
  async fetchForDashboard() {
    return supabase
      .from("bookings")
      .select(
        "status, total_amount, created_at, check_in_date, special_requests",
      );
  },

  /** Fetch booking stats for a user (status + created_at) */
  async fetchUserBookingStats(userId: string) {
    return supabase
      .from("bookings")
      .select("status, created_at")
      .eq("user_id", userId);
  },

  /** Fetch bookings by user with limited fields (for settings/profile) */
  async fetchByUserIdWithFields(
    userId: string,
    fields: string = "id, status, check_in_date, check_out_date",
  ) {
    return supabase
      .from("bookings")
      .select(fields)
      .eq("user_id", userId);
  },

  /** Fetch pending bookings (for expiration checking) */
  async fetchPending() {
    return supabase
      .from("bookings")
      .select("id, guest_name, guest_email, created_at, status")
      .eq("status", BOOKING_STATUS.PENDING);
  },

  /** Fetch cancelled bookings (for admin notifications) */
  async fetchCancelled() {
    return supabase
      .from("bookings")
      .select("id, guest_name, check_in_date, updated_at")
      .eq("status", BOOKING_STATUS.CANCELLED);
  },

  /** Fetch pending bookings for notification count */
  async fetchPendingIds() {
    return supabase
      .from("bookings")
      .select("id")
      .eq("status", BOOKING_STATUS.PENDING);
  },

  /** Fetch cancelled bookings for notification count */
  async fetchCancelledIds() {
    return supabase
      .from("bookings")
      .select("id")
      .eq("status", BOOKING_STATUS.CANCELLED);
  },

  /** Fetch bookings with payment review status */
  async fetchPaymentReview() {
    return supabase
      .from("bookings")
      .select("id, guest_name, updated_at")
      .eq("payment_status", PAYMENT_STATUS.PAYMENT_REVIEW);
  },

  /** Fetch bookings with failed payment */
  async fetchPaymentFailed() {
    return supabase
      .from("bookings")
      .select("id, guest_name, updated_at")
      .eq("payment_status", "failed");
  },

  /** Fetch bookings needing payment (confirmed or pending with payment info) */
  async fetchNeedingPayment() {
    return supabase
      .from("bookings")
      .select(
        "id, guest_name, total_amount, payment_status, payment_type, updated_at",
      )
      .in("status", [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING]);
  },

  /** Create a new booking */
  async create(bookingData: TablesInsert<"bookings">) {
    return supabase.from("bookings").insert([bookingData]).select().single();
  },

  /** Update a booking by ID */
  async updateById(id: number, updateData: TablesUpdate<"bookings">) {
    return supabase.from("bookings").update(updateData).eq("id", id);
  },

  /** Update bookings by user ID (for bulk operations like cancellation) */
  async updateByUserId(userId: string, updateData: TablesUpdate<"bookings">) {
    return supabase.from("bookings").update(updateData).eq("user_id", userId);
  },

  /** Check if bookings table is accessible */
  async checkConnection() {
    return supabase.from("bookings").select("*").limit(1);
  },
};
