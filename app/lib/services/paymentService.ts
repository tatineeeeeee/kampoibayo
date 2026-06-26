import { supabase } from "../../supabaseClient";
import { TablesInsert, TablesUpdate } from "@/database.types";
import { PAYMENT_STATUS } from "../constants/booking";

/**
 * Payment Service - Wraps all client-side Supabase queries for the payment_proofs table.
 * Queries are unchanged from their original inline usage; only relocated here.
 */
export const paymentService = {
  /** Fetch all payment proofs for a booking */
  async fetchByBookingId(bookingId: number) {
    return supabase
      .from("payment_proofs")
      .select("*")
      .eq("booking_id", bookingId);
  },

  /** Fetch payment proof status for a booking */
  async fetchStatusByBookingId(bookingId: number) {
    return supabase
      .from("payment_proofs")
      .select("status")
      .eq("booking_id", bookingId);
  },

  /** Fetch payment amounts for a booking */
  async fetchAmountsByBookingId(bookingId: number) {
    return supabase
      .from("payment_proofs")
      .select("amount")
      .eq("booking_id", bookingId);
  },

  /** Fetch a single payment proof by ID */
  async fetchById(proofId: number) {
    return supabase
      .from("payment_proofs")
      .select("*")
      .eq("id", proofId);
  },

  /** Fetch pending payment proofs (booking_ids only) */
  async fetchPendingBookingIds() {
    return supabase
      .from("payment_proofs")
      .select("booking_id")
      .eq("status", PAYMENT_STATUS.PENDING);
  },

  /** Fetch payment proofs by multiple booking IDs */
  async fetchByBookingIds(bookingIds: number[]) {
    return supabase
      .from("payment_proofs")
      .select("booking_id")
      .in("booking_id", bookingIds);
  },

  /** Fetch payment history with selected fields */
  async fetchHistoryByBookingId(bookingId: number) {
    return supabase
      .from("payment_proofs")
      .select(
        "id, status, admin_notes, uploaded_at, reference_number, payment_method, amount",
      )
      .eq("booking_id", bookingId);
  },

  /** Create a new payment proof */
  async create(proofData: TablesInsert<"payment_proofs">) {
    return supabase.from("payment_proofs").insert(proofData);
  },

  /** Update a payment proof by ID */
  async updateById(proofId: number, updateData: TablesUpdate<"payment_proofs">) {
    return supabase
      .from("payment_proofs")
      .update(updateData)
      .eq("id", proofId);
  },
};
