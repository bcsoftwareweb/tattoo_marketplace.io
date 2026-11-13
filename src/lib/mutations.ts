import { transitionBooking, type BookingAction } from "@/lib/booking";
import { ADMIN_ID, BOROUGHS, DEMO_TODAY, TIME_SLOTS } from "@/lib/constants";
import { deriveState } from "@/lib/derive";
import { addDays, uid, weekdayIndex } from "@/lib/format";
import { bookingPath, messagePath } from "@/lib/permissions";
import type {
  Actor,
  Artist,
  Category,
  ChatMessage,
  Customer,
  DemoState,
  PlatformSettings,
  PortfolioItem,
  ReferenceImage,
  Service,
  TattooStyle,
} from "@/lib/types";

export interface Result {
  state: DemoState;
  error?: string;
  id?: string;
}

function fail(state: DemoState, error: string): Result {
  return { state, error };
}

function artistOf(state: DemoState, id: string) {
  return state.artists.find((artist) => artist.id === id) ?? null;
}

export function slotsFor(state: DemoState, artistId: string, date: string) {
  const artist = artistOf(state, artistId);
  if (!artist || date < DEMO_TODAY) return [];
  const day = artist.availability.find((item) => item.date === date);
  if (!day || day.status !== "open") return [];
  const hours = artist.workingHours.find((item) => item.day === weekdayIndex(date));
  if (!hours || hours.closed) return [];
  return TIME_SLOTS.filter((slot) => slot >= hours.open && slot < hours.close);
}

function setDay(state: DemoState, artistId: string, date: string, status: "open" | "blocked" | "booked") {
  return {
    ...state,
    artists: state.artists.map((artist) =>
      artist.id === artistId
        ? {
            ...artist,
            availability: artist.availability.map((day) => (day.date === date ? { ...day, status } : day)),
          }
        : artist,
    ),
  };
}

function releaseDay(state: DemoState, artistId: string, date: string) {
  const stillHeld = state.bookings.some(
    (booking) =>
      booking.artistId === artistId &&
      booking.appointmentDate === date &&
      (booking.status === "confirmed" || booking.status === "completed"),
  );
  if (stillHeld) return state;
  return setDay(state, artistId, date, "open");
}

export function applyBookingAction(state: DemoState, bookingId: string, action: BookingAction, actor: Actor, now: string): Result {
  const booking = state.bookings.find((item) => item.id === bookingId);
  if (!booking) return fail(state, "Booking not found.");
  if (action.type === "pay_deposit") {
    const artist = artistOf(state, booking.artistId);
    const day = artist?.availability.find((item) => item.date === booking.appointmentDate);
    if (day?.status === "booked") return fail(state, "That date was just taken. Ask the artist for another day.");
  }
  const result = transitionBooking(booking, action, actor, state.settings, state.transactions, now);
  if (!result.ok) return fail(state, result.error);
  let next: DemoState = {
    ...state,
    bookings: state.bookings.map((item) => (item.id === bookingId ? result.booking : item)),
    transactions: [...state.transactions, ...result.transactions.map((item) => ({ ...item, id: uid("tx") }))],
    notifications: [
      ...result.notifications.map((item) => ({ ...item, id: uid("nt"), read: false, createdAt: now })),
      ...state.notifications,
    ],
    activity: [...result.activity.map((item) => ({ ...item, id: uid("act") })), ...state.activity],
  };
  if (result.blockDate) next = setDay(next, booking.artistId, result.blockDate, "booked");
  if (result.releaseDate) next = releaseDay(next, booking.artistId, result.releaseDate);
  return { state: next, id: bookingId };
}

export interface BookingDraft {
  customerId: string;
  artistId: string;
  serviceId: string | null;
  idea: string;
  placement: string;
  size: string;
  references: ReferenceImage[];
  requestedDate: string;
  requestedTime: string;
  customerBudget: number;
}

export function createBookingRequest(state: DemoState, draft: BookingDraft, actor: Actor, now: string): Result {
  if (actor.role !== "customer" || actor.userId !== draft.customerId) return fail(state, "Sign in as a customer to request an appointment.");
  const customer = state.customers.find((item) => item.id === draft.customerId);
  if (!customer || customer.status !== "active") return fail(state, "This customer account cannot request appointments.");
  const artist = artistOf(state, draft.artistId);
  if (!artist || artist.verificationStatus !== "approved") return fail(state, "This artist is not accepting bookings.");
  const idea = draft.idea.trim();
  if (idea.length < 20) return fail(state, "Describe the tattoo in at least a sentence.");
  if (!draft.placement || !draft.size) return fail(state, "Choose a placement and size.");
  if (!slotsFor(state, artist.id, draft.requestedDate).includes(draft.requestedTime as (typeof TIME_SLOTS)[number])) {
    return fail(state, "That date and time are not open.");
  }
  const budget = Math.round(draft.customerBudget);
  if (!Number.isFinite(budget) || budget <= 0) return fail(state, "Enter a budget greater than zero.");
  let serviceName = "Custom quote";
  if (draft.serviceId) {
    const service = state.services.find((item) => item.id === draft.serviceId && item.artistId === artist.id);
    if (!service) return fail(state, "Choose a service from this artist.");
    serviceName = service.name;
  }
  const id = uid("bk");
  const booking = {
    id,
    customerId: customer.id,
    artistId: artist.id,
    serviceId: draft.serviceId,
    serviceName,
    idea,
    placement: draft.placement,
    size: draft.size,
    references: draft.references.slice(0, 4),
    requestedDate: draft.requestedDate,
    requestedTime: draft.requestedTime,
    appointmentDate: draft.requestedDate,
    appointmentTime: draft.requestedTime,
    proposedDate: null,
    proposedTime: null,
    quote: null,
    deposit: null,
    customerBudget: budget,
    artistNote: "",
    status: "pending" as const,
    createdAt: now,
    updatedAt: now,
    history: [{ at: now, status: "pending" as const, note: "Request submitted.", actor: "customer" as const }],
  };
  const conversation = ensureConversation(state, customer.id, artist.id);
  const message: ChatMessage = {
    id: uid("msg"),
    senderRole: "customer",
    senderId: customer.id,
    body: `Appointment request: ${serviceName} on ${draft.requestedDate} at ${draft.requestedTime}. ${idea}`,
    createdAt: now,
  };
  const withMessage = sendOnto(conversation.state, conversation.conversationId, message);
  return {
    state: {
      ...withMessage,
      bookings: [booking, ...withMessage.bookings],
      notifications: [
        {
          id: uid("nt"),
          userId: artist.id,
          role: "artist",
          title: `New request from ${customer.name}`,
          body: `${serviceName} · ${draft.placement}`,
          href: bookingPath("artist", id),
          read: false,
          createdAt: now,
          kind: "booking",
        },
        {
          id: uid("nt"),
          userId: customer.id,
          role: "customer",
          title: "Request sent",
          body: `${artist.name} can accept, decline, or propose a new time.`,
          href: bookingPath("customer", id),
          read: false,
          createdAt: now,
          kind: "booking",
        },
        ...withMessage.notifications,
      ],
      activity: [
        { id: uid("act"), userId: customer.id, role: "customer", text: `Requested ${serviceName} with ${artist.name}.`, createdAt: now },
        { id: uid("act"), userId: artist.id, role: "artist", text: `${customer.name} requested ${serviceName}.`, createdAt: now },
        ...withMessage.activity,
      ],
    },
    id,
  };
}

export type ArtistPatch = Partial<
  Pick<
    Artist,
    | "name"
    | "bio"
    | "phone"
    | "photo"
    | "borough"
    | "neighborhood"
    | "studioName"
    | "studioAddress"
    | "yearsExperience"
    | "styleIds"
    | "specialties"
  >
>;

export function updateArtistProfile(state: DemoState, artistId: string, patch: ArtistPatch, actor: Actor): Result {
  if (actor.role !== "artist" || actor.userId !== artistId) return fail(state, "You can only edit your own artist profile.");
  const artist = artistOf(state, artistId);
  if (!artist) return fail(state, "Artist not found.");
  const next = { ...artist, ...patch };
  if (next.name.trim().length < 2) return fail(state, "Enter the name clients should see.");
  if (next.bio.trim().length < 40) return fail(state, "Write a biography of at least a few sentences.");
  if (!BOROUGHS.includes(next.borough as (typeof BOROUGHS)[number])) return fail(state, "Choose a New York borough.");
  if (!next.neighborhood.trim() || !next.studioName.trim() || !next.studioAddress.trim()) {
    return fail(state, "Studio name, neighborhood, and address are required.");
  }
  if (!Number.isInteger(next.yearsExperience) || next.yearsExperience < 0 || next.yearsExperience > 60) {
    return fail(state, "Years of experience should be between 0 and 60.");
  }
  if (!next.styleIds.length || next.styleIds.some((id) => !state.styles.some((style) => style.id === id))) {
    return fail(state, "Select at least one tattoo style.");
  }
  const specialties = next.specialties.map((item) => item.trim()).filter(Boolean).slice(0, 8);
  if (!specialties.length) return fail(state, "Add at least one specialty.");
  const saved: Artist = { ...next, name: next.name.trim(), bio: next.bio.trim(), specialties };
  return {
    state: deriveState({ ...state, artists: state.artists.map((item) => (item.id === artistId ? saved : item)) }),
  };
}

export function addPortfolio(
  state: DemoState,
  artistId: string,
  input: Omit<PortfolioItem, "id" | "artistId">,
  actor: Actor,
): Result {
  if (actor.role !== "artist" || actor.userId !== artistId) return fail(state, "You can only edit your own portfolio.");
  if (!input.image || !input.title.trim() || !input.description.trim()) return fail(state, "Add an image, title, and description.");
  if (!state.categories.some((category) => category.name === input.category)) return fail(state, "Choose a category.");
  const item: PortfolioItem = { ...input, id: uid("pf"), artistId, title: input.title.trim(), description: input.description.trim() };
  return { state: { ...state, portfolio: [item, ...state.portfolio] }, id: item.id };
}

export function updatePortfolio(state: DemoState, id: string, patch: Partial<PortfolioItem>, actor: Actor): Result {
  const item = state.portfolio.find((entry) => entry.id === id);
  if (!item) return fail(state, "Portfolio piece not found.");
  if (actor.role !== "artist" || actor.userId !== item.artistId) return fail(state, "You can only edit your own portfolio.");
  const next = { ...item, ...patch, id: item.id, artistId: item.artistId };
  if (!next.title.trim() || !next.description.trim()) return fail(state, "Title and description are required.");
  return { state: { ...state, portfolio: state.portfolio.map((entry) => (entry.id === id ? next : entry)) } };
}

export function deletePortfolio(state: DemoState, id: string, actor: Actor): Result {
  const item = state.portfolio.find((entry) => entry.id === id);
  if (!item) return fail(state, "Portfolio piece not found.");
  if (actor.role !== "artist" || actor.userId !== item.artistId) return fail(state, "You can only edit your own portfolio.");
  return { state: { ...state, portfolio: state.portfolio.filter((entry) => entry.id !== id) } };
}

function serviceError(state: DemoState, service: Omit<Service, "id" | "artistId">) {
  if (!service.name.trim() || service.description.trim().length < 12) return "Add a name and a short description.";
  if (!Number.isFinite(service.minPrice) || !Number.isFinite(service.maxPrice) || service.minPrice <= 0) return "Enter a minimum price greater than zero.";
  if (service.maxPrice < service.minPrice) return "Maximum price must be at least the minimum.";
  if (!Number.isFinite(service.durationMinutes) || service.durationMinutes < 15) return "Duration should be at least 15 minutes.";
  if (!service.styleIds.length) return "Select at least one style.";
  if (service.styleIds.some((id) => !state.styles.some((style) => style.id === id))) return "One of those styles is no longer on the platform.";
  return null;
}

export function addService(state: DemoState, artistId: string, input: Omit<Service, "id" | "artistId">, actor: Actor): Result {
  if (actor.role !== "artist" || actor.userId !== artistId) return fail(state, "You can only edit your own services.");
  const error = serviceError(state, input);
  if (error) return fail(state, error);
  const service: Service = {
    ...input,
    id: uid("svc"),
    artistId,
    name: input.name.trim(),
    description: input.description.trim(),
    minPrice: Math.round(input.minPrice),
    maxPrice: Math.round(input.maxPrice),
    durationMinutes: Math.round(input.durationMinutes),
  };
  return { state: deriveState({ ...state, services: [...state.services, service] }), id: service.id };
}

export function updateService(state: DemoState, id: string, patch: Partial<Service>, actor: Actor): Result {
  const current = state.services.find((service) => service.id === id);
  if (!current) return fail(state, "Service not found.");
  if (actor.role !== "artist" || actor.userId !== current.artistId) return fail(state, "You can only edit your own services.");
  const next = { ...current, ...patch, id: current.id, artistId: current.artistId };
  const error = serviceError(state, next);
  if (error) return fail(state, error);
  return {
    state: deriveState({
      ...state,
      services: state.services.map((service) => (service.id === id ? { ...next, name: next.name.trim(), description: next.description.trim() } : service)),
    }),
  };
}

export function deleteService(state: DemoState, id: string, actor: Actor): Result {
  const current = state.services.find((service) => service.id === id);
  if (!current) return fail(state, "Service not found.");
  if (actor.role !== "artist" || actor.userId !== current.artistId) return fail(state, "You can only edit your own services.");
  const remaining = state.services.filter((service) => service.artistId === current.artistId && service.id !== id);
  if (!remaining.length) return fail(state, "Keep at least one service on your profile.");
  return { state: deriveState({ ...state, services: state.services.filter((service) => service.id !== id) }) };
}

export function toggleAvailability(state: DemoState, artistId: string, date: string, actor: Actor): Result {
  if (actor.role !== "artist" || actor.userId !== artistId) return fail(state, "You can only edit your own calendar.");
  if (date < DEMO_TODAY) return fail(state, "Past dates stay as they are.");
  const artist = artistOf(state, artistId);
  const day = artist?.availability.find((item) => item.date === date);
  if (!day) return fail(state, "That date is outside the published calendar.");
  if (day.status === "booked") return fail(state, "Confirmed appointments keep the day booked.");
  return { state: setDay(state, artistId, date, day.status === "open" ? "blocked" : "open") };
}

export function updateWorkingHours(state: DemoState, artistId: string, hours: Artist["workingHours"], actor: Actor): Result {
  if (actor.role !== "artist" || actor.userId !== artistId) return fail(state, "You can only edit your own hours.");
  if (hours.length !== 7) return fail(state, "Set hours for every day of the week.");
  for (const day of hours) {
    if (!day.closed && day.open >= day.close) return fail(state, "Closing time has to be after opening time.");
  }
  return {
    state: {
      ...state,
      artists: state.artists.map((artist) => (artist.id === artistId ? { ...artist, workingHours: hours } : artist)),
    },
  };
}

export function updateCustomer(state: DemoState, customerId: string, patch: Partial<Pick<Customer, "name" | "phone" | "photo" | "borough" | "neighborhood" | "bio">>, actor: Actor): Result {
  if (actor.role !== "customer" || actor.userId !== customerId) return fail(state, "You can only edit your own profile.");
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return fail(state, "Customer not found.");
  const next = { ...customer, ...patch };
  if (next.name.trim().length < 2) return fail(state, "Enter your name.");
  if (!BOROUGHS.includes(next.borough as (typeof BOROUGHS)[number])) return fail(state, "Choose a New York borough.");
  return {
    state: {
      ...state,
      customers: state.customers.map((item) => (item.id === customerId ? { ...next, name: next.name.trim(), bio: next.bio.trim() } : item)),
    },
  };
}

export function toggleFavorite(state: DemoState, customerId: string, artistId: string, actor: Actor): Result {
  if (actor.role !== "customer" || actor.userId !== customerId) return fail(state, "Sign in as a customer to save artists.");
  if (!artistOf(state, artistId)) return fail(state, "Artist not found.");
  const current = state.favorites[customerId] ?? [];
  const next = current.includes(artistId) ? current.filter((id) => id !== artistId) : [...current, artistId];
  return { state: { ...state, favorites: { ...state.favorites, [customerId]: next } } };
}

export function ensureConversation(state: DemoState, customerId: string, artistId: string) {
  const existing = state.conversations.find((item) => item.customerId === customerId && item.artistId === artistId);
  if (existing) return { state, conversationId: existing.id };
  const conversationId = uid("conv");
  return {
    state: {
      ...state,
      conversations: [{ id: conversationId, customerId, artistId, messages: [], updatedAt: new Date().toISOString() }, ...state.conversations],
    },
    conversationId,
  };
}

function sendOnto(state: DemoState, conversationId: string, message: ChatMessage) {
  return {
    ...state,
    conversations: state.conversations.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, messages: [...conversation.messages, message], updatedAt: message.createdAt }
        : conversation,
    ),
  };
}

export function sendMessage(state: DemoState, conversationId: string, body: string, attachment: { name: string; url: string } | null, actor: Actor, now: string): Result {
  const conversation = state.conversations.find((item) => item.id === conversationId);
  if (!conversation) return fail(state, "Conversation not found.");
  const customerSide = actor.role === "customer" && actor.userId === conversation.customerId;
  const artistSide = actor.role === "artist" && actor.userId === conversation.artistId;
  if (!customerSide && !artistSide) return fail(state, "You are not part of this conversation.");
  const text = body.trim();
  if (!text && !attachment) return fail(state, "Write a message or attach an image.");
  if (text.length > 2000) return fail(state, "Keep the message under 2,000 characters.");
  const senderRole = customerSide ? "customer" : "artist";
  const message: ChatMessage = {
    id: uid("msg"),
    senderRole,
    senderId: actor.userId,
    body: text,
    createdAt: now,
    attachment: attachment ?? undefined,
  };
  const recipientId = customerSide ? conversation.artistId : conversation.customerId;
  const recipientRole = customerSide ? "artist" : "customer";
  return {
    state: {
      ...sendOnto(state, conversationId, message),
      notifications: [
        {
          id: uid("nt"),
          userId: recipientId,
          role: recipientRole,
          title: "New message",
          body: text || "Sent an image.",
          href: messagePath(recipientRole, conversationId),
          read: false,
          createdAt: now,
          kind: "message",
        },
        ...state.notifications,
      ],
    },
  };
}

export function markNotificationRead(state: DemoState, id: string, actor: Actor): Result {
  return {
    state: {
      ...state,
      notifications: state.notifications.map((item) => (item.id === id && item.userId === actor.userId ? { ...item, read: true } : item)),
    },
  };
}

export function markAllRead(state: DemoState, actor: Actor): Result {
  return {
    state: {
      ...state,
      notifications: state.notifications.map((item) => (item.userId === actor.userId ? { ...item, read: true } : item)),
    },
  };
}

export function setVerification(state: DemoState, artistId: string, status: Artist["verificationStatus"], note: string, actor: Actor, now: string): Result {
  if (actor.role !== "admin") return fail(state, "Only an administrator can change verification.");
  const artist = artistOf(state, artistId);
  if (!artist) return fail(state, "Artist not found.");
  const allowed =
    (status === "approved" && ["pending", "rejected", "suspended"].includes(artist.verificationStatus)) ||
    (status === "rejected" && artist.verificationStatus === "pending") ||
    (status === "suspended" && artist.verificationStatus === "approved") ||
    (status === "approved" && artist.verificationStatus === "suspended");
  if (!allowed && status !== artist.verificationStatus) {
    if (!(status === "approved" && artist.verificationStatus !== "approved")) {
      return fail(state, "That verification change is not allowed.");
    }
  }
  if (status === "rejected" && artist.verificationStatus !== "pending") return fail(state, "Only a pending application can be rejected.");
  if (status === "suspended" && artist.verificationStatus !== "approved") return fail(state, "Only an approved artist can be suspended.");
  if (status === "pending") return fail(state, "Applications cannot be moved back to pending.");
  const verificationNote = note.trim() || artist.verificationNote;
  return {
    state: deriveState({
      ...state,
      artists: state.artists.map((item) => (item.id === artistId ? { ...item, verificationStatus: status, verificationNote, featured: status === "approved" ? item.featured : false } : item)),
      notifications: [
        {
          id: uid("nt"),
          userId: artistId,
          role: "artist",
          title: "Verification updated",
          body: `Your profile is now ${status}. ${verificationNote}`,
          href: "/artist/profile",
          read: false,
          createdAt: now,
          kind: "verification",
        },
        ...state.notifications,
      ],
      activity: [{ id: uid("act"), userId: actor.userId, role: "admin", text: `Set ${artist.name} to ${status}.`, createdAt: now }, ...state.activity],
    }),
  };
}

export function setCustomerStatus(state: DemoState, customerId: string, status: Customer["status"], actor: Actor, now: string): Result {
  if (actor.role !== "admin") return fail(state, "Only an administrator can change customer access.");
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) return fail(state, "Customer not found.");
  if (customer.status === status) return { state };
  return {
    state: {
      ...state,
      customers: state.customers.map((item) => (item.id === customerId ? { ...item, status } : item)),
      activity: [{ id: uid("act"), userId: actor.userId, role: "admin", text: `${status === "suspended" ? "Suspended" : "Reactivated"} ${customer.name}.`, createdAt: now }, ...state.activity],
    },
  };
}

export function setReviewStatus(state: DemoState, reviewId: string, status: DemoState["reviews"][number]["status"], actor: Actor): Result {
  if (actor.role !== "admin") return fail(state, "Only an administrator can moderate reviews.");
  if (!state.reviews.some((review) => review.id === reviewId)) return fail(state, "Review not found.");
  return {
    state: deriveState({
      ...state,
      reviews: state.reviews.map((review) => (review.id === reviewId ? { ...review, status } : review)),
    }),
  };
}

export function setReportStatus(state: DemoState, reportId: string, status: DemoState["reports"][number]["status"], actor: Actor): Result {
  if (actor.role !== "admin") return fail(state, "Only an administrator can review reports.");
  if (!state.reports.some((report) => report.id === reportId)) return fail(state, "Report not found.");
  return { state: { ...state, reports: state.reports.map((report) => (report.id === reportId ? { ...report, status } : report)) } };
}

export function toggleFeatured(state: DemoState, artistId: string, actor: Actor): Result {
  if (actor.role !== "admin") return fail(state, "Only an administrator can feature artists.");
  const artist = artistOf(state, artistId);
  if (!artist) return fail(state, "Artist not found.");
  if (artist.verificationStatus !== "approved") return fail(state, "Approve the artist before featuring them.");
  return {
    state: {
      ...state,
      artists: state.artists.map((item) => (item.id === artistId ? { ...item, featured: !item.featured } : item)),
    },
  };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ArtistApplication {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  photo: string;
  borough: string;
  neighborhood: string;
  studioName: string;
  studioAddress: string;
  yearsExperience: number;
  startingPrice: number;
  styleIds: string[];
  specialties: string[];
  bio: string;
  licenseNumber: string;
  studioPermit: string;
  bloodbornePathogenDate: string;
  licenseExpiresOn: string;
  licenseDocument: string;
  notes: string;
}

function applicationCalendar(closed: number[]) {
  return Array.from({ length: 120 }, (_, index) => {
    const date = addDays(DEMO_TODAY, index);
    const closedDay = closed.includes(weekdayIndex(date));
    return { date, status: closedDay ? ("blocked" as const) : ("open" as const) };
  });
}

export function submitArtistApplication(state: DemoState, input: ArtistApplication, now: string): Result {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const neighborhood = input.neighborhood.trim();
  const studioName = input.studioName.trim();
  const studioAddress = input.studioAddress.trim();
  const bio = input.bio.trim();
  const licenseNumber = input.licenseNumber.trim();
  const studioPermit = input.studioPermit.trim();
  const notes = input.notes.trim();
  const years = Math.round(input.yearsExperience);
  const startingPrice = Math.round(input.startingPrice);
  const styleIds = [...new Set(input.styleIds)];
  const specialties = input.specialties.map((item) => item.trim()).filter(Boolean);

  if (name.length < 2) return fail(state, "Enter your name.");
  if (!EMAIL_PATTERN.test(email)) return fail(state, "Enter a valid email address.");
  if (state.artists.some((artist) => artist.email.toLowerCase() === email)) return fail(state, "An application already uses that email.");
  if (phone.replace(/\D/g, "").length < 10) return fail(state, "Enter a phone number.");
  if (!BOROUGHS.includes(input.borough as (typeof BOROUGHS)[number])) return fail(state, "Choose a New York borough.");
  if (neighborhood.length < 2) return fail(state, "Enter your neighborhood.");
  if (studioName.length < 2) return fail(state, "Enter the studio name.");
  if (studioAddress.length < 8) return fail(state, "Enter the studio address.");
  if (!Number.isFinite(years) || years < 0 || years > 60) return fail(state, "Enter years of experience between 0 and 60.");
  if (!Number.isFinite(startingPrice) || startingPrice <= 0) return fail(state, "Enter a starting price greater than zero.");
  if (!styleIds.length || styleIds.some((id) => !state.styles.some((style) => style.id === id))) {
    return fail(state, "Choose at least one style you tattoo.");
  }
  if (!specialties.length || specialties.length > 6) return fail(state, "List between one and six specialties.");
  if (bio.length < 40) return fail(state, "Describe your work in at least a sentence or two.");
  if (licenseNumber.length < 4) return fail(state, "Enter your tattoo license number.");
  if (studioPermit.length < 2) return fail(state, "Enter the studio permit.");
  if (!DATE_PATTERN.test(input.bloodbornePathogenDate) || input.bloodbornePathogenDate > DEMO_TODAY) {
    return fail(state, "Enter a bloodborne pathogen training date that has already passed.");
  }
  if (!DATE_PATTERN.test(input.licenseExpiresOn) || input.licenseExpiresOn < DEMO_TODAY) {
    return fail(state, "Enter a license expiration that is still current.");
  }
  if (!input.licenseDocument.startsWith("data:image/")) {
    return fail(state, "Upload a photo or scan of your tattoo license.");
  }
  if (input.photo && !input.photo.startsWith("data:image/") && !input.photo.startsWith("https://")) {
    return fail(state, "Use a portrait image.");
  }

  const baseSlug = slugify(name);
  if (!baseSlug) return fail(state, "Enter your name.");
  let slug = baseSlug;
  let suffix = 2;
  while (state.artists.some((artist) => artist.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const id = uid("artist");
  const closed = [0, 1];
  const instagram = input.instagram.trim();
  const handle = instagram ? (instagram.startsWith("@") ? instagram : `@${instagram}`) : "";
  const artist: Artist = {
    id,
    slug,
    name,
    email,
    phone,
    photo: input.photo,
    bio,
    borough: input.borough,
    neighborhood,
    studioName,
    studioAddress,
    yearsExperience: years,
    styleIds,
    specialties,
    startingPrice,
    rating: 0,
    reviewCount: 0,
    featured: false,
    verificationStatus: "pending",
    verificationNote: "Application submitted. License and studio permit are waiting on review.",
    license: {
      licenseNumber,
      licenseType: "NYC Tattoo Artist License",
      issuedBy: "New York City Department of Health",
      expiresOn: input.licenseExpiresOn,
      bloodbornePathogenDate: input.bloodbornePathogenDate,
      studioPermit,
      notes: notes || "Submitted from the public artist application.",
      document: input.licenseDocument,
    },
    workingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      closed: closed.includes(day),
      open: "11:00",
      close: "19:00",
    })),
    availability: applicationCalendar(closed),
    joinedAt: now.slice(0, 10),
    instagram: handle,
  };

  return {
    id,
    state: deriveState({
      ...state,
      artists: [...state.artists, artist],
      notifications: [
        {
          id: uid("nt"),
          userId: ADMIN_ID,
          role: "admin",
          title: "Artist application waiting",
          body: `${name} applied from ${neighborhood}. The profile stays hidden until you approve it.`,
          href: `/admin/artists/detail?id=${id}`,
          read: false,
          createdAt: now,
          kind: "verification",
        },
        ...state.notifications,
      ],
      activity: [
        { id: uid("act"), userId: ADMIN_ID, role: "admin", text: `${name} submitted an artist application.`, createdAt: now },
        ...state.activity,
      ],
    }),
  };
}

export function saveStyle(state: DemoState, input: TattooStyle, actor: Actor): Result {
  if (actor.role !== "admin") return fail(state, "Only an administrator can edit styles.");
  const name = input.name.trim();
  if (name.length < 2 || input.description.trim().length < 8) return fail(state, "Add a style name and description.");
  const slug = slugify(input.slug || name);
  const id = input.id || slug;
  if (state.styles.some((style) => style.id !== id && (style.slug === slug || style.name.toLowerCase() === name.toLowerCase()))) {
    return fail(state, "A style with that name already exists.");
  }
  const about = input.about?.trim();
  const style: TattooStyle = { id, name, slug, description: input.description.trim(), image: input.image || state.styles[0]?.image || "", ...(about ? { about } : {}) };
  const exists = state.styles.some((item) => item.id === id);
  return { state: { ...state, styles: exists ? state.styles.map((item) => (item.id === id ? style : item)) : [...state.styles, style] }, id };
}

export function deleteStyle(state: DemoState, id: string, actor: Actor): Result {
  if (actor.role !== "admin") return fail(state, "Only an administrator can edit styles.");
  if (state.artists.some((artist) => artist.styleIds.includes(id)) || state.services.some((service) => service.styleIds.includes(id))) {
    return fail(state, "That style is still used by an artist or service.");
  }
  return { state: { ...state, styles: state.styles.filter((style) => style.id !== id) } };
}

export function saveCategory(state: DemoState, input: Category, actor: Actor): Result {
  if (actor.role !== "admin") return fail(state, "Only an administrator can edit categories.");
  const name = input.name.trim();
  if (name.length < 2) return fail(state, "Enter a category name.");
  const id = input.id || slugify(name);
  if (state.categories.some((category) => category.id !== id && category.name.toLowerCase() === name.toLowerCase())) {
    return fail(state, "That category already exists.");
  }
  const category = { id, name, description: input.description.trim() };
  const exists = state.categories.some((item) => item.id === id);
  return { state: { ...state, categories: exists ? state.categories.map((item) => (item.id === id ? category : item)) : [...state.categories, category] }, id };
}

export function deleteCategory(state: DemoState, id: string, actor: Actor): Result {
  if (actor.role !== "admin") return fail(state, "Only an administrator can edit categories.");
  const category = state.categories.find((item) => item.id === id);
  if (!category) return fail(state, "Category not found.");
  if (state.portfolio.some((item) => item.category === category.name)) return fail(state, "Portfolio pieces still use that category.");
  return { state: { ...state, categories: state.categories.filter((item) => item.id !== id) } };
}

export function updateSettings(state: DemoState, patch: Partial<PlatformSettings>, actor: Actor): Result {
  if (actor.role !== "admin") return fail(state, "Only an administrator can change platform settings.");
  const next = { ...state.settings, ...patch };
  if (!Number.isFinite(next.commissionPercent) || next.commissionPercent < 0 || next.commissionPercent > 40) {
    return fail(state, "Commission must be between 0 and 40 percent.");
  }
  if (!next.platformName.trim() || !next.bookingPolicy.trim() || !next.cancellationPolicy.trim()) {
    return fail(state, "Name and policies cannot be empty.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.supportEmail)) return fail(state, "Enter a valid support email.");
  return {
    state: {
      ...state,
      settings: {
        ...next,
        commissionPercent: Math.round(next.commissionPercent),
        platformName: next.platformName.trim(),
        supportEmail: next.supportEmail.trim(),
        tagline: next.tagline.trim(),
        city: next.city.trim(),
      },
    },
  };
}
