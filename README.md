# KindLink — NGO & Volunteer Management Portal

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TanStack Router](https://img.shields.io/badge/TanStack_Start-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)](https://tanstack.com/router)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

**KindLink** is a modern, full-stack web application designed to seamlessly connect non-profit organizations (NGOs) with passionate volunteers. It provides real-time location-based event discovery, automated applicant management, attendance verification, and PDF certificate generation.

---

## ✨ Features

### 🤝 For Volunteers
- **Proximity & Radius Search:** Find volunteering opportunities near your location by searching your pincode with interactive distance sliders.
- **Skill-Based Matching:** Filter events by required skills (e.g., teaching, first aid, event management, design).
- **One-Click Application & Tracking:** Apply to events and track application statuses (`pending`, `accepted`, `rejected`, `completed`) in real-time.
- **Digital Certificates:** Download verified PDF certificates of completion with hours logged.

### 🏢 For Non-Profits (NGOs)
- **Instant Event Publishing:** Create detailed volunteering opportunities with dates, location, volunteer quotas, and required skills.
- **Applicant & Attendance Management:** Review applicant profiles, accept/reject volunteers, and mark attendance post-event.
- **Automated Certificate Issuance:** Generate and distribute customized PDF certificates with dual rendering support (Server-side + Client-side fallback via `pdf-lib`).
- **Organization Profile Management:** Showcase NGO mission, contact info, and website.

### 🛡️ For Admins
- **Verification Workflows:** Verify NGO registrations to build trust across the community.
- **System Moderation:** Monitor active users, events, applications, and platform activity.

---

## 🛠️ Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (Full-stack React framework with SSR)
- **UI Library:** React 19, Tailwind CSS v4, Radix UI Primitives, Lucide Icons
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Storage, Auth)
- **PDF Generation:** `pdf-lib` (dual server & client-side rendering)
- **Build System & Deployment Engine:** Vite 6 & Nitro (configured for Vercel deployment)
- **State & Data Fetching:** TanStack Query (React Query v5)

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+ recommended)
- npm, pnpm, or yarn

### 1. Clone the repository
```bash
git clone https://github.com/mahir1411/ngo-volunteer.git
cd ngo-volunteer/volunteer-connect-hub-main
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env` file in the root directory:

```env
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"

# Optional: Server-side admin operations
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📦 Production Build & Deployment

KindLink is pre-configured to deploy on **Vercel** via Nitro server presets.

### Build locally:
```bash
npm run build
```

### Deploy to Vercel:
1. Connect your repository to Vercel.
2. In Vercel Project Settings, add the environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Optional)
3. Deploy! Vercel will automatically run `npm run build` and generate the `.vercel/output` serverless bundle.

---

## 📄 License

This project is licensed under the MIT License.
