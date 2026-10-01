PawSphere — Full Project Context & Real-Time Chat Handover

You are taking over an existing university project called PawSphere.

This is NOT a new project. The project has already gone through multiple implementation phases using React, TypeScript, Supabase, and an existing approved UI/UX design.

Your first responsibility is to understand the existing codebase and architecture before modifying anything.

Do not rebuild existing functionality.
Do not redesign existing screens.
Do not create parallel implementations.
Do not assume the database schema — inspect the actual project and Supabase-related code first.

1. Project Overview

PawSphere is a unified pet-care, veterinary, and pet-adoption platform.

The platform connects:

Pet Owners
Animal Shelters
Veterinarians

There is also an Admin role for platform management.

The main goal is to provide one platform where users can:

Browse adoptable pets
Apply for adoption
Track adoption applications
Communicate with shelters
Find and communicate with veterinarians
Book veterinary appointments
Maintain medical records
Maintain vaccination records
Generate relevant documents
Manage pets/listings
Manage platform users and verification
Communicate through persistent messaging

The project is primarily a university/course project and demonstration, not a large-scale commercial platform.

Expected testing population is very small, approximately 4–5 users.

Therefore:

Avoid unnecessary enterprise architecture.
Avoid paid third-party services unless absolutely necessary.
Prefer Supabase Free-tier-compatible solutions.
Prefer simple, maintainable architecture.
Do not overengineer.
2. Current Technology Stack

Inspect the repository to confirm the exact versions, but the intended stack is:

Vite
React
TypeScript
Tailwind CSS
Supabase
PostgreSQL through Supabase
Supabase Authentication
Supabase Storage
Supabase Realtime
React Router or the routing architecture already present
Existing UI/component system

Do NOT replace the stack.

Do NOT migrate the application to another framework.

Do NOT introduce a new backend unless the existing architecture genuinely requires it.

3. Existing User Roles

There are four roles.

Pet Owner

Main capabilities include:

Dashboard
Browse Pets
Pet Details
Adoption Application
Adoption Application Status
Appointments
Medical Timeline
Vaccination Records
Adoption Certificate
Messaging
Settings
Shelter

Main capabilities include:

Shelter Dashboard
Add Pet
Pet Listings
Adoption Applications
Meet & Greet
Messages
Adoption Certificate
Reports / Analytics
Settings
Veterinarian

Main capabilities include:

Vet Dashboard
Appointment management
Medical records
Vaccination records
Prescription/document functionality
Messaging
Settings
Admin

Admin is NOT a public signup role.

Admin exists for development/platform management.

Admin functionality includes:

Admin Dashboard
Users
Verification Centre
Pets/Listings
Adoptions
Reports/Analytics
Settings
4. Important Existing Authentication Architecture

The application already has role-based authentication and routing.

The intended role routing is:

owner  → /dashboard
shelter → /shelter/dashboard
vet → /vet/dashboard
admin → /admin/dashboard

There is already an authentication/session architecture.

Before modifying authentication:

Inspect the existing implementation.

Do not replace it with another auth system.

The project uses Supabase Auth.

The user profile is associated with the authenticated Supabase user.

The profiles table is expected to contain role information.

Shelter and veterinarian users may also have corresponding records in their respective tables.

There are already protected routes and role-based access controls.

Preserve them.

5. Existing Supabase Architecture

Supabase is the primary backend.

The project already uses Supabase for:

Authentication

Supabase Auth handles:

Sign up
Sign in
Sessions
User identity
PostgreSQL

Existing database entities include, depending on the current implementation:

profiles
shelters
veterinarians
pets
adoption_applications
appointments
medical_records
vaccinations
conversations
messages

There may be additional tables.

Do not assume these are the exact final schemas.

Inspect:

Supabase client
TypeScript types
service files
hooks
SQL files/migrations if available
existing queries
existing components

before changing anything.

6. Existing Messaging Architecture

Messaging functionality has already been started.

The project already has the conceptual architecture for:

conversations
messages

Existing messaging service functionality may include things such as:

createConversation()
getUserConversations()
getConversationMessages()
sendMessage()
markConversationRead()

Again:

Inspect the actual implementation before changing it.

Do not recreate these services if they already exist.

The existing UI already contains messaging screens/components.

The previous implementation intentionally created the messaging foundation, but the chat was not yet fully real-time.

The next objective is therefore:

PHASE 19 — REAL-TIME CHAT
7. Phase 19 Objective

Convert the existing persistent messaging system into a real-time chat system using Supabase Realtime.

The desired user experience:

User A
   │
   │ sends message
   ▼
messages table
   │
   │ Supabase Realtime event
   ▼
User B
   │
   ▼
message appears immediately

The user should NOT need to:

refresh the page
reopen the conversation
manually reload messages

for a newly received message to appear.

8. Supported Chat Relationships

The system should support:

Owner ↔ Shelter

For example:

Pet Owner
    ↓
Shelter
    ↓
Questions about adoption/pet
Owner ↔ Veterinarian

For example:

Pet Owner
    ↓
Veterinarian
    ↓
Questions related to appointment/care

Do not create arbitrary public chat rooms.

Do not allow users to message every user in the system.

Use the existing conversation model.

9. Real-Time Requirements

Implement real-time updates using:

Supabase Realtime

Do not introduce:

Socket.io
Firebase
Pusher
Ably
separate WebSocket servers
custom Node.js messaging backend

unless the existing project proves that Supabase Realtime cannot support the current architecture.

For this project, Supabase Realtime is the intended solution.

The expected testing scale is only around 4–5 users, so optimize for simplicity and correctness rather than massive scalability.

10. Database Requirements

First inspect the existing:

conversations
messages

schema.

Determine:

primary keys
foreign keys
sender relationship
recipient/conversation relationship
timestamps
read status
conversation participants
existing indexes
existing RLS policies

Do NOT create duplicate tables.

Do NOT create conversations_v2, messages_v2, etc.

If the existing schema is suitable, reuse it.

If something small is genuinely missing, modify the existing schema carefully.

11. Messages

A message should have an appropriate structure based on the existing schema, conceptually similar to:

id
conversation_id
sender_id
content
created_at
read_at / is_read

But again:

Use the actual existing schema rather than blindly creating these columns.

Messages should be persisted in PostgreSQL.

Realtime should notify clients about database changes.

Realtime is NOT the permanent message store.

12. Conversation List

The existing conversation list should update appropriately.

For example:

Shelter A
"Is this pet still available?"
2 minutes ago
Unread

When a new message arrives:

update latest message
update timestamp
update unread state where appropriate
move conversation to the appropriate position if the current UI already supports sorting
do not require refresh

Preserve the existing UI design.

13. Chat Window

When a user opens a conversation:

Load existing historical messages from Supabase.
Subscribe to new messages for that conversation.
Display incoming messages immediately.
Allow sending new messages.
Persist messages to PostgreSQL.
Clean up the Realtime subscription when leaving the conversation/unmounting the component.

Avoid duplicate messages.

This is especially important.

For example, if:

sendMessage()

inserts a message and the Realtime subscription also receives that same message, the UI must not display it twice.

Use the existing architecture or a clean deduplication strategy based on message ID.

14. Realtime Subscription

Use Supabase Realtime appropriately.

The preferred concept is:

postgres_changes

for the existing messages table.

Subscribe only to the relevant conversation or conversations.

Do not create one uncontrolled global subscription for every message in the entire database.

Conceptually:

messages
WHERE conversation_id = currentConversationId

should trigger the current chat UI.

Use the correct Supabase Realtime API for the installed Supabase client version.

15. Subscription Lifecycle

This is important.

When the user:

opens conversation

→ subscribe.

When the user:

changes conversation

→ remove old subscription.

When the user:

leaves messaging page

→ clean up subscription.

When the component:

unmounts

→ clean up subscription.

Do not create accumulating subscriptions.

Avoid:

subscription #1
subscription #2
subscription #3
subscription #4
...

for the same conversation.

16. RLS / Security

Do NOT disable Row Level Security.

Do NOT use insecure policies like:

using (true)

for the final implementation.

A user should only be able to:

access conversations they participate in
read messages belonging to those conversations
send messages to conversations they participate in
update read state where appropriate

A user must NOT be able to:

read another user's private conversations
read unrelated messages
send messages into conversations they do not belong to
manipulate another user's messages

Inspect the current RLS policies first.

If the existing development policies are too permissive, improve them carefully without breaking the rest of PawSphere.

Do not blindly rewrite all RLS policies.

17. Important Security Rule

Never put:

service_role

credentials in frontend code.

The frontend must use the normal Supabase client/public configuration.

Never expose:

service-role keys
private credentials
database passwords
secrets

in React/Vite client code.

18. Existing UI Must Be Preserved

This is extremely important.

The UI has already been designed and approved.

Do NOT:

redesign the chat page
replace the sidebar
change colors
replace cards
change typography
change navigation
introduce a new design system
redesign dashboards

unless absolutely necessary for functionality.

Your job is:

make the existing interface actually work.

If the UI already has:

Messages
Conversations
Chat Window
Send button
Unread indicator

connect those existing elements to the real backend.

Do not build another chat interface beside it.

19. Existing Architecture First

Before writing code, inspect the project and identify:

Frontend
application entry point
routing
authentication provider/context
protected routes
dashboard layout
messaging components
messaging pages
hooks
services
TypeScript types
Backend
Supabase client
tables
SQL/migrations
RLS
Realtime configuration
existing messaging services
Existing State Management

Determine whether the project uses:

React Context
hooks
local state
another state-management library

Use the existing approach.

Do not introduce Redux/Zustand/etc. just for chat.

20. Before Making Changes

First perform an inspection.

Give me a concise report containing:

1. Current project structure
2. Current authentication architecture
3. Current routing architecture
4. Existing Supabase client setup
5. Existing messaging components
6. Existing conversation schema
7. Existing message schema
8. Existing messaging services/hooks
9. Existing RLS policies affecting messaging
10. Whether Supabase Realtime is already configured
11. What exactly is missing for real-time chat
12. Files you intend to modify

Do not immediately rewrite the project.

After inspection, implement the smallest necessary changes.

21. Error Handling

The chat should handle:

Message send failure

Show an appropriate existing toast/error state.

Do not silently fail.

Realtime connection failure

The application should remain usable.

Historical messages should still load.

If real-time connection fails, do not crash the entire application.

Empty conversation

Show the existing empty-state UI if present.

Loading

Use existing loading components/patterns.

Network interruption

Avoid losing already loaded messages.

Do not aggressively reload the entire application.

22. Message Ordering

Messages should appear chronologically.

Use the database timestamp/order already present in the schema.

Be careful with:

duplicate messages
messages arriving slightly out of order
optimistic UI vs database events

If optimistic sending is already implemented, preserve it and ensure the Realtime event doesn't duplicate the message.

If optimistic sending does not exist, don't add unnecessary complexity unless it improves the existing UX.

23. Read / Unread Behavior

Use the existing read implementation if present.

When appropriate:

User opens conversation
        ↓
messages become read
        ↓
conversation unread indicator updates

The exact implementation should follow the current database schema.

Do not invent another unread system if one already exists.

24. Notifications

For this phase, do NOT build a complete notification center.

Only make the existing messaging unread behavior work.

For example:

New message
   ↓
conversation unread

A separate persistent notification system can be implemented later.

25. Do NOT Implement Voice/Video Yet

The application already contains UI buttons or placeholders for:

Call
Video Call

Leave those intact.

Do NOT implement WebRTC in this phase.

Do NOT create:

video signaling
microphone permissions
camera permissions
WebRTC peer connections

Those belong to a later phase.

For now:

Real-time text chat only.

26. Supabase Free Tier Constraint

This project is intentionally using the Supabase Free tier.

The expected usage is very small:

approximately 4–5 testers

Therefore:

Supabase Realtime is appropriate.
Do not introduce paid infrastructure.
Do not recommend upgrading merely to implement chat.
Avoid unnecessary realtime subscriptions.
Subscribe only where needed.
Clean up subscriptions correctly.

The goal is a working university demonstration, not millions of concurrent users.

27. Do Not Break Existing Features

This is a major requirement.

While implementing Phase 19, do not unnecessarily modify:

Authentication
Signup
Sign-in
Role routing
Owner dashboard
Shelter dashboard
Vet dashboard
Admin dashboard
Pet browsing
Pet CRUD
Adoption application flow
Appointment flow
Medical records
Vaccination system
PDF generation
Admin functionality

Only modify shared code if the change is genuinely necessary.

If an existing feature works:

LEAVE IT ALONE.

28. No Duplicate Architecture

Before creating anything, search the repository.

For example, before creating:

chatService.ts

check whether one already exists.

Before creating:

useMessages.ts

check whether one already exists.

Before creating database tables:

check the actual Supabase schema.

Before creating types:

check existing types.

Reuse existing architecture wherever possible.

29. Testing Requirements

After implementation, test at least:

Test 1 — Owner → Shelter
Owner opens Shelter conversation
Owner sends message
Shelter has conversation open
Shelter receives message instantly
Test 2 — Shelter → Owner
Shelter sends message
Owner receives message instantly
Test 3 — Owner → Vet
Owner sends message
Vet receives message instantly
Test 4 — Historical Messages

Refresh the page.

Existing messages should still exist.

Test 5 — Conversation Switching

Open:

Conversation A
→ Conversation B
→ Conversation A

Ensure subscriptions do not duplicate.

Test 6 — Multiple Users

Use multiple browser tabs/accounts if possible.

Confirm that:

User A's private conversation

does not appear for:

User B

unless they are actual participants.

Test 7 — Security

Attempt unauthorized access through the frontend/API.

Confirm RLS prevents access.

30. Build / TypeScript Verification

After implementation:

run TypeScript checks
run build
inspect browser console
inspect Supabase errors
inspect network errors
inspect Realtime subscription errors

Fix actual errors.

Do not hide errors with:

// @ts-ignore

or unnecessary casts.

Do not suppress warnings simply to make the build pass.

31. Final Verification Report

After completing the work, report:

PHASE 19 STATUS

Implemented:
- ...
- ...
- ...

Files modified:
- ...
- ...

Database changes:
- ...
- ...

RLS changes:
- ...
- ...

Realtime subscriptions:
- ...

Existing services reused:
- ...

Tests performed:
- ...

Build status:
- ...

Remaining issues:
- ...

Phase 19 ready: YES / NO

If something could not be verified because the required Supabase configuration or environment variable is missing, clearly state that instead of pretending it works.

32. Most Important Instruction

Do not treat this as a greenfield project.

PawSphere already has a substantial implementation.

Your workflow should be:

UNDERSTAND
    ↓
INSPECT
    ↓
IDENTIFY WHAT IS MISSING
    ↓
REUSE EXISTING ARCHITECTURE
    ↓
IMPLEMENT MINIMUM REQUIRED CHANGES
    ↓
TEST
    ↓
FIX
    ↓
REPORT

Not:

Create a new chat system
Create new tables
Create new services
Create new UI
Create new architecture

The existing project is the source of truth.

Inspect first. Preserve existing functionality. Implement only what is necessary for Phase 19: reliable real-time text chat using Supabase Realtime.