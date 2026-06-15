<div align="center">

<img src="public/logo.png" alt="Kampo Ibayo Resort" width="120" height="120" />

# Kampo Ibayo Resort

### Online Booking & Resort Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue)](package.json)

**A production-grade full-stack booking & resort management platform** — replacing manual WhatsApp/phone reservations with a complete digital experience for guests and administrators.

[🌐 Live Demo](https://kampo-ibayo.vercel.app) · [📹 Demo Video](#demo) · [📖 Documentation](docs/) · [🐛 Report Bug](https://github.com/tatineeeeeee/kampo-ibayo-UI-/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Demo](#demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Team](#team)
- [License](#license)

---

## Overview

Kampo Ibayo Resort is an eco-friendly camping resort in **Brgy. Tapia, General Trias, Cavite, Philippines**. This system was built as a capstone thesis at **Cavite State University** and is deployed in production to handle real guest bookings.

### The Problem It Solves

| Before | After |
|--------|-------|
| Manual WhatsApp & phone-call reservations | Online booking with real-time calendar availability |
| Paper receipt and spreadsheet tracking | Automated PDF receipts and database-backed records |
| No payment visibility | Dual-mode payments: PayMongo (GCash/cards) + bank transfer with OCR verification |
| Manual email/SMS typing | Automated multi-channel notifications (8 email templates + SMS reminders) |
| Zero analytics | Interactive dashboard with charts, KPIs, and PDF/CSV report exports |
| No review system | Moderated 5-category review platform with photo uploads |

---

## Demo

### 🎬 Video Walkthrough

> **Add your screen recording here.** Upload an `.mp4` to this repo or paste a YouTube link.
>
> See [`docs/screenshots/CAPTURE_GUIDE.md`](docs/screenshots/CAPTURE_GUIDE.md) for a step-by-step guide on what to record.

<!-- Uncomment and update once you have a video:
[![Watch the Demo](docs/screenshots/demo-thumbnail.png)](https://youtu.be/YOUR_VIDEO_ID)
-->

### Resort Preview

| | | |
|:---:|:---:|:---:|
| ![Gallery 1](public/gallery1.jpg) | ![Gallery 2](public/gallery2.jpg) | ![Gallery 3](public/gallery3.jpg) |
| ![Gallery 4](public/gallery4.jpg) | ![Pool](public/pool.jpg) | ![Gallery 6](public/gallery6.jpg) |

---

## Screenshots

> Screenshots of the live application. See [`docs/screenshots/CAPTURE_GUIDE.md`](docs/screenshots/CAPTURE_GUIDE.md) for the full list of pages to capture.

<details>
<summary><b>🏠 Public Pages — Home, Booking, Gallery, Reviews</b></summary>
<br>

| Home — Hero Section | Booking Calendar |
|:---:|:---:|
| ![Home Hero](docs/screenshots/01-home-hero.png) | ![Booking Calendar](docs/screenshots/02-booking-calendar.png) |

| Price Breakdown | Payment Selection |
|:---:|:---:|
| ![Price Breakdown](docs/screenshots/03-price-breakdown.png) | ![Payment](docs/screenshots/04-payment-selection.png) |

| Gallery Page | Reviews Section |
|:---:|:---:|
| ![Gallery](docs/screenshots/05-gallery.png) | ![Reviews](docs/screenshots/06-reviews.png) |

| My Bookings | Chatbot |
|:---:|:---:|
| ![My Bookings](docs/screenshots/07-my-bookings.png) | ![Chatbot](docs/screenshots/08-chatbot.png) |

</details>

<details>
<summary><b>🔐 Admin Dashboard — Bookings, Payments, Reports, Users</b></summary>
<br>

| Dashboard Overview | Booking Management |
|:---:|:---:|
| ![Admin Dashboard](docs/screenshots/09-admin-dashboard.png) | ![Admin Bookings](docs/screenshots/10-admin-bookings.png) |

| Payment Verification + OCR | Financial Reports |
|:---:|:---:|
| ![Admin Payments](docs/screenshots/11-admin-payments.png) | ![Admin Reports](docs/screenshots/12-admin-reports.png) |

| User Management | Gallery Management |
|:---:|:---:|
| ![Admin Users](docs/screenshots/13-admin-users.png) | ![Admin Gallery](docs/screenshots/14-admin-gallery.png) |

| Review Moderation | Walk-in Booking |
|:---:|:---:|
| ![Admin Reviews](docs/screenshots/15-admin-reviews.png) | ![Walk-in](docs/screenshots/16-admin-walkin.png) |

</details>

<details>
<summary><b>📱 Mobile Responsive</b></summary>
<br>

| Home (Mobile) | Booking (Mobile) | Admin (Mobile) |
|:---:|:---:|:---:|
| ![Mobile Home](docs/screenshots/17-mobile-home.png) | ![Mobile Booking](docs/screenshots/18-mobile-booking.png) | ![Mobile Admin](docs/screenshots/19-mobile-admin.png) |

</details>

<details>
<summary><b>🌙 Dark / Light Mode</b></summary>
<br>

| Dark Mode | Light Mode |
|:---:|:---:|
| ![Dark Mode](docs/screenshots/20-dark-mode.png) | ![Light Mode](docs/screenshots/21-light-mode.png) |

</details>

---

## Features

### 🗓️ Real-Time Booking System

- **Availability calendar** — visual date picker with live-blocked dates and instant conflict detection
- **Dynamic pricing engine** — weekday ₱9,000 / weekend & holiday ₱12,000 / peak season surcharge / extra guest fee ₱300 per person beyond the included 15 guests (max 25)
- **Booking lifecycle** — `pending` → `confirmed` → `completed` → `cancelled` with full audit trail
- **Rescheduling** — guests can reschedule up to 3 times; admins have unlimited reschedules
- **Walk-in bookings** — admins create offline reservations for on-site guests
- **Auto-cancellation** — cron job expires and cancels stale pending bookings nightly
- **Max 3 pending bookings** per guest to prevent slot hoarding

### 💳 Payment Processing

- **PayMongo** — GCash, Maya, credit/debit cards via secure hosted checkout
- **Bank transfer** — manual payment proof upload with OCR auto-extraction
- **Half payment option** — pay 50% to confirm, settle balance on check-in
- **Full payment history** — itemized transaction log per booking
- **Refund tracking** — partial and full refund state management

### 🔍 OCR Payment Verification

- **Tesseract.js** — client-side OCR reads reference numbers and amounts directly from payment screenshots (no server upload required for extraction)
- **Smart preprocessing** — auto-contrast, noise reduction, and threshold tuning for GCash/Maya receipts
- **Multi-source detection** — GCash, Maya, BDO, Metrobank, and other Philippine bank formats
- **Admin manual review** — side-by-side proof viewer as fallback when OCR confidence is low

### 📊 Admin Dashboard

- **KPI cards** — live revenue totals, booking counts, occupancy rate, pending action queue
- **Interactive charts** — booking trends, revenue breakdown, occupancy heatmap (Recharts)
- **Booking management** — confirm, cancel, reschedule, annotate, and view full payment history per booking
- **Payment review panel** — approve or reject bank transfer proofs with zoomable image viewer
- **Report generation** — PDF and CSV export for any custom date range
- **Maintenance mode** — instantly disable all new bookings with a custom guest-facing message

### 📧 Multi-Channel Notifications

- **8 email templates** (Nodemailer / Gmail SMTP):
  - Booking confirmation & cancellation
  - Reschedule notification
  - Payment receipt
  - Review approved / rejected
  - Admin alert for new bookings
- **SMS reminders** (SMS-Gate.app) — automated check-in reminders 24 h and 3 h before arrival via Vercel cron
- **In-app toasts** — real-time feedback for every user action

### ⭐ Review System

- **5-category ratings** — Cleanliness · Service · Location · Value · Amenities
- **Photo uploads** — guests attach resort photos with captions
- **Moderation workflow** — admin approve/reject with reason; guest can resubmit after rejection
- **Anonymous option** — post a review without showing your name

### 🤖 AI Chatbot

- **200+ curated FAQ responses** covering bookings, pricing, amenities, check-in/out, cancellation policy
- **Keyword + fuzzy matching** — handles natural language variations
- **Stateful conversation** — context retained within the session

### 🔐 Security

- **Row-Level Security** — Supabase RLS enforces data access per role (`admin` / `staff` / `user`) at the database layer
- **Server-side session validation** — `validateServerSession()` called at the top of every API route
- **Rate limiting** — in-memory rate limiter on all 35 API routes
- **Content Security Policy** — strict CSP headers applied globally via `next.config.ts`
- **XSS prevention** — `escapeHtml()` utility applied to all user-generated content before storage
- **Input sanitization** — server-side validation on every form submission

### 📱 UX & Accessibility

- **Dark / light mode** — system preference detected automatically, manual toggle available
- **Fully responsive** — mobile-first Tailwind CSS 4.0, tested across breakpoints
- **PDF receipts** — downloadable booking confirmations with QR code via React PDF
- **QR codes** — booking reference QR for fast check-in validation
- **Vercel Analytics & Speed Insights** — real-time performance monitoring in production

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Next.js](https://nextjs.org/) | 16.0.7 | App Router, SSR, API Routes, Turbopack |
| [React](https://react.dev/) | 19.1.0 | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | 5 | End-to-end type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4.0 | Utility-first styling with CSS variables |
| [next-themes](https://github.com/pacocoursey/next-themes) | 0.4.6 | Dark / light mode |
| [Recharts](https://recharts.org/) | 3.3.0 | Admin charts and analytics |
| [React Day Picker](https://daypicker.dev/) | 9.7.0 | Interactive booking calendar |
| [React Leaflet](https://react-leaflet.js.org/) | 5.0.0 | Resort location map (OpenStreetMap) |
| [Lucide React](https://lucide.dev/) | 0.543.0 | Icon system |
| [date-fns](https://date-fns.org/) | 4.1.0 | Date arithmetic and formatting |

### Backend & Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Supabase](https://supabase.com/) | 2.57.4 | PostgreSQL database, Auth, Storage |
| [Supabase SSR](https://supabase.com/docs/guides/auth/server-side) | 0.5.0 | Cookie-based server-side auth |
| Next.js API Routes | — | 35 typed REST endpoints |

### Integrations & Services

| Service | Library | Purpose |
|---------|---------|---------|
| [PayMongo](https://paymongo.com/) | REST API | GCash, Maya, card payments |
| [Nodemailer](https://nodemailer.com/) | 7.0.11 | Transactional email via Gmail SMTP |
| [SMS-Gate.app](https://sms-gate.app/) | REST API | SMS check-in and cancellation reminders |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | 6.0.1 | Client-side OCR for payment proof verification |
| [@react-pdf/renderer](https://react-pdf.org/) | 4.3.1 | PDF booking receipts and reports |
| [jsPDF](https://github.com/parallax/jsPDF) | 3.0.4 | Supplemental PDF generation |
| [qrcode](https://github.com/soldair/node-qrcode) | 1.5.4 | QR codes on booking receipts |

### DevOps

| Tool | Purpose |
|------|---------|
| [Vercel](https://vercel.com/) | Hosting, CI/CD, and cron job scheduling |
| [Vercel Analytics](https://vercel.com/analytics) | Real-time visitor analytics |
| [Vercel Speed Insights](https://vercel.com/docs/speed-insights) | Core Web Vitals monitoring |
| [Vitest](https://vitest.dev/) | Unit testing |
| [ESLint](https://eslint.org/) | Static code analysis |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE NETWORK                         │
├─────────────────────────────┬───────────────────────────────────────┤
│       Next.js App Router    │          API Routes (35)               │
│                             │                                        │
│  Public            Admin    │  /api/bookings/    /api/admin/         │
│  ├ /               ├ /admin │  /api/user/        /api/email/         │
│  ├ /gallery        ├ /admin/│  /api/sms/                             │
│  ├ /legal/*        │  books │           │                            │
│                    ├ /admin/│  ┌─────────▼────────────────────────┐  │
│  Auth              │  pays  │  │      Business Logic Layer        │  │
│  ├ /auth           ├ /admin/│  │  validateServerSession()          │  │
│                    │  rpts  │  │  Rate Limiter (in-memory)        │  │
│  Guest             └ /admin/│  │  supabaseAdmin (service role)    │  │
│  ├ /book             users  │  └──────────────────────────────────┘  │
│  ├ /bookings                │                                        │
│  ├ /review                  │                                        │
│  ├ /profile                 │                                        │
│  └ /upload-payment-proof    │                                        │
│                             │                                        │
├─────────────────────────────┴───────────────────────────────────────┤
│                        External Services                             │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  PayMongo   │  │ Nodemailer  │  │  SMS-Gate   │  │ Vercel    │  │
│  │  GCash      │  │ Gmail SMTP  │  │ SMS-Gate.app│  │ Cron Jobs │  │
│  │  Cards/Maya │  │ 8 templates │  │ Reminders   │  │ (daily)   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                           SUPABASE                                   │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │  PostgreSQL    │  │ Supabase Auth  │  │   Storage (Files)      │  │
│  │  7 tables      │  │ JWT + cookies  │  │  Payment proofs        │  │
│  │  Row-Level     │  │ admin/staff/   │  │  Gallery images        │  │
│  │  Security      │  │ user roles     │  │  Review photos         │  │
│  └────────────────┘  └────────────────┘  └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Booking Creation Flow

```
Guest fills /book form
        │
        ▼
validateServerSession() ──► 401 if unauthenticated
        │
        ▼
Server-side price validation (bookingUtils)
        │
        ▼
Conflict check against booking_dates table
        │
        ├─── PayMongo path ──► Hosted checkout ──► Webhook ──► updateBookingStatus
        │                                                              │
        └─── Bank transfer path ──► Upload proof ──► OCR extract ──► Admin review
                                                                       │
                                                         ┌─────────────▼───────────┐
                                                         │  Nodemailer confirmation │
                                                         │  SMS-Gate reminder (D-1) │
                                                         └─────────────────────────┘
```

---

## Database Schema

Seven tables, all secured with Supabase Row-Level Security policies.

```
bookings                      users                    payment_proofs
─────────────────────────     ───────────────────────  ──────────────────────────
id            uuid PK         id            uuid PK    id            uuid PK
user_id       FK → users      email         text        booking_id    FK → bookings
guest_name    text            phone         text        user_id       FK → users
guest_email   text            role          text        proof_image_url text
check_in      date            paymongo_id   text        reference_number text
check_out     date            metadata      jsonb       status        text
number_of_guests int          created_at    timestamptz ocr_result    text
total_amount  numeric                                   verified_at   timestamptz
status        text            booking_dates            verified_by   uuid
payment_status text           ───────────────────────  created_at    timestamptz
payment_type  text            id            uuid PK
reschedule_count int          date          date        gallery_images
refund_amount numeric         booking_id    FK          ──────────────────────────
refund_status text            status        text        id            uuid PK
created_at    timestamptz                              file_name     text
                              guest_reviews            storage_path  text
maintenance_settings          ───────────────────────  category      text
─────────────────────────     id            uuid PK    caption       text
id            uuid PK         booking_id    FK          is_featured   boolean
is_active     boolean         guest_name    text        uploaded_by   uuid
message       text            rating        int (1–5)   created_at    timestamptz
enabled_at    timestamptz     cleanliness_rating int
updated_by    uuid            service_rating     int
                              location_rating    int
                              value_rating       int
                              amenities_rating   int
                              review_text   text
                              status        text
                              anonymous     boolean
                              photos        FK → review_photos
                              created_at    timestamptz
```

---

## Getting Started

### Prerequisites

- **Node.js** 20 or higher
- **npm** 8 or higher
- [Supabase](https://supabase.com/) project (free tier works)
- [PayMongo](https://paymongo.com/) account (for card/GCash payments)
- Gmail account with [App Password](https://support.google.com/accounts/answer/185833) enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tatineeeeeee/kampo-ibayo-UI-.git
cd kampo-ibayo-UI-

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Open .env.local and fill in your credentials (see below)

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack (fast refresh) |
| `npm run build` | Production build with type checking |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests |
| `npx tsc --noEmit` | Type check without building |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in each value:

```env
# ── Application ────────────────────────────────────────────────────
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# ── Supabase (Database + Auth) ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...          # Never expose client-side

# ── Email via Gmail SMTP ─────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx           # Gmail App Password (16 chars)
EMAIL_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@yourdomain.com

# ── SMS via SMS-Gate.app ─────────────────────────────────────────────
SMSGATE_USERNAME=your-username
SMSGATE_PASSWORD=your-password
SMS_ENABLED=true

# ── PayMongo (Payments) ──────────────────────────────────────────────
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...

# ── Security ─────────────────────────────────────────────────────────
INTERNAL_API_SECRET=your-long-random-secret
CRON_SECRET=your-cron-job-secret
```

> See [`docs/INSTALLATION_GUIDE.md`](docs/INSTALLATION_GUIDE.md) for step-by-step instructions on setting up each service, including Supabase RLS policies and PayMongo webhook configuration.

---

## API Reference

35 typed REST endpoints organized by domain. All routes call `validateServerSession()` before any logic runs.

### Booking Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/bookings/create` | User | Create a new booking |
| `GET` | `/api/bookings/auto-complete` | Cron secret | Mark checkout-passed bookings as completed |

### Admin Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/admin/confirm-booking` | Admin | Confirm a pending booking |
| `POST` | `/api/admin/cancel-booking` | Admin | Cancel any booking |
| `POST` | `/api/admin/reschedule-booking` | Admin | Reschedule any booking |
| `POST` | `/api/admin/mark-balance-paid` | Admin | Mark split-payment balance as settled |
| `POST` | `/api/admin/verify-payment-proof` | Admin | Approve or reject a payment proof |
| `GET` | `/api/admin/payments` | Admin | Fetch full payment dashboard data |
| `GET` | `/api/admin/payment-history/[bookingId]` | Admin | Payment history for a booking |
| `GET` | `/api/admin/paymongo-details` | Admin | Fetch PayMongo transaction detail |
| `POST` | `/api/admin/create-user` | Admin | Create a new user account |
| `POST` | `/api/admin/delete-user` | Admin | Delete a user account |
| `POST` | `/api/admin/approve-review` | Admin | Approve a guest review |
| `POST` | `/api/admin/reject-review` | Admin | Reject a guest review with reason |

### User Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/user/cancel-booking` | User | Guest-initiated booking cancellation |
| `POST` | `/api/user/reschedule-booking` | User | Guest-initiated reschedule (max 3×) |
| `GET` | `/api/user/payment-history/[bookingId]` | User | Guest's own payment history |
| `GET` | `/api/user/generate-receipt` | User | Generate a PDF receipt |
| `GET` | `/api/user/download-receipt` | User | Download generated receipt |
| `GET` | `/api/user/export-pdf` | User | Export booking data as PDF |
| `DELETE` | `/api/user/delete-account` | User | Permanently delete own account |

### Notification Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/email/booking-confirmation` | Internal | Send booking confirmation email |
| `POST` | `/api/email/booking-rescheduled` | Internal | Send reschedule notification email |
| `POST` | `/api/email/review-approved` | Internal | Notify guest that review was approved |
| `POST` | `/api/email/review-rejected` | Internal | Notify guest that review was rejected |
| `POST` | `/api/sms/check-in-reminders` | Cron secret | Batch-send check-in SMS reminders |
| `POST` | `/api/sms/booking-cancelled` | Internal | Send cancellation SMS to guest |

---

## Deployment

### Vercel (Recommended)

1. Push the repository to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Vercel automatically uses `vercel.json` for cron scheduling:

```json
{
  "crons": [
    { "path": "/api/sms/check-in-reminders?type=24h", "schedule": "0 7 * * *" },
    { "path": "/api/sms/check-in-reminders?type=3h",  "schedule": "0 4 * * *" }
  ]
}
```

5. Click **Deploy** — every push to `main` triggers an automatic redeploy.

### Self-Hosted

```bash
npm run build
npm run start
```

Configure a reverse proxy (nginx/Caddy) to forward port 3000 and handle SSL.

> See [`docs/INSTALLATION_GUIDE.md`](docs/INSTALLATION_GUIDE.md) for the complete production checklist including Supabase RLS setup, webhook registration, and custom domain configuration.

---

## Documentation

All project documentation is in [`docs/`](docs/):

| Document | Description |
|----------|-------------|
| [Installation Guide](docs/INSTALLATION_GUIDE.md) | Prerequisites, setup steps, Supabase config, deployment |
| [System Documentation](docs/SYSTEM_DOCUMENTATION.md) | System overview, user roles, booking/payment workflows |
| [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) | Architecture, design decisions, code organization |
| [User Manual](docs/USER_MANUAL.md) | End-user guide for guests and admins |
| [Testing Documentation](docs/TESTING_DOCUMENTATION.md) | Test strategy, test cases, and results |
| [OCR Implementation Guide](docs/OCR_IMPLEMENTATION_GUIDE.md) | Tesseract.js setup, preprocessing pipeline, tuning tips |
| [Security Q&A](docs/SECURITY_DEFENSE_QA.md) | Security controls, threat model, and common questions |
| [Defense Q&A Prep](docs/DEFENSE_QA_PREP.md) | Thesis defense preparation and expected questions |
| [Unit Testing Document](docs/UNIT_TESTING_DOCUMENT.md) | Unit test cases with expected vs. actual results |
| [Test Execution Checklist](docs/TEST_EXECUTION_CHECKLIST.md) | Manual QA checklist for each feature |
| [Screenshot Capture Guide](docs/screenshots/CAPTURE_GUIDE.md) | Step-by-step guide to capturing app screenshots |

---

## Team

Developed as a **Bachelor of Science in Information Technology** capstone thesis.

**Institution**: Cavite State University — Trece Martires City Campus

| Name | Role |
|------|------|
| **Dai Ren B. Dacasin** | Full-Stack Developer & Project Lead |
| **Justine Cesar L. Ocampo** | Full-Stack Developer |
| **John Reign Reyes** | Full-Stack Developer |

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Kampo Ibayo Resort** · Brgy. Tapia, General Trias, Cavite, Philippines

📞 +63 966 281 5123 &nbsp;·&nbsp; 📧 kampoibayo@gmail.com &nbsp;·&nbsp; 🕗 Open 8:00 AM – 8:00 PM

*Built with passion by BSIT students of Cavite State University*

</div>
