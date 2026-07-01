# Screenshot & Screen Recording Capture Guide

This guide tells you exactly what to capture so the README looks complete and professional.

## Setup Before Capturing

1. Run the app: `npm run dev`
2. Use **Chrome** or **Edge** at **1440 × 900** viewport (standard desktop)
3. For mobile shots: DevTools → Device → iPhone 14 Pro (390 × 844)
4. Use **Dark Mode** for most shots (it's the default theme and looks best)
5. Capture at **2× resolution** (Retina) if your display supports it
6. Use a tool like **ShareX** (Windows), **CleanShot X** (Mac), or browser DevTools screenshot

---

## Required Screenshots

Save each file to this folder (`docs/screenshots/`) with the exact filename below.

### Public Pages

| File | Page | URL | Notes |
|------|------|-----|-------|
| `01-home-hero.png` | Home — Hero | `/` | Full page, scroll to top. Show the hero section with the resort banner. |
| `02-booking-calendar.png` | Booking Calendar | `/book` | Show the date picker with some dates blocked in red. |
| `03-price-breakdown.png` | Price Breakdown | `/book` | After selecting dates, show the price summary card. |
| `04-payment-selection.png` | Payment Options | `/book` | Show the payment method selector (GCash, card, bank transfer). |
| `05-gallery.png` | Gallery | `/gallery` | Show the masonry grid with resort photos. |
| `06-reviews.png` | Reviews | `/#reviews` | Show 2–3 review cards with star ratings. |
| `07-my-bookings.png` | My Bookings | `/bookings` | Show a list with one booking in "Confirmed" status. |
| `08-chatbot.png` | Chatbot | `/` | Open the chatbot widget with a sample conversation. |

### Admin Pages

| File | Page | URL | Notes |
|------|------|-----|-------|
| `09-admin-dashboard.png` | Admin Dashboard | `/admin` | Show KPI cards + at least one chart. |
| `10-admin-bookings.png` | Booking Management | `/admin/bookings` | Show the bookings table with status badges. |
| `11-admin-payments.png` | Payment Verification | `/admin/payments` | Show the payment table with a proof image open in the viewer. |
| `12-admin-reports.png` | Reports | `/admin/reports` | Show a report with the chart and the export buttons. |
| `13-admin-users.png` | User Management | `/admin/users` | Show the user list table. |
| `14-admin-gallery.png` | Gallery Management | `/admin/gallery` | Show the gallery grid with upload button. |
| `15-admin-reviews.png` | Review Moderation | `/admin/reviews` | Show a pending review with approve/reject buttons. |
| `16-admin-walkin.png` | Walk-in Booking | `/admin/bookings/walk-in` | Show the walk-in form. |

### Mobile Responsive

Capture these using Chrome DevTools in iPhone 14 Pro (390 × 844) device mode.

| File | Page | Notes |
|------|------|-------|
| `17-mobile-home.png` | Home | Navbar collapsed, hero section visible. |
| `18-mobile-booking.png` | Book | Booking form on mobile, calendar visible. |
| `19-mobile-admin.png` | Admin Dashboard | KPI cards stacked vertically. |

### Theme Comparison

| File | Notes |
|------|-------|
| `20-dark-mode.png` | Home page in dark mode (default). |
| `21-light-mode.png` | Home page in light mode (click the theme toggle button). |

---

## Screen Recording (Demo Video)

Record a single walkthrough video (3–5 minutes) covering:

1. **Landing page** — scroll through the full home page (hero → amenities → gallery → reviews → contact/map)
2. **Booking flow** — sign in → pick dates → see price breakdown → select payment → submit booking
3. **Payment upload** — upload a sample payment screenshot, show OCR extracting the reference number
4. **My Bookings page** — show the confirmed booking, download receipt
5. **Chatbot** — ask 2–3 common questions
6. **Admin dashboard** — confirm a booking, approve a payment proof, view a report, export CSV

### Recording Tools

- **Windows**: Xbox Game Bar (`Win + G`) → Capture, or [ShareX](https://getsharex.com/)
- **Mac**: QuickTime Player or CleanShot X
- **Browser-only**: [Loom](https://loom.com) (free, auto-uploads to shareable link)

### After Recording

- Upload the video to **YouTube** (unlisted is fine) or directly to this GitHub repo
- Update `README.md`:
  - Replace the `<!-- Uncomment... -->` block with your actual video link
  - Set `demo-thumbnail.png` to a screenshot of the first frame

---

## Tips for Great Screenshots

- **Use real-looking data** — add a few sample bookings, reviews, and gallery images before capturing
- **Avoid loading spinners** — wait for all content to fully load
- **Crop tightly** — remove browser chrome (address bar, tabs) unless showing mobile frame
- **Consistent lighting** — all dark mode or all light mode per section (pick one)
- **Hide dev tools** — press `F12` to close DevTools before capturing
