import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardList,
  Cloud,
  Cpu,
  FileScan,
  FlaskConical,
  Gauge,
  Handshake,
  HeartPulse,
  History,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  Package,
  Pill,
  Receipt,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  group: string;
}

export const patientNav: NavItem[] = [
  {
    to: "/app",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "Care",
    description: "Your medicine command centre",
  },
  {
    to: "/app/search",
    label: "Find medicine",
    icon: Search,
    group: "Care",
    description: "Search by brand, generic or ingredient",
  },
  {
    to: "/app/compare",
    label: "Compare prices",
    icon: BarChart3,
    group: "Care",
    description: "Side-by-side equivalent products",
  },
  {
    to: "/app/pharmacies",
    label: "Pharmacies",
    icon: MapPin,
    group: "Care",
    description: "Nearby pharmacies and availability",
  },
  {
    to: "/app/prescriptions",
    label: "Prescriptions",
    icon: FileScan,
    group: "Documents",
    description: "Upload and review extractions",
  },
  {
    to: "/app/labs",
    label: "Lab reports",
    icon: FlaskConical,
    group: "Documents",
    description: "Understand test names and ranges",
  },
  {
    to: "/app/verify",
    label: "Pack verification",
    icon: BadgeCheck,
    group: "Documents",
    description: "Scan a pack barcode or QR",
  },
  {
    to: "/app/assistant",
    label: "Medicine assistant",
    icon: MessageSquareText,
    group: "Guidance",
    description: "Ask about a medicine",
  },
  {
    to: "/app/triage",
    label: "Symptom check",
    icon: Stethoscope,
    group: "Guidance",
    description: "Where to go, not what you have",
  },
  {
    to: "/app/interactions",
    label: "Interaction check",
    icon: ShieldAlert,
    group: "Guidance",
    description: "Medicines and allergies review",
  },
  {
    to: "/app/reminders",
    label: "Reminders",
    icon: CalendarClock,
    group: "Routine",
    description: "Doses, adherence and snoozes",
  },
  {
    to: "/app/orders",
    label: "Orders",
    icon: ShoppingBag,
    group: "Routine",
    description: "Reservations and order status",
  },
  {
    to: "/app/history",
    label: "History",
    icon: History,
    group: "Routine",
    description: "Medicines, documents, comparisons",
  },
  {
    to: "/app/workspace",
    label: "Google Workspace",
    icon: Cloud,
    group: "Integrations",
    description: "Gmail, Calendar & Drive sync",
  },
  {
    to: "/app/notifications",
    label: "Notifications",
    icon: Bell,
    group: "Account",
    description: "Alerts and activity",
  },
  {
    to: "/app/settings",
    label: "Settings",
    icon: Settings,
    group: "Account",
    description: "Profile, privacy and security",
  },
];

export const patientBottomNav = patientNav.filter((n) =>
  ["/app", "/app/search", "/app/assistant", "/app/reminders"].includes(n.to),
);

export const pharmacyNav: NavItem[] = [
  { to: "/pharmacy", label: "Overview", icon: Gauge, group: "Workspace" },
  {
    to: "/pharmacy/inventory",
    label: "Inventory",
    icon: Boxes,
    group: "Workspace",
  },
  {
    to: "/pharmacy/prescriptions",
    label: "Verification queue",
    icon: ClipboardList,
    group: "Workspace",
  },
  {
    to: "/pharmacy/orders",
    label: "Orders",
    icon: Package,
    group: "Workspace",
  },
  {
    to: "/pharmacy/customers",
    label: "Customers",
    icon: Users,
    group: "Relations",
  },
  {
    to: "/pharmacy/suppliers",
    label: "Suppliers",
    icon: Handshake,
    group: "Relations",
  },
  {
    to: "/pharmacy/analytics",
    label: "Analytics",
    icon: BarChart3,
    group: "Relations",
  },
];

export const doctorNav: NavItem[] = [
  { to: "/doctor", label: "Patients", icon: Users, group: "Practice" },
  {
    to: "/doctor/patients",
    label: "Patient health metrics",
    icon: HeartPulse,
    group: "Practice",
    description: "Longitudinal health metrics and vital trends",
  },
  {
    to: "/doctor/prescriptions",
    label: "Prescription review",
    icon: Pill,
    group: "Practice",
  },
  {
    to: "/doctor/schedule",
    label: "Schedule & OPD",
    icon: CalendarClock,
    group: "Practice",
  },
  {
    to: "/doctor/labs",
    label: "Lab & Diagnostics",
    icon: FlaskConical,
    group: "Intelligence",
  },
  {
    to: "/doctor/cdss",
    label: "CDSS & Interactions",
    icon: ShieldAlert,
    group: "Intelligence",
  },
  {
    to: "/doctor/consults",
    label: "Teleconsult & SOAP",
    icon: Stethoscope,
    group: "Intelligence",
  },
  {
    to: "/doctor/analytics",
    label: "Practice analytics",
    icon: BarChart3,
    group: "Insights",
  },
];

export const adminNav: NavItem[] = [
  {
    to: "/admin",
    label: "Platform metrics",
    icon: Activity,
    group: "Operations",
  },
  { to: "/admin/users", label: "Users", icon: Users, group: "Operations" },
  {
    to: "/admin/pharmacies",
    label: "Pharmacies & doctors",
    icon: Building2,
    group: "Operations",
  },
  {
    to: "/admin/system",
    label: "System & AI health",
    icon: Cpu,
    group: "Operations",
  },
  {
    to: "/admin/revenue",
    label: "Revenue & GST payouts",
    icon: Receipt,
    group: "Operations",
  },
  {
    to: "/admin/catalog",
    label: "Catalogue metadata",
    icon: Pill,
    group: "Governance",
  },
  {
    to: "/admin/moderation",
    label: "Moderation",
    icon: ShieldAlert,
    group: "Governance",
  },
  {
    to: "/admin/audit",
    label: "Audit log",
    icon: ClipboardList,
    group: "Governance",
  },
];
