export type Role = "customer" | "artist" | "admin";

export type VerificationStatus = "pending" | "approved" | "rejected" | "suspended";

export type AccountStatus = "active" | "suspended";

export type BookingStatus =
  | "pending"
  | "artist_proposed_changes"
  | "awaiting_customer_confirmation"
  | "awaiting_deposit"
  | "confirmed"
  | "completed"
  | "declined"
  | "cancelled"
  | "disputed"
  | "refunded";

export type ReviewStatus = "published" | "flagged" | "removed";

export type ReportStatus = "open" | "reviewed" | "dismissed";

export type ReportType = "review" | "account" | "portfolio";

export type TransactionType = "deposit" | "balance" | "refund";

export type NotificationKind =
  | "message"
  | "booking"
  | "payment"
  | "verification"
  | "reminder"
  | "system";

export interface TattooStyle {
  id: string;
  name: string;
  slug: string;
  description: string;
  about?: string;
  image: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface WorkingHours {
  day: number;
  closed: boolean;
  open: string;
  close: string;
}

export interface AvailabilityDay {
  date: string;
  status: "open" | "blocked" | "booked";
}

export interface LicenseInfo {
  licenseNumber: string;
  licenseType: string;
  issuedBy: string;
  expiresOn: string;
  bloodbornePathogenDate: string;
  studioPermit: string;
  notes: string;
  document?: string;
}

export interface Service {
  id: string;
  artistId: string;
  name: string;
  description: string;
  styleIds: string[];
  minPrice: number;
  maxPrice: number;
  durationMinutes: number;
  customDesign: boolean;
}

export interface PortfolioItem {
  id: string;
  artistId: string;
  image: string;
  title: string;
  description: string;
  category: string;
  styleId: string;
}

export interface Artist {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string;
  photo: string;
  bio: string;
  borough: string;
  neighborhood: string;
  studioName: string;
  studioAddress: string;
  yearsExperience: number;
  styleIds: string[];
  specialties: string[];
  startingPrice: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  verificationStatus: VerificationStatus;
  verificationNote: string;
  license: LicenseInfo;
  workingHours: WorkingHours[];
  availability: AvailabilityDay[];
  joinedAt: string;
  instagram: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  borough: string;
  neighborhood: string;
  photo: string;
  bio: string;
  status: AccountStatus;
  joinedAt: string;
}

export interface Review {
  id: string;
  artistId: string;
  customerId: string;
  bookingId?: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  status: ReviewStatus;
}

export interface ReferenceImage {
  id: string;
  name: string;
  url: string;
}

export interface Booking {
  id: string;
  customerId: string;
  artistId: string;
  serviceId: string | null;
  serviceName: string;
  idea: string;
  placement: string;
  size: string;
  references: ReferenceImage[];
  requestedDate: string;
  requestedTime: string;
  appointmentDate: string;
  appointmentTime: string;
  proposedDate: string | null;
  proposedTime: string | null;
  quote: number | null;
  deposit: number | null;
  customerBudget: number;
  artistNote: string;
  status: BookingStatus;
  history: BookingEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingEvent {
  at: string;
  status: BookingStatus;
  note: string;
  actor: Role | "system";
}

export interface ChatMessage {
  id: string;
  senderRole: "customer" | "artist";
  senderId: string;
  body: string;
  attachment?: { name: string; url: string };
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  artistId: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  customerId: string;
  artistId: string;
  type: TransactionType;
  amount: number;
  commission: number;
  artistNet: number;
  createdAt: string;
  note: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  role: Role;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
  kind: NotificationKind;
}

export interface Report {
  id: string;
  type: ReportType;
  targetId: string;
  targetLabel: string;
  reporterId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  role: Role;
  text: string;
  createdAt: string;
}

export interface PlatformSettings {
  commissionPercent: number;
  bookingPolicy: string;
  cancellationPolicy: string;
  platformName: string;
  supportEmail: string;
  tagline: string;
  city: string;
}

export interface DemoState {
  artists: Artist[];
  customers: Customer[];
  styles: TattooStyle[];
  categories: Category[];
  services: Service[];
  portfolio: PortfolioItem[];
  bookings: Booking[];
  conversations: Conversation[];
  reviews: Review[];
  transactions: Transaction[];
  notifications: AppNotification[];
  reports: Report[];
  activity: Activity[];
  settings: PlatformSettings;
  favorites: Record<string, string[]>;
}

export interface Session {
  role: Role;
  userId: string;
  email: string;
  name: string;
}

export interface Actor {
  role: Role;
  userId: string;
}
