You are a senior full-stack engineer and product designer.

Build a production-quality desktop web application called **PawSphere**.

PawSphere is a premium Pet Adoption & Veterinary Care platform with multiple user roles and a modern SaaS-style interface.

The UI and UX must strictly follow the approved design language described below.

---

## Tech Stack

Use:

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React icons
- Recharts for charts
- React Hook Form + Zod
- Framer Motion (subtle animations only)

Do not use mobile-first layouts for this project. Focus on **desktop web (1440px)**.

---

## Design Language (IMPORTANT)

The UI must match the approved Figma-style screens.

Style inspiration:

- Apple
- Stripe Dashboard
- Linear
- Notion
- Airbnb

### Visual Rules

- Background: #F8FAFC
- Surface: #FFFFFF
- Primary Green: #16A34A
- Border: #E5E7EB
- Text Primary: #111827
- Text Secondary: #6B7280

### Typography

- Font: Inter
- Large heading: 32px
- Section heading: 24px
- Card title: 20px
- Body: 16px

### Components

- Rounded cards (18px)
- Rounded buttons (14px)
- Soft shadows only
- Spacious padding
- Sticky left sidebar
- Top search bar
- Notification and message icons in header

---

# User Roles

Implement role-based layouts.

## 1. Guest

Can:
- View landing page
- Browse pets
- View pet details
- Read pet care guides
- View contact page
- Login / Register

## 2. Pet Owner

Sidebar:
- Dashboard
- Browse Pets
- Find Vet
- Adoption
- My Pets
- Appointments
- Messages
- Notifications
- Favorites
- Pet Care Guide
- Settings

## 3. Shelter

Sidebar:
- Dashboard
- Add Pet
- Pet Listings
- Adoption Applications
- Meet & Greet
- Messages
- Adoption Certificates
- Reports & Analytics
- Settings

## 4. Veterinarian

Sidebar:
- Dashboard
- Appointment Management
- Patient Records
- Prescription Editor
- Medical History
- Messages
- Settings

## 5. Admin

Sidebar:
- Dashboard
- Users
- Verification Center
- Pets & Listings
- Adoptions
- Reports & Analytics
- Broadcasts
- Content Moderation
- Feedback & Support
- System Logs
- Settings

---

# Approved Screens (Build These)

## Public

### Landing Page
Sections:
- Hero
- Search
- Featured Pets
- How It Works
- Pet Categories
- Veterinary Services
- Testimonials
- Partners
- Footer

### Browse Pets
- Filter sidebar
- Search
- Pet grid
- Pagination

### Pet Details
- Large gallery
- Health info
- Vaccination status
- Personality
- Shelter info
- Sticky Adopt button

---

# Pet Owner Screens

### Dashboard
- Welcome banner
- Stats cards
- Upcoming appointments
- Recent activity
- Quick actions

### Browse Pets
Same as public with favorite and apply actions.

### Find Vet
- Search
- Filters
- Vet cards
- Rating
- Availability
- Book button

### Adoption
- Active applications
- Approved
- Rejected
- Completed
- Timeline

### Application Wizard
Multi-step form:
- Personal info
- Living conditions
- Experience
- Documents
- Review

### Application Status
Timeline:
Submitted → Review → Interview → Approved → Meet & Greet → Completed

### My Pets
Pet cards with health and vaccination info.

### Pet Profile
- Medical history
- Vaccinations
- Appointments
- Download records

### Appointment Booking
Calendar + time slots.

### Medical Timeline
Chronological medical events.

### Vaccination Records
Table + next due reminders.

### Messages
Two-column chat layout.

### Notifications
Grouped notification list.

### Favorites
Saved pets and vets.

### Pet Care Guide
Articles and videos.

### Settings
Profile, security, notifications, privacy.

---

# Shelter Screens

### Dashboard
- Total pets
- Pending applications
- Adopted this month
- Upcoming meet & greets
- Adoption trend chart
- Recent applications
- Quick actions

### Add Pet
- Multi-step form
- Photo upload
- Basic info
- Health details
- Personality
- Availability
- Publish

### Pet Listings
Table with:
- Image
- Name
- Breed
- Age
- Gender
- Status
- Applications
- Edit/Delete

### Adoption Applications
- Tabs (All, Pending, Interview, Approved, Rejected)
- Search
- Filters
- Applicant table
- Quick actions

### Meet & Greet
- Calendar
- Upcoming meetings
- Status chips
- Meeting details panel

### Messages
Chat interface for adopters.

### Adoption Certificates
- Certificate table
- Preview panel
- Download PDF
- Generate button

### Reports & Analytics
- KPI cards
- Line charts
- Donut charts
- Bar charts
- Insights panel

### Settings
- Profile
- Operating hours
- Adoption policies
- Notifications
- Team members
- Security
- Documents
- Connected accounts
- Danger zone

---

# Veterinarian Screens

### Dashboard
- Today’s appointments
- Patient count
- Alerts
- Calendar

### Appointment Management
- Approve
- Reject
- Reschedule
- Complete

### Patient Record
- Owner info
- Medical history
- Vaccinations
- Lab reports
- Allergies

### Prescription Editor
- Diagnosis
- Medicines
- Dosage
- Instructions
- Generate PDF

### Medical History
Timeline view.

### Messages
Chat interface.

### Settings
Profile and availability.

---

# Admin Screens

### Dashboard
- Total users
- Shelters
- Veterinarians
- Pets
- Adoptions
- Donations
- Charts
- Pending approvals
- Recent activity
- System health

### Users
Searchable table with role badges and actions.

### Verification Center
Approve/reject shelters and veterinarians.

### Pets & Listings
Moderation table.

### Adoptions
Application monitoring and analytics.

### Reports & Analytics
Advanced platform charts.

### Broadcasts
Compose and schedule announcements.

### Content Moderation
Reported users, pets, and messages.

### Feedback & Support
Support tickets and feedback.

### System Logs
Audit and security logs.

### Settings
Branding, policies, email templates, security, integrations.

---

# Layout Requirements

- Left sidebar: 240px
- Top header: 72px
- Content width: 1280px centered
- Use CSS Grid and Flexbox
- All pages must feel consistent

---

# Data

Use realistic mock data:

- Real pet names
- Dog and cat breeds
- Bangladesh locations
- Realistic dates
- Status badges:
  - Pending (orange)
  - Approved (green)
  - Rejected (red)
  - Interview (purple)
  - Completed (green)

---

# Interactions

- Hover lift on cards
- Smooth sidebar transitions
- Subtle fade animations
- Loading skeletons
- Empty states with pet illustrations
- Toast notifications

---

# Accessibility

- Keyboard navigation
- Focus states
- AA contrast
- 44px touch targets

---

# Deliverables

Generate:

1. Complete folder structure
2. Reusable layout components
3. Reusable UI components
4. Role-based route groups
5. Mock API layer
6. Responsive desktop implementation
7. Clean TypeScript code
8. No placeholder lorem ipsum

The final result should look like a commercial SaaS product and match the approved PawSphere UI screens exactly.