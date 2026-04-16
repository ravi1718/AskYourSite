export interface BookingPayload {
  url: string;
  name: string;
}

export interface Product {
  name?: string;
  price?: string;
  image?: string;
  url?: string;
  description?: string;
}

export interface Action {
  label: string;
  url?: string;
  style?: "primary" | "secondary";
  icon?: "cart" | "track" | "support";
}

export interface AysMarkers {
  text: string;
  suggestions: string[];
  products: Product[];
  actions: Action[];
  booking: BookingPayload | null;
  handoff: boolean;
}

const AYS_MARKER = "__AYS_";

export function parseMarkers(raw: string): AysMarkers {
  const result: AysMarkers = { text: raw, suggestions: [], products: [], actions: [], booking: null, handoff: false };

  const MARKERS = ["__AYS_SUGGESTIONS__", "__AYS_PRODUCTS__", "__AYS_ACTIONS__", "__AYS_BOOKING__", "__AYS_HANDOFF__"] as const;
  const firstIdx = MARKERS.map(m => raw.indexOf(m)).filter(i => i !== -1);
  if (!firstIdx.length) return result;

  const splitAt = Math.min(...firstIdx);
  result.text = raw.substring(0, splitAt);
  const tail = raw.substring(splitAt);

  // Parse suggestions — stop at any subsequent marker
  const sugsIdx = tail.indexOf("__AYS_SUGGESTIONS__");
  if (sugsIdx !== -1) {
    const afterSugs = tail.substring(sugsIdx + "__AYS_SUGGESTIONS__".length);
    const p = afterSugs.indexOf("__AYS_PRODUCTS__");
    const a = afterSugs.indexOf("__AYS_ACTIONS__");
    const b = afterSugs.indexOf("__AYS_BOOKING__");
    let sugsRaw = afterSugs;
    if (p !== -1) sugsRaw = afterSugs.substring(0, p);
    else if (a !== -1) sugsRaw = afterSugs.substring(0, a);
    else if (b !== -1) sugsRaw = afterSugs.substring(0, b);
    try { result.suggestions = JSON.parse(sugsRaw.trim()); } catch { /* skip */ }
  }

  // Parse products — stop at actions or booking
  const prodsIdx = tail.indexOf("__AYS_PRODUCTS__");
  if (prodsIdx !== -1) {
    const afterProds = tail.substring(prodsIdx + "__AYS_PRODUCTS__".length);
    const a = afterProds.indexOf("__AYS_ACTIONS__");
    const b = afterProds.indexOf("__AYS_BOOKING__");
    let prodsRaw = afterProds;
    if (a !== -1) prodsRaw = afterProds.substring(0, a);
    else if (b !== -1) prodsRaw = afterProds.substring(0, b);
    try { result.products = JSON.parse(prodsRaw.trim()); } catch { /* skip */ }
  }

  // Parse actions — stop at booking
  const actsIdx = tail.indexOf("__AYS_ACTIONS__");
  if (actsIdx !== -1) {
    const afterActs = tail.substring(actsIdx + "__AYS_ACTIONS__".length);
    const b = afterActs.indexOf("__AYS_BOOKING__");
    const actsRaw = b !== -1 ? afterActs.substring(0, b) : afterActs;
    try { result.actions = JSON.parse(actsRaw.trim()); } catch { /* skip */ }
  }

  // Parse booking
  const bookIdx = tail.indexOf("__AYS_BOOKING__");
  if (bookIdx !== -1) {
    const afterBook = tail.substring(bookIdx + "__AYS_BOOKING__".length);
    const h = afterBook.indexOf("__AYS_HANDOFF__");
    const bookRaw = h !== -1 ? afterBook.substring(0, h) : afterBook;
    try { result.booking = JSON.parse(bookRaw.trim()); } catch { /* skip */ }
  }

  // Handoff — always last marker
  result.handoff = tail.indexOf("__AYS_HANDOFF__") !== -1;

  return result;
}

export { AYS_MARKER };
