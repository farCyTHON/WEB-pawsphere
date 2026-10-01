# PawSphere — Pet Adoption & Veterinary Care Platform

PawSphere is a clean, user-friendly platform for pet adoption and veterinary care in Bangladesh. It brings together pet owners, shelters, veterinarians, and platform administrators in one organized experience.

The project currently focuses on a polished front-end prototype with role-based dashboards, realistic mock data, interactive UI states, adoption workflows, and veterinary appointment management.

---

## Features Completed So Far

### Public Experience
- Landing page with PawSphere introduction
- Pet browsing and search
- Species filtering for dogs and cats
- Pet profile pages with pet image gallery carousel, personality and lifestyle tags, health notes, vaccination status, shelter information, and verified shelter badges
- Favorite/save pet interactions
- Public sign-in and registration screens

### Pet Owner Portal
- Owner dashboard with account overview
- Quick action cards
- Upcoming appointment reminder widget
- Browse pets and save favorites
- Adoption application tracking
- Pet health and vaccination records
- Appointment history and cancellation flow
- Veterinary search and booking experience
- Messages and notifications
- Downloadable document area for pet records, certificates, and adoption agreements
- Friendly empty states for pets, saved favorites, appointments, messages, and filtered applications

### Shelter Portal
- Shelter dashboard
- Pet listing management
- Add-pet workflow
- Adoption application review
- Meet-and-greet scheduling
- Adoption certificates
- Shelter reports and analytics using charts

### Veterinarian Portal
- Veterinarian dashboard
- Appointment management
- Patient record management
- Prescriptions
- Medical history
- Messaging
- Verified veterinarian indicators

### Administrator Portal
- Platform dashboard
- User management
- Shelter and veterinarian verification workflows
- Adoption monitoring
- Pet listing moderation
- Broadcast management
- Feedback and system logs
- Platform analytics and reporting

### UX and UI Enhancements
- First-login welcome modal for each role
- Success feedback toast notifications for important actions
- Loading skeletons for pet browsing
- Subtle hover, shadow, and elevation animations
- Clean empty states with helpful next steps
- Verified badges for shelters and veterinarians
- Responsive layouts for smaller screen sizes
- Unique chart and chart-series IDs to prevent Recharts duplicate-key warnings

---

## Technology Stack

### Front End
- **React 18**
- **TypeScript**
- **Vite**
- **Tailwind CSS**

### UI and Visual Libraries
- **Lucide React** — icons
- **Recharts** — dashboard charts and analytics
- **Motion** — animation support where needed
- **Sonner** — toast notification capability
- **Radix UI** — accessible UI primitives
- **Embla Carousel** — available for carousel-related functionality

### Styling
- Tailwind CSS utility classes
- Shared design tokens in `src/styles/theme.css`
- Google Font: **Manrope**
- Core accent color: **Green `#16A34A`**

### Data
- Mock data only at the current stage
- No backend, database, authentication provider, payment system, maps, or real-time communication has been added

---

## Project Structure

```text
PawSphere/
├── src/
│   ├── app/
│   │   └── App.tsx                 # Main application and all current screens
│   ├── styles/
│   │   ├── fonts.css               # Google font imports
│   │   ├── theme.css               # Design tokens and Tailwind theme mappings
│   │   ├── index.css               # Global Tailwind styles
│   │   └── globals.css             # Global application styles
│   └── imports/
│       └── PawSphere_Project_Description.pdf
│
├── package.json                    # Dependencies and scripts
├── vite.config.ts                  # Vite configuration
├── postcss.config.mjs              # PostCSS configuration
└── __figma__entrypoint__.ts        # Figma Make entrypoint
```

> At present, the majority of application logic and screens are intentionally consolidated inside `src/app/App.tsx`.

---

## System Architecture

PawSphere currently uses a **front-end-only, role-based architecture**.

```text
User
  │
  ├── Guest / Public Visitor
  │     ├── Landing page
  │     ├── Browse pets
  │     ├── Pet details
  │     └── Authentication screens
  │
  └── Authenticated User
        │
        ├── Pet Owner Portal
        │     ├── Pet browsing
        │     ├── Favorites
        │     ├── Applications
        │     ├── Appointments
        │     ├── Documents
        │     └── Messages
        │
        ├── Shelter Portal
        │     ├── Pet listings
        │     ├── Adoption applications
        │     ├── Meet and greets
        │     ├── Certificates
        │     └── Analytics
        │
        ├── Veterinarian Portal
        │     ├── Appointments
        │     ├── Patients
        │     ├── Prescriptions
        │     └── Medical history
        │
        └── Administrator Portal
              ├── Users
              ├── Verifications
              ├── Adoption oversight
              ├── Moderation
              ├── Broadcasts
              └── Analytics
```

### Current Application Flow

1. A visitor starts on the public landing page.
2. They can browse pets and open pet detail pages.
3. Users register or sign in through Supabase Auth.
4. PawSphere loads the authenticated profile and routes to the correct role dashboard.
5. Shelter and veterinarian accounts remain on the verification screen until approved.
6. Dashboard feature data is still mock data stored directly in the application.
7. Important actions provide local UI feedback through success notices and updated local state.

---

## Prerequisites

Install the following before running the project locally:

- **Node.js** version 18 or later
- **npm** package manager

Check your versions:

```bash
node --version
npm --version
```

---

## Installation

Clone or download the project, then open the project folder in your terminal.

Install all dependencies:

```bash
npm install
```

---

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run
   [`supabase/migrations/20260806_role_auth.sql`](supabase/migrations/20260806_role_auth.sql).
   This creates the role profile tables, signup trigger, and row-level security policies.
3. Run
   [`supabase/migrations/20260806_pet_crud.sql`](supabase/migrations/20260806_pet_crud.sql).
   This creates the shelter-owned pets table, public `pets` Storage bucket, and the
   database and Storage access policies required for pet images.
4. Run
   [`supabase/migrations/20260806_public_pets.sql`](supabase/migrations/20260806_public_pets.sql).
   This adds the secure public pet queries used by browsing, details, filters,
   pagination, and related listings.
5. Run
   [`supabase/migrations/20260806_adoption_flow.sql`](supabase/migrations/20260806_adoption_flow.sql).
   This creates adoption applications, owner/shelter access policies, status
   queries, and automatic reserved/adopted pet status updates.
6. Run
   [`supabase/migrations/20260806_appointment_flow.sql`](supabase/migrations/20260806_appointment_flow.sql).
   This creates veterinary appointments, secure owner/veterinarian queries,
   booking validation, status actions, cancellation, and rescheduling.
7. Run
   [`supabase/migrations/20260806_medical_records.sql`](supabase/migrations/20260806_medical_records.sql).
   This creates medical records and vaccinations tables, prescription issuance,
   patient summaries, medical timeline events, and owner/vet access policies.
8. Run
   [`supabase/migrations/20260806_messaging.sql`](supabase/migrations/20260806_messaging.sql).
   This creates persistent conversations and messages for owner↔shelter and
   owner↔veterinarian chats with access policies based on applications and appointments.
9. Copy `.env.example` to `.env.local` and add your project URL and public anon or
   publishable key:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-key
```

10. In **Authentication → URL Configuration**, set the local Site URL to
   `http://localhost:5173` and add it to the allowed redirect URLs. Add the deployed
   application URL before production deployment.
11. Configure email confirmation in **Authentication → Providers → Email**. When
   confirmation is enabled, new users must follow the email link before signing in.

The public registration form can create owner, shelter, and veterinarian accounts.
Shelter and veterinarian profiles start with `pending` verification status. Admin roles
must be assigned from a trusted server or the Supabase dashboard; they cannot be selected
during public registration.

---

## Run Locally

Start the local development server:

```bash
npm run dev
```

After the server starts, open the local URL shown in the terminal. It is commonly:

```text
http://localhost:5173
```

---

## Build for Production

Create a production build:

```bash
npm run build
```

> Note: The current workspace is configured for Figma Make and uses `__figma__entrypoint__.ts`. A standard standalone Vite deployment may require an `index.html` entry file before using the usual Vite production build flow outside Figma Make.

---

## Main Dependencies

```text
react
react-dom
typescript
vite
tailwindcss
lucide-react
recharts
motion
sonner
date-fns
@radix-ui/*
embla-carousel-react
```

---

## Design System

PawSphere follows a minimal, trustworthy health-and-care SaaS design system.

### Visual Principles
- Clean white card surfaces
- Spacious layouts
- Clear hierarchy and readable typography
- Calm green accent for primary actions
- Subtle borders and soft shadows
- Minimal decorative elements
- Accessible contrast for text and controls
- Rounded cards and form controls

### Core Colors

```text
Primary Green:      #16A34A
Dark Green:         #15803D
Light Green:        #DCFCE7
Soft Green Surface: #F0FDF4
Page Background:    #F8FAFC
Primary Text:       #111827
Secondary Text:     #6B7280
Border:             #E5E7EB
```

---

## Current Limitations

Supabase authentication and role profile storage are implemented. The remaining
dashboard features are still a front-end prototype and do not yet include:

- Database storage for pets, appointments, messages, or reports
- API integration beyond authentication and role profiles
- Real appointment booking
- Real messaging
- File uploads
- PDF generation
- Email notifications
- Payment processing
- Maps or location services
- Real-time updates
- Advanced analytics

All users, pets, appointments, messages, records, documents, and reports are currently represented using mock data.

---

## Suggested Future Improvements

### Backend and Authentication
- Add secure authentication for each role
- Connect users to a database
- Add role-based access control
- Store pet listings, applications, and appointments

### Pet Adoption Workflow
- Real application submission forms
- Application status updates
- Shelter review tools
- Meet-and-greet scheduling
- Adoption agreement management

### Veterinary Care
- Real appointment booking
- Digital prescriptions
- Pet medical record uploads
- Vaccination reminders
- Downloadable care documents

### Notifications
- Email notifications
- In-app notification persistence
- Appointment reminder delivery
- Adoption application updates

### Admin Tools
- Real user verification
- Listing approval workflows
- Content moderation
- System activity records

---

## Demo Roles

The sign-in screen currently supports demo access for:

```text
Pet Owner
Shelter
Veterinarian
Administrator
```

Each demo role opens a different dashboard and navigation experience.

---

## Credits

- Pet and veterinarian imagery: Unsplash
- Icons: Lucide React
- Charts: Recharts
- UI framework: React and Tailwind CSS

---

## License

This project is currently intended for educational, prototype, and portfolio use.
