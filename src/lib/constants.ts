export const DEMO_TODAY = "2026-11-10";

export const STATE_KEY = "blackline.demo.v1";
export const SESSION_KEY = "blackline.session.v1";

export const ADMIN_ID = "avery-quinn";

export const TIME_SLOTS = ["11:00", "12:30", "14:00", "15:30", "17:00"] as const;

export const BOROUGHS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
] as const;

export const PLACEMENTS = [
  "Forearm",
  "Upper arm",
  "Wrist",
  "Shoulder",
  "Collarbone",
  "Chest",
  "Ribs",
  "Back",
  "Thigh",
  "Calf",
  "Ankle",
  "Neck",
  "Hand",
  "Other",
] as const;

export const SIZES = [
  "Tiny (under 2 in)",
  "Small (2–4 in)",
  "Medium (4–7 in)",
  "Large (7–12 in)",
  "Full sleeve or back",
] as const;

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const PRICE_FILTERS = [
  { id: "any", label: "Any price" },
  { id: "under-200", label: "Under $200" },
  { id: "200-350", label: "$200–$350" },
  { id: "350-500", label: "$350–$500" },
  { id: "500-plus", label: "$500 and up" },
] as const;

export const SORTS = [
  { id: "relevance", label: "Relevance" },
  { id: "rating", label: "Rating" },
  { id: "price-asc", label: "Price, low to high" },
  { id: "price-desc", label: "Price, high to low" },
] as const;
