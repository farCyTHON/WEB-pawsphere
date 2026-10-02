import { useEffect, useState } from "react";
import {
  Heart,
  Search,
  MapPin,
  Star,
  ArrowRight,
  CheckCircle,
  Shield,
  Menu,
  X,
  Phone,
  Video,
  Mail,
  Instagram,
  Twitter,
  Facebook,
  Home,
  Stethoscope,
  Calendar,
  MessageSquare,
  Bell,
  Bookmark,
  BookOpen,
  Settings,
  LogOut,
  Plus,
  Filter,
  Edit,
  Trash2,
  Download,
  Eye,
  Check,
  FileText,
  BarChart2,
  Activity,
  UserCheck,
  Award,
  Megaphone,
  Flag,
  HelpCircle,
  TrendingUp,
  Send,
  User,
  ClipboardList,
  Pill,
  Syringe,
  AlertCircle,
  ChevronDown,
  Clock,
  Users,
  MoreVertical,
  Terminal,
  ChevronLeft,
  Layers,
  PawPrint,
  RefreshCw,
  BadgeCheck,
  Sparkles,
  ChevronRight,
  Image as ImageIcon,
  FileCheck2,
  ShieldCheck,
  MailCheck,
  Trash,
  Printer,
  LifeBuoy,
  FileDown,
  Frown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import {
  signUpOwner,
  signUpShelter,
  signUpVet,
  type AppRole,
  type PublicRole,
} from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials, ROLE_HOME_PATHS } from "@/lib/auth-utils";
import { useNotifications } from "@/hooks/useNotifications";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ShelterPetForm } from "@/components/shelter/PetForm";
import { ShelterPetListings } from "@/components/shelter/PetListings";
import {
  PublicBrowsePets,
  PublicPetDetails,
} from "@/components/pets/PublicPets";
import {
  AdoptionApplicationWizard,
  OwnerAdoptionApplications,
  ShelterAdoptionApplications,
} from "@/components/adoptions/AdoptionFlow";
import {
  AppointmentBooking,
  OwnerAppointments,
  VetAppointmentManagement,
} from "@/components/appointments/AppointmentFlow";
import {
  AdminAdoptionsScreen,
  AdminAnalyticsScreen,
  AdminDashboard,
  AdminPetsScreen,
  AdminSettingsScreen,
  AdminUsersScreen,
  AdminVerificationScreen,
} from "@/components/admin";
import {
  MedicalTimelineScreen,
  OwnerHealthRecords,
  PrescriptionEditor,
  VaccinationRecords,
  VetPatientRecords,
} from "@/components/medical/MedicalRecords";
import { MessagesInbox } from "@/components/messages/Messages";
import {
  NotificationsScreen,
  RecentNotifications,
} from "@/components/notifications/NotificationsScreen";
import { AdoptionCertificates } from "@/components/documents/AdoptionCertificates";
import type { Pet, PublicPet } from "@/services/pets";

// ── TYPES ────────────────────────────────────────────────────────────────────
type Role = "guest" | AppRole;

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const PETS = [
  {
    id: 1,
    name: "Biscuit",
    breed: "Golden Retriever",
    species: "Dog",
    age: "8 months",
    gender: "Male",
    weight: "12 kg",
    location: "Mirpur, Dhaka",
    shelter: "Dhaka Animal Rescue",
    status: "Available",
    vaccinated: true,
    neutered: false,
    image:
      "https://images.unsplash.com/photo-1599692392256-2d084495fe15?w=600&h=600&fit=crop&auto=format",
    personality: ["Playful", "Friendly", "Energetic"],
    healthNotes: "Healthy, last checkup Dec 2024",
    applications: 3,
  },
  {
    id: 2,
    name: "Luna",
    breed: "Tabby Cat",
    species: "Cat",
    age: "1 year",
    gender: "Female",
    weight: "4 kg",
    location: "Nasirabad, Chittagong",
    shelter: "Chittagong Pet Shelter",
    status: "Available",
    vaccinated: true,
    neutered: true,
    image:
      "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?w=600&h=600&fit=crop&auto=format",
    personality: ["Gentle", "Calm", "Affectionate"],
    healthNotes: "Vaccinated, spayed",
    applications: 1,
  },
  {
    id: 3,
    name: "Oreo",
    breed: "Bernese Mountain Dog",
    species: "Dog",
    age: "2 years",
    gender: "Male",
    weight: "28 kg",
    location: "Zindabazar, Sylhet",
    shelter: "Sylhet Paws Foundation",
    status: "Reserved",
    vaccinated: false,
    neutered: false,
    image:
      "https://images.unsplash.com/photo-1602979677071-1781b7f40023?w=600&h=600&fit=crop&auto=format",
    personality: ["Calm", "Loyal", "Intelligent"],
    healthNotes: "Due for vaccination next month",
    applications: 5,
  },
  {
    id: 4,
    name: "Mochi",
    breed: "Persian Cat",
    species: "Cat",
    age: "6 months",
    gender: "Female",
    weight: "3 kg",
    location: "Gulshan, Dhaka",
    shelter: "Dhaka Animal Rescue",
    status: "Available",
    vaccinated: true,
    neutered: false,
    image:
      "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=600&h=600&fit=crop&auto=format",
    personality: ["Curious", "Playful", "Social"],
    healthNotes: "Recently vaccinated",
    applications: 2,
  },
  {
    id: 5,
    name: "Bruno",
    breed: "German Shepherd",
    species: "Dog",
    age: "3 years",
    gender: "Male",
    weight: "35 kg",
    location: "Rajshahi Sadar",
    shelter: "Rajshahi Animal Care",
    status: "Available",
    vaccinated: true,
    neutered: true,
    image:
      "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&h=600&fit=crop&auto=format",
    personality: ["Protective", "Smart", "Loyal"],
    healthNotes: "Fully vaccinated, neutered",
    applications: 4,
  },
  {
    id: 6,
    name: "Coco",
    breed: "Beagle",
    species: "Dog",
    age: "1.5 years",
    gender: "Female",
    weight: "10 kg",
    location: "Uttara, Dhaka",
    shelter: "Dhaka Animal Rescue",
    status: "Available",
    vaccinated: true,
    neutered: false,
    image:
      "https://images.unsplash.com/photo-1563460716037-460a3ad24ba9?w=600&h=600&fit=crop&auto=format",
    personality: ["Curious", "Merry", "Friendly"],
    healthNotes: "Good health, active",
    applications: 2,
  },
];

const VETS = [
  {
    id: 1,
    name: "Dr. Ariful Haque",
    specialty: "General Practitioner",
    clinic: "Dhaka Pet Clinic",
    location: "Dhanmondi, Dhaka",
    rating: 4.9,
    reviews: 128,
    experience: "12 years",
    fee: 800,
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&auto=format",
    nextSlot: "Today, 3:00 PM",
    available: true,
  },
  {
    id: 2,
    name: "Dr. Fatima Begum",
    specialty: "Veterinary Surgeon",
    clinic: "Chittagong Animal Hospital",
    location: "Nasirabad, Chittagong",
    rating: 4.8,
    reviews: 96,
    experience: "9 years",
    fee: 1000,
    image:
      "https://images.unsplash.com/photo-1581841064838-a470c740e8ee?w=200&h=200&fit=crop&auto=format",
    nextSlot: "Tomorrow, 10:00 AM",
    available: true,
  },
  {
    id: 3,
    name: "Dr. Rezaul Karim",
    specialty: "Dermatologist",
    clinic: "Sylhet Pet Care",
    location: "Zindabazar, Sylhet",
    rating: 4.7,
    reviews: 64,
    experience: "7 years",
    fee: 700,
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&auto=format",
    nextSlot: "Today, 5:30 PM",
    available: false,
  },
];

const APPOINTMENTS = [
  {
    id: 1,
    petName: "Biscuit",
    vetName: "Dr. Ariful Haque",
    clinic: "Dhaka Pet Clinic",
    date: "Jul 30, 2024",
    time: "3:00 PM",
    type: "Checkup",
    status: "Confirmed",
    petImage:
      "https://images.unsplash.com/photo-1599692392256-2d084495fe15?w=100&h=100&fit=crop&auto=format",
  },
  {
    id: 2,
    petName: "Mochi",
    vetName: "Dr. Fatima Begum",
    clinic: "Chittagong Animal Hospital",
    date: "Aug 5, 2024",
    time: "10:00 AM",
    type: "Vaccination",
    status: "Pending",
    petImage:
      "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=100&h=100&fit=crop&auto=format",
  },
  {
    id: 3,
    petName: "Biscuit",
    vetName: "Dr. Rezaul Karim",
    clinic: "Sylhet Pet Care",
    date: "Jul 15, 2024",
    time: "4:00 PM",
    type: "Skin Checkup",
    status: "Completed",
    petImage:
      "https://images.unsplash.com/photo-1599692392256-2d084495fe15?w=100&h=100&fit=crop&auto=format",
  },
  {
    id: 4,
    petName: "Mochi",
    vetName: "Dr. Ariful Haque",
    clinic: "Dhaka Pet Clinic",
    date: "Jun 20, 2024",
    time: "2:00 PM",
    type: "General Exam",
    status: "Completed",
    petImage:
      "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=100&h=100&fit=crop&auto=format",
  },
];

const MESSAGES_DATA = [
  {
    id: 1,
    from: "Dhaka Animal Rescue",
    avatar: "DA",
    role: "Shelter",
    lastMessage:
      "Your application for Biscuit has been reviewed.",
    time: "10:30 AM",
    unread: 2,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "Hello! We received your adoption application for Biscuit.",
        time: "10:00 AM",
      },
      {
        id: 2,
        sender: "me",
        text: "Great! When can we schedule a meet and greet?",
        time: "10:15 AM",
      },
      {
        id: 3,
        sender: "them",
        text: "Your application for Biscuit has been reviewed.",
        time: "10:30 AM",
      },
    ],
  },
  {
    id: 2,
    from: "Dr. Ariful Haque",
    avatar: "AH",
    role: "Veterinarian",
    lastMessage:
      "Please give Biscuit 2 tablets daily for a week.",
    time: "Yesterday",
    unread: 0,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "Your appointment is confirmed for tomorrow at 3 PM.",
        time: "9:00 AM",
      },
      {
        id: 2,
        sender: "me",
        text: "Thank you, doctor!",
        time: "9:05 AM",
      },
      {
        id: 3,
        sender: "them",
        text: "Please give Biscuit 2 tablets daily for a week.",
        time: "Yesterday",
      },
    ],
  },
  {
    id: 3,
    from: "Sylhet Paws Foundation",
    avatar: "SP",
    role: "Shelter",
    lastMessage:
      "Oreo is doing great, looking forward to your visit!",
    time: "2 days ago",
    unread: 1,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "Oreo is doing great, looking forward to your visit!",
        time: "2 days ago",
      },
    ],
  },
];

const ADOPTION_APPS = [
  {
    id: 1,
    petName: "Biscuit",
    shelter: "Dhaka Animal Rescue",
    appliedDate: "Jul 20, 2024",
    status: "Interview",
    step: 3,
    petImage:
      "https://images.unsplash.com/photo-1599692392256-2d084495fe15?w=100&h=100&fit=crop&auto=format",
  },
  {
    id: 2,
    petName: "Luna",
    shelter: "Chittagong Pet Shelter",
    appliedDate: "Jul 10, 2024",
    status: "Approved",
    step: 4,
    petImage:
      "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?w=100&h=100&fit=crop&auto=format",
  },
  {
    id: 3,
    petName: "Bruno",
    shelter: "Rajshahi Animal Care",
    appliedDate: "Jun 28, 2024",
    status: "Completed",
    step: 6,
    petImage:
      "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=100&h=100&fit=crop&auto=format",
  },
];

const SHELTER_APPS = [
  {
    id: 1,
    petName: "Biscuit",
    applicant: "Rafiqul Islam",
    email: "rafiq@email.com",
    location: "Mirpur, Dhaka",
    appliedDate: "Jul 20, 2024",
    status: "Interview",
    experience: "First time",
  },
  {
    id: 2,
    petName: "Luna",
    applicant: "Nadia Sultana",
    email: "nadia@email.com",
    location: "Gulshan, Dhaka",
    appliedDate: "Jul 18, 2024",
    status: "Pending",
    experience: "1 pet currently",
  },
  {
    id: 3,
    petName: "Oreo",
    applicant: "Karim Uddin",
    email: "karim@email.com",
    location: "Banani, Dhaka",
    appliedDate: "Jul 15, 2024",
    status: "Approved",
    experience: "3+ years",
  },
  {
    id: 4,
    petName: "Mochi",
    applicant: "Sumaiya Ahmed",
    email: "sumaiya@email.com",
    location: "Chittagong",
    appliedDate: "Jul 10, 2024",
    status: "Rejected",
    experience: "First time",
  },
  {
    id: 5,
    petName: "Bruno",
    applicant: "Tariqul Hassan",
    email: "tariq@email.com",
    location: "Sylhet",
    appliedDate: "Jul 8, 2024",
    status: "Pending",
    experience: "2 pets previously",
  },
];

const PATIENT_RECORDS = [
  {
    id: 1,
    petName: "Biscuit",
    owner: "Rafiqul Islam",
    breed: "Golden Retriever",
    age: "8 months",
    lastVisit: "Jul 15, 2024",
    nextVisit: "Jul 30, 2024",
    status: "Active",
    conditions: ["Healthy"],
    image:
      "https://images.unsplash.com/photo-1599692392256-2d084495fe15?w=100&h=100&fit=crop&auto=format",
  },
  {
    id: 2,
    petName: "Luna",
    owner: "Nadia Sultana",
    breed: "Tabby Cat",
    age: "1 year",
    lastVisit: "Jul 10, 2024",
    nextVisit: "Aug 10, 2024",
    status: "Follow-up",
    conditions: ["Dermatitis"],
    image:
      "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?w=100&h=100&fit=crop&auto=format",
  },
  {
    id: 3,
    petName: "Bruno",
    owner: "Karim Uddin",
    breed: "German Shepherd",
    age: "3 years",
    lastVisit: "Jun 20, 2024",
    nextVisit: "Aug 20, 2024",
    status: "Active",
    conditions: ["Hip Dysplasia"],
    image:
      "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=100&h=100&fit=crop&auto=format",
  },
];

const GUIDE_ARTICLES = [
  {
    id: 1,
    title: "First Week with Your New Dog",
    category: "Dogs",
    readTime: "5 min",
    image:
      "https://images.unsplash.com/photo-1599692392256-2d084495fe15?w=400&h=200&fit=crop&auto=format",
  },
  {
    id: 2,
    title: "Essential Cat Care Guide",
    category: "Cats",
    readTime: "7 min",
    image:
      "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?w=400&h=200&fit=crop&auto=format",
  },
  {
    id: 3,
    title: "Vaccination Schedule for Pets",
    category: "Health",
    readTime: "4 min",
    image:
      "https://images.unsplash.com/photo-1770836037793-95bdbf190f71?w=400&h=200&fit=crop&auto=format",
  },
  {
    id: 4,
    title: "Nutrition Tips for Young Puppies",
    category: "Dogs",
    readTime: "6 min",
    image:
      "https://images.unsplash.com/photo-1629740067905-bd3f515aa739?w=400&h=200&fit=crop&auto=format",
  },
];

const adoptionTrend = [
  { month: "Feb", adoptions: 12 },
  { month: "Mar", adoptions: 18 },
  { month: "Apr", adoptions: 15 },
  { month: "May", adoptions: 22 },
  { month: "Jun", adoptions: 28 },
  { month: "Jul", adoptions: 35 },
];
const speciesBreakdown = [
  { name: "Dogs", value: 58 },
  { name: "Cats", value: 35 },
  { name: "Others", value: 7 },
];
const COLORS = ["#16A34A", "#86EFAC", "#6B7280"];

const MEET_GREETS = [
  {
    id: 1,
    petName: "Biscuit",
    applicant: "Rafiqul Islam",
    date: "Jul 30, 2024",
    time: "11:00 AM",
    status: "Confirmed",
  },
  {
    id: 2,
    petName: "Oreo",
    applicant: "Karim Uddin",
    date: "Aug 2, 2024",
    time: "3:00 PM",
    status: "Pending",
  },
  {
    id: 3,
    petName: "Luna",
    applicant: "Nadia Sultana",
    date: "Aug 5, 2024",
    time: "10:00 AM",
    status: "Confirmed",
  },
];

const SYS_LOGS = [
  {
    id: 1,
    event: "User login",
    user: "rafiq@email.com",
    ip: "103.121.45.2",
    time: "Jul 30, 2024 10:02 AM",
    level: "Info",
  },
  {
    id: 2,
    event: "Pet listing created",
    user: "dar@email.com",
    ip: "103.121.45.8",
    time: "Jul 30, 2024 9:45 AM",
    level: "Info",
  },
  {
    id: 3,
    event: "Failed login attempt",
    user: "unknown",
    ip: "192.168.1.1",
    time: "Jul 30, 2024 9:10 AM",
    level: "Warning",
  },
  {
    id: 4,
    event: "Adoption approved",
    user: "dar@email.com",
    ip: "103.121.45.8",
    time: "Jul 29, 2024 4:30 PM",
    level: "Info",
  },
  {
    id: 5,
    event: "Account suspended",
    user: "admin@pawsphere.bd",
    ip: "10.0.0.1",
    time: "Jul 29, 2024 2:15 PM",
    level: "Critical",
  },
];

// ── NAVIGATION CONFIG ────────────────────────────────────────────────────────
const NAV: Record<
  string,
  { icon: React.ReactNode; label: string; view: string }[]
> = {
  owner: [
    {
      icon: <Home size={16} />,
      label: "Dashboard",
      view: "dashboard",
    },
    {
      icon: <Search size={16} />,
      label: "Browse Pets",
      view: "browse-pets",
    },
    {
      icon: <Stethoscope size={16} />,
      label: "Find Vet",
      view: "find-vet",
    },
    {
      icon: <ClipboardList size={16} />,
      label: "Adoption",
      view: "adoption",
    },
    {
      icon: <PawPrint size={16} />,
      label: "My Pets",
      view: "my-pets",
    },
    {
      icon: <Calendar size={16} />,
      label: "Appointments",
      view: "appointments",
    },
    {
      icon: <Activity size={16} />,
      label: "Health Records",
      view: "health-records",
    },
    {
      icon: <MessageSquare size={16} />,
      label: "Messages",
      view: "messages",
    },
    {
      icon: <Bell size={16} />,
      label: "Notifications",
      view: "notifications",
    },
    {
      icon: <Bookmark size={16} />,
      label: "Favorites",
      view: "favorites",
    },
    {
      icon: <BookOpen size={16} />,
      label: "Pet Care Guide",
      view: "guide",
    },
    {
      icon: <Settings size={16} />,
      label: "Settings",
      view: "settings",
    },
  ],
  shelter: [
    {
      icon: <Home size={16} />,
      label: "Dashboard",
      view: "dashboard",
    },
    {
      icon: <Plus size={16} />,
      label: "Add Pet",
      view: "add-pet",
    },
    {
      icon: <Layers size={16} />,
      label: "Pet Listings",
      view: "pet-listings",
    },
    {
      icon: <ClipboardList size={16} />,
      label: "Applications",
      view: "applications",
    },
    {
      icon: <Calendar size={16} />,
      label: "Meet & Greet",
      view: "meet-greet",
    },
    {
      icon: <MessageSquare size={16} />,
      label: "Messages",
      view: "messages",
    },
    {
      icon: <Award size={16} />,
      label: "Certificates",
      view: "certificates",
    },
    {
      icon: <BarChart2 size={16} />,
      label: "Analytics",
      view: "analytics",
    },
    {
      icon: <Settings size={16} />,
      label: "Settings",
      view: "settings",
    },
  ],
  vet: [
    {
      icon: <Home size={16} />,
      label: "Dashboard",
      view: "dashboard",
    },
    {
      icon: <Calendar size={16} />,
      label: "Appointments",
      view: "appointments",
    },
    {
      icon: <ClipboardList size={16} />,
      label: "Patient Records",
      view: "patients",
    },
    {
      icon: <Pill size={16} />,
      label: "Prescriptions",
      view: "prescriptions",
    },
    {
      icon: <Syringe size={16} />,
      label: "Vaccinations",
      view: "vaccinations",
    },
    {
      icon: <Activity size={16} />,
      label: "Medical History",
      view: "medical-history",
    },
    {
      icon: <MessageSquare size={16} />,
      label: "Messages",
      view: "messages",
    },
    {
      icon: <Settings size={16} />,
      label: "Settings",
      view: "settings",
    },
  ],
  admin: [
    {
      icon: <Home size={16} />,
      label: "Dashboard",
      view: "dashboard",
    },
    {
      icon: <Users size={16} />,
      label: "Users",
      view: "users",
    },
    {
      icon: <UserCheck size={16} />,
      label: "Verification",
      view: "verification",
    },
    {
      icon: <PawPrint size={16} />,
      label: "Pets & Listings",
      view: "pets-listings",
    },
    {
      icon: <ClipboardList size={16} />,
      label: "Adoptions",
      view: "adoptions",
    },
    {
      icon: <BarChart2 size={16} />,
      label: "Analytics",
      view: "analytics",
    },
    {
      icon: <Megaphone size={16} />,
      label: "Broadcasts",
      view: "broadcasts",
    },
    {
      icon: <Flag size={16} />,
      label: "Moderation",
      view: "moderation",
    },
    {
      icon: <HelpCircle size={16} />,
      label: "Feedback",
      view: "feedback",
    },
    {
      icon: <Terminal size={16} />,
      label: "System Logs",
      view: "logs",
    },
    {
      icon: <Settings size={16} />,
      label: "Settings",
      view: "settings",
    },
  ],
};

const roleNames: Record<string, string> = {
  owner: "Rafiqul Islam",
  shelter: "Dhaka Animal Rescue",
  vet: "Dr. Ariful Haque",
  admin: "Super Admin",
};
const roleAvatars: Record<string, string> = {
  owner: "RI",
  shelter: "DA",
  vet: "AH",
  admin: "SA",
};
const roleLabels: Record<string, string> = {
  owner: "Pet Owner",
  shelter: "Shelter",
  vet: "Veterinarian",
  admin: "Administrator",
};

// ── SHARED UI ────────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  Available: "bg-green-100 text-green-700",
  Reserved: "bg-amber-100 text-amber-700",
  Adopted: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Interview: "bg-purple-100 text-purple-700",
  Completed: "bg-blue-100 text-blue-700",
  Confirmed: "bg-green-100 text-green-700",
  Active: "bg-green-100 text-green-700",
  "Follow-up": "bg-amber-100 text-amber-700",
  Info: "bg-blue-100 text-blue-700",
  Warning: "bg-amber-100 text-amber-700",
  Critical: "bg-red-100 text-red-700",
};

function Badge({ status }: { status: string }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusColors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color = "green",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  const bg =
    color === "green"
      ? "bg-[#DCFCE7] text-[#16A34A]"
      : color === "amber"
        ? "bg-amber-100 text-amber-600"
        : color === "blue"
          ? "bg-blue-100 text-blue-600"
          : "bg-purple-100 text-purple-600";
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5">
      <div
        className={`w-9 h-9 rounded-[10px] flex items-center justify-center mb-3 ${bg}`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-[#111827]">
        {value}
      </p>
      <p className="text-sm text-[#6B7280] mt-0.5">{label}</p>
      {sub && (
        <p className="text-xs text-[#16A34A] mt-1 font-medium">
          {sub}
        </p>
      )}
    </div>
  );
}

function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#6B7280] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyState({
  title = "Nothing here yet",
  text,
  action,
  icon: Icon = PawPrint,
}: {
  title?: string;
  text: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#16A34A]">
        <Icon size={23} />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[#6B7280]">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function VerificationBadge({ type = "Verified" }: { type?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2 py-1 text-[10px] font-semibold text-[#15803D]">
      <BadgeCheck size={12} /> {type}
    </span>
  );
}

function SuccessNotice({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-[14px] border border-[#BBF7D0] bg-white p-4 shadow-xl shadow-green-950/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]"><CheckCircle size={17} /></div>
      <div className="flex-1"><p className="text-sm font-semibold text-[#111827]">All set</p><p className="mt-0.5 text-xs leading-5 text-[#6B7280]">{message}</p></div>
      <button onClick={onClose} className="text-[#9CA3AF] transition-colors hover:text-[#374151]" aria-label="Dismiss notification"><X size={15} /></button>
    </div>
  );
}

function WelcomeModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const next = role === "owner" ? "Browse pets or book Biscuit's next checkup." : role === "shelter" ? "Review new applications and keep your listings current." : role === "vet" ? "Your appointments and patient records are ready." : "Your platform overview is ready to review.";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[20px] bg-white p-7 shadow-2xl shadow-slate-900/20">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#16A34A]"><Sparkles size={22} /></div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#16A34A]">Welcome to PawSphere</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#111827]">Your {roleLabels[role]} space is ready.</h2>
        <p className="mt-3 text-sm leading-6 text-[#6B7280]">{next} We’ll keep the essentials clear and close at hand.</p>
        <div className="mt-6 flex items-center justify-between rounded-[12px] bg-[#F8FAFC] p-3 text-xs text-[#6B7280]"><span className="flex items-center gap-2"><CheckCircle size={15} className="text-[#16A34A]" /> Profile workspace activated</span><span>1 of 1</span></div>
        <button onClick={onClose} className="mt-5 flex w-full items-center justify-center gap-2 rounded-[11px] bg-[#16A34A] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#15803D] hover:shadow-lg hover:shadow-green-900/15">Take me to my dashboard <ArrowRight size={15} /></button>
      </div>
    </div>
  );
}

function ReminderWidget() {
  return (
    <div className="rounded-[14px] border border-[#BBF7D0] bg-[#F0FDF4] p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-1.5 text-xs font-semibold text-[#166534]"><Bell size={14} /> Upcoming reminder</p><p className="mt-2 text-sm font-semibold text-[#111827]">Biscuit’s checkup is tomorrow</p><p className="mt-1 text-xs text-[#4B5563]">Jul 30 · 3:00 PM · Dhaka Pet Clinic</p></div><Calendar size={18} className="text-[#16A34A]" /></div>
      <button className="mt-3 text-xs font-semibold text-[#15803D] transition-colors hover:text-[#166534]">View appointment <ChevronRight className="inline" size={14} /></button>
    </div>
  );
}

function LoadingCards() {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white"><Skeleton className="h-44 rounded-none" /><div className="space-y-3 p-4"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}</div>;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gradient-to-r from-[#F1F5F9] via-[#EAF3EC] to-[#F1F5F9] bg-[length:200%_100%] ${className}`} />;
}

function DashboardCardSkeletons() {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="rounded-[18px] border border-[#E5E7EB] bg-white p-5"><Skeleton className="h-9 w-9" /><Skeleton className="mt-4 h-6 w-16" /><Skeleton className="mt-2 h-3 w-24" /></div>)}</div>;
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white p-5"><Skeleton className="h-4 w-1/3" />{Array.from({ length: rows }, (_, index) => <div key={index} className="mt-5 grid grid-cols-4 gap-4"><Skeleton className="h-4" /><Skeleton className="h-4" /><Skeleton className="h-4" /><Skeleton className="h-4" /></div>)}</div>;
}

function ChatListSkeleton() {
  return <div className="space-y-4 rounded-[18px] border border-[#E5E7EB] bg-white p-5">{[1, 2, 3, 4].map((item) => <div key={item} className="flex gap-3"><Skeleton className="h-10 w-10 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-3/4" /></div></div>)}</div>;
}

function FormSkeleton() {
  return <div className="space-y-4 rounded-[18px] border border-[#E5E7EB] bg-white p-6">{[1, 2, 3].map((item) => <div key={item}><Skeleton className="mb-2 h-3 w-24" /><Skeleton className="h-11 w-full" /></div>)}<Skeleton className="h-11 w-32" /></div>;
}

function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/40 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-[18px] bg-white p-6 shadow-2xl shadow-slate-900/15"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500"><AlertCircle size={20} /></div><h2 className="mt-4 text-lg font-bold text-[#111827]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6B7280]">{description}</p><div className="mt-6 flex gap-3"><button onClick={onCancel} className="flex-1 rounded-[14px] border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#F8FAFC]">Keep it</button><button onClick={onConfirm} className="flex-1 rounded-[14px] bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600">{confirmLabel}</button></div></div></div>;
}

function Breadcrumbs({ items }: { items: string[] }) {
  return <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">{items.map((item, index) => <span key={`${item}-${index}`} className="flex items-center gap-1.5">{index > 0 && <ChevronRight size={13} className="text-[#9CA3AF]" />}<span className={index === items.length - 1 ? "text-[#111827]" : ""}>{item}</span></span>)}</nav>;
}

function DocumentPreviewModal({ open, title, onClose }: { open: boolean; title: string; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/40 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[18px] bg-white shadow-2xl shadow-slate-900/15"><div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4"><div><p className="text-sm font-semibold text-[#111827]">{title}</p><p className="mt-0.5 text-xs text-[#6B7280]">Document preview</p></div><button onClick={onClose} aria-label="Close preview" className="rounded-[10px] p-2 text-[#6B7280] hover:bg-[#F8FAFC]"><X size={18} /></button></div><div className="m-6 flex min-h-[320px] flex-1 items-center justify-center rounded-[14px] border border-dashed border-[#D1D5DB] bg-[#F8FAFC]"><div className="text-center"><FileText size={36} className="mx-auto text-[#16A34A]" /><p className="mt-3 text-sm font-semibold text-[#374151]">PDF preview</p><p className="mt-1 text-xs text-[#9CA3AF]">A secure preview would appear here.</p></div></div><div className="flex flex-wrap justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4"><button onClick={onClose} className="rounded-[14px] border border-[#E5E7EB] px-4 py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#F8FAFC]">Close</button><button className="flex items-center gap-2 rounded-[14px] border border-[#16A34A] px-4 py-2.5 text-sm font-semibold text-[#15803D] hover:bg-[#F0FDF4]"><Printer size={15} /> Print</button><button className="flex items-center gap-2 rounded-[14px] bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D]"><FileDown size={15} /> Download</button></div></div></div>;
}

function ErrorPage({ code, title, message, onHome }: { code: "403" | "404" | "500"; title: string; message: string; onHome: () => void }) {
  return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6"><div className="max-w-md text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F0FDF4] text-[#16A34A]"><PawPrint size={38} /></div><p className="mt-7 text-sm font-bold tracking-[0.2em] text-[#16A34A]">ERROR {code}</p><h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-[#111827]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#6B7280]">{message}</p><div className="mt-7 flex justify-center gap-3"><button onClick={onHome} className="rounded-[14px] bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#15803D]">Back to home</button><button onClick={() => window.location.reload()} className="rounded-[14px] border border-[#E5E7EB] px-5 py-3 text-sm font-semibold text-[#374151] hover:bg-white">Try again</button></div></div></div>;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4"><div className="w-full max-w-sm rounded-[18px] border border-[#E5E7EB] bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">{children}</div></div>;
}

function RegistrationSuccessScreen({ role, emailConfirmationRequired, onContinue }: { role: Role; emailConfirmationRequired: boolean; onContinue: () => void }) {
  return <AuthShell><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]"><CheckCircle size={28} /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-[#16A34A]">Account created</p><h1 className="mt-2 text-2xl font-bold text-[#111827]">{emailConfirmationRequired ? "Check your email" : "Welcome to PawSphere"}</h1><p className="mt-3 text-sm leading-6 text-[#6B7280]">{emailConfirmationRequired ? "Confirm your email address using the link Supabase sent you, then return here to sign in." : `Your ${roleLabels[role]} account has been created successfully.`} {!emailConfirmationRequired && (role === "shelter" || role === "vet") ? "Your profile is now pending administrator approval." : null}</p><button onClick={onContinue} className="mt-7 w-full rounded-[14px] bg-[#16A34A] py-3 text-sm font-semibold text-white hover:bg-[#15803D]">Go to Sign In</button></AuthShell>;
}

function VerificationPendingScreen({ role, onLogout }: { role: "shelter" | "vet"; onLogout: () => void }) {
  const documents = role === "shelter" ? ["Shelter registration certificate", "Director identity document"] : ["Veterinary license", "Professional identity document"];
  return <AuthShell><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#16A34A]"><ShieldCheck size={27} /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-[#16A34A]">Verification in progress</p><h1 className="mt-2 text-2xl font-bold text-[#111827]">We’re reviewing your account</h1><p className="mt-3 text-sm leading-6 text-[#6B7280]">Your {roleLabels[role].toLowerCase()} profile is pending admin approval. We’ll notify you once it’s ready.</p><div className="mt-6 rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFC] p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#111827]">Submitted documents</p><Badge status="Pending" /></div><div className="mt-3 space-y-2">{documents.map((document) => <div key={document} className="flex items-center gap-2 text-xs text-[#6B7280]"><FileCheck2 size={14} className="text-[#16A34A]" /> {document}</div>)}</div></div><p className="mt-4 text-xs text-[#6B7280]"><Clock className="mr-1 inline text-[#16A34A]" size={14} />Estimated review time: 1–2 business days</p><button className="mt-6 w-full rounded-[14px] border border-[#16A34A] py-2.5 text-sm font-semibold text-[#15803D] hover:bg-[#F0FDF4]">Contact support</button><button onClick={onLogout} className="mt-3 w-full py-2 text-sm font-semibold text-[#6B7280] hover:text-[#111827]">Log out</button></AuthShell>;
}

function ForgotPasswordScreen({ navigate }: { navigate: (view: string) => void }) {
  return <AuthShell><button onClick={() => navigate("login")} className="text-sm font-semibold text-[#6B7280] hover:text-[#111827]">← Back to sign in</button><h1 className="mt-7 text-2xl font-bold text-[#111827]">Reset your password</h1><p className="mt-2 text-sm leading-6 text-[#6B7280]">Enter your email and we’ll send a password reset link.</p><input type="email" placeholder="Email address" className="mt-6 w-full rounded-[14px] border border-[#E5E7EB] px-3 py-3 text-sm outline-none focus:border-[#16A34A]" /><button onClick={() => navigate("reset-sent")} className="mt-4 w-full rounded-[14px] bg-[#16A34A] py-3 text-sm font-semibold text-white hover:bg-[#15803D]">Send reset link</button></AuthShell>;
}

function ResetSentScreen({ navigate }: { navigate: (view: string) => void }) {
  return <AuthShell><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]"><MailCheck size={27} /></div><h1 className="mt-6 text-2xl font-bold text-[#111827]">Check your inbox</h1><p className="mt-3 text-sm leading-6 text-[#6B7280]">If an account exists for that email, we’ve sent a reset link. This is a frontend-only demo, so no email will be delivered.</p><button onClick={() => navigate("login")} className="mt-7 w-full rounded-[14px] bg-[#16A34A] py-3 text-sm font-semibold text-white hover:bg-[#15803D]">Back to Sign In</button></AuthShell>;
}

// ── DASHBOARD LAYOUT ─────────────────────────────────────────────────────────
function DashboardLayout({
  role,
  view,
  setView,
  children,
  onSignOut,
}: {
  role: AppRole;
  view: string;
  setView: (v: string) => void;
  children: React.ReactNode;
  onSignOut: () => Promise<void>;
}) {
  const { profile, user } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navItems = NAV[role] || [];
  const displayName = profile?.full_name?.trim() || roleNames[role] || "User";
  const displayInitials = getInitials(displayName);
  const displayRole = roleLabels[role] || role;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <aside
        className={`${collapsed ? "w-[60px]" : "w-[240px] max-lg:w-[64px]"} flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-200`}
      >
        <div className="h-[68px] flex items-center px-4 border-b border-[#E5E7EB] gap-2.5">
          <div className="w-7 h-7 bg-[#16A34A] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              P
            </span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-[#111827] max-lg:hidden">
              PawSphere
            </span>
          )}
        </div>
        <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const active = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors ${active ? "bg-[#DCFCE7] text-[#16A34A]" : "text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#111827]"}`}
              >
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
                {!collapsed && <span className="max-lg:hidden">{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-[#E5E7EB] p-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div className="w-7 h-7 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {displayInitials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-[#111827] truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-[#9CA3AF]">
                  {displayRole}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => void onSignOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={15} className="flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[68px] bg-white border-b border-[#E5E7EB] flex items-center px-6 gap-4 flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1 max-w-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-3 py-2">
            <Search size={14} className="text-[#9CA3AF]" />
            <input
              className="text-sm text-[#111827] placeholder-[#9CA3AF] bg-transparent outline-none flex-1"
              placeholder="Search..."
            />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setView("notifications")}
              className="relative w-9 h-9 flex items-center justify-center text-[#6B7280] hover:bg-[#F8FAFC] rounded-[10px] transition-colors"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setView("messages")}
              className="w-9 h-9 flex items-center justify-center text-[#6B7280] hover:bg-[#F8FAFC] rounded-[10px] transition-colors"
            >
              <MessageSquare size={16} />
            </button>
            <div className="relative ml-2"><button onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16A34A] text-[11px] font-bold text-white ring-offset-2 transition hover:ring-2 hover:ring-[#BBF7D0]">{displayInitials}</button>{profileOpen && <div className="absolute right-0 top-11 z-40 w-48 rounded-[14px] border border-[#E5E7EB] bg-white p-1.5 shadow-xl shadow-slate-900/10"><div className="border-b border-[#F1F5F9] px-3 py-2"><p className="text-xs font-semibold text-[#111827]">{displayName}</p><p className="text-[10px] text-[#9CA3AF]">{displayRole}</p></div><button onClick={() => { setView("settings"); setProfileOpen(false); }} className="mt-1 flex w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left text-xs font-medium text-[#374151] hover:bg-[#F8FAFC]"><User size={14} /> My Profile</button><button onClick={() => { setView("settings"); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left text-xs font-medium text-[#374151] hover:bg-[#F8FAFC]"><Settings size={14} /> Settings</button><button onClick={() => { setView(role === "owner" ? "guide" : "settings"); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left text-xs font-medium text-[#374151] hover:bg-[#F8FAFC]"><LifeBuoy size={14} /> Help</button><button onClick={() => void onSignOut()} className="mt-1 flex w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50"><LogOut size={14} /> Logout</button></div>}</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── AUTH SCREENS ─────────────────────────────────────────────────────────────
function LoginScreen({
  navigate,
}: {
  navigate: (view: string) => void;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-[#E5E7EB] rounded-[18px] p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-7">
          <div className="w-7 h-7 bg-[#16A34A] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              P
            </span>
          </div>
          <span className="font-semibold text-[#111827]">
            PawSphere
          </span>
        </div>
        <h2 className="text-xl font-bold text-[#111827] mb-1">
          Welcome back
        </h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Sign in to your account
        </p>
        <form onSubmit={handleSubmit}>
        <div className="space-y-3 mb-5">
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
          />
        </div>
        <button type="button" onClick={() => navigate("forgot-password")} className="-mt-3 mb-5 text-xs font-semibold text-[#16A34A] hover:text-[#15803D]">Forgot password?</button>
        {error && <p role="alert" className="mb-4 rounded-[10px] bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#16A34A] text-white text-sm font-medium py-2.5 rounded-[10px] hover:bg-[#15803D] transition-colors mb-4"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        </form>
        <p className="text-center text-sm text-[#6B7280]">
          No account?{" "}
          <button
            onClick={() => navigate("register")}
            className="text-[#16A34A] font-medium"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterScreen({
  navigate,
}: {
  navigate: (view: string) => void;
}) {
  const routerNavigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<PublicRole>("owner");
  const [completed, setCompleted] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    shelterName: "",
    address: "",
    registrationNumber: "",
    clinicName: "",
    specialty: "",
    licenseNumber: "",
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const commonFields = [form.fullName, form.email, form.phone, form.password];
    const roleFields =
      selectedRole === "shelter"
        ? [form.shelterName, form.address, form.registrationNumber]
        : selectedRole === "vet"
          ? [form.clinicName, form.specialty, form.licenseNumber]
          : [];

    if ([...commonFields, ...roleFields].some((value) => !value.trim())) {
      setError("Complete all required fields.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      };

      const result =
        selectedRole === "shelter"
          ? await signUpShelter({
              ...payload,
              shelterName: form.shelterName,
              address: form.address,
              registrationNumber: form.registrationNumber,
            })
          : selectedRole === "vet"
            ? await signUpVet({
                ...payload,
                clinicName: form.clinicName,
                specialty: form.specialty,
                licenseNumber: form.licenseNumber,
              })
            : await signUpOwner(payload);

      // Wait for AuthContext to load/create the profile before routing.
      if (result.session) {
        await refreshProfile();
        routerNavigate(
          selectedRole === "shelter" || selectedRole === "vet"
            ? "/verification-pending"
            : ROLE_HOME_PATHS[selectedRole],
          { replace: true },
        );
        return;
      }

      setEmailConfirmationRequired(result.emailConfirmationRequired);
      setCompleted(true);
    } catch (signUpError) {
      console.error("[PawSphere] RegisterScreen signup failed", signUpError);
      setError(
        signUpError instanceof Error
          ? signUpError.message
          : "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (completed) return <RegistrationSuccessScreen role={selectedRole} emailConfirmationRequired={emailConfirmationRequired} onContinue={() => navigate("login")} />;
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-[#E5E7EB] rounded-[18px] p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-7">
          <div className="w-7 h-7 bg-[#16A34A] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              P
            </span>
          </div>
          <span className="font-semibold text-[#111827]">
            PawSphere
          </span>
        </div>
        <div className="flex gap-1 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? "bg-[#16A34A]" : "bg-[#E5E7EB]"}`}
            />
          ))}
        </div>
        {step === 1 ? (
          <>
            <h2 className="text-xl font-bold text-[#111827] mb-1">
              Create account
            </h2>
            <p className="text-sm text-[#6B7280] mb-5">
              Choose your account type
            </p>
            <div className="space-y-2 mb-6">
              {(
                [
                  [
                    "owner",
                    "Pet Owner / Adopter",
                    "Browse & adopt pets, book vet care",
                  ],
                  [
                    "shelter",
                    "Animal Shelter",
                    "List pets and manage adoptions",
                  ],
                  [
                    "vet",
                    "Veterinarian",
                    "Manage patients and appointments",
                  ],
                ] as [PublicRole, string, string][]
              ).map(([val, label, desc]) => (
                <button
                  key={val}
                  onClick={() => setSelectedRole(val)}
                  className={`w-full text-left border rounded-[10px] px-4 py-3 transition-colors ${selectedRole === val ? "border-[#16A34A] bg-[#F0FDF4]" : "border-[#E5E7EB] hover:border-[#D1FAE5]"}`}
                >
                  <p className="text-sm font-medium text-[#111827]">
                    {label}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {desc}
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-[#16A34A] text-white text-sm font-medium py-2.5 rounded-[10px] hover:bg-[#15803D] transition-colors"
            >
              Continue
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold text-[#111827] mb-1">
              Your details
            </h2>
            <p className="text-sm text-[#6B7280] mb-5">
              Fill in your information
            </p>
            <div className="space-y-3 mb-5">
              <input
                placeholder="Full name"
                autoComplete="name"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
              />
              <input
                placeholder="Email address"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
              />
              <input
                placeholder="Phone number"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
              />
              <input
                placeholder="Password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
              />
              {selectedRole === "shelter" && (
                <>
                  <input placeholder="Shelter name" value={form.shelterName} onChange={(event) => updateField("shelterName", event.target.value)} className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
                  <input placeholder="Shelter address" value={form.address} onChange={(event) => updateField("address", event.target.value)} className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
                  <input placeholder="Registration number" value={form.registrationNumber} onChange={(event) => updateField("registrationNumber", event.target.value)} className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
                </>
              )}
              {selectedRole === "vet" && (
                <>
                  <input placeholder="Clinic name" value={form.clinicName} onChange={(event) => updateField("clinicName", event.target.value)} className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
                  <input placeholder="Specialty" value={form.specialty} onChange={(event) => updateField("specialty", event.target.value)} className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
                  <input placeholder="Veterinary license number" value={form.licenseNumber} onChange={(event) => updateField("licenseNumber", event.target.value)} className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
                </>
              )}
            </div>
            {error && <p role="alert" className="mb-3 rounded-[10px] bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16A34A] text-white text-sm font-medium py-2.5 rounded-[10px] hover:bg-[#15803D] transition-colors mb-3"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-[#6B7280] hover:text-[#111827]"
            >
              ← Back
            </button>
          </form>
        )}
        <p className="text-center text-sm text-[#6B7280] mt-4">
          Have an account?{" "}
          <button
            onClick={() => navigate("login")}
            className="text-[#16A34A] font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

// ── PUBLIC SCREENS ────────────────────────────────────────────────────────────
function BrowsePetsScreen({
  navigate,
}: {
  navigate: (view: string, id?: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("All");
  const [liked, setLiked] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setLoading(false), 420); return () => window.clearTimeout(timer); }, []);
  const filtered = PETS.filter(
    (p) =>
      (species === "All" || p.species === species) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.breed.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div>
      <PageTitle
        title="Browse Pets"
        subtitle="Find your perfect companion"
        action={
          <button
            onClick={() => navigate("login")}
            className="text-sm font-medium bg-[#16A34A] text-white px-4 py-2 rounded-[10px] hover:bg-[#15803D] transition-colors"
          >
            Sign In to Apply
          </button>
        }
      />
      <div className="flex gap-6">
        <div className="w-52 flex-shrink-0 space-y-3">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4">
            <p className="text-xs font-semibold text-[#111827] uppercase tracking-wider mb-3">
              Species
            </p>
            {["All", "Dog", "Cat"].map((s) => (
              <label
                key={s}
                className="flex items-center gap-2.5 py-1.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name="species"
                  checked={species === s}
                  onChange={() => setSpecies(s)}
                  className="accent-[#16A34A]"
                />
                <span className="text-sm text-[#374151]">
                  {s}
                </span>
              </label>
            ))}
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4">
            <p className="text-xs font-semibold text-[#111827] uppercase tracking-wider mb-3">
              Status
            </p>
            {["Available", "Reserved"].map((s) => (
              <label
                key={s}
                className="flex items-center gap-2.5 py-1.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-[#16A34A]"
                />
                <span className="text-sm text-[#374151]">
                  {s}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2 flex-1 bg-white border border-[#E5E7EB] rounded-[10px] px-3 py-2">
              <Search size={14} className="text-[#9CA3AF]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search breed, name..."
                className="text-sm outline-none flex-1 placeholder-[#9CA3AF]"
              />
            </div>
            <span className="text-sm text-[#6B7280] whitespace-nowrap">
              {filtered.length} pets
            </span>
          </div>
          {loading ? <LoadingCards /> : filtered.length === 0 ? (
            <EmptyState title="No pets match that search" text="Try a different name, breed, or species to meet more companions." action={<button onClick={() => { setSearch(""); setSpecies("All"); }} className="rounded-[9px] bg-[#16A34A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15803D]">Clear filters</button>} />
          ) : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((pet) => (
              <div
                key={pet.id}
                className="bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                onClick={() => navigate("pet-detail", pet.id)}
              >
                <div className="relative bg-[#F1F5F9]">
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-44 object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLiked((p) =>
                        p.includes(pet.id)
                          ? p.filter((i) => i !== pet.id)
                          : [...p, pet.id],
                      );
                    }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm"
                  >
                    <Heart
                      size={13}
                      className={
                        liked.includes(pet.id)
                          ? "fill-red-500 text-red-500"
                          : "text-[#9CA3AF]"
                      }
                    />
                  </button>
                </div>
                <div className="p-3.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-[#111827] text-sm">
                      {pet.name}
                    </p>
                    <Badge status={pet.status} />
                  </div>
                  <p className="text-xs text-[#6B7280] mb-1">
                    {pet.breed} · {pet.age}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pet.personality.slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-medium text-[#15803D]">{tag}</span>)}
                    <span className="rounded-full bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]">Apartment-friendly</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#9CA3AF]">
                    <span className="flex items-center gap-1"><MapPin size={10} />{pet.location}</span>
                    <VerificationBadge type="Verified shelter" />
                  </div>
                </div>
              </div>
            ))}
          </div>}
        </div>
      </div>
    </div>
  );
}

function PetDetailScreen({
  petId,
  navigate,
}: {
  petId: number;
  navigate: (view: string) => void;
}) {
  const pet = PETS.find((p) => p.id === petId) || PETS[0];
  const gallery = [pet.image, "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=900&h=700&fit=crop&auto=format", "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=900&h=700&fit=crop&auto=format"];
  const [activeImage, setActiveImage] = useState(0);
  return (
    <div className="max-w-4xl">
      <Breadcrumbs items={["Browse Pets", pet.name]} />
      <button
        onClick={() => navigate("browse-pets")}
        className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
      >
        <ChevronLeft size={15} /> Back to Browse
      </button>
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="group relative overflow-hidden rounded-[18px] bg-[#F1F5F9]">
            <img src={gallery[activeImage]} alt={`${pet.name} gallery image ${activeImage + 1}`} className="h-80 w-full object-cover transition-opacity duration-300" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/45 to-transparent px-4 pb-4 pt-10">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#374151]">{activeImage + 1} / {gallery.length}</span>
              <div className="flex gap-1.5"><button onClick={() => setActiveImage((activeImage + gallery.length - 1) % gallery.length)} aria-label="Previous image" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#374151] hover:bg-white"><ChevronLeft size={16} /></button><button onClick={() => setActiveImage((activeImage + 1) % gallery.length)} aria-label="Next image" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#374151] hover:bg-white"><ChevronRight size={16} /></button></div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {gallery.map((img, i) => <button key={img} onClick={() => setActiveImage(i)} className={`overflow-hidden rounded-[10px] border-2 transition-all ${activeImage === i ? "border-[#16A34A]" : "border-transparent opacity-70 hover:opacity-100"}`}><img src={img} alt={`View image ${i + 1}`} className="h-20 w-full object-cover" /></button>)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge status={pet.status} />
            {pet.vaccinated && (
              <span className="text-[11px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                Vaccinated
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#111827] mb-1">
            {pet.name}
          </h1>
          <p className="text-[#6B7280] mb-4">
            {pet.breed} · {pet.age} · {pet.gender}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              ["Weight", pet.weight],
              ["Location", pet.location],
              ["Shelter", pet.shelter],
              ["Applications", `${pet.applications} pending`],
            ].map(([k, v]) => (
              <div
                key={k}
                className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] p-3"
              >
                <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wider">
                  {k}
                </p>
                <p className="text-sm font-medium text-[#111827] mt-0.5">
                  {v}
                </p>
              </div>
            ))}
          </div>
          <div className="mb-5 flex items-center gap-2 text-xs text-[#6B7280]"><VerificationBadge type="Verified shelter" /><span>{pet.shelter} has confirmed identity and care standards.</span></div>

          <div className="mb-5">
            <p className="text-sm font-semibold text-[#111827] mb-2">
              Personality
            </p>
            <div className="flex gap-2 flex-wrap">
              {pet.personality.map((p) => (
                <span
                  key={p}
                  className="text-xs font-medium bg-[#F0FDF4] text-[#16A34A] px-3 py-1 rounded-full"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px] p-3 mb-6">
            <p className="text-xs font-semibold text-[#111827] mb-1">
              Health Notes
            </p>
            <p className="text-sm text-[#6B7280]">
              {pet.healthNotes}
            </p>
          </div>

          <button
            onClick={() => navigate("login")}
            className="w-full bg-[#16A34A] text-white font-semibold py-3 rounded-[12px] hover:bg-[#15803D] transition-colors"
          >
            Apply to Adopt {pet.name}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MESSAGES (shared across roles) ────────────────────────────────────────────
function MessagesScreen() {
  const [selected, setSelected] = useState(0);
  const [input, setInput] = useState("");
  const [chats, setChats] = useState(MESSAGES_DATA);
  const [callNotice, setCallNotice] = useState("");
  const conv = chats[selected];

  const send = () => {
    if (!input.trim()) return;
    const updated = chats.map((c, i) =>
      i === selected
        ? {
            ...c,
            messages: [
              ...c.messages,
              {
                id: Date.now(),
                sender: "me" as const,
                text: input,
                time: "Now",
              },
            ],
            lastMessage: input,
          }
        : c,
    );
    setChats(updated);
    setInput("");
  };

  return (
    <div>
      <PageTitle title="Messages" />
      {chats.length === 0 ? <EmptyState title="Your inbox is calm" text="When a shelter or veterinarian replies, the conversation will appear here." icon={MessageSquare} action={<button className="rounded-[14px] bg-[#16A34A] px-4 py-2.5 text-xs font-semibold text-white">Browse pets</button>} /> : <div className="flex bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden h-[600px]">
        <div className="w-72 border-r border-[#E5E7EB] flex flex-col">
          <div className="p-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-[8px] px-3 py-2">
              <Search size={13} className="text-[#9CA3AF]" />
              <input
                className="text-sm outline-none bg-transparent flex-1 placeholder-[#9CA3AF]"
                placeholder="Search..."
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelected(i)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] ${selected === i ? "bg-[#F0FDF4]" : ""}`}
              >
                <div className="w-9 h-9 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#111827] truncate">
                      {c.from}
                    </p>
                    <span className="text-[11px] text-[#9CA3AF] flex-shrink-0 ml-1">
                      {c.time}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] truncate">
                    {c.lastMessage}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="w-4 h-4 bg-[#16A34A] rounded-full text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex h-[72px] items-center gap-3 border-b border-[#E5E7EB] px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16A34A] text-[11px] font-bold text-white">{conv.avatar}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#111827]">{conv.from}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-[#6B7280]"><span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" /> Online · {conv.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCallNotice("Voice call feature coming soon")} aria-label="Voice call" title="Voice call coming soon" className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#E5E7EB] bg-white text-[#16A34A] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><Phone size={17} /></button>
              <button onClick={() => setCallNotice("Video call feature coming soon")} aria-label="Video call" title="Video call coming soon" className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#16A34A] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#15803D] hover:shadow-md"><Video size={17} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {conv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[65%] px-4 py-2.5 rounded-[12px] text-sm ${msg.sender === "me" ? "bg-[#16A34A] text-white rounded-br-[4px]" : "bg-[#F1F5F9] text-[#111827] rounded-bl-[4px]"}`}
                >
                  <p>{msg.text}</p>
                  <p
                    className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-green-200" : "text-[#9CA3AF]"}`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-[#E5E7EB] flex items-center gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message..."
              className="flex-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-4 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
            />
            <button
              onClick={send}
              className="w-9 h-9 bg-[#16A34A] rounded-[10px] flex items-center justify-center hover:bg-[#15803D] transition-colors"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      </div>}
      {callNotice && <SuccessNotice message={callNotice} onClose={() => setCallNotice("")} />}
    </div>
  );
}

// ── SETTINGS (shared) ─────────────────────────────────────────────────────────
function SettingsScreen({ role }: { role: string }) {
  const { profile } = useAuth();
  const [tab, setTab] = useState("profile");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tabs = [
    "profile",
    "security",
    "notifications",
    "privacy",
  ];
  const displayName = profile?.full_name?.trim() || roleNames[role] || "User";
  const displayEmail = profile?.email || `${role}@pawsphere.bd`;
  const displayPhone = profile?.phone || "";

  return (
    <div>
      <PageTitle
        title="Settings"
        subtitle="Manage your account preferences"
      />
      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-2 space-y-0.5">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`w-full text-left px-3 py-2.5 rounded-[8px] text-sm font-medium capitalize transition-colors ${tab === t ? "bg-[#DCFCE7] text-[#16A34A]" : "text-[#6B7280] hover:bg-[#F8FAFC]"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-white border border-[#E5E7EB] rounded-[14px] p-6">
          {tab === "profile" && (
            <div className="max-w-md">
              <h3 className="font-semibold text-[#111827] mb-5">
                Profile Information
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {getInitials(displayName)}
                </div>
                <button className="text-sm font-medium text-[#16A34A] border border-[#16A34A] px-3 py-1.5 rounded-[8px] hover:bg-[#F0FDF4] transition-colors">
                  Change Photo
                </button>
              </div>
              <div className="space-y-4">
                {[
                  ["Full Name", displayName],
                  ["Email", displayEmail],
                  ["Phone", displayPhone],
                  ["Role", roleLabels[role] || role],
                ].map(([label, val]) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-[#111827] mb-1.5">
                      {label}
                    </label>
                    <input
                      defaultValue={val}
                      readOnly={label === "Email" || label === "Role"}
                      className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
                    />
                  </div>
                ))}
              </div>
              <button className="mt-6 bg-[#16A34A] text-white text-sm font-medium px-5 py-2.5 rounded-[10px] hover:bg-[#15803D] transition-colors">
                Save Changes
              </button>
            </div>
          )}
          {tab === "security" && (
            <div className="max-w-md">
              <h3 className="font-semibold text-[#111827] mb-5">
                Security
              </h3>
              <div className="space-y-4">
                {[
                  "Current Password",
                  "New Password",
                  "Confirm New Password",
                ].map((label) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-[#111827] mb-1.5">
                      {label}
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
                    />
                  </div>
                ))}
              </div>
              <button className="mt-6 bg-[#16A34A] text-white text-sm font-medium px-5 py-2.5 rounded-[10px] hover:bg-[#15803D] transition-colors">
                Update Password
              </button>
              <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                <h4 className="font-medium text-[#111827] mb-3 text-sm">
                  Two-Factor Authentication
                </h4>
                <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] p-3">
                  <p className="text-sm text-[#6B7280]">
                    Protect your account with 2FA
                  </p>
                  <button className="text-xs font-medium text-[#16A34A] border border-[#16A34A] px-3 py-1.5 rounded-[8px]">
                    Enable
                  </button>
                </div>
              </div>
            </div>
          )}
          {tab === "notifications" && (
            <div className="max-w-md">
              <h3 className="font-semibold text-[#111827] mb-5">
                Notification Preferences
              </h3>
              <div className="space-y-3">
                {[
                  [
                    "Adoption Updates",
                    "Get notified on application status changes",
                  ],
                  [
                    "Appointment Reminders",
                    "Reminders 24h before appointments",
                  ],
                  [
                    "Vaccination Alerts",
                    "Alert when vaccinations are due",
                  ],
                  [
                    "New Messages",
                    "Email notification for new messages",
                  ],
                  [
                    "Platform Updates",
                    "News and feature announcements",
                  ],
                ].map(([label, desc]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-[10px]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        {label}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {desc}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="accent-[#16A34A] w-4 h-4"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "privacy" && (
            <div className="max-w-md">
              <h3 className="font-semibold text-[#111827] mb-5">
                Privacy
              </h3>
              <div className="space-y-3">
                {[
                  [
                    "Profile Visibility",
                    "Make your profile visible to shelters",
                  ],
                  [
                    "Share Activity",
                    "Allow PawSphere to use activity data to improve",
                  ],
                  ["Data Export", "Download all your data"],
                ].map(([label, desc]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-[10px]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        {label}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {desc}
                      </p>
                    </div>
                    {label === "Data Export" ? (
                      <button className="text-xs font-medium text-[#16A34A] border border-[#16A34A] px-3 py-1.5 rounded-[8px]">
                        Export
                      </button>
                    ) : (
                      <input
                        type="checkbox"
                        defaultChecked
                        className="accent-[#16A34A] w-4 h-4"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                <p className="text-sm font-semibold text-red-500 mb-2">
                  Danger Zone
                </p>
                <button onClick={() => setConfirmDelete(true)} className="text-sm font-medium text-red-500 border border-red-200 px-4 py-2 rounded-[8px] hover:bg-red-50 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmationDialog open={confirmDelete} title="Delete your account?" description="This demo will return you to the landing page. In production, this action permanently removes account data." confirmLabel="Delete account" onCancel={() => setConfirmDelete(false)} onConfirm={() => setConfirmDelete(false)} />
    </div>
  );
}

// ── PET OWNER SCREENS ─────────────────────────────────────────────────────────
function OwnerDashboard({
  setView,
}: {
  setView: (v: string) => void;
}) {
  const { profile } = useAuth();
  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] || "there";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Here&apos;s what&apos;s happening with your pets
          today.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="My Pets"
          value="2"
          icon={<PawPrint size={16} />}
          color="green"
        />
        <StatCard
          label="Applications"
          value="3"
          sub="1 in Interview"
          icon={<ClipboardList size={16} />}
          color="amber"
        />
        <StatCard
          label="Upcoming Appointments"
          value="1"
          sub="Jul 30"
          icon={<Calendar size={16} />}
          color="blue"
        />
        <StatCard
          label="Saved Pets"
          value="5"
          icon={<Bookmark size={16} />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white border border-[#E5E7EB] rounded-[14px] p-5">
          <h3 className="font-semibold text-[#111827] mb-4">
            Upcoming Appointments
          </h3>
          <div className="space-y-3">
            {APPOINTMENTS.filter(
              (a) => a.status !== "Completed",
            ).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-[10px]"
              >
                <img
                  src={apt.petImage}
                  alt={apt.petName}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#111827]">
                    {apt.petName} — {apt.type}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {apt.vetName} · {apt.date} at {apt.time}
                  </p>
                </div>
                <Badge status={apt.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <ReminderWidget />
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5">
          <h3 className="font-semibold text-[#111827] mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {[
              ["Browse Pets", "browse-pets"],
              ["Find Vet", "find-vet"],
              ["My Applications", "adoption"],
              ["Notifications", "notifications"],
            ].map(([label, view]) => (
              <button
                key={view}
                onClick={() => setView(view)}
                className="w-full flex items-center justify-between text-sm font-medium text-[#374151] bg-[#F8FAFC] border border-[#E5E7EB] px-4 py-3 rounded-[10px] hover:border-[#16A34A] hover:text-[#16A34A] transition-colors"
              >
                {label} <ArrowRight size={14} />
              </button>
            ))}
          </div>
          </div>
        </div>
      </div>

      <div className="mt-5 bg-white border border-[#E5E7EB] rounded-[14px] p-5">
        <h3 className="font-semibold text-[#111827] mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <RecentNotifications />
        </div>
      </div>
    </div>
  );
}

function FindVetScreen() {
  const [search, setSearch] = useState("");
  const filtered = VETS.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.specialty.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div>
      <PageTitle
        title="Find a Vet"
        subtitle="Book appointments with verified veterinarians"
      />
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 bg-white border border-[#E5E7EB] rounded-[10px] px-3 py-2.5">
          <Search size={14} className="text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialty..."
            className="text-sm outline-none flex-1 placeholder-[#9CA3AF]"
          />
        </div>
        <select className="text-sm border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 outline-none bg-white text-[#374151]">
          <option>All Specialties</option>
          <option>General Practitioner</option>
          <option>Surgeon</option>
          <option>Dermatologist</option>
        </select>
      </div>
      <div className="space-y-4">
        {filtered.map((vet) => (
          <div
            key={vet.id}
            className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 flex items-start gap-5 hover:shadow-sm transition-shadow"
          >
            <img
              src={vet.image}
              alt={vet.name}
              className="w-16 h-16 rounded-full object-cover bg-[#F1F5F9]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-[#111827]">
                  {vet.name}
                </h3>
                <VerificationBadge type="Verified vet" />
              </div>
              <p className="text-sm text-[#6B7280] mb-1">
                {vet.specialty} · {vet.clinic}
              </p>
              <div className="flex items-center gap-4 text-xs text-[#9CA3AF] mb-3">
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {vet.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {vet.experience} exp.
                </span>
                <span className="flex items-center gap-1">
                  <Star
                    size={10}
                    className="fill-amber-400 text-amber-400"
                  />
                  {vet.rating} ({vet.reviews} reviews)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 rounded-full">
                  Next: {vet.nextSlot}
                </span>
                <span className="text-xs text-[#6B7280]">
                  Fee: ৳{vet.fee}
                </span>
              </div>
            </div>
            <button
              className={`text-sm font-medium px-4 py-2 rounded-[10px] transition-colors ${vet.available ? "bg-[#16A34A] text-white hover:bg-[#15803D]" : "bg-[#F1F5F9] text-[#9CA3AF] cursor-not-allowed"}`}
            >
              {vet.available ? "Book Now" : "Unavailable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdoptionScreen() {
  const [tab, setTab] = useState("all");
  const steps = [
    "Submitted",
    "Review",
    "Interview",
    "Approved",
    "Meet & Greet",
    "Completed",
  ];
  const tabs = ["all", "pending", "approved", "completed"];
  const filtered =
    tab === "all"
      ? ADOPTION_APPS
      : ADOPTION_APPS.filter(
          (a) => a.status.toLowerCase() === tab,
        );
  return (
    <div>
      <Breadcrumbs items={["Applications", "My applications"]} />
      <PageTitle
        title="Adoption Applications"
        subtitle="Track your adoption journey"
      />
      <div className="flex gap-1.5 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-medium px-4 py-2 rounded-[8px] capitalize transition-colors ${tab === t ? "bg-[#16A34A] text-white" : "text-[#6B7280] hover:bg-[#F1F5F9]"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.length === 0 ? <EmptyState title="No applications in this stage" text="Your applications will move here as shelters update their review." icon={ClipboardList} action={<button onClick={() => setTab("all")} className="rounded-[14px] bg-[#16A34A] px-4 py-2.5 text-xs font-semibold text-white">View all applications</button>} /> : filtered.map((app) => (
          <div
            key={app.id}
            className="bg-white border border-[#E5E7EB] rounded-[14px] p-5"
          >
            <div className="flex items-center gap-4 mb-5">
              <img
                src={app.petImage}
                alt={app.petName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[#111827]">
                    {app.petName}
                  </h3>
                  <Badge status={app.status} />
                </div>
                <p className="text-sm text-[#6B7280]">
                  {app.shelter} · Applied {app.appliedDate}
                </p>
              </div>
              <button className="text-sm font-medium text-[#16A34A] border border-[#16A34A] px-3 py-1.5 rounded-[8px] hover:bg-[#F0FDF4] transition-colors">
                View Details
              </button>
            </div>
            <div className="flex items-center gap-0">
              {steps.map((step, i) => {
                const done = i < app.step;
                const current = i === app.step - 1;
                return (
                  <div
                    key={step}
                    className="flex items-center flex-1 last:flex-none"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${done || current ? "bg-[#16A34A] text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}
                      >
                        {done ? <Check size={12} /> : i + 1}
                      </div>
                      <p className="text-[9px] text-[#9CA3AF] mt-1 text-center w-14">
                        {step}
                      </p>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mb-4 ${i < app.step - 1 ? "bg-[#16A34A]" : "bg-[#E5E7EB]"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyPetsScreen() {
  const myPets = PETS.slice(0, 2);
  return (
    <div>
      <PageTitle
        title="My Pets"
        subtitle="Manage your pets' health records"
      />
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {myPets.map((pet) => (
          <div
            key={pet.id}
            className="bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden"
          >
            <div className="flex items-start gap-4 p-5">
              <img
                src={pet.image}
                alt={pet.name}
                className="w-16 h-16 rounded-[12px] object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-[#111827]">
                  {pet.name}
                </h3>
                <p className="text-sm text-[#6B7280]">
                  {pet.breed} · {pet.age}
                </p>
                <div className="flex gap-2 mt-2">
                  {pet.vaccinated && (
                    <span className="text-[10px] font-medium bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full">
                      Vaccinated
                    </span>
                  )}
                  {pet.neutered && (
                    <span className="text-[10px] font-medium bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      Neutered
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-[#F1F5F9] px-5 py-3 flex gap-3">
              <button className="flex-1 text-xs font-medium text-[#16A34A] border border-[#16A34A] py-2 rounded-[8px] hover:bg-[#F0FDF4] transition-colors">
                Medical History
              </button>
              <button className="flex-1 text-xs font-medium text-[#374151] border border-[#E5E7EB] py-2 rounded-[8px] hover:bg-[#F8FAFC] transition-colors">
                Download Records
              </button>
            </div>
          </div>
        ))}
      </div>
      <section className="mb-6 rounded-[14px] border border-[#E5E7EB] bg-white p-5">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold text-[#111827]">Documents</h3><p className="mt-0.5 text-xs text-[#6B7280]">Secure copies of Biscuit’s health documents</p></div><FileText size={18} className="text-[#16A34A]" /></div>
        <div className="grid gap-3 md:grid-cols-3">{[["Vaccination certificate", "PDF · 284 KB"], ["Wellness visit summary", "PDF · 156 KB"], ["Adoption agreement", "PDF · 212 KB"]].map(([title, meta]) => <button key={title} className="group flex items-center gap-3 rounded-[10px] border border-[#E5E7EB] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#86EFAC] hover:shadow-sm"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0FDF4] text-[#16A34A]"><FileText size={15} /></div><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#374151]">{title}</span><span className="text-[10px] text-[#9CA3AF]">{meta}</span></span><Download size={15} className="text-[#9CA3AF] group-hover:text-[#16A34A]" /></button>)}</div>
      </section>
      <VaccinationRecords />
    </div>
  );
}

function AppointmentsScreen() {
  const [appointments, setAppointments] = useState(APPOINTMENTS);
  const [notice, setNotice] = useState("");
  const [cancelId, setCancelId] = useState<number | null>(null);
  return (
    <div>
      <PageTitle
        title="Appointments"
        subtitle="Your veterinary appointment history"
        action={
          <button onClick={() => setNotice("We’ve opened the booking flow. Choose a verified veterinarian to continue.")} className="text-sm font-medium bg-[#16A34A] text-white px-4 py-2 rounded-[10px] hover:bg-[#15803D] transition-colors flex items-center gap-2">
            <Plus size={14} /> Book Appointment
          </button>
        }
      />
      <div className="bg-white border border-[#E5E7EB] rounded-[18px] overflow-x-auto">
        <table className="min-w-[720px] w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <tr>
              {[
                "Pet",
                "Veterinarian",
                "Date & Time",
                "Type",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-[#6B7280] uppercase px-5 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {appointments.length === 0 ? <tr><td colSpan={6} className="p-5"><EmptyState title="No appointments on your calendar" text="When you book a visit, the details and reminders will appear here." icon={Calendar} action={<button onClick={() => setNotice("We’ve opened the booking flow. Choose a verified veterinarian to continue.")} className="rounded-[14px] bg-[#16A34A] px-4 py-2.5 text-xs font-semibold text-white">Book appointment</button>} /></td></tr> : appointments.map((apt) => (
              <tr
                key={apt.id}
                className="hover:bg-[#F8FAFC] transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={apt.petImage}
                      alt={apt.petName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-[#111827]">
                      {apt.petName}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {apt.vetName}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {apt.date} · {apt.time}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {apt.type}
                </td>
                <td className="px-5 py-4">
                  <Badge status={apt.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button className="text-xs text-[#16A34A] font-medium hover:underline">
                      View
                    </button>
                    {apt.status !== "Completed" && (
                      <button onClick={() => setCancelId(apt.id)} className="text-xs text-red-500 font-medium hover:underline">
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {notice && <SuccessNotice message={notice} onClose={() => setNotice("")} />}
      <ConfirmationDialog open={cancelId !== null} title="Cancel this appointment?" description="The appointment will be removed from your calendar. You can book another time when needed." confirmLabel="Cancel appointment" onCancel={() => setCancelId(null)} onConfirm={() => { if (cancelId !== null) setAppointments((items) => items.filter((item) => item.id !== cancelId)); setNotice("The appointment has been cancelled and your calendar is updated."); setCancelId(null); }} />
    </div>
  );
}

function FavoritesScreen() {
  const [savedPets, setSavedPets] = useState(PETS.slice(0, 4));
  const [savedVets, setSavedVets] = useState(VETS.slice(0, 2));
  const [removeId, setRemoveId] = useState<number | null>(null);
  return (
    <div>
      <PageTitle
        title="Favorites"
        subtitle="Your saved pets and vets"
      />
      <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
        Saved Pets
      </h3>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {savedPets.length === 0 ? <div className="col-span-4"><EmptyState title="Your saved pets will live here" text="Save a pet while browsing to revisit them whenever you’re ready." icon={Heart} action={<button className="rounded-[14px] bg-[#16A34A] px-4 py-2.5 text-xs font-semibold text-white">Browse pets</button>} /></div> : savedPets.map((pet) => (
          <div
            key={pet.id}
            className="bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden hover:shadow-sm transition-shadow"
          >
            <img
              src={pet.image}
              alt={pet.name}
              className="w-full h-36 object-cover"
            />
            <div className="p-3">
              <p className="font-semibold text-[#111827] text-sm">
                {pet.name}
              </p>
              <p className="text-xs text-[#6B7280]">{pet.breed}</p>
              <button onClick={() => setRemoveId(pet.id)} className="mt-2 text-[11px] font-semibold text-[#6B7280] hover:text-red-500">Remove</button>
            </div>
          </div>
        ))}
      </div>
      <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
        Saved Vets
      </h3>
      <div className="space-y-3">
        {savedVets.length === 0 ? <EmptyState title="No saved vets yet" text="Save a veterinarian to compare options and book a visit later." icon={Stethoscope} action={<button className="rounded-[14px] bg-[#16A34A] px-4 py-2.5 text-xs font-semibold text-white">Find a vet</button>} /> : savedVets.map((vet) => (
          <div
            key={vet.id}
            className="bg-white border border-[#E5E7EB] rounded-[14px] p-4 flex items-center gap-4"
          >
            <img
              src={vet.image}
              alt={vet.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#111827]">
                {vet.name}
              </p>
              <p className="text-xs text-[#6B7280]">
                {vet.specialty} · {vet.location}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <Star size={11} className="fill-amber-400" />
              {vet.rating}
            </div>
            <button className="text-xs font-medium text-[#16A34A] border border-[#16A34A] px-3 py-1.5 rounded-[8px]">
              Book
            </button>
          </div>
        ))}
      </div>
      <ConfirmationDialog open={removeId !== null} title="Remove this favorite?" description="This pet will no longer appear in your saved list." confirmLabel="Remove favorite" onCancel={() => setRemoveId(null)} onConfirm={() => { if (removeId !== null) setSavedPets((items) => items.filter((item) => item.id !== removeId)); setRemoveId(null); }} />
    </div>
  );
}

function GuideScreen() {
  return (
    <div>
      <PageTitle
        title="Pet Care Guide"
        subtitle="Articles and resources for pet owners"
      />
      <div className="grid grid-cols-2 gap-5">
        {GUIDE_ARTICLES.map((a) => (
          <div
            key={a.id}
            className="bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <img
              src={a.image}
              alt={a.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 rounded-full">
                  {a.category}
                </span>
                <span className="text-[11px] text-[#9CA3AF]">
                  {a.readTime} read
                </span>
              </div>
              <h3 className="font-semibold text-[#111827] text-sm">
                {a.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SHELTER SCREENS ────────────────────────────────────────────────────────────
function ShelterDashboard({
  setView,
}: {
  setView: (v: string) => void;
}) {
  const [rejectId, setRejectId] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">
          Shelter Dashboard
        </h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Dhaka Animal Rescue · Overview
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Pets Listed"
          value="24"
          icon={<PawPrint size={16} />}
          color="green"
        />
        <StatCard
          label="Pending Applications"
          value="8"
          sub="2 need action"
          icon={<ClipboardList size={16} />}
          color="amber"
        />
        <StatCard
          label="Adopted This Month"
          value="6"
          sub="+2 vs last month"
          icon={<Award size={16} />}
          color="blue"
        />
        <StatCard
          label="Meet & Greets"
          value="3"
          sub="This week"
          icon={<Calendar size={16} />}
          color="purple"
        />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white border border-[#E5E7EB] rounded-[14px] p-5">
          <h3 className="font-semibold text-[#111827] mb-4">
            Adoption Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart id="shelter-trend-area" data={adoptionTrend}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <Tooltip />
              <Area
                id="shelter-trend-series"
                type="monotone"
                dataKey="adoptions"
                stroke="#16A34A"
                fill="#DCFCE7"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5">
          <h3 className="font-semibold text-[#111827] mb-4">
            Species
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart id="shelter-species-pie">
              <Pie
                id="shelter-species-series"
                data={speciesBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={55}
                dataKey="value"
                label={({ name, value }) => `${value}%`}
                labelLine={false}
                fontSize={10}
              >
                {speciesBreakdown.map((entry, i) => (
                  <Cell
                    key={`species-${entry.name}`}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {speciesBreakdown.map((s, i) => (
              <div
                key={s.name}
                className="flex items-center gap-2"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-xs text-[#6B7280]">
                  {s.name}
                </span>
                <span className="ml-auto text-xs font-medium text-[#111827]">
                  {s.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 bg-white border border-[#E5E7EB] rounded-[14px] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#111827]">
            Recent Applications
          </h3>
          <button
            onClick={() => setView("applications")}
            className="text-sm text-[#16A34A] font-medium hover:underline"
          >
            View all
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F1F5F9]">
              {[
                "Applicant",
                "Pet",
                "Applied",
                "Status",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-[#6B7280] uppercase pb-2 pr-4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {SHELTER_APPS.slice(0, 3).map((app) => (
              <tr key={app.id} className="hover:bg-[#F8FAFC]">
                <td className="py-3 pr-4 text-sm font-medium text-[#111827]">
                  {app.applicant}
                </td>
                <td className="py-3 pr-4 text-sm text-[#6B7280]">
                  {app.petName}
                </td>
                <td className="py-3 pr-4 text-sm text-[#6B7280]">
                  {app.appliedDate}
                </td>
                <td className="py-3 pr-4">
                  <Badge status={app.status} />
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button className="text-xs font-medium text-[#16A34A] hover:underline">
                      Review
                    </button>
                    <button onClick={() => setRejectId(app.id)} className="text-xs font-medium text-red-500 hover:underline">
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmationDialog
        open={rejectId !== null}
        title="Reject this application?"
        description="The applicant will be notified that their adoption application was not approved."
        confirmLabel="Reject application"
        onCancel={() => setRejectId(null)}
        onConfirm={() => setRejectId(null)}
      />
    </div>
  );
}

function AddPetScreen() {
  const [step, setStep] = useState(1);
  const steps = [
    "Basic Info",
    "Health Details",
    "Personality",
    "Photos",
    "Publish",
  ];
  return (
    <div className="max-w-2xl">
      <PageTitle
        title="Add a Pet"
        subtitle="List a new pet for adoption"
      />
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div
            key={s}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? "bg-[#16A34A] text-white" : i === step - 1 ? "bg-[#16A34A] text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}
              >
                {i < step - 1 ? <Check size={13} /> : i + 1}
              </div>
              <p className="text-[10px] text-[#9CA3AF] mt-1 text-center w-16">
                {s}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-4 ${i < step - 1 ? "bg-[#16A34A]" : "bg-[#E5E7EB]"}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#111827] mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Pet Name", "text", "e.g. Buddy"],
                ["Breed", "text", "e.g. Labrador"],
                ["Age", "text", "e.g. 2 years"],
                ["Weight", "text", "e.g. 15 kg"],
              ].map(([label, type, ph]) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    placeholder={ph}
                    className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">
                  Species
                </label>
                <select className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] bg-white">
                  <option>Dog</option>
                  <option>Cat</option>
                  <option>Rabbit</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">
                  Gender
                </label>
                <select className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] bg-white">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#111827] mb-4">
              Health Details
            </h3>
            {[
              ["Health Notes", "textarea"],
              ["Medical History", "textarea"],
            ].map(([label]) => (
              <div key={label}>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">
                  {label}
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] resize-none transition-colors"
                />
              </div>
            ))}
            <div className="flex gap-6">
              {[
                ["Vaccinated", "vacc"],
                ["Neutered/Spayed", "neut"],
              ].map(([label, name]) => (
                <label
                  key={name}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name={name}
                    className="accent-[#16A34A] w-4 h-4"
                  />
                  <span className="text-sm font-medium text-[#374151]">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h3 className="font-semibold text-[#111827] mb-4">
              Personality Traits
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Playful",
                "Calm",
                "Friendly",
                "Energetic",
                "Gentle",
                "Curious",
                "Loyal",
                "Protective",
                "Social",
                "Independent",
              ].map((trait) => (
                <label
                  key={trait}
                  className="flex items-center gap-1.5 border border-[#E5E7EB] rounded-full px-3 py-1.5 cursor-pointer hover:border-[#16A34A] hover:text-[#16A34A] transition-colors"
                >
                  <input
                    type="checkbox"
                    className="accent-[#16A34A]"
                  />
                  <span className="text-xs font-medium">
                    {trait}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        {step === 4 && (
          <div>
            <h3 className="font-semibold text-[#111827] mb-4">
              Upload Photos
            </h3>
            <div className="border-2 border-dashed border-[#E5E7EB] rounded-[14px] p-12 text-center hover:border-[#16A34A] transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus size={20} className="text-[#16A34A]" />
              </div>
              <p className="text-sm font-medium text-[#374151]">
                Drop photos here or click to upload
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                JPG, PNG up to 5MB each. Min 3 photos.
              </p>
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-[#16A34A]" />
            </div>
            <h3 className="font-semibold text-[#111827] text-lg mb-2">
              Ready to Publish
            </h3>
            <p className="text-sm text-[#6B7280] max-w-xs mx-auto">
              Review your pet listing before making it live for
              adoption applications.
            </p>
          </div>
        )}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#F1F5F9]">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="text-sm font-medium text-[#6B7280] hover:text-[#111827] disabled:opacity-40 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => setStep(Math.min(5, step + 1))}
            className="text-sm font-medium bg-[#16A34A] text-white px-6 py-2.5 rounded-[10px] hover:bg-[#15803D] transition-colors"
          >
            {step === 5 ? "Publish Listing" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PetListingsScreen() {
  return (
    <div>
      <PageTitle
        title="Pet Listings"
        subtitle="Manage your shelter's pets"
        action={
          <button className="text-sm font-medium bg-[#16A34A] text-white px-4 py-2 rounded-[10px] hover:bg-[#15803D] transition-colors flex items-center gap-2">
            <Plus size={14} /> Add Pet
          </button>
        }
      />
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E5E7EB] flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] px-3 py-2">
            <Search size={13} className="text-[#9CA3AF]" />
            <input
              className="text-sm outline-none bg-transparent flex-1 placeholder-[#9CA3AF]"
              placeholder="Search pets..."
            />
          </div>
          <select className="text-sm border border-[#E5E7EB] rounded-[8px] px-3 py-2 outline-none bg-white text-[#374151]">
            <option>All Status</option>
            <option>Available</option>
            <option>Reserved</option>
            <option>Adopted</option>
          </select>
        </div>
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <tr>
              {[
                "Pet",
                "Breed",
                "Age",
                "Gender",
                "Status",
                "Applications",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-[#6B7280] uppercase px-5 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {PETS.map((pet) => (
              <tr
                key={pet.id}
                className="hover:bg-[#F8FAFC] transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={pet.image}
                      alt={pet.name}
                      className="w-9 h-9 rounded-[8px] object-cover"
                    />
                    <span className="text-sm font-medium text-[#111827]">
                      {pet.name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {pet.breed}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {pet.age}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {pet.gender}
                </td>
                <td className="px-5 py-4">
                  <Badge status={pet.status} />
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {pet.applications}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button className="w-7 h-7 flex items-center justify-center text-[#6B7280] hover:text-[#16A34A] transition-colors">
                      <Edit size={14} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center text-[#6B7280] hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShelterApplicationsScreen() {
  const [tab, setTab] = useState("All");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const tabs = [
    "All",
    "Pending",
    "Interview",
    "Approved",
    "Rejected",
  ];
  const filtered =
    tab === "All"
      ? SHELTER_APPS
      : SHELTER_APPS.filter((a) => a.status === tab);
  return (
    <div>
      <PageTitle
        title="Adoption Applications"
        subtitle="Review and manage applications"
      />
      <div className="flex gap-1.5 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-medium px-4 py-2 rounded-[8px] transition-colors ${tab === t ? "bg-[#16A34A] text-white" : "text-[#6B7280] hover:bg-[#F1F5F9]"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-[18px] overflow-x-auto">
        <table className="min-w-[720px] w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <tr>
              {[
                "Applicant",
                "Pet",
                "Location",
                "Applied",
                "Experience",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-[#6B7280] uppercase px-5 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filtered.map((app) => (
              <tr key={app.id} className="hover:bg-[#F8FAFC]">
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-[#111827]">
                    {app.applicant}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {app.email}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {app.petName}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {app.location}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {app.appliedDate}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {app.experience}
                </td>
                <td className="px-5 py-4">
                  <Badge status={app.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button className="text-xs font-medium text-[#16A34A] hover:underline">
                      Approve
                    </button>
                    <button className="text-xs font-medium text-red-500 hover:underline">
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmationDialog open={rejectId !== null} title="Reject this application?" description="The applicant will be notified that their adoption application was not approved." confirmLabel="Reject application" onCancel={() => setRejectId(null)} onConfirm={() => setRejectId(null)} />
    </div>
  );
}

function MeetGreetScreen() {
  return (
    <div>
      <PageTitle
        title="Meet & Greet"
        subtitle="Upcoming pet introduction sessions"
        action={
          <button className="text-sm font-medium bg-[#16A34A] text-white px-4 py-2 rounded-[10px] hover:bg-[#15803D] transition-colors flex items-center gap-2">
            <Plus size={14} /> Schedule
          </button>
        }
      />
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">
            Upcoming Sessions
          </h3>
          {MEET_GREETS.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-[#E5E7EB] rounded-[14px] p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    {m.petName} + {m.applicant}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {m.date} at {m.time}
                  </p>
                </div>
                <Badge status={m.status} />
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 text-xs font-medium text-[#16A34A] border border-[#16A34A] py-1.5 rounded-[8px]">
                  Confirm
                </button>
                <button className="flex-1 text-xs font-medium text-[#6B7280] border border-[#E5E7EB] py-1.5 rounded-[8px]">
                  Reschedule
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">
            Schedule New Session
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                Select Pet
              </label>
              <select className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] bg-white">
                {PETS.map((p) => (
                  <option key={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                Applicant
              </label>
              <select className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] bg-white">
                {SHELTER_APPS.map((a) => (
                  <option key={a.id}>{a.applicant}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                Date
              </label>
              <input
                type="date"
                className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                Time
              </label>
              <input
                type="time"
                className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
              />
            </div>
            <button className="w-full bg-[#16A34A] text-white text-sm font-medium py-2.5 rounded-[10px] hover:bg-[#15803D] transition-colors mt-2">
              Schedule Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificatesScreen() {
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const certs = [
    {
      id: 1,
      petName: "Luna",
      adopter: "Nadia Sultana",
      issuedDate: "Jul 10, 2024",
      certNo: "PSC-2024-001",
    },
    {
      id: 2,
      petName: "Bruno",
      adopter: "Karim Uddin",
      issuedDate: "Jun 28, 2024",
      certNo: "PSC-2024-002",
    },
  ];
  return (
    <div>
      <Breadcrumbs items={["Certificates", "Adoption certificates"]} />
      <PageTitle
        title="Adoption Certificates"
        subtitle="Issued certificates for completed adoptions"
      />
      <div className="grid md:grid-cols-2 gap-5">
        {certs.map((cert) => (
          <div
            key={cert.id}
            className="bg-white border border-[#E5E7EB] rounded-[14px] p-5"
          >
            <div className="border-2 border-[#16A34A] rounded-[10px] p-5 mb-4 text-center bg-[#F0FDF4]">
              <div className="w-10 h-10 bg-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-2">
                <Award size={18} className="text-white" />
              </div>
              <p className="text-xs font-semibold text-[#16A34A] uppercase tracking-widest mb-1">
                Adoption Certificate
              </p>
              <p className="text-lg font-bold text-[#111827]">
                {cert.petName}
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                Adopted by {cert.adopter}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {cert.issuedDate}
              </p>
              <p className="text-[10px] font-mono text-[#9CA3AF] mt-2">
                {cert.certNo}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreviewTitle(`Adoption Certificate — ${cert.petName}`)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-[#16A34A] border border-[#16A34A] py-2 rounded-[8px] hover:bg-[#F0FDF4] transition-colors">
                <Eye size={13} /> Preview
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-[#374151] border border-[#E5E7EB] py-2 rounded-[8px] hover:bg-[#F8FAFC] transition-colors">
                <Download size={13} /> Download PDF
              </button>
            </div>
          </div>
        ))}
        <div className="border-2 border-dashed border-[#E5E7EB] rounded-[14px] p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#16A34A] transition-colors">
          <div className="w-10 h-10 bg-[#F0FDF4] rounded-full flex items-center justify-center mb-2">
            <Plus size={18} className="text-[#16A34A]" />
          </div>
          <p className="text-sm font-medium text-[#374151]">
            Generate Certificate
          </p>
          <p className="text-xs text-[#9CA3AF]">
            For a completed adoption
          </p>
        </div>
      </div>
      <DocumentPreviewModal open={previewTitle !== null} title={previewTitle || "Document preview"} onClose={() => setPreviewTitle(null)} />
    </div>
  );
}

function ShelterAnalytics() {
  return (
    <div>
      <PageTitle
        title="Reports & Analytics"
        subtitle="Platform performance and adoption insights"
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Adoptions"
          value="48"
          sub="+6 this month"
          icon={<TrendingUp size={16} />}
          color="green"
        />
        <StatCard
          label="Avg. Days to Adoption"
          value="12"
          sub="−2 vs last month"
          icon={<Clock size={16} />}
          color="blue"
        />
        <StatCard
          label="Application Rate"
          value="84%"
          icon={<Activity size={16} />}
          color="amber"
        />
        <StatCard
          label="Return Rate"
          value="2%"
          sub="Industry avg: 8%"
          icon={<RefreshCw size={16} />}
          color="purple"
        />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5">
          <h3 className="font-semibold text-[#111827] mb-4">
            Monthly Adoptions
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart id="shelter-monthly-bar" data={adoptionTrend}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <Tooltip />
              <Bar
                id="shelter-monthly-series"
                dataKey="adoptions"
                fill="#16A34A"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5">
          <h3 className="font-semibold text-[#111827] mb-4">
            Application Outcomes
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart id="shelter-outcomes-pie">
              <Pie
                id="shelter-outcomes-series"
                data={[
                  { name: "Approved", value: 48 },
                  { name: "Pending", value: 22 },
                  { name: "Rejected", value: 14 },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                fontSize={11}
              >
                {["Approved", "Pending", "Rejected"].map((name, i) => (
                  <Cell key={`outcome-${name}`} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── VET SCREENS ───────────────────────────────────────────────────────────────
function VetDashboard() {
  const todaysApts = APPOINTMENTS.filter(
    (a) => a.date === "Jul 30, 2024",
  );
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">
          Good morning, Dr. Ariful 👨‍⚕️
        </h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          You have {todaysApts.length} appointments today.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's Appointments"
          value={todaysApts.length}
          icon={<Calendar size={16} />}
          color="green"
        />
        <StatCard
          label="Total Patients"
          value="38"
          icon={<PawPrint size={16} />}
          color="blue"
        />
        <StatCard
          label="Pending Reviews"
          value="4"
          icon={<ClipboardList size={16} />}
          color="amber"
        />
        <StatCard
          label="Prescriptions Issued"
          value="21"
          icon={<Pill size={16} />}
          color="purple"
        />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white border border-[#E5E7EB] rounded-[14px] p-5">
          <h3 className="font-semibold text-[#111827] mb-4">
            Today&apos;s Appointments
          </h3>
          <div className="space-y-3">
            {APPOINTMENTS.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-[10px]"
              >
                <img
                  src={apt.petImage}
                  alt={apt.petName}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#111827]">
                    {apt.petName} — {apt.type}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {apt.time} · {apt.clinic}
                  </p>
                </div>
                <Badge status={apt.status} />
                <div className="flex gap-1.5">
                  <button className="text-xs font-medium text-[#16A34A] border border-[#16A34A] px-2.5 py-1 rounded-[6px]">
                    Start
                  </button>
                  <button className="text-xs font-medium text-red-500 border border-red-200 px-2.5 py-1 rounded-[6px]">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5">
          <h3 className="font-semibold text-[#111827] mb-4">
            Alerts
          </h3>
          <div className="space-y-3">
            {[
              {
                text: "Biscuit vaccination overdue",
                type: "warning",
              },
              {
                text: "Luna follow-up due tomorrow",
                type: "info",
              },
              {
                text: "New appointment request from Rafiqul",
                type: "info",
              },
            ].map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 p-3 rounded-[10px] text-sm ${a.type === "warning" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}
              >
                <AlertCircle
                  size={14}
                  className="flex-shrink-0 mt-0.5"
                />
                <p className="text-xs">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VetAppointmentsScreen() {
  return (
    <div>
      <PageTitle
        title="Appointment Management"
        subtitle="Approve, reschedule, or complete appointments"
      />
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E5E7EB] flex gap-3">
          {["All", "Pending", "Confirmed", "Completed"].map(
            (t) => (
              <button
                key={t}
                className="text-sm font-medium text-[#6B7280] hover:text-[#16A34A] transition-colors"
              >
                {t}
              </button>
            ),
          )}
        </div>
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <tr>
              {[
                "Pet",
                "Owner",
                "Date & Time",
                "Type",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-[#6B7280] uppercase px-5 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {APPOINTMENTS.map((apt) => (
              <tr key={apt.id} className="hover:bg-[#F8FAFC]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={apt.petImage}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-[#111827]">
                      {apt.petName}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  Rafiqul Islam
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {apt.date} · {apt.time}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {apt.type}
                </td>
                <td className="px-5 py-4">
                  <Badge status={apt.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    {apt.status === "Pending" && (
                      <>
                        <button className="text-xs font-medium text-[#16A34A] hover:underline">
                          Approve
                        </button>
                        <button className="text-xs font-medium text-amber-500 hover:underline">
                          Reschedule
                        </button>
                      </>
                    )}
                    {apt.status === "Confirmed" && (
                      <button className="text-xs font-medium text-blue-500 hover:underline">
                        Complete
                      </button>
                    )}
                    {apt.status === "Completed" && (
                      <button className="text-xs font-medium text-[#6B7280] hover:underline">
                        View Record
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PatientRecordsScreen() {
  const [selected, setSelected] = useState<number | null>(null);
  const patient = PATIENT_RECORDS.find(
    (p) => p.id === selected,
  );
  return (
    <div>
      {patient && <Breadcrumbs items={["Patients", patient.petName]} />}
      <PageTitle
        title="Patient Records"
        subtitle="Medical history for all patients"
      />
      <div className="flex gap-5">
        <div className="flex-1 bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
              <tr>
                {[
                  "Pet",
                  "Owner",
                  "Breed",
                  "Last Visit",
                  "Next Visit",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-[#6B7280] uppercase px-5 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {PATIENT_RECORDS.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`cursor-pointer hover:bg-[#F8FAFC] ${selected === p.id ? "bg-[#F0FDF4]" : ""}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.image}
                        alt={p.petName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-[#111827]">
                        {p.petName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#374151]">
                    {p.owner}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#374151]">
                    {p.breed}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#374151]">
                    {p.lastVisit}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#374151]">
                    {p.nextVisit}
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={p.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button className="text-xs font-medium text-[#16A34A] hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {patient && (
          <div className="w-72 bg-white border border-[#E5E7EB] rounded-[14px] p-5 flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={patient.image}
                alt={patient.petName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-[#111827]">
                  {patient.petName}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {patient.breed} · {patient.age}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                ["Owner", patient.owner],
                ["Last Visit", patient.lastVisit],
                ["Next Visit", patient.nextVisit],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-[#9CA3AF]">{k}</p>
                  <p className="text-sm font-medium text-[#111827]">
                    {v}
                  </p>
                </div>
              ))}
              <div>
                <p className="text-xs text-[#9CA3AF] mb-1.5">
                  Conditions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {patient.conditions.map((c) => (
                    <span
                      key={c}
                      className="text-[11px] bg-[#F1F5F9] text-[#374151] px-2 py-0.5 rounded-full"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button className="w-full mt-4 text-sm font-medium bg-[#16A34A] text-white py-2.5 rounded-[10px] hover:bg-[#15803D] transition-colors">
              Add Record
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PrescriptionsScreen() {
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <div className="max-w-2xl">
      <Breadcrumbs items={["Prescriptions", "New prescription"]} />
      <PageTitle
        title="Prescription Editor"
        subtitle="Create and issue digital prescriptions"
      />
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">
              Patient
            </label>
            <select className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] bg-white">
              {PATIENT_RECORDS.map((p) => (
                <option key={p.id}>
                  {p.petName} — {p.owner}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">
              Date
            </label>
            <input
              type="date"
              defaultValue="2024-07-30"
              className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#111827] mb-1.5">
            Diagnosis
          </label>
          <textarea
            rows={2}
            placeholder="Enter diagnosis..."
            className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] resize-none transition-colors"
          />
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#111827]">
              Medicines
            </label>
            <button className="text-xs font-medium text-[#16A34A] flex items-center gap-1">
              <Plus size={12} /> Add Medicine
            </button>
          </div>
          <div className="space-y-2">
            {[
              {
                name: "Amoxicillin 250mg",
                dosage: "2x daily",
                duration: "7 days",
              },
              {
                name: "Probiotic Supplement",
                dosage: "1x daily",
                duration: "14 days",
              },
            ].map((m, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <input
                  defaultValue={m.name}
                  className="border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-[#16A34A] transition-colors"
                />
                <input
                  defaultValue={m.dosage}
                  className="border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-[#16A34A] transition-colors"
                />
                <input
                  defaultValue={m.duration}
                  className="border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-[#16A34A] transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#111827] mb-1.5">
            Instructions
          </label>
          <textarea
            rows={2}
            placeholder="Additional instructions for the pet owner..."
            className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] resize-none transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setPreviewOpen(true)} className="flex-1 bg-[#16A34A] text-white text-sm font-medium py-2.5 rounded-[10px] hover:bg-[#15803D] transition-colors">
            Issue Prescription
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-[#374151] border border-[#E5E7EB] px-4 py-2.5 rounded-[10px] hover:bg-[#F8FAFC] transition-colors">
            <Download size={14} /> PDF
          </button>
        </div>
      </div>
      <DocumentPreviewModal open={previewOpen} title="Prescription — Biscuit" onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

function MedicalHistoryScreen() {
  const timeline = [
    {
      date: "Jul 15, 2024",
      pet: "Biscuit",
      type: "Checkup",
      vet: "Dr. Ariful Haque",
      notes: "General health checkup. All vitals normal.",
      outcome: "Healthy",
    },
    {
      date: "Jun 20, 2024",
      pet: "Bruno",
      type: "Follow-up",
      vet: "Dr. Ariful Haque",
      notes:
        "Hip dysplasia monitoring. X-ray shows stable condition.",
      outcome: "Stable",
    },
    {
      date: "Jun 10, 2024",
      pet: "Luna",
      type: "Treatment",
      vet: "Dr. Ariful Haque",
      notes:
        "Skin dermatitis treatment. Applied topical cream.",
      outcome: "Improving",
    },
    {
      date: "May 28, 2024",
      pet: "Biscuit",
      type: "Vaccination",
      vet: "Dr. Ariful Haque",
      notes: "Annual DHPP booster administered.",
      outcome: "Complete",
    },
  ];
  return (
    <div>
      <PageTitle
        title="Medical History"
        subtitle="Chronological patient medical records"
      />
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5">
        <div className="space-y-0">
          {timeline.map((entry, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[#16A34A] flex-shrink-0 mt-1" />
                {i < timeline.length - 1 && (
                  <div className="w-0.5 bg-[#E5E7EB] flex-1 my-1" />
                )}
              </div>
              <div
                className={`pb-5 flex-1 ${i < timeline.length - 1 ? "" : ""}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      {entry.pet} — {entry.type}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {entry.date} · {entry.vet}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full">
                    {entry.outcome}
                  </span>
                </div>
                <p className="text-sm text-[#6B7280]">
                  {entry.notes}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Admin screens live in src/components/admin

function BroadcastsScreen() {
  return (
    <div className="max-w-2xl">
      <PageTitle
        title="Broadcasts"
        subtitle="Send announcements to all users or groups"
      />
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 mb-5">
        <h3 className="font-semibold text-[#111827] mb-4">
          Compose Broadcast
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">
              Audience
            </label>
            <select className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] bg-white">
              <option>All Users (4,821)</option>
              <option>Pet Owners only</option>
              <option>Shelters only</option>
              <option>Veterinarians only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">
              Subject
            </label>
            <input
              placeholder="e.g. National Vaccination Drive 2024"
              className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">
              Message
            </label>
            <textarea
              rows={5}
              placeholder="Write your broadcast message..."
              className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] resize-none transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <button className="flex-1 bg-[#16A34A] text-white text-sm font-medium py-2.5 rounded-[10px] hover:bg-[#15803D] transition-colors">
              Send Broadcast
            </button>
            <button className="text-sm font-medium text-[#6B7280] border border-[#E5E7EB] px-4 py-2.5 rounded-[10px] hover:bg-[#F8FAFC] transition-colors">
              Schedule
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5">
        <h3 className="font-semibold text-[#111827] mb-4">
          Recent Broadcasts
        </h3>
        <div className="space-y-3">
          {[
            {
              title: "Rabies Awareness Month",
              audience: "All Users",
              sent: "Jul 15, 2024",
              reach: "4,821",
            },
            {
              title: "New Vet Partners in Chittagong",
              audience: "Pet Owners",
              sent: "Jul 1, 2024",
              reach: "3,200",
            },
            {
              title: "Shelter Verification Update",
              audience: "Shelters",
              sent: "Jun 20, 2024",
              reach: "118",
            },
          ].map((b, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-[10px]"
            >
              <div>
                <p className="text-sm font-medium text-[#111827]">
                  {b.title}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {b.audience} · {b.sent}
                </p>
              </div>
              <span className="text-xs text-[#16A34A] font-medium">
                {b.reach} reached
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModerationScreen() {
  const reports = [
    {
      id: 1,
      type: "Pet Listing",
      item: "Suspicious listing: 'Rare dog'",
      reporter: "Nadia Sultana",
      date: "Jul 28, 2024",
      status: "Pending",
    },
    {
      id: 2,
      type: "User",
      item: "Reported account: karim@email.com",
      reporter: "dar@email.com",
      date: "Jul 25, 2024",
      status: "Reviewed",
    },
    {
      id: 3,
      type: "Message",
      item: "Inappropriate message in chat",
      reporter: "rafiq@email.com",
      date: "Jul 22, 2024",
      status: "Resolved",
    },
  ];
  return (
    <div>
      <PageTitle
        title="Content Moderation"
        subtitle="Review reported users, listings, and messages"
      />
      <div className="bg-white border border-[#E5E7EB] rounded-[18px] overflow-x-auto">
        <table className="min-w-[720px] w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <tr>
              {[
                "Type",
                "Item",
                "Reporter",
                "Date",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-[#6B7280] uppercase px-5 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-[#F8FAFC]">
                <td className="px-5 py-4">
                  <span className="text-[11px] font-semibold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full">
                    {r.type}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-[#374151] max-w-xs truncate">
                  {r.item}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {r.reporter}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {r.date}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    status={
                      r.status === "Resolved"
                        ? "Completed"
                        : r.status === "Reviewed"
                          ? "Approved"
                          : "Pending"
                    }
                  />
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button className="text-xs font-medium text-[#16A34A] hover:underline">
                      Dismiss
                    </button>
                    <button className="text-xs font-medium text-red-500 hover:underline">
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeedbackScreen() {
  const tickets = [
    {
      id: "TK-001",
      user: "Rafiqul Islam",
      subject: "Can't upload pet photos",
      status: "Open",
      priority: "High",
      date: "Jul 29, 2024",
    },
    {
      id: "TK-002",
      user: "Nadia Sultana",
      subject: "Appointment booking not working",
      status: "In Progress",
      priority: "High",
      date: "Jul 27, 2024",
    },
    {
      id: "TK-003",
      user: "Karim Uddin",
      subject: "Adoption certificate not generating",
      status: "Resolved",
      priority: "Medium",
      date: "Jul 20, 2024",
    },
  ];
  const priorityColor: Record<string, string> = {
    High: "text-red-600",
    Medium: "text-amber-600",
    Low: "text-green-600",
  };
  return (
    <div>
      <PageTitle
        title="Feedback & Support"
        subtitle="User support tickets and platform feedback"
      />
      <div className="bg-white border border-[#E5E7EB] rounded-[18px] overflow-x-auto">
        <table className="min-w-[720px] w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <tr>
              {[
                "Ticket",
                "User",
                "Subject",
                "Priority",
                "Status",
                "Date",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-[#6B7280] uppercase px-5 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-[#F8FAFC]">
                <td className="px-5 py-4 text-sm font-mono text-[#6B7280]">
                  {t.id}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-[#111827]">
                  {t.user}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {t.subject}
                </td>
                <td
                  className={`px-5 py-4 text-xs font-semibold ${priorityColor[t.priority]}`}
                >
                  {t.priority}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    status={
                      t.status === "Open"
                        ? "Pending"
                        : t.status === "In Progress"
                          ? "Interview"
                          : "Completed"
                    }
                  />
                </td>
                <td className="px-5 py-4 text-sm text-[#374151]">
                  {t.date}
                </td>
                <td className="px-5 py-4">
                  <button className="text-xs font-medium text-[#16A34A] hover:underline">
                    Reply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SystemLogsScreen() {
  return (
    <div>
      <PageTitle
        title="System Logs"
        subtitle="Audit trail and security events"
      />
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E5E7EB] flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xs bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] px-3 py-2">
            <Search size={13} className="text-[#9CA3AF]" />
            <input
              className="text-sm outline-none bg-transparent flex-1 placeholder-[#9CA3AF]"
              placeholder="Search logs..."
            />
          </div>
          <select className="text-sm border border-[#E5E7EB] rounded-[8px] px-3 py-2 outline-none bg-white text-[#374151]">
            <option>All Levels</option>
            <option>Info</option>
            <option>Warning</option>
            <option>Critical</option>
          </select>
          <button className="flex items-center gap-1.5 text-sm font-medium text-[#6B7280] border border-[#E5E7EB] px-3 py-2 rounded-[8px] hover:bg-[#F8FAFC] transition-colors">
            <Download size={13} /> Export
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <tr>
              {[
                "Event",
                "User",
                "IP Address",
                "Timestamp",
                "Level",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-[#6B7280] uppercase px-5 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {SYS_LOGS.map((log) => (
              <tr key={log.id} className="hover:bg-[#F8FAFC]">
                <td className="px-5 py-4 text-sm font-medium text-[#111827]">
                  {log.event}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151] font-mono text-xs">
                  {log.user}
                </td>
                <td className="px-5 py-4 text-sm text-[#374151] font-mono text-xs">
                  {log.ip}
                </td>
                <td className="px-5 py-4 text-xs text-[#9CA3AF]">
                  {log.time}
                </td>
                <td className="px-5 py-4">
                  <Badge status={log.level} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── LANDING PAGE ──────────────────────────────────────────────────────────────
const featuredPets = PETS.slice(0, 4);
const heroStats = [
  { value: "4,800+", label: "Pets Adopted" },
  { value: "120+", label: "Partner Shelters" },
  { value: "340+", label: "Verified Vets" },
  { value: "98%", label: "Satisfaction" },
];

function LandingPage({
  navigate,
}: {
  navigate: (view: string) => void;
}) {
  const [liked, setLiked] = useState<number[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#16A34A] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                P
              </span>
            </div>
            <span className="font-semibold text-[#111827]">
              PawSphere
            </span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-[#6B7280] font-medium">
            <button
              onClick={() => navigate("browse-pets-public")}
              className="hover:text-[#111827] transition-colors"
            >
              Browse Pets
            </button>
            <a
              href="#how"
              className="hover:text-[#111827] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#services"
              className="hover:text-[#111827] transition-colors"
            >
              Vet Services
            </a>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate("login")}
              className="text-sm font-medium text-[#111827] px-4 py-2 rounded-[10px] hover:bg-[#F8FAFC] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("register")}
              className="text-sm font-medium text-white bg-[#16A34A] px-4 py-2 rounded-[10px] hover:bg-[#15803D] transition-colors"
            >
              Get Started
            </button>
          </div>
          <button
            className="md:hidden p-2 text-[#6B7280]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-[#E5E7EB] px-6 pb-5 pt-4 flex flex-col gap-4 text-sm font-medium text-[#6B7280]">
            <button onClick={() => navigate("login")}>
              Sign In
            </button>
            <button
              onClick={() => navigate("register")}
              className="bg-[#16A34A] text-white py-2.5 rounded-[10px]"
            >
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-[100px] pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-[#16A34A] text-xs font-semibold tracking-widest uppercase bg-[#DCFCE7] px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
                Bangladesh&apos;s #1 Pet Platform
              </span>
              <h1 className="text-5xl font-bold text-[#111827] leading-[1.15] tracking-tight mb-5">
                Every pet deserves
                <br />
                <span className="text-[#16A34A]">
                  a loving home.
                </span>
              </h1>
              <p className="text-[#6B7280] text-lg leading-relaxed mb-8 max-w-[440px]">
                Connect with shelters, find your perfect
                companion, and access professional veterinary
                care — all in one place.
              </p>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => navigate("browse-pets-public")}
                  className="bg-[#16A34A] text-white font-semibold px-6 py-3 rounded-[12px] hover:bg-[#15803D] transition-colors"
                >
                  Browse Pets
                </button>
                <button
                  onClick={() => navigate("login")}
                  className="text-[#111827] font-medium px-6 py-3 border border-[#E5E7EB] rounded-[12px] hover:bg-white transition-colors"
                >
                  Sign In
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#9CA3AF]">
                  Popular:
                </span>
                {["Dogs", "Cats", "Puppies", "Kittens"].map(
                  (t) => (
                    <button
                      key={t}
                      className="text-xs font-medium text-[#6B7280] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-full hover:border-[#16A34A] hover:text-[#16A34A] transition-colors"
                    >
                      {t}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-3">
              <img
                src="https://images.unsplash.com/photo-1629740067905-bd3f515aa739?w=400&h=500&fit=crop&auto=format"
                alt="Puppy"
                className="rounded-[18px] h-[280px] w-full object-cover mt-8"
              />
              <img
                src="https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400&h=500&fit=crop&auto=format"
                alt="Kitten"
                className="rounded-[18px] h-[280px] w-full object-cover"
              />
            </div>
          </div>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-[#E5E7EB] pt-10">
            {heroStats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-[#111827]">
                  {s.value}
                </p>
                <p className="text-sm text-[#6B7280] mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Pets */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[#16A34A] mb-2">
                Available Now
              </p>
              <h2 className="text-3xl font-bold text-[#111827] tracking-tight">
                Featured Pets
              </h2>
            </div>
            <button
              onClick={() => navigate("browse-pets-public")}
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[#16A34A]"
            >
              View all pets <ArrowRight size={15} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredPets.map((pet) => (
              <div
                key={pet.id}
                className="group bg-[#F8FAFC] rounded-[18px] overflow-hidden border border-[#E5E7EB] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="relative bg-[#E5E7EB]">
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-52 object-cover"
                  />
                  <button
                    onClick={() =>
                      setLiked((p) =>
                        p.includes(pet.id)
                          ? p.filter((i) => i !== pet.id)
                          : [...p, pet.id],
                      )
                    }
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"
                  >
                    <Heart
                      size={15}
                      className={
                        liked.includes(pet.id)
                          ? "fill-red-500 text-red-500"
                          : "text-[#9CA3AF]"
                      }
                    />
                  </button>
                  <span className="absolute top-3 left-3 text-[11px] font-semibold bg-white/90 text-[#16A34A] px-2.5 py-1 rounded-full">
                    {pet.personality[0]}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-[#111827]">
                      {pet.name}
                    </h3>
                    {pet.vaccinated && (
                      <span className="text-[10px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                        Vaccinated
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#6B7280] mb-1">
                    {pet.breed}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mb-3">
                    {pet.age} · {pet.gender}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-[#9CA3AF] mb-4">
                    <MapPin size={11} />
                    {pet.location}
                  </div>
                  <button
                    onClick={() => navigate("login")}
                    className="w-full text-sm font-medium text-[#16A34A] border border-[#16A34A] rounded-[10px] py-2 hover:bg-[#16A34A] hover:text-white transition-colors"
                  >
                    Adopt {pet.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#16A34A] mb-2">
              Simple Process
            </p>
            <h2 className="text-3xl font-bold text-[#111827] tracking-tight">
              How Adoption Works
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              [
                "01",
                "Browse & Find",
                "Search through hundreds of loving pets. Filter by breed, age, and location.",
              ],
              [
                "02",
                "Apply Online",
                "Submit your adoption application in minutes via our simple wizard.",
              ],
              [
                "03",
                "Meet & Greet",
                "Schedule a visit with your future companion at the shelter.",
              ],
              [
                "04",
                "Take Them Home",
                "Get your official adoption certificate and welcome your new family member.",
              ],
            ].map(([num, title, desc]) => (
              <div
                key={num}
                className="bg-white border border-[#E5E7EB] rounded-[18px] p-6"
              >
                <span className="text-3xl font-bold text-[#E5E7EB] block mb-4">
                  {num}
                </span>
                <h3 className="font-semibold text-[#111827] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vet Services */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[#16A34A] mb-2">
                Veterinary Care
              </p>
              <h2 className="text-3xl font-bold text-[#111827] tracking-tight mb-4">
                Professional care,
                <br />
                at your fingertips.
              </h2>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-8">
                Book appointments with 340+ verified
                veterinarians across Bangladesh. Manage health
                records, vaccinations, and prescriptions
                digitally.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [
                    "🩺",
                    "Health Checkups",
                    "Routine checkups with verified vets.",
                  ],
                  [
                    "💉",
                    "Vaccination Tracking",
                    "Complete records with renewal alerts.",
                  ],
                  [
                    "📋",
                    "Digital Prescriptions",
                    "Download and share instantly.",
                  ],
                  [
                    "🗓️",
                    "Easy Booking",
                    "Real-time slots, one click away.",
                  ],
                ].map(([icon, title, desc]) => (
                  <div
                    key={title}
                    className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[14px] p-4"
                  >
                    <span className="text-xl block mb-2">
                      {icon}
                    </span>
                    <h4 className="font-semibold text-[#111827] text-sm mb-1">
                      {title}
                    </h4>
                    <p className="text-xs text-[#6B7280]">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1770836037793-95bdbf190f71?w=700&h=800&fit=crop&auto=format"
              alt="Veterinarian examining a dog"
              className="rounded-[22px] w-full h-[480px] object-cover hidden lg:block"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#16A34A] mb-2">
              Stories
            </p>
            <h2 className="text-3xl font-bold text-[#111827] tracking-tight">
              Loved by the community
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: "Rafiqul Islam",
                role: "Pet Owner · Dhaka",
                avatar: "RI",
                quote:
                  "Adopting through PawSphere was seamless. The whole process took less than a week and the team was incredibly supportive.",
              },
              {
                name: "Nadia Sultana",
                role: "Shelter Manager · Chittagong",
                avatar: "NS",
                quote:
                  "Managing listings and applications has never been easier. We've seen a 40% increase in successful adoptions since joining.",
              },
              {
                name: "Dr. Ariful Haque",
                role: "Veterinarian · Sylhet",
                avatar: "AH",
                quote:
                  "The prescription editor and medical history tools are exactly what our clinic needed. Patients love the digital records.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white border border-[#E5E7EB] rounded-[18px] p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={13}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#374151] leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#16A34A]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to find your companion?
          </h2>
          <p className="text-[#BBF7D0] text-sm mb-8 max-w-md mx-auto">
            Join thousands of families who found their perfect
            pet through PawSphere.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate("register")}
              className="bg-white text-[#16A34A] font-semibold text-sm px-6 py-3 rounded-[12px] hover:bg-[#F0FDF4] transition-colors"
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate("browse-pets-public")}
              className="text-white border border-white/40 font-medium text-sm px-6 py-3 rounded-[12px] hover:bg-white/10 transition-colors"
            >
              Browse Pets
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111827] text-[#9CA3AF] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#16A34A] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    P
                  </span>
                </div>
                <span className="font-semibold text-white">
                  PawSphere
                </span>
              </div>
              <p className="text-xs leading-relaxed max-w-[180px] mb-4">
                Bangladesh&apos;s platform for pet adoption and
                veterinary care.
              </p>
              <div className="flex gap-2">
                {[Twitter, Instagram, Facebook].map(
                  (Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <Icon size={13} className="text-white" />
                    </a>
                  ),
                )}
              </div>
            </div>
            <div>
              <p className="text-white text-xs font-semibold mb-4 uppercase tracking-widest">
                Platform
              </p>
              <ul className="space-y-3 text-xs">
                {[
                  "Browse Pets",
                  "How It Works",
                  "Vet Services",
                  "Pet Care Guide",
                ].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white text-xs font-semibold mb-4 uppercase tracking-widest">
                Roles
              </p>
              <ul className="space-y-3 text-xs">
                {[
                  "Pet Owners",
                  "Shelters",
                  "Veterinarians",
                  "Administrators",
                ].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white text-xs font-semibold mb-4 uppercase tracking-widest">
                Contact
              </p>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center gap-2">
                  <Mail size={12} />
                  hello@pawsphere.bd
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={12} />
                  +880 1700-000000
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={12} />
                  Dhaka, Bangladesh
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <p>© 2024 PawSphere. All rights reserved.</p>
            <div className="flex gap-5">
              <a
                href="#"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
function PawSphereApp() {
  const {
    session,
    profile,
    loading: authLoading,
    error: authError,
    signOut,
  } = useAuth();
  const location = useLocation();
  const routerNavigate = useNavigate();
  const { petId: routePetId } = useParams();
  const role: Role = profile?.role ?? "guest";
  const verificationStatus = profile?.verification_status ?? null;
  const [view, setView] = useState(() => {
    const publicViews: Record<string, string> = {
      "/": "landing",
      "/sign-in": "login",
      "/sign-up": "register",
      "/forgot-password": "forgot-password",
      "/reset-sent": "reset-sent",
      "/browse-pets": "browse-pets-public",
    };
    if (location.pathname.startsWith("/browse-pets/")) {
      return "pet-detail-public";
    }
    return publicViews[location.pathname] ?? "dashboard";
  });
  const [selectedPublicPetId, setSelectedPublicPetId] = useState<string | null>(
    null,
  );
  const [applyingPet, setApplyingPet] = useState<PublicPet | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (profile?.role === "owner" && location.pathname === "/browse-pets") {
      setView("browse-pets");
      return;
    }
    if (
      profile?.role === "owner" &&
      location.pathname.startsWith("/browse-pets/") &&
      routePetId
    ) {
      setSelectedPublicPetId(routePetId);
      setView("pet-detail");
      return;
    }
    const publicViews: Record<string, string> = {
      "/": "landing",
      "/sign-in": "login",
      "/sign-up": "register",
      "/forgot-password": "forgot-password",
      "/reset-sent": "reset-sent",
      "/browse-pets": "browse-pets-public",
    };
    setView(
      location.pathname.startsWith("/browse-pets/")
        ? "pet-detail-public"
        : publicViews[location.pathname] ?? "dashboard",
    );
  }, [location.pathname, profile?.role, routePetId]);

  useEffect(() => {
    if (!profile || !["/sign-in", "/sign-up"].includes(location.pathname)) {
      return;
    }
    const isPendingProfessional =
      (profile.role === "shelter" || profile.role === "vet") &&
      profile.verification_status === "pending";
    const requestedPath = (
      location.state as { from?: string } | null
    )?.from;
    const safeRequestedPath =
      requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : null;
    routerNavigate(
      isPendingProfessional
        ? "/verification-pending"
        : safeRequestedPath ?? ROLE_HOME_PATHS[profile.role],
      { replace: true, state: null },
    );
  }, [location.pathname, location.state, profile, routerNavigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      setView("landing");
      setShowWelcome(false);
      routerNavigate("/sign-in", { replace: true });
    }
  };

  const navigate = (v: string) => {
    setView(v);
    const publicPaths: Record<string, string> = {
      landing: "/",
      login: "/sign-in",
      register: "/sign-up",
      "forgot-password": "/forgot-password",
      "reset-sent": "/reset-sent",
      "browse-pets-public": "/browse-pets",
    };
    if (publicPaths[v]) {
      routerNavigate(publicPaths[v]);
    } else if (v === "dashboard" && profile) {
      routerNavigate(ROLE_HOME_PATHS[profile.role]);
    }
  };

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><div className="text-center"><RefreshCw className="mx-auto animate-spin text-[#16A34A]" size={28} /><p className="mt-3 text-sm text-[#6B7280]">Loading your account...</p></div></div>;
  }

  // Never block public pages (landing, sign-in, register) on auth errors.
  // Only show a fatal error when a signed-in session cannot load its profile.
  if (session && !profile && authError) {
    return (
      <ErrorPage
        code="500"
        title="Unable to load your account"
        message={authError}
        onHome={() => void handleSignOut()}
      />
    );
  }

  // Guest / public views
  if (role === "guest") {
    if (view === "landing")
      return <LandingPage navigate={navigate} />;
    if (view === "login")
      return <LoginScreen navigate={navigate} />;
    if (view === "register") return <RegisterScreen navigate={navigate} />;
    if (view === "forgot-password") return <ForgotPasswordScreen navigate={navigate} />;
    if (view === "reset-sent") return <ResetSentScreen navigate={navigate} />;
    if (view === "unauthorized") return <ErrorPage code="403" title="This page is private" message="You don’t have permission to view this PawSphere area." onHome={() => navigate("landing")} />;
    if (view === "server-error") return <ErrorPage code="500" title="A paw went sideways" message="Something unexpected happened. Please try again in a moment." onHome={() => navigate("landing")} />;
    if (view === "not-found") return <ErrorPage code="404" title="We couldn’t find that page" message="The page may have moved, or the trail may have gone cold." onHome={() => navigate("landing")} />;
    if (view === "browse-pets-public")
      return (
        <div className="min-h-screen bg-[#F8FAFC]">
          <nav className="bg-white border-b border-[#E5E7EB] px-6 h-[68px] flex items-center justify-between">
            <button
              onClick={() => navigate("landing")}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 bg-[#16A34A] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  P
                </span>
              </div>
              <span className="font-semibold text-[#111827]">
                PawSphere
              </span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("login")}
                className="text-sm font-medium text-[#111827] px-4 py-2 border border-[#E5E7EB] rounded-[10px]"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("register")}
                className="text-sm font-medium text-white bg-[#16A34A] px-4 py-2 rounded-[10px]"
              >
                Register
              </button>
            </div>
          </nav>
          <div className="max-w-6xl mx-auto px-6 py-8">
            <PublicBrowsePets
              onPetClick={(petId) =>
                routerNavigate(`/browse-pets/${petId}`)
              }
              onSignIn={() => navigate("login")}
            />
          </div>
        </div>
      );
    if (view === "pet-detail-public")
      return (
        <div className="min-h-screen bg-[#F8FAFC]">
          <nav className="bg-white border-b border-[#E5E7EB] px-6 h-[68px] flex items-center justify-between">
            <button
              onClick={() => navigate("landing")}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 bg-[#16A34A] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  P
                </span>
              </div>
              <span className="font-semibold text-[#111827]">
                PawSphere
              </span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("login")}
                className="text-sm font-medium text-[#111827] px-4 py-2 border border-[#E5E7EB] rounded-[10px]"
              >
                Sign In
              </button>
            </div>
          </nav>
          <div className="max-w-6xl mx-auto px-6 py-8">
            <PublicPetDetails
              petId={routePetId ?? ""}
              onBack={() => routerNavigate("/browse-pets")}
              onPetClick={(petId) =>
                routerNavigate(`/browse-pets/${petId}`)
              }
              onApply={() => navigate("login")}
            />
          </div>
        </div>
      );
    return <LandingPage navigate={navigate} />;
  }

  if (
    (role === "shelter" || role === "vet") &&
    verificationStatus === "pending"
  ) {
    return <VerificationPendingScreen role={role} onLogout={() => void handleSignOut()} />;
  }

  if (
    (role === "shelter" || role === "vet") &&
    verificationStatus === "rejected"
  ) {
    return <ErrorPage code="403" title="Account verification declined" message="Contact PawSphere support if you believe your professional account should be reviewed again." onHome={() => void handleSignOut()} />;
  }

  // Render dashboard screen content by role + view
  const renderContent = () => {
    // Shared
    if (view === "messages") return <MessagesInbox />;
    if (view === "settings")
      return role === "admin" ? (
        <AdminSettingsScreen />
      ) : (
        <SettingsScreen role={role} />
      );
    if (view === "notifications")
      return <NotificationsScreen />;

    if (role === "owner") {
      if (view === "dashboard")
        return <OwnerDashboard setView={setView} />;
      if (view === "browse-pets")
        return (
          <PublicBrowsePets
            onPetClick={(petId) => {
              setSelectedPublicPetId(petId);
              setView("pet-detail");
            }}
          />
        );
      if (view === "pet-detail")
        return selectedPublicPetId ? (
          <PublicPetDetails
            petId={selectedPublicPetId}
            onBack={() => setView("browse-pets")}
            onPetClick={setSelectedPublicPetId}
            onApply={(pet) => {
              setApplyingPet(pet);
              setView("apply-adoption");
            }}
          />
        ) : (
          <EmptyState
            text="Select a pet from Browse Pets to view its details."
          />
        );
      if (view === "find-vet")
        return (
          <AppointmentBooking
            onCancel={() => setView("appointments")}
            onBooked={() => setView("appointments")}
          />
        );
      if (view === "apply-adoption" && applyingPet)
        return (
          <AdoptionApplicationWizard
            pet={applyingPet}
            onCancel={() => setView("pet-detail")}
            onSubmitted={() => {
              setApplyingPet(null);
              setView("adoption");
            }}
          />
        );
      if (view === "adoption") return <OwnerAdoptionApplications />;
      if (view === "my-pets") return <MyPetsScreen />;
      if (view === "appointments")
        return <OwnerAppointments onBook={() => setView("find-vet")} />;
      if (view === "health-records") return <OwnerHealthRecords />;
      if (view === "favorites") return <FavoritesScreen />;
      if (view === "guide") return <GuideScreen />;
    }

    if (role === "shelter") {
      if (view === "dashboard")
        return <ShelterDashboard setView={setView} />;
      if (view === "add-pet")
        return (
          <ShelterPetForm
            pet={editingPet}
            onSaved={() => {
              setEditingPet(null);
              setView("pet-listings");
            }}
            onCancel={() => {
              setEditingPet(null);
              setView("pet-listings");
            }}
          />
        );
      if (view === "pet-listings")
        return (
          <ShelterPetListings
            canManage
            onAdd={() => {
              setEditingPet(null);
              setView("add-pet");
            }}
            onEdit={(pet) => {
              setEditingPet(pet);
              setView("add-pet");
            }}
          />
        );
      if (view === "applications")
        return <ShelterAdoptionApplications />;
      if (view === "meet-greet") return <MeetGreetScreen />;
      if (view === "certificates")
        return <AdoptionCertificates />;
      if (view === "analytics") return <ShelterAnalytics />;
    }

    if (role === "vet") {
      if (view === "dashboard") return <VetDashboard />;
      if (view === "appointments")
        return (
          <VetAppointmentManagement
            onOpenPrescription={() => setView("prescriptions")}
          />
        );
      if (view === "patients") return <VetPatientRecords />;
      if (view === "prescriptions")
        return <PrescriptionEditor />;
      if (view === "vaccinations")
        return <VaccinationRecords canManage />;
      if (view === "medical-history")
        return <MedicalTimelineScreen />;
    }

    if (role === "admin") {
      if (view === "dashboard") return <AdminDashboard />;
      if (view === "users") return <AdminUsersScreen />;
      if (view === "verification")
        return <AdminVerificationScreen />;
      if (view === "pets-listings") return <AdminPetsScreen />;
      if (view === "adoptions") return <AdminAdoptionsScreen />;
      if (view === "analytics") return <AdminAnalyticsScreen />;
      if (view === "broadcasts") return <BroadcastsScreen />;
      if (view === "moderation") return <ModerationScreen />;
      if (view === "feedback") return <FeedbackScreen />;
      if (view === "logs") return <SystemLogsScreen />;
    }

    return <EmptyState text="Page not found." />;
  };

  return (
    <>
      <DashboardLayout
        role={role}
        view={view}
        setView={(nextView) => {
          if (nextView === "add-pet") setEditingPet(null);
          setView(nextView);
        }}
        onSignOut={handleSignOut}
      >
        {renderContent()}
      </DashboardLayout>
      {showWelcome && <WelcomeModal role={role} onClose={() => setShowWelcome(false)} />}
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PawSphereApp />} />
      <Route path="/sign-in" element={<PawSphereApp />} />
      <Route path="/sign-up" element={<PawSphereApp />} />
      <Route path="/forgot-password" element={<PawSphereApp />} />
      <Route path="/reset-sent" element={<PawSphereApp />} />
      <Route path="/browse-pets" element={<PawSphereApp />} />
      <Route path="/browse-pets/:petId" element={<PawSphereApp />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute allowedRoles={["owner"]}>
            <PawSphereApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shelter/*"
        element={
          <ProtectedRoute allowedRoles={["shelter"]}>
            <PawSphereApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vet/*"
        element={
          <ProtectedRoute allowedRoles={["vet"]}>
            <PawSphereApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <PawSphereApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verification-pending"
        element={
          <ProtectedRoute
            allowedRoles={["shelter", "vet"]}
            allowPending
          >
            <PawSphereApp />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}