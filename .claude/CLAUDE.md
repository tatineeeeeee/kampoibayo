# Kampo Ibayo Resort — Developer Guide

## Project Overview

Booking and reservation system for Kampo Ibayo Resort (Brgy. Tapia, General Trias, Cavite). Built as a capstone/thesis project.

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · Supabase (Postgres + RLS + Storage) · Vercel

**Key features**: Online booking with calendar availability, manual payment upload + OCR verification, admin booking management, PDF/CSV export, email/SMS notifications, chatbot FAQ, reviews, gallery.

---

## Commands

```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Production build
npm run test     # Vitest unit tests
npx tsc --noEmit # Type check only
```

---

## Folder Structure

```
app/
├── api/                    # 33 Next.js route handlers (server-side)
│   ├── admin/              # Admin-only API routes
│   ├── bookings/           # Booking CRUD + reschedule
│   ├── email/              # Email send endpoints
│   ├── sms/                # SMS send endpoint
│   └── user/               # User management endpoints
│
├── admin/                  # Admin pages (protected by role check)
│   ├── bookings/           # Main admin booking management
│   ├── payments/           # Payment proof review
│   ├── reports/            # Analytics & reports
│   ├── users/              # User management
│   ├── gallery/            # Gallery management
│   ├── reviews/            # Review moderation
│   ├── settings/           # Resort settings (maintenance mode)
│   └── walk-in/            # Walk-in booking creation
│
├── auth/                   # Login / signup / password reset
├── book/                   # Customer booking form
├── bookings/               # Customer "My Bookings" page
├── profile/                # Customer profile
├── settings/               # Customer account settings
├── upload-payment-proof/   # Payment proof upload + OCR
├── legal/                  # Terms, privacy, cancellation policy
│
├── components/
│   ├── admin/
│   │   ├── bookings/       # WorkflowStatus, PaymentStatusCell, BookingDetailModal, etc.
│   │   ├── gallery/        # GalleryGrid, ImageUploader, EditImageModal, etc.
│   │   ├── payments/       # PaymentFilters, PaymentTable, PaymentDetailModal
│   │   ├── reports/        # DailyOperationsReport, BookingsTable, ReportFilters, etc.
│   │   └── users/          # UserFilters, UserTable, UserDetailModal
│   ├── auth/               # LoginForm, SignupForm, ForgotPasswordForm, AuthTestimonials
│   ├── booking/            # BookingFormFields, BookingCalendar, PriceBreakdown, DatePickerStyles
│   ├── bookings/           # SearchParamsHandler, PaymentProofUploadButton, PaymentBreakdown
│   ├── chatbot/            # Chatbot, faqDatabase.ts, greetings.ts, types.ts
│   ├── home/               # Navbar, HeroSection, AboutSection, AmenitiesSection,
│   │                       # ReviewsSection, ContactSection, AvailabilityModal
│   ├── payment/            # OCRResultDisplay, PaymentMethodSelector, PaymentHistoryList,
│   │                       # UploadInstructions, BookingDetailsSummary
│   ├── profile/            # ProfileHeader, StatsCards, BookingHistory
│   ├── settings/           # ProfileSection, PasswordSection, DataExportSection, DeleteAccountSection
│   ├── AdminNotificationBell.tsx
│   ├── ThemeToggle.tsx     # Dark/light mode toggle button
│   └── Toast.tsx
│
├── contexts/
│   └── AuthContext.tsx     # Global auth state (user, userRole, loading)
│
├── hooks/
│   ├── useAdminBookingStats.ts   # Admin dashboard booking counts
│   ├── useBookingStats.ts        # Customer booking stats
│   ├── useModalState.ts          # Generic modal open/close/data state
│   ├── usePagination.ts          # Reusable pagination (paginatedItems, goToFirst/Last/Prev/Next)
│   └── usePriceCalculation.ts    # Price breakdown from dates + guest count
│
├── lib/
│   ├── constants/
│   │   ├── pricing.ts      # BASE_RATE_WEEKDAY, BASE_RATE_WEEKEND, EXTRA_GUEST_FEE,
│   │   │                   # INCLUDED_GUESTS, MAX_GUESTS, PHILIPPINE_HOLIDAYS
│   │   ├── booking.ts      # BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_TYPE,
│   │   │                   # CHECK_IN_TIME, CHECK_OUT_TIME, MAX_PENDING_BOOKINGS, ITEMS_PER_PAGE
│   │   ├── timeouts.ts     # SESSION_TIMEOUT_MS, AUTH_TIMEOUT_MS, LOGOUT_TIMEOUT_MS,
│   │   │                   # REALTIME_TIMEOUT_MS, TOAST_DURATION_MS
│   │   ├── business.ts     # RESORT_NAME, RESORT_ADDRESS, RESORT_PHONE, RESORT_EMAIL,
│   │   │                   # RESORT_FACEBOOK_URL
│   │   ├── ui.ts           # MAX_CHAT_MESSAGES, MAX_CHAT_INPUT_LENGTH, DEBOUNCE_MS
│   │   └── index.ts        # Barrel export
│   │
│   ├── types/
│   │   ├── booking.ts      # Booking, BookingRow, BookingBasic, BookingWithPayment,
│   │   │                   # BookingStatus, PaymentType, PriceBreakdown, BookingStats
│   │   ├── payment.ts      # PaymentProof, PaymentHistoryEntry, PaymentSummary,
│   │   │                   # PaymentValidation, EnhancedOCRResult, OCRProgress
│   │   ├── user.ts         # UserRow, UserRole, AuthenticatedUser, AuthResult, LoyaltyStatus
│   │   ├── review.ts       # GuestReviewRow, ReviewWithPhotos, GalleryImage, MaintenanceSettings
│   │   └── index.ts        # Barrel export
│   │
│   ├── services/           # Supabase query wrappers (client-side only)
│   │   ├── bookingService.ts   # fetchAllBookings, fetchBookingById, fetchUserBookings,
│   │   │                       # createBooking, updateBookingStatus
│   │   ├── paymentService.ts   # fetchPaymentProofs, fetchLatestPaymentProof,
│   │   │                       # updatePaymentProofStatus
│   │   ├── userService.ts      # fetchUserByAuthId, fetchUserRole, fetchAllUsers
│   │   ├── reviewService.ts    # fetchApprovedReviews, fetchAllReviews, updateReviewStatus
│   │   ├── galleryService.ts   # fetchGalleryImages, uploadGalleryImage, deleteGalleryImage
│   │   └── index.ts            # Barrel export
│   │
│   ├── email/
│   │   ├── emailClient.ts      # Nodemailer transporter + sendEmail()
│   │   ├── templates/          # 9 template files (one per notification type)
│   │   └── index.ts
│   │
│   ├── pdf/
│   │   ├── pdfStyles.ts        # Shared @react-pdf StyleSheet
│   │   ├── helpers.ts          # formatDate, formatCurrency, etc.
│   │   ├── BookingsPDF.tsx, UsersPDF.tsx, PaymentsPDF.tsx, ReportsPDF.tsx
│   │   ├── exportFunctions.tsx # downloadBookingsPDF(), downloadReportPDF(), etc.
│   │   └── index.ts
│   │
│   └── utils.ts            # cn() — clsx + tailwind-merge class merger
│
└── utils/                  # Server-side utilities
    ├── bookingUtils.ts     # Auto-cancel logic, status helpers
    ├── serverAuth.ts       # Server-side session validation for API routes
    ├── supabaseAdmin.ts    # Service-role Supabase client (server only)
    ├── rateLimit.ts        # In-memory rate limiter for API routes
    ├── ocrService.ts       # Tesseract.js OCR processing
    ├── smsService.ts       # SMS via external API
    ├── escapeHtml.ts       # XSS prevention
    └── *.test.ts           # Vitest unit tests
```

---

## Constants — Critical Rules

**Never hardcode** prices, times, business info, or limits. Always import from `app/lib/constants/`:

The `@/*` path alias maps to the **project root** (`@/* → ./*`), so constants in `app/lib/constants/` must be imported via `@/app/lib/constants/...` — **not** `@/lib/constants/...`, which resolves to the root `lib/` folder (only `utils.ts` lives there) and breaks the build. Relative imports (e.g. `../../lib/constants/pricing`) also work.

```ts
import { BASE_RATE_WEEKDAY, BASE_RATE_WEEKEND, EXTRA_GUEST_FEE, INCLUDED_GUESTS, MAX_GUESTS } from "@/app/lib/constants/pricing";
import { CHECK_IN_TIME, CHECK_OUT_TIME, BOOKING_STATUS, ITEMS_PER_PAGE } from "@/app/lib/constants/booking";
import { RESORT_NAME, RESORT_PHONE, RESORT_ADDRESS } from "@/app/lib/constants/business";
import { TOAST_DURATION_MS, SESSION_TIMEOUT_MS } from "@/app/lib/constants/timeouts";
```

---

## Design System

### Theme: "Tropical Luxury Dark"

Default dark, toggleable to light. Powered by `next-themes` + Tailwind v4 class-based dark mode.

**Color palette:**
- Primary (teal): `hsl(var(--primary))` → tropical teal `#29b899`
- Accent (amber): `hsl(var(--accent))` → warm amber `#f5a520`
- Dark background: `hsl(var(--background))` → deep navy `#0d1117`
- Light background: warm sand `#f8f6f1`

**Semantic status tokens** (use for booking/payment badges):
| Token | Usage |
|-------|-------|
| `--success` | confirmed / completed bookings |
| `--warning` | pending bookings / payments |
| `--destructive` | cancelled bookings |
| `--info` | active (in-progress) stays |

**Chart tokens**: `--chart-1` through `--chart-5` for Recharts — pass as `hsl(var(--chart-1))`.

### Using tokens in Tailwind

Tailwind v4 `@theme inline` maps CSS vars to utility classes:
```jsx
// These work after the globals.css @theme inline mapping:
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">
<div className="border-border">

// Dark mode — works because @custom-variant dark targets .dark class:
<div className="bg-gray-800 dark:bg-card">
```

### ThemeToggle

Add to any page header or navbar:
```tsx
import { ThemeToggle } from "@/app/components/ThemeToggle";
<ThemeToggle />
```

### cn() utility

Use for conditional class merging — avoids Tailwind class conflicts:
```ts
import { cn } from "@/lib/utils";
cn("base-class", isActive && "active-class", variant === "primary" && "bg-primary")
```

---

## Auth & Roles

- **Roles**: `admin`, `staff`, `user`
- **Client auth**: `useAuth()` from `AuthContext` → `{ user, userRole, loading }`
- **Server auth**: `validateServerSession()` from `app/utils/serverAuth.ts` — call in every API route
- **Database**: Supabase RLS policies enforce row-level access per role

---

## Database

Auto-generated types at `database.types.ts` (project root). Import with:
```ts
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";
type BookingRow = Tables<"bookings">;
```

**Never** write raw SQL or use the service-role client in client-side code. The service-role client (`supabaseAdmin`) is server-only.

---

## API Routes

All 33 routes live in `app/api/`. Every route must:
1. Call `validateServerSession()` at the top
2. Check `userRole` against required access level
3. Use `supabaseAdmin` for DB operations (never the client Supabase instance)

API routes are **not touched** by the service layer — they use their own direct Supabase calls.
