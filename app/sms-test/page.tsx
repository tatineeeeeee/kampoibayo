"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function SMSTestPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [testType, setTestType] = useState("basic");
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Block access in production — dev/testing tool only
    if (process.env.NODE_ENV === "production") {
      router.push("/admin");
      return;
    }
    if (!authLoading && (!user || userRole !== "admin")) {
      router.push("/auth");
    }
  }, [user, userRole, authLoading, router]);

  // Guard render in production (and during prerender) — redirect handled in effect
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (authLoading || !user || userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const testSMS = async () => {
    if (!phoneNumber) {
      alert("Please enter a phone number");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/sms/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          testType,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Network error: " + error,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sms/send-test");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Network error: " + error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          📱 SMS Test Center
        </h1>

        {/* Configuration Check */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            1. Check SMS Configuration
          </h2>
          <button
            onClick={checkConfig}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "🔄 Checking..." : "🔍 Check Config"}
          </button>
        </div>

        {/* SMS Test */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h2 className="text-lg font-semibold text-green-900 mb-3">
            2. Send Test SMS
          </h2>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (with country code)
            </label>
            <input
              type="tel"
              placeholder="+639123456789"
              value={phoneNumber}
              onChange={(e) => {
                // Clean the phone number input (remove extra + signs)
                const cleaned = e.target.value.replace(/^\++/, "+");
                setPhoneNumber(cleaned);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Type
            </label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="basic">Basic Test</option>
              <option value="booking-confirmation">Booking Confirmation</option>
              <option value="booking-cancellation">Booking Cancellation</option>
              <option value="booking-reminder">Booking Reminder</option>
            </select>
          </div>

          <button
            onClick={testSMS}
            disabled={loading || !phoneNumber}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 mb-2"
          >
            {loading ? "📱 Sending..." : "📱 Send Test SMS"}
          </button>

          <button
            onClick={async () => {
              if (!phoneNumber) {
                alert("Please enter a phone number");
                return;
              }
              setLoading(true);
              try {
                const response = await fetch("/api/sms/booking-cancelled", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    phoneNumber,
                    bookingDetails: {
                      name: "Test Guest",
                      booking_number: "KB-0001",
                      check_in_date: "2024-12-15",
                      check_out_date: "2024-12-16",
                      number_of_guests: 4,
                      refund_status: "processing",
                    },
                    reason: "Test cancellation",
                    cancelledBy: "Admin",
                  }),
                });
                const data = await response.json();
                setResult(data);
              } catch (error) {
                setResult({ success: false, error: "Network error: " + error });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || !phoneNumber}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-2"
          >
            {loading ? "📱 Sending..." : "🚫 Test Cancellation SMS"}
          </button>

          <button
            onClick={async () => {
              if (!phoneNumber) {
                alert("Please enter a phone number");
                return;
              }
              setLoading(true);
              try {
                const response = await fetch("/api/email/booking-rescheduled", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    bookingId: 1,
                    guestName: "Test Guest",
                    guestEmail: "test@example.com",
                    phoneNumber: phoneNumber,
                    originalCheckIn: "December 15, 2024",
                    originalCheckOut: "December 16, 2024",
                    newCheckIn: "December 20, 2024",
                    newCheckOut: "December 21, 2024",
                    totalAmount: 9000,
                    guests: 4,
                  }),
                });
                const data = await response.json();
                setResult(data);
              } catch (error) {
                setResult({ success: false, error: "Network error: " + error });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || !phoneNumber}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "📱 Sending..." : "📅 Test Reschedule SMS"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.success
                ? "bg-green-100 border border-green-300"
                : "bg-red-100 border border-red-300"
            }`}
          >
            <h3
              className={`font-semibold ${
                result.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.success ? "✅ Success!" : "❌ Error"}
            </h3>
            <pre
              className={`mt-2 text-sm ${
                result.success ? "text-green-700" : "text-red-700"
              } overflow-auto`}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            💡 Instructions:
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Make sure your Android phone is online</li>
            <li>• SMS-Gate app should be running</li>
            <li>• Use Philippine format: +639xxxxxxxxx</li>
            <li>• Test with your own number first</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
