import { portraits, workAt } from "@/lib/images";
import { addDays, weekdayIndex } from "@/lib/format";
import { balanceSplit, depositSplit } from "@/lib/money";
import { deriveState } from "@/lib/derive";
import type {
  Artist,
  AvailabilityDay,
  Booking,
  Category,
  Conversation,
  Customer,
  DemoState,
  LicenseInfo,
  PortfolioItem,
  Review,
  Service,
  TattooStyle,
  Transaction,
  WorkingHours,
} from "@/lib/types";

const COMMISSION = 12;

export const ADMIN_PROFILE = {
  id: "avery-quinn",
  name: "Avery Quinn",
  email: "admin@demo.com",
  title: "Marketplace administrator",
  photo: portraits.avery,
  phone: "212-555-0199",
};

function license(number: string, notes: string, expiresOn = "2027-08-31"): LicenseInfo {
  return {
    licenseNumber: number,
    licenseType: "NYC Tattoo Artist License",
    issuedBy: "New York City Department of Health",
    expiresOn,
    bloodbornePathogenDate: "2026-03-12",
    studioPermit: `SP-${number.slice(-5)}`,
    notes,
  };
}

function hours(closed: number[]): WorkingHours[] {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    closed: closed.includes(day),
    open: "11:00",
    close: "19:00",
  }));
}

function availability(closed: number[], booked: string[], salt: number): AvailabilityDay[] {
  const days: AvailabilityDay[] = [];
  for (let index = 0; index < 160; index += 1) {
    const date = addDays("2026-09-01", index);
    const dow = weekdayIndex(date);
    let status: AvailabilityDay["status"] = "open";
    if (closed.includes(dow) || (index + salt) % 13 === 0) status = "blocked";
    if (booked.includes(date)) status = "booked";
    days.push({ date, status });
  }
  return days;
}

interface ArtistInput {
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
  featured: boolean;
  verificationStatus: Artist["verificationStatus"];
  verificationNote: string;
  license: LicenseInfo;
  closed: number[];
  booked: string[];
  joinedAt: string;
  instagram: string;
}

const ARTISTS: ArtistInput[] = [
  {
    id: "nova-reyes",
    slug: "nova-reyes",
    name: "Nova Reyes",
    email: "artist@demo.com",
    phone: "347-555-0114",
    photo: portraits.nova,
    bio: "Nova Reyes works in fine line and ornamental blackwork from a private room at Atelier North in Williamsburg. She spent six years between Madrid and Mexico City before coming back to Brooklyn. Most pieces are drawn for the body, not pulled from a flash wall.",
    borough: "Brooklyn",
    neighborhood: "Williamsburg",
    studioName: "Atelier North",
    studioAddress: "118 N 6th Street, Brooklyn, NY 11249",
    yearsExperience: 9,
    styleIds: ["fine-line", "ornamental", "blackwork"],
    specialties: ["Fine line florals", "Ornamental bands", "Small script"],
    startingPrice: 180,
    featured: true,
    verificationStatus: "approved",
    verificationNote: "License and studio permit matched. Approved for public booking.",
    license: license("NYC-TAT-48211", "Active license on file. Bloodborne pathogen training current."),
    closed: [0, 1],
    booked: ["2026-09-14", "2026-11-18", "2026-11-27"],
    joinedAt: "2024-05-16",
    instagram: "@novareyes.ink",
  },
  {
    id: "julian-cho",
    slug: "julian-cho",
    name: "Julian Cho",
    email: "julian.cho@blackline.demo",
    phone: "212-555-0172",
    photo: portraits.julian,
    bio: "Julian Cho has run a Japanese and traditional room on Orchard Street for fourteen years. Large-scale work is booked by the session, with the back piece or sleeve mapped before the first needle goes in.",
    borough: "Manhattan",
    neighborhood: "Lower East Side",
    studioName: "Cho Room",
    studioAddress: "47 Orchard Street, New York, NY 10002",
    yearsExperience: 14,
    styleIds: ["japanese", "traditional"],
    specialties: ["Japanese sleeves", "Traditional flash", "Back pieces"],
    startingPrice: 560,
    featured: true,
    verificationStatus: "approved",
    verificationNote: "Long-standing LES studio. Approved.",
    license: license("NYC-TAT-22018", "Renewed through 2027. Studio permit posted in the room."),
    closed: [0, 1],
    booked: [],
    joinedAt: "2023-11-02",
    instagram: "@choroom.nyc",
  },
  {
    id: "amara-blake",
    slug: "amara-blake",
    name: "Amara Blake",
    email: "amara.blake@blackline.demo",
    phone: "212-555-0144",
    photo: portraits.amara,
    bio: "Amara Blake paints realism and black-and-gray portraiture in Harlem. She is booked for people, pets, and memorial work, and she will say no when a photograph will not translate.",
    borough: "Manhattan",
    neighborhood: "Harlem",
    studioName: "Lenox Atelier",
    studioAddress: "228 Lenox Avenue, New York, NY 10027",
    yearsExperience: 11,
    styleIds: ["realism", "black-gray"],
    specialties: ["Portrait realism", "Pet portraits", "Memorial pieces"],
    startingPrice: 420,
    featured: true,
    verificationStatus: "approved",
    verificationNote: "Approved. Portfolio review completed May 2026.",
    license: license("NYC-TAT-33901", "Harlem studio permit current."),
    closed: [1, 2],
    booked: [],
    joinedAt: "2024-02-11",
    instagram: "@lenoxatelier",
  },
  {
    id: "sage-okonkwo",
    slug: "sage-okonkwo",
    name: "Sage Okonkwo",
    email: "sage.okonkwo@blackline.demo",
    phone: "718-555-0160",
    photo: portraits.sage,
    bio: "Sage Okonkwo builds geometric blackwork in Astoria. The work is measured on the body first — bands, panels, and repeating structures that have to survive movement.",
    borough: "Queens",
    neighborhood: "Astoria",
    studioName: "30th Avenue Studio",
    studioAddress: "31-18 30th Avenue, Astoria, NY 11102",
    yearsExperience: 7,
    styleIds: ["geometric", "blackwork"],
    specialties: ["Geometric bands", "Blackwork panels", "Dotwork"],
    startingPrice: 200,
    featured: false,
    verificationStatus: "approved",
    verificationNote: "Approved after a second look at the studio permit.",
    license: license("NYC-TAT-55120", "Astoria studio permit on file."),
    closed: [0],
    booked: ["2026-10-02"],
    joinedAt: "2025-01-20",
    instagram: "@sage.geometry",
  },
  {
    id: "leo-marino",
    slug: "leo-marino",
    name: "Leo Marino",
    email: "leo.marino@blackline.demo",
    phone: "718-555-0188",
    photo: portraits.leo,
    bio: "Leo Marino has tattooed traditional American and lettering on Staten Island since the late 2000s. Harbor Flash still sells sheets, and the custom work follows the same rules: readable, bold, and finished in the time quoted.",
    borough: "Staten Island",
    neighborhood: "St. George",
    studioName: "Harbor Flash",
    studioAddress: "17 Hyatt Street, Staten Island, NY 10301",
    yearsExperience: 18,
    styleIds: ["traditional", "lettering"],
    specialties: ["American traditional", "Bold lettering", "Cover-ups"],
    startingPrice: 150,
    featured: false,
    verificationStatus: "approved",
    verificationNote: "Approved. Veteran Staten Island license.",
    license: license("NYC-TAT-10442", "Harbor Flash permit posted at the counter."),
    closed: [0],
    booked: ["2026-10-20"],
    joinedAt: "2023-08-09",
    instagram: "@harborflash",
  },
  {
    id: "priya-shah",
    slug: "priya-shah",
    name: "Priya Shah",
    email: "priya.shah@blackline.demo",
    phone: "347-555-0194",
    photo: portraits.priya,
    bio: "Priya Shah draws ornamental and fine-line pieces in Mott Haven. Jewelry-like linework, anklets, and sternum patterns are the core of the book.",
    borough: "Bronx",
    neighborhood: "Mott Haven",
    studioName: "Mott Haven Ink",
    studioAddress: "2851 3rd Avenue, Bronx, NY 10455",
    yearsExperience: 8,
    styleIds: ["ornamental", "fine-line"],
    specialties: ["Ornamental jewelry", "Fine line anklets", "Sternum pieces"],
    startingPrice: 220,
    featured: false,
    verificationStatus: "approved",
    verificationNote: "Recently approved. First public month on Blackline.",
    license: license("NYC-TAT-61002", "Bronx studio permit verified October 2026."),
    closed: [1],
    booked: [],
    joinedAt: "2026-10-28",
    instagram: "@priyashah.line",
  },
  {
    id: "cass-nguyen",
    slug: "cass-nguyen",
    name: "Cass Nguyen",
    email: "cass.nguyen@blackline.demo",
    phone: "347-555-0133",
    photo: portraits.cass,
    bio: "Cass Nguyen works illustrative blackwork out of Jefferson Studio in Bushwick. Animals, objects, and the occasional weird portrait, drawn like a print and tattooed like one.",
    borough: "Brooklyn",
    neighborhood: "Bushwick",
    studioName: "Jefferson Studio",
    studioAddress: "82 Jefferson Street, Brooklyn, NY 11206",
    yearsExperience: 6,
    styleIds: ["illustrative", "blackwork"],
    specialties: ["Illustrative animals", "Object studies", "Graphic blackwork"],
    startingPrice: 190,
    featured: true,
    verificationStatus: "approved",
    verificationNote: "Approved. New Bushwick chair, November 2026.",
    license: license("NYC-TAT-70881", "Jefferson Studio permit current."),
    closed: [0, 1],
    booked: [],
    joinedAt: "2026-11-02",
    instagram: "@cassnguyen.ink",
  },
  {
    id: "river-alvarez",
    slug: "river-alvarez",
    name: "River Alvarez",
    email: "river.alvarez@blackline.demo",
    phone: "212-555-0166",
    photo: portraits.river,
    bio: "River Alvarez tattoos black-and-gray realism from a private room on Avenue A. Soft shading, memorial pieces, and cover-ups that need a calm hand.",
    borough: "Manhattan",
    neighborhood: "East Village",
    studioName: "Avenue A Private",
    studioAddress: "154 Avenue A, New York, NY 10009",
    yearsExperience: 12,
    styleIds: ["black-gray", "realism"],
    specialties: ["Black and gray", "Cover-ups", "Soft realism"],
    startingPrice: 300,
    featured: false,
    verificationStatus: "approved",
    verificationNote: "Approved. East Village private room.",
    license: license("NYC-TAT-28810", "Avenue A permit on file."),
    closed: [2],
    booked: [],
    joinedAt: "2024-09-01",
    instagram: "@avenuea.private",
  },
  {
    id: "mina-park",
    slug: "mina-park",
    name: "Mina Park",
    email: "mina.park@blackline.demo",
    phone: "718-555-0108",
    photo: portraits.mina,
    bio: "Mina Park is applying for a micro-realism chair in Long Island City. The portfolio is small on purpose: tiny botanicals and pet portraits meant to be read up close.",
    borough: "Queens",
    neighborhood: "Long Island City",
    studioName: "Vernon Room",
    studioAddress: "45-10 Vernon Boulevard, Queens, NY 11101",
    yearsExperience: 5,
    styleIds: ["micro-realism", "fine-line"],
    specialties: ["Micro botanicals", "Tiny pet portraits"],
    startingPrice: 250,
    featured: false,
    verificationStatus: "pending",
    verificationNote: "Application in review. Bloodborne certificate uploaded. Studio permit is still being matched.",
    license: license("NYC-TAT-PENDING", "Pending match on the Vernon Boulevard studio permit.", "2027-01-31"),
    closed: [0, 1],
    booked: [],
    joinedAt: "2026-11-06",
    instagram: "@minapark.micro",
  },
  {
    id: "drew-hale",
    slug: "drew-hale",
    name: "Drew Hale",
    email: "drew.hale@blackline.demo",
    phone: "347-555-0177",
    photo: portraits.drew,
    bio: "Drew Hale lettered and tattooed traditional out of Greenpoint. The account is suspended while a customer report is reviewed.",
    borough: "Brooklyn",
    neighborhood: "Greenpoint",
    studioName: "Franklin Lettering",
    studioAddress: "142 Franklin Street, Brooklyn, NY 11222",
    yearsExperience: 10,
    styleIds: ["lettering", "traditional"],
    specialties: ["Script lettering", "Traditional banners"],
    startingPrice: 160,
    featured: false,
    verificationStatus: "suspended",
    verificationNote: "Suspended after a customer report. Public booking is paused.",
    license: license("NYC-TAT-39002", "License is valid, but the public profile is suspended."),
    closed: [0],
    booked: [],
    joinedAt: "2024-06-18",
    instagram: "@franklin.lettering",
  },
  {
    id: "ellis-ward",
    slug: "ellis-ward",
    name: "Ellis Ward",
    email: "ellis.ward@blackline.demo",
    phone: "718-555-0121",
    photo: portraits.ellis,
    bio: "Ellis Ward applied with watercolor and illustrative work from Mott Haven. The application was rejected after the studio permit could not be verified.",
    borough: "Bronx",
    neighborhood: "Mott Haven",
    studioName: "Ward Studio",
    studioAddress: "415 E 138th Street, Bronx, NY 10454",
    yearsExperience: 4,
    styleIds: ["watercolor", "illustrative"],
    specialties: ["Watercolor florals", "Illustrative color"],
    startingPrice: 140,
    featured: false,
    verificationStatus: "rejected",
    verificationNote: "Rejected. Studio permit could not be matched to the listed address.",
    license: license("NYC-TAT-00000", "Permit number did not match Department of Health records.", "2026-12-01"),
    closed: [0, 1],
    booked: [],
    joinedAt: "2026-10-12",
    instagram: "@wardstudio.bx",
  },
];

function toArtist(input: ArtistInput): Artist {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    email: input.email,
    phone: input.phone,
    photo: input.photo,
    bio: input.bio,
    borough: input.borough,
    neighborhood: input.neighborhood,
    studioName: input.studioName,
    studioAddress: input.studioAddress,
    yearsExperience: input.yearsExperience,
    styleIds: input.styleIds,
    specialties: input.specialties,
    startingPrice: input.startingPrice,
    rating: 0,
    reviewCount: 0,
    featured: input.featured,
    verificationStatus: input.verificationStatus,
    verificationNote: input.verificationNote,
    license: input.license,
    workingHours: hours(input.closed),
    availability: availability(input.closed, input.booked, input.name.length),
    joinedAt: input.joinedAt,
    instagram: input.instagram,
  };
}

const STYLE_COPY: Record<string, string> = {
  "fine-line": "Single-needle line, drawn to the scale of the placement.",
  blackwork: "Solid black, ornamental or graphic, with time left for saturation.",
  traditional: "Bold American traditional with limited color and heavy line.",
  japanese: "Japanese composition planned across sessions.",
  realism: "Realism from a usable photograph, usually more than one sitting.",
  geometric: "Measured geometric work that has to line up when you move.",
  ornamental: "Repeating ornamental line, often jewelry-like.",
  illustrative: "Illustrative drawing tattooed with print-like contrast.",
  lettering: "Lettering drawn to stay readable as it heals.",
  "black-gray": "Black and gray shading, soft edges, longer sessions.",
  "micro-realism": "Very small realism meant to be read up close.",
  watercolor: "Color work with soft edges. Not offered by every studio.",
};

function servicesFor(artist: Artist): Service[] {
  const blurb = STYLE_COPY[artist.styleIds[0]] ?? "Custom work drawn for the placement.";
  return [
    {
      id: `svc-${artist.id}-consult`,
      artistId: artist.id,
      name: "Consultation",
      description: `Thirty minutes at ${artist.studioName} to review references, placement, and whether the idea should be tattooed. The consult fee is credited if you book.`,
      styleIds: artist.styleIds,
      minPrice: 60,
      maxPrice: 80,
      durationMinutes: 30,
      customDesign: true,
    },
    {
      id: `svc-${artist.id}-small`,
      artistId: artist.id,
      name: "Small piece",
      description: `${blurb} Typically one sitting at ${artist.studioName}.`,
      styleIds: artist.styleIds.slice(0, 2),
      minPrice: artist.startingPrice,
      maxPrice: artist.startingPrice + 160,
      durationMinutes: 150,
      customDesign: true,
    },
    {
      id: `svc-${artist.id}-custom`,
      artistId: artist.id,
      name: "Custom session",
      description: `A half-day custom session with ${artist.name.split(" ")[0]}. Drawing is sent before the appointment when the schedule allows.`,
      styleIds: artist.styleIds,
      minPrice: artist.startingPrice + 220,
      maxPrice: artist.startingPrice + 1400,
      durationMinutes: 240,
      customDesign: true,
    },
  ];
}

const PIECES: Record<string, Array<[string, string, string]>> = {
  "nova-reyes": [
    ["Olive branch, inner forearm", "Four-inch fine line, healed six weeks. Stem follows the arm instead of sitting flat.", "Floral"],
    ["Ornamental anklet", "Repeating leaf band drawn to clear a boot line.", "Ornament"],
    ["Sternum chain", "Fine ornamental drop, single sitting, no shading.", "Ornament"],
    ["Fine line moth", "Black line only, placed high on the shoulder blade.", "Fauna"],
  ],
  "julian-cho": [
    ["Wind bars and peony", "Start of a half sleeve. Background left open for a later session.", "Japanese"],
    ["Traditional swallow", "Flash from the Orchard Street wall, one hour, bold color.", "Traditional flash"],
    ["Back piece map", "Outline day for a full back. Waves blocked in, figures still pencil.", "Japanese"],
  ],
  "amara-blake": [
    ["Portrait, three-quarter", "Black and gray from a 1970s photograph. Two sessions.", "Portrait"],
    ["Dog, inner bicep", "Pet portrait kept small enough to read across a room.", "Portrait"],
    ["Memorial hands", "Soft realism, ribs, healed and settled.", "Portrait"],
  ],
  "sage-okonkwo": [
    ["Forearm band", "Measured geometric band, negative space left on purpose.", "Geometric"],
    ["Dotwork panel", "Knee to mid-calf panel. Symmetry checked standing, not sitting.", "Geometric"],
    ["Blackwork cuff", "Solid cuff with a hairline gap so it can be extended later.", "Blackwork"],
  ],
  "leo-marino": [
    ["Harbor rose", "Traditional rose and banner, Staten Island flash sheet.", "Traditional flash"],
    ["Banner lettering", "A family name in a banner. Drawn heavy so it stays readable.", "Script"],
    ["Dagger cover-up", "Old faded dagger covered with a larger traditional eagle.", "Cover-up"],
  ],
  "priya-shah": [
    ["Jewelry anklet", "Ornamental chain that stops before the shoe line.", "Ornament"],
    ["Sternum pendant", "Fine line pendant, no color, one sitting.", "Ornament"],
    ["Wrist lace", "Narrow lace band, both wrists, mirrored.", "Ornament"],
  ],
  "cass-nguyen": [
    ["Snake study", "Illustrative snake wrapping the forearm, black only.", "Fauna"],
    ["Matchbox", "Small object study on the calf, printed like a woodcut.", "Fauna"],
    ["Cat portrait, graphic", "Not realism — a graphic cat with heavy black.", "Portrait"],
  ],
  "river-alvarez": [
    ["Moth, black and gray", "Soft shading, upper arm, one long sitting.", "Fauna"],
    ["Cover-up, shoulder", "Old color script softened under black and gray flowers.", "Cover-up"],
    ["Clouds, thigh", "Background clouds for a later figure.", "Blackwork"],
  ],
  "mina-park": [
    ["Tiny fern", "Micro botanical, about an inch, inner wrist.", "Floral"],
    ["Pet eye", "A single eye from a reference photo, very small.", "Portrait"],
    ["Seed pod", "Fine line pod behind the ear.", "Floral"],
  ],
  "drew-hale": [
    ["Script on the ribs", "Lettering sample from before the account was suspended.", "Script"],
    ["Traditional banner", "Banner flash, bold and short.", "Traditional flash"],
  ],
  "ellis-ward": [
    ["Watercolor poppy", "Color study submitted with the rejected application.", "Floral"],
    ["Illustrative koi", "Color koi, not Japanese traditional.", "Fauna"],
  ],
};

function portfolioFor(artist: Artist, offset: number): PortfolioItem[] {
  return (PIECES[artist.id] ?? []).map(([title, description, category], index) => ({
    id: `pf-${artist.id}-${index}`,
    artistId: artist.id,
    image: workAt(offset + index, 1400),
    title,
    description,
    category,
    styleId: artist.styleIds[index % artist.styleIds.length],
  }));
}

function buildStyles(): TattooStyle[] {
  const rows: Array<[string, string, string, string]> = [
    ["fine-line", "Fine line", "Single needle work, florals, and small ornamental drawings.", "Fine line is tattooed with a single needle or a very small grouping. The drawing stays thin, so scale and placement decide whether it reads: a stem that follows the arm holds up better than a stamp. It heals lighter than it looks on day one, which is why these artists draw for the body rather than pull a design off a flash sheet."],
    ["blackwork", "Blackwork", "Solid black, ornamental, and graphic coverage.", "Blackwork uses solid black, bold negative space, and repeating ornament. Coverage can be a band, a panel, or a large field. The piece is planned so the black stays even and the skin left open still reads as part of the drawing."],
    ["traditional", "Traditional", "American traditional: heavy line, limited palette, readable shapes.", "American traditional is built from heavy outlines, a small set of colors, and shapes that stay readable across a room. Roses, daggers, swallows, and banners come from the flash wall, then get scaled to the placement."],
    ["japanese", "Japanese", "Sleeves, backs, and compositions built over several sessions.", "Japanese tattooing is composed as a sleeve, a back, or a panel that has to hold together over several sessions. Background, wind, and flowers are drawn around the subject so the piece grows instead of stacking unrelated pictures."],
    ["realism", "Realism", "Portrait and pet work from photographs that can actually be tattooed.", "Realism is portrait and pet work taken from photographs that can survive skin. These artists talk about size, contrast, and what a face will look like healed before they agree to tattoo it."],
    ["geometric", "Geometric", "Bands, panels, and measured repeating structures.", "Geometric work is measured. Bands, panels, and repeating structures are drawn to the limb so the pattern meets itself and the spacing stays even."],
    ["ornamental", "Ornamental", "Jewelry-like line, lace, and repeating motifs.", "Ornamental tattooing treats line like jewelry: lace, chains, leaves, and repeating motifs scaled to a wrist, an ankle, or a sternum. Most of it is black, and the drawing is made for that exact placement."],
    ["illustrative", "Illustrative", "Drawn imagery with print-like contrast.", "Illustrative tattoos look drawn. Contrast is closer to a print than to a photograph, with animals, objects, and scenes that do not pretend to be a photo."],
    ["lettering", "Lettering", "Script and banners composed to heal cleanly.", "Lettering is script, serif, and banners composed so the words stay readable after they heal. Spacing, baseline, and where the text bends on the body are decided before the stencil goes on."],
    ["black-gray", "Black & gray", "Soft shading, memorial work, and cover-ups.", "Black and gray uses soft shading instead of color. It covers memorial portraits, animals, and cover-ups where a limited palette has to sit over older work."],
    ["micro-realism", "Micro realism", "Very small realism and botanicals.", "Micro realism is very small realism and botanicals. The limit is what a needle can still read at that size, so these artists will turn down a portrait that needs to be larger."],
    ["watercolor", "Watercolor", "Color with soft edges. Fewer artists take it.", "Watercolor uses color with soft edges and less outline. Fewer artists on the index take it, because the color has to be placed where it can heal without a hard border holding it in."],
  ];
  return rows.map(([id, name, description, about], index) => ({
    id,
    name,
    slug: id,
    description,
    about,
    image: workAt(index, 1200),
  }));
}

function buildCategories(): Category[] {
  return [
    ["Floral", "Botanicals, branches, and arrangements."],
    ["Fauna", "Animals, insects, and birds."],
    ["Script", "Lettering and short passages."],
    ["Ornament", "Bands, jewelry, and repeating line."],
    ["Portrait", "People and pets."],
    ["Geometric", "Measured pattern and blackwork structure."],
    ["Traditional flash", "Sheet-style traditional designs."],
    ["Japanese", "Japanese composition and background."],
    ["Blackwork", "Solid black and graphic coverage."],
    ["Cover-up", "Work designed over an existing tattoo."],
  ].map(([name, description]) => ({
    id: name.toLowerCase().replace(/[^a-z]+/g, "-"),
    name,
    description,
  }));
}

const CUSTOMERS: Customer[] = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    email: "customer@demo.com",
    phone: "347-555-0148",
    borough: "Brooklyn",
    neighborhood: "Greenpoint",
    photo: portraits.maya,
    bio: "Product designer in Greenpoint. Collecting fine line and the occasional larger piece. Usually books a consult before committing to placement.",
    status: "active",
    joinedAt: "2025-04-02",
  },
  {
    id: "jordan-ellis",
    name: "Jordan Ellis",
    email: "jordan.ellis@blackline.demo",
    phone: "212-555-0130",
    borough: "Manhattan",
    neighborhood: "Chelsea",
    photo: portraits.jordan,
    bio: "Looking for a small collarbone piece and trying not to rush the lettering.",
    status: "active",
    joinedAt: "2025-09-14",
  },
  {
    id: "samira-patel",
    name: "Samira Patel",
    email: "samira.patel@blackline.demo",
    phone: "718-555-0119",
    borough: "Queens",
    neighborhood: "Astoria",
    photo: portraits.samira,
    bio: "Walks to work and wants an anklet that survives shoes.",
    status: "active",
    joinedAt: "2025-06-21",
  },
  {
    id: "owen-brooks",
    name: "Owen Brooks",
    email: "owen.brooks@blackline.demo",
    phone: "347-555-0182",
    borough: "Brooklyn",
    neighborhood: "Park Slope",
    photo: portraits.owen,
    bio: "Booking a blackwork band and keeping the week after clear.",
    status: "active",
    joinedAt: "2024-12-03",
  },
  {
    id: "lila-nguyen",
    name: "Lila Nguyen",
    email: "lila.nguyen@blackline.demo",
    phone: "212-555-0190",
    borough: "Manhattan",
    neighborhood: "West Village",
    photo: portraits.lila,
    bio: "Has a healed fern from Nova and a declined moth request with River.",
    status: "active",
    joinedAt: "2024-07-19",
  },
  {
    id: "chris-delgado",
    name: "Chris Delgado",
    email: "chris.delgado@blackline.demo",
    phone: "718-555-0155",
    borough: "Bronx",
    neighborhood: "Riverdale",
    photo: portraits.chris,
    bio: "Account suspended after repeated missed appointment fees.",
    status: "suspended",
    joinedAt: "2025-02-08",
  },
];

function event(at: string, status: Booking["status"], note: string, actor: Booking["history"][number]["actor"]) {
  return { at, status, note, actor };
}

function makeBooking(input: Booking): Booking {
  return input;
}

function paid(bookingId: string, customerId: string, artistId: string, quote: number, deposit: number, at: string, note: string): Transaction {
  const split = depositSplit(quote, deposit, COMMISSION);
  return {
    id: `tx-${bookingId}-deposit`,
    bookingId,
    customerId,
    artistId,
    type: "deposit",
    amount: split.amount,
    commission: split.commission,
    artistNet: split.artistNet,
    createdAt: at,
    note,
  };
}

function settled(bookingId: string, customerId: string, artistId: string, quote: number, deposit: number, at: string): Transaction {
  const split = balanceSplit(quote, deposit, COMMISSION);
  return {
    id: `tx-${bookingId}-balance`,
    bookingId,
    customerId,
    artistId,
    type: "balance",
    amount: split.amount,
    commission: split.commission,
    artistNet: split.artistNet,
    createdAt: at,
    note: "Remaining balance settled at the appointment.",
  };
}

function buildBookings(): Booking[] {
  return [
    makeBooking({
      id: "bk-maya-nova",
      customerId: "maya-chen",
      artistId: "nova-reyes",
      serviceId: "svc-nova-reyes-small",
      serviceName: "Small piece",
      idea: "A four-inch olive branch on the inner forearm. Fine line only, no shading, stem following the arm.",
      placement: "Forearm",
      size: "Small (2–4 in)",
      references: [{ id: "ref-maya-nova", name: "Olive study", url: workAt(0, 900) }],
      requestedDate: "2026-11-18",
      requestedTime: "14:00",
      appointmentDate: "2026-11-18",
      appointmentTime: "14:00",
      proposedDate: null,
      proposedTime: null,
      quote: 420,
      deposit: 126,
      customerBudget: 420,
      artistNote: "Accepted at the requested time.",
      status: "confirmed",
      createdAt: "2026-11-01T15:00:00Z",
      updatedAt: "2026-11-02T18:10:00Z",
      history: [
        event("2026-11-01T15:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-11-01T19:20:00Z", "awaiting_deposit", "Accepted at the requested time.", "artist"),
        event("2026-11-02T18:10:00Z", "confirmed", "Deposit recorded.", "customer"),
      ],
    }),
    makeBooking({
      id: "bk-maya-julian",
      customerId: "maya-chen",
      artistId: "julian-cho",
      serviceId: null,
      serviceName: "Custom Japanese session",
      idea: "A quieter Hokusai-inspired wave on the calf. I want the line to read, but not a full background yet.",
      placement: "Calf",
      size: "Large (7–12 in)",
      references: [{ id: "ref-maya-julian", name: "Wave reference", url: workAt(2, 900) }],
      requestedDate: "2026-11-24",
      requestedTime: "12:30",
      appointmentDate: "2026-11-24",
      appointmentTime: "12:30",
      proposedDate: null,
      proposedTime: null,
      quote: null,
      deposit: null,
      customerBudget: 900,
      artistNote: "",
      status: "pending",
      createdAt: "2026-11-08T16:40:00Z",
      updatedAt: "2026-11-08T16:40:00Z",
      history: [event("2026-11-08T16:40:00Z", "pending", "Request submitted.", "customer")],
    }),
    makeBooking({
      id: "bk-maya-amara",
      customerId: "maya-chen",
      artistId: "amara-blake",
      serviceId: "svc-amara-blake-custom",
      serviceName: "Custom session",
      idea: "Black and gray portrait of my grandmother from a 1978 photograph. Upper arm, large enough to read her expression.",
      placement: "Upper arm",
      size: "Large (7–12 in)",
      references: [{ id: "ref-maya-amara", name: "1978 photograph", url: workAt(4, 900) }],
      requestedDate: "2026-12-02",
      requestedTime: "11:00",
      appointmentDate: "2026-12-02",
      appointmentTime: "11:00",
      proposedDate: null,
      proposedTime: null,
      quote: 1400,
      deposit: 420,
      customerBudget: 1400,
      artistNote: "Two sessions. Deposit holds the first.",
      status: "awaiting_deposit",
      createdAt: "2026-11-05T14:00:00Z",
      updatedAt: "2026-11-06T17:00:00Z",
      history: [
        event("2026-11-05T14:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-11-06T17:00:00Z", "awaiting_deposit", "Accepted at the requested time.", "artist"),
      ],
    }),
    makeBooking({
      id: "bk-maya-sage",
      customerId: "maya-chen",
      artistId: "sage-okonkwo",
      serviceId: "svc-sage-okonkwo-small",
      serviceName: "Small piece",
      idea: "A narrow geometric band just above the ankle.",
      placement: "Ankle",
      size: "Small (2–4 in)",
      references: [],
      requestedDate: "2026-10-02",
      requestedTime: "14:00",
      appointmentDate: "2026-10-02",
      appointmentTime: "14:00",
      proposedDate: null,
      proposedTime: null,
      quote: 480,
      deposit: 144,
      customerBudget: 480,
      artistNote: "Completed in one sitting.",
      status: "completed",
      createdAt: "2026-09-20T15:00:00Z",
      updatedAt: "2026-10-02T21:00:00Z",
      history: [
        event("2026-09-20T15:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-09-21T12:00:00Z", "awaiting_deposit", "Accepted at the requested time.", "artist"),
        event("2026-09-21T18:00:00Z", "confirmed", "Deposit recorded.", "customer"),
        event("2026-10-02T21:00:00Z", "completed", "Marked complete.", "artist"),
      ],
    }),
    makeBooking({
      id: "bk-maya-river",
      customerId: "maya-chen",
      artistId: "river-alvarez",
      serviceId: null,
      serviceName: "Custom black and gray",
      idea: "A moth on the shoulder. I cancelled after deciding the placement was wrong.",
      placement: "Shoulder",
      size: "Medium (4–7 in)",
      references: [],
      requestedDate: "2026-11-30",
      requestedTime: "15:30",
      appointmentDate: "2026-11-30",
      appointmentTime: "15:30",
      proposedDate: null,
      proposedTime: null,
      quote: null,
      deposit: null,
      customerBudget: 600,
      artistNote: "",
      status: "cancelled",
      createdAt: "2026-11-03T13:00:00Z",
      updatedAt: "2026-11-04T11:00:00Z",
      history: [
        event("2026-11-03T13:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-11-04T11:00:00Z", "cancelled", "Cancelled by the customer before the artist responded.", "customer"),
      ],
    }),
    makeBooking({
      id: "bk-maya-cass",
      customerId: "maya-chen",
      artistId: "cass-nguyen",
      serviceId: "svc-cass-nguyen-small",
      serviceName: "Small piece",
      idea: "An illustrative snake wrapping the forearm, black only, about six inches.",
      placement: "Forearm",
      size: "Medium (4–7 in)",
      references: [{ id: "ref-maya-cass", name: "Snake study", url: workAt(6, 900) }],
      requestedDate: "2026-11-21",
      requestedTime: "15:30",
      appointmentDate: "2026-11-21",
      appointmentTime: "15:30",
      proposedDate: "2026-11-28",
      proposedTime: "14:00",
      quote: 540,
      deposit: 162,
      customerBudget: 400,
      artistNote: "The 21st is too tight for this scale. I can do the 28th and the price needs to come up.",
      status: "artist_proposed_changes",
      createdAt: "2026-11-07T18:00:00Z",
      updatedAt: "2026-11-09T16:00:00Z",
      history: [
        event("2026-11-07T18:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-11-09T16:00:00Z", "artist_proposed_changes", "The 21st is too tight for this scale. I can do the 28th and the price needs to come up.", "artist"),
      ],
    }),
    makeBooking({
      id: "bk-jordan-nova",
      customerId: "jordan-ellis",
      artistId: "nova-reyes",
      serviceId: "svc-nova-reyes-small",
      serviceName: "Small piece",
      idea: "Short collarbone script. Nothing cursive that will blur. I can come in for a drawing first.",
      placement: "Collarbone",
      size: "Small (2–4 in)",
      references: [],
      requestedDate: "2026-11-20",
      requestedTime: "15:30",
      appointmentDate: "2026-11-20",
      appointmentTime: "15:30",
      proposedDate: null,
      proposedTime: null,
      quote: null,
      deposit: null,
      customerBudget: 350,
      artistNote: "",
      status: "pending",
      createdAt: "2026-11-10T14:20:00Z",
      updatedAt: "2026-11-10T14:20:00Z",
      history: [event("2026-11-10T14:20:00Z", "pending", "Request submitted.", "customer")],
    }),
    makeBooking({
      id: "bk-samira-nova",
      customerId: "samira-patel",
      artistId: "nova-reyes",
      serviceId: "svc-nova-reyes-small",
      serviceName: "Small piece",
      idea: "A repeating leaf anklet that stops before the shoe line. I walk most of the day.",
      placement: "Ankle",
      size: "Small (2–4 in)",
      references: [],
      requestedDate: "2026-11-19",
      requestedTime: "11:00",
      appointmentDate: "2026-11-19",
      appointmentTime: "11:00",
      proposedDate: "2026-11-25",
      proposedTime: "13:00",
      quote: 560,
      deposit: 168,
      customerBudget: 500,
      artistNote: "Moved off the 19th so the anklet is not rushed. Price covers both ankles if you want them matched.",
      status: "artist_proposed_changes",
      createdAt: "2026-11-06T12:00:00Z",
      updatedAt: "2026-11-08T15:30:00Z",
      history: [
        event("2026-11-06T12:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-11-08T15:30:00Z", "artist_proposed_changes", "Moved off the 19th so the anklet is not rushed.", "artist"),
      ],
    }),
    makeBooking({
      id: "bk-owen-nova",
      customerId: "owen-brooks",
      artistId: "nova-reyes",
      serviceId: "svc-nova-reyes-custom",
      serviceName: "Custom session",
      idea: "A solid blackwork band around the forearm, with a hairline gap so it can be extended next year.",
      placement: "Forearm",
      size: "Medium (4–7 in)",
      references: [],
      requestedDate: "2026-11-27",
      requestedTime: "16:00",
      appointmentDate: "2026-11-27",
      appointmentTime: "16:00",
      proposedDate: null,
      proposedTime: null,
      quote: 640,
      deposit: 192,
      customerBudget: 640,
      artistNote: "Accepted. We will stencil the full circumference first.",
      status: "confirmed",
      createdAt: "2026-11-03T17:00:00Z",
      updatedAt: "2026-11-04T20:00:00Z",
      history: [
        event("2026-11-03T17:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-11-04T13:00:00Z", "awaiting_deposit", "Accepted at the requested time.", "artist"),
        event("2026-11-04T20:00:00Z", "confirmed", "Deposit recorded.", "customer"),
      ],
    }),
    makeBooking({
      id: "bk-lila-nova",
      customerId: "lila-nguyen",
      artistId: "nova-reyes",
      serviceId: "svc-nova-reyes-small",
      serviceName: "Small piece",
      idea: "A fine line fern on the ribs.",
      placement: "Ribs",
      size: "Small (2–4 in)",
      references: [],
      requestedDate: "2026-09-14",
      requestedTime: "12:30",
      appointmentDate: "2026-09-14",
      appointmentTime: "12:30",
      proposedDate: null,
      proposedTime: null,
      quote: 300,
      deposit: 90,
      customerBudget: 300,
      artistNote: "Healed cleanly.",
      status: "completed",
      createdAt: "2026-09-01T15:00:00Z",
      updatedAt: "2026-09-14T20:00:00Z",
      history: [
        event("2026-09-01T15:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-09-02T12:00:00Z", "awaiting_deposit", "Accepted at the requested time.", "artist"),
        event("2026-09-02T19:00:00Z", "confirmed", "Deposit recorded.", "customer"),
        event("2026-09-14T20:00:00Z", "completed", "Marked complete.", "artist"),
      ],
    }),
    makeBooking({
      id: "bk-chris-nova",
      customerId: "chris-delgado",
      artistId: "nova-reyes",
      serviceId: "svc-nova-reyes-custom",
      serviceName: "Custom session",
      idea: "A small portrait of my dog. The photo is sharp. I budgeted less than the quote that came back.",
      placement: "Thigh",
      size: "Medium (4–7 in)",
      references: [{ id: "ref-chris-nova", name: "Dog photo", url: workAt(8, 900) }],
      requestedDate: "2026-12-05",
      requestedTime: "14:00",
      appointmentDate: "2026-12-05",
      appointmentTime: "14:00",
      proposedDate: null,
      proposedTime: null,
      quote: 720,
      deposit: 216,
      customerBudget: 500,
      artistNote: "Same date. The portrait cannot be done well at the original budget.",
      status: "awaiting_customer_confirmation",
      createdAt: "2026-11-04T16:00:00Z",
      updatedAt: "2026-11-05T18:00:00Z",
      history: [
        event("2026-11-04T16:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-11-05T18:00:00Z", "awaiting_customer_confirmation", "Same date. The portrait cannot be done well at the original budget.", "artist"),
      ],
    }),
    makeBooking({
      id: "bk-jordan-leo",
      customerId: "jordan-ellis",
      artistId: "leo-marino",
      serviceId: "svc-leo-marino-small",
      serviceName: "Small piece",
      idea: "Traditional dagger on the calf. I am disputing the healed color.",
      placement: "Calf",
      size: "Small (2–4 in)",
      references: [],
      requestedDate: "2026-10-20",
      requestedTime: "11:00",
      appointmentDate: "2026-10-20",
      appointmentTime: "11:00",
      proposedDate: null,
      proposedTime: null,
      quote: 220,
      deposit: 66,
      customerBudget: 220,
      artistNote: "Flash dagger, one hour.",
      status: "disputed",
      createdAt: "2026-10-08T15:00:00Z",
      updatedAt: "2026-11-01T12:00:00Z",
      history: [
        event("2026-10-08T15:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-10-08T18:00:00Z", "awaiting_deposit", "Accepted at the requested time.", "artist"),
        event("2026-10-09T12:00:00Z", "confirmed", "Deposit recorded.", "customer"),
        event("2026-11-01T12:00:00Z", "disputed", "Color healed patchy and I want the deposit reviewed.", "customer"),
      ],
    }),
    makeBooking({
      id: "bk-owen-priya",
      customerId: "owen-brooks",
      artistId: "priya-shah",
      serviceId: "svc-priya-shah-small",
      serviceName: "Small piece",
      idea: "A fine line wrist lace. Refunded after the studio closed that week.",
      placement: "Wrist",
      size: "Tiny (under 2 in)",
      references: [],
      requestedDate: "2026-10-28",
      requestedTime: "12:30",
      appointmentDate: "2026-10-28",
      appointmentTime: "12:30",
      proposedDate: null,
      proposedTime: null,
      quote: 260,
      deposit: 78,
      customerBudget: 260,
      artistNote: "Studio week was cancelled.",
      status: "refunded",
      createdAt: "2026-10-10T15:00:00Z",
      updatedAt: "2026-10-18T16:00:00Z",
      history: [
        event("2026-10-10T15:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-10-11T12:00:00Z", "awaiting_deposit", "Accepted at the requested time.", "artist"),
        event("2026-10-11T18:00:00Z", "confirmed", "Deposit recorded.", "customer"),
        event("2026-10-18T16:00:00Z", "refunded", "Refunded after the studio week was cancelled.", "admin"),
      ],
    }),
    makeBooking({
      id: "bk-lila-river",
      customerId: "lila-nguyen",
      artistId: "river-alvarez",
      serviceId: null,
      serviceName: "Custom black and gray",
      idea: "A large moth over an old stick-and-poke. River declined because the old work needs laser first.",
      placement: "Shoulder",
      size: "Large (7–12 in)",
      references: [],
      requestedDate: "2026-11-16",
      requestedTime: "11:00",
      appointmentDate: "2026-11-16",
      appointmentTime: "11:00",
      proposedDate: null,
      proposedTime: null,
      quote: null,
      deposit: null,
      customerBudget: 800,
      artistNote: "The old stick-and-poke needs fading before I can cover it cleanly.",
      status: "declined",
      createdAt: "2026-10-22T15:00:00Z",
      updatedAt: "2026-10-23T14:00:00Z",
      history: [
        event("2026-10-22T15:00:00Z", "pending", "Request submitted.", "customer"),
        event("2026-10-23T14:00:00Z", "declined", "The old stick-and-poke needs fading before I can cover it cleanly.", "artist"),
      ],
    }),
  ];
}

function buildTransactions(bookings: Booking[]): Transaction[] {
  const find = (id: string) => bookings.find((booking) => booking.id === id)!;
  const rows: Transaction[] = [
    paid("bk-maya-nova", "maya-chen", "nova-reyes", 420, 126, "2026-11-02T18:10:00Z", "Deposit paid at checkout."),
    paid("bk-maya-sage", "maya-chen", "sage-okonkwo", 480, 144, "2026-09-21T18:00:00Z", "Deposit paid at checkout."),
    settled("bk-maya-sage", "maya-chen", "sage-okonkwo", 480, 144, "2026-10-02T21:00:00Z"),
    paid("bk-owen-nova", "owen-brooks", "nova-reyes", 640, 192, "2026-11-04T20:00:00Z", "Deposit paid at checkout."),
    paid("bk-lila-nova", "lila-nguyen", "nova-reyes", 300, 90, "2026-09-02T19:00:00Z", "Deposit paid at checkout."),
    settled("bk-lila-nova", "lila-nguyen", "nova-reyes", 300, 90, "2026-09-14T20:00:00Z"),
    paid("bk-jordan-leo", "jordan-ellis", "leo-marino", 220, 66, "2026-10-09T12:00:00Z", "Deposit paid at checkout."),
    paid("bk-owen-priya", "owen-brooks", "priya-shah", 260, 78, "2026-10-11T18:00:00Z", "Deposit paid at checkout."),
  ];
  const priya = find("bk-owen-priya");
  const deposit = rows.find((row) => row.id === "tx-bk-owen-priya-deposit")!;
  rows.push({
    id: "tx-bk-owen-priya-refund",
    bookingId: priya.id,
    customerId: priya.customerId,
    artistId: priya.artistId,
    type: "refund",
    amount: -deposit.amount,
    commission: -deposit.commission,
    artistNet: -deposit.artistNet,
    createdAt: "2026-10-18T16:00:00Z",
    note: "Refunded after the studio week was cancelled.",
  });
  return rows;
}

function buildConversations(): Conversation[] {
  return [
    {
      id: "conv-maya-nova",
      customerId: "maya-chen",
      artistId: "nova-reyes",
      updatedAt: "2026-11-09T15:00:00Z",
      messages: [
        { id: "m1", senderRole: "customer", senderId: "maya-chen", body: "Hi Nova — inner forearm, about four inches, fine line olive branch. I attached the study.", createdAt: "2026-11-01T15:05:00Z", attachment: { name: "Olive study", url: workAt(0, 800) } },
        { id: "m2", senderRole: "artist", senderId: "nova-reyes", body: "This scale works. I can draw the stem so it follows the arm. November 18 at 2pm is open once the deposit is in.", createdAt: "2026-11-01T19:30:00Z" },
        { id: "m3", senderRole: "customer", senderId: "maya-chen", body: "November 18 is good. I'll pay the deposit.", createdAt: "2026-11-02T18:12:00Z" },
        { id: "m4", senderRole: "artist", senderId: "nova-reyes", body: "See you on the 18th. Come hydrated, and skip anything that thins your blood that week.", createdAt: "2026-11-09T15:00:00Z" },
      ],
    },
    {
      id: "conv-maya-julian",
      customerId: "maya-chen",
      artistId: "julian-cho",
      updatedAt: "2026-11-09T13:00:00Z",
      messages: [
        { id: "m5", senderRole: "customer", senderId: "maya-chen", body: "Would a calf wave be one session or three? I have a Hokusai reference but I want it quieter.", createdAt: "2026-11-08T16:42:00Z" },
        { id: "m6", senderRole: "artist", senderId: "julian-cho", body: "A readable wave at that size is two sessions minimum. I left the request pending so we can lock a consult before I outline anything.", createdAt: "2026-11-09T13:00:00Z" },
      ],
    },
    {
      id: "conv-maya-amara",
      customerId: "maya-chen",
      artistId: "amara-blake",
      updatedAt: "2026-11-07T18:10:00Z",
      messages: [
        { id: "m7", senderRole: "customer", senderId: "maya-chen", body: "The portrait is my grandmother in 1978. I can bring the print to Lenox.", createdAt: "2026-11-06T15:00:00Z" },
        { id: "m8", senderRole: "artist", senderId: "amara-blake", body: "The photograph has enough contrast. I quoted two sessions, and the deposit holds December 2.", createdAt: "2026-11-07T18:10:00Z" },
      ],
    },
    {
      id: "conv-maya-cass",
      customerId: "maya-chen",
      artistId: "cass-nguyen",
      updatedAt: "2026-11-10T12:00:00Z",
      messages: [
        { id: "m9", senderRole: "artist", senderId: "cass-nguyen", body: "I can't do the 21st cleanly. I proposed the 28th and a higher price for the snake.", createdAt: "2026-11-09T16:05:00Z" },
        { id: "m10", senderRole: "customer", senderId: "maya-chen", body: "Looking at the new date tonight.", createdAt: "2026-11-10T12:00:00Z" },
      ],
    },
    {
      id: "conv-jordan-nova",
      customerId: "jordan-ellis",
      artistId: "nova-reyes",
      updatedAt: "2026-11-10T14:22:00Z",
      messages: [
        { id: "m11", senderRole: "customer", senderId: "jordan-ellis", body: "Collarbone script, small, nothing too cursive. Happy to do a drawing consult first.", createdAt: "2026-11-10T14:22:00Z" },
      ],
    },
    {
      id: "conv-samira-nova",
      customerId: "samira-patel",
      artistId: "nova-reyes",
      updatedAt: "2026-11-08T15:40:00Z",
      messages: [
        { id: "m12", senderRole: "customer", senderId: "samira-patel", body: "Anklet of repeating leaves. I walk a lot, so it has to stop before my shoes.", createdAt: "2026-11-07T11:00:00Z" },
        { id: "m13", senderRole: "artist", senderId: "nova-reyes", body: "I moved you to the 25th so it is not rushed. The quote in the request covers a matched pair if you want both ankles.", createdAt: "2026-11-08T15:40:00Z" },
      ],
    },
    {
      id: "conv-owen-nova",
      customerId: "owen-brooks",
      artistId: "nova-reyes",
      updatedAt: "2026-11-04T20:10:00Z",
      messages: [
        { id: "m14", senderRole: "customer", senderId: "owen-brooks", body: "Blackwork band is confirmed on my side. I'll keep the week after clear.", createdAt: "2026-11-04T20:05:00Z" },
        { id: "m15", senderRole: "artist", senderId: "nova-reyes", body: "November 27 is held. We'll stencil the full circumference before I start.", createdAt: "2026-11-04T20:10:00Z" },
      ],
    },
  ];
}

function buildReviews(): Review[] {
  const rows: Array<[string, string, string, string | undefined, number, string, string, Review["status"], string?]> = [
    ["rev-nova-1", "nova-reyes", "maya-chen", "bk-maya-nova", 5, "Exactly the scale I asked for", "Nova drew the olive branch smaller than my first instinct and it sits correctly on the forearm. Line weight is even.", "published", "2026-11-09T12:00:00Z"],
    ["rev-nova-2", "nova-reyes", "owen-brooks", "bk-owen-nova", 5, "Direct about time and price", "The blackwork band was stenciled all the way around before she started. No surprises on the quote.", "published", "2026-11-05T12:00:00Z"],
    ["rev-nova-3", "nova-reyes", "lila-nguyen", "bk-lila-nova", 5, "Fern healed clean", "Delicate without going faint. I would book the ribs with her again.", "published", "2026-09-28T12:00:00Z"],
    ["rev-nova-4", "nova-reyes", "jordan-ellis", undefined, 4, "Useful consult", "She talked me out of a cursive collarbone piece. Still waiting on the longer session.", "published", "2026-11-10T15:00:00Z"],
    ["rev-julian-1", "julian-cho", "maya-chen", undefined, 5, "Honest about session count", "Julian would not pretend a calf wave is a one-hour tattoo. That is why I sent the request.", "published", "2026-11-09T14:00:00Z"],
    ["rev-julian-2", "julian-cho", "samira-patel", undefined, 5, "Traditional rose, done properly", "Bold, settled, no muddy shading. The Orchard Street room is quiet.", "published", "2026-08-12T12:00:00Z"],
    ["rev-amara-1", "amara-blake", "lila-nguyen", undefined, 5, "She refused a bad photo", "Amara sent me back for a sharper print and the portrait is better for it.", "published", "2026-06-02T12:00:00Z"],
    ["rev-amara-2", "amara-blake", "owen-brooks", undefined, 4, "Slow and careful", "Two sessions for a pet portrait. Healing was straightforward.", "published", "2026-04-18T12:00:00Z"],
    ["rev-sage-1", "sage-okonkwo", "maya-chen", "bk-maya-sage", 5, "Band lines up", "Measured on the ankle while I was standing. It survived a month of boots.", "published", "2026-10-20T12:00:00Z"],
    ["rev-leo-1", "leo-marino", "jordan-ellis", "bk-jordan-leo", 3, "Color healed uneven", "The dagger is bold, but the red healed patchy. I opened a dispute.", "published", "2026-11-01T12:30:00Z"],
    ["rev-leo-2", "leo-marino", "owen-brooks", undefined, 5, "What traditional should be", "Readable across the room. Harbor Flash still feels like a shop, not a lobby.", "published", "2026-05-09T12:00:00Z"],
    ["rev-priya-1", "priya-shah", "samira-patel", undefined, 5, "Anklet placement was right", "She stopped the pattern where my shoe starts. That was the whole brief.", "published", "2026-09-02T12:00:00Z"],
    ["rev-cass-1", "cass-nguyen", "lila-nguyen", undefined, 5, "Looks like a print", "The snake has real contrast. Bushwick room, no upsell.", "published", "2026-10-30T12:00:00Z"],
    ["rev-cass-2", "cass-nguyen", "jordan-ellis", undefined, 4, "Good drawing, tight schedule", "Cass was clear that the date I wanted was too soon.", "published", "2026-11-09T18:00:00Z"],
    ["rev-river-1", "river-alvarez", "owen-brooks", undefined, 5, "Cover-up advice was honest", "Told me what could be covered and what needed laser. I respected the no.", "published", "2026-07-14T12:00:00Z"],
    ["rev-river-2", "river-alvarez", "samira-patel", undefined, 4, "Soft black and gray", "Moth healed softly. Appointment ran long, and he said so up front.", "published", "2026-03-22T12:00:00Z"],
    ["rev-drew-1", "drew-hale", "chris-delgado", undefined, 2, "Missed the appointment window", "Reported separately. Keeping this flagged for review.", "flagged", "2026-10-02T12:00:00Z"],
  ];
  return rows.map(([id, artistId, customerId, bookingId, rating, title, body, status, createdAt]) => ({
    id,
    artistId,
    customerId,
    bookingId,
    rating,
    title,
    body,
    status,
    createdAt: createdAt ?? "2026-01-01T12:00:00Z",
  }));
}

function alignCalendar(artists: Artist[], bookings: Booking[]) {
  const active = new Set(["confirmed", "completed", "disputed"]);
  const waiting = new Set(["pending", "artist_proposed_changes", "awaiting_customer_confirmation", "awaiting_deposit"]);
  return artists.map((artist) => ({
    ...artist,
    availability: artist.availability.map((day) => {
      const holds = bookings.some(
        (booking) => booking.artistId === artist.id && active.has(booking.status) && booking.appointmentDate === day.date,
      );
      if (holds) return { ...day, status: "booked" as const };
      const requested = bookings.some((booking) => {
        if (booking.artistId !== artist.id || !waiting.has(booking.status)) return false;
        return booking.appointmentDate === day.date || booking.proposedDate === day.date || booking.requestedDate === day.date;
      });
      if (requested && day.status === "blocked") return { ...day, status: "open" as const };
      return day;
    }),
  }));
}

function buildState(): DemoState {
  const bookings = buildBookings();
  const artists = alignCalendar(ARTISTS.map(toArtist), bookings);
  const services = artists.flatMap(servicesFor);
  const portfolio = artists.flatMap((artist, index) => portfolioFor(artist, index * 2));
  const transactions = buildTransactions(bookings);
  const base: DemoState = {
    artists,
    customers: CUSTOMERS,
    styles: buildStyles(),
    categories: buildCategories(),
    services,
    portfolio,
    bookings,
    conversations: buildConversations(),
    reviews: buildReviews(),
    transactions,
    notifications: [
      { id: "nt-maya-1", userId: "maya-chen", role: "customer", title: "Deposit due", body: "Amara Blake is holding December 2. Pay the deposit to confirm.", href: "/customer/bookings/detail?id=bk-maya-amara", read: false, createdAt: "2026-11-06T17:05:00Z", kind: "payment" },
      { id: "nt-maya-2", userId: "maya-chen", role: "customer", title: "Cass proposed a new date", body: "November 28 at 2:00 PM, with a revised price for the snake.", href: "/customer/bookings/detail?id=bk-maya-cass", read: false, createdAt: "2026-11-09T16:05:00Z", kind: "booking" },
      { id: "nt-maya-3", userId: "maya-chen", role: "customer", title: "Appointment reminder", body: "Olive branch with Nova Reyes is on November 18 at 2:00 PM.", href: "/customer/bookings/detail?id=bk-maya-nova", read: false, createdAt: "2026-11-10T09:00:00Z", kind: "reminder" },
      { id: "nt-maya-4", userId: "maya-chen", role: "customer", title: "New message from Julian Cho", body: "A readable wave is two sessions minimum.", href: "/customer/messages?thread=conv-maya-julian", read: true, createdAt: "2026-11-09T13:00:00Z", kind: "message" },
      { id: "nt-maya-5", userId: "maya-chen", role: "customer", title: "Deposit confirmed", body: "Your November 18 appointment with Nova is confirmed.", href: "/customer/bookings/detail?id=bk-maya-nova", read: true, createdAt: "2026-11-02T18:10:00Z", kind: "payment" },
      { id: "nt-nova-1", userId: "nova-reyes", role: "artist", title: "New request from Jordan Ellis", body: "Collarbone script, November 20 at 3:30 PM.", href: "/artist/bookings/detail?id=bk-jordan-nova", read: false, createdAt: "2026-11-10T14:20:00Z", kind: "booking" },
      { id: "nt-nova-2", userId: "nova-reyes", role: "artist", title: "Message from Samira Patel", body: "She confirmed the anklet has to stop before the shoe line.", href: "/artist/messages?thread=conv-samira-nova", read: false, createdAt: "2026-11-07T11:00:00Z", kind: "message" },
      { id: "nt-nova-3", userId: "nova-reyes", role: "artist", title: "Deposit received", body: "Owen Brooks confirmed the blackwork band.", href: "/artist/bookings/detail?id=bk-owen-nova", read: true, createdAt: "2026-11-04T20:00:00Z", kind: "payment" },
      { id: "nt-nova-4", userId: "nova-reyes", role: "artist", title: "Reminder", body: "Maya Chen is booked November 18 at 2:00 PM.", href: "/artist/bookings/detail?id=bk-maya-nova", read: false, createdAt: "2026-11-10T09:00:00Z", kind: "reminder" },
      { id: "nt-admin-1", userId: "avery-quinn", role: "admin", title: "Dispute opened", body: "Jordan Ellis disputed the dagger with Leo Marino.", href: "/admin/bookings/detail?id=bk-jordan-leo", read: false, createdAt: "2026-11-01T12:00:00Z", kind: "booking" },
      { id: "nt-admin-2", userId: "avery-quinn", role: "admin", title: "Artist application waiting", body: "Mina Park's Long Island City application is still pending.", href: "/admin/artists/detail?id=mina-park", read: false, createdAt: "2026-11-06T10:00:00Z", kind: "verification" },
      { id: "nt-admin-3", userId: "avery-quinn", role: "admin", title: "Report filed", body: "A review of Drew Hale was flagged for moderation.", href: "/admin/marketplace", read: true, createdAt: "2026-10-02T12:30:00Z", kind: "system" },
      { id: "nt-admin-4", userId: "avery-quinn", role: "admin", title: "Refund recorded", body: "Owen Brooks was refunded for the cancelled Mott Haven week.", href: "/admin/finance", read: true, createdAt: "2026-10-18T16:00:00Z", kind: "payment" },
    ],
    reports: [
      { id: "rpt-drew-review", type: "review", targetId: "rev-drew-1", targetLabel: "Review of Drew Hale by Chris Delgado", reporterId: "maya-chen", reason: "The review describes a missed appointment and should be checked before it stays public.", status: "open", createdAt: "2026-10-03T12:00:00Z" },
      { id: "rpt-drew-account", type: "account", targetId: "drew-hale", targetLabel: "Drew Hale", reporterId: "chris-delgado", reason: "Artist missed the booked window and did not answer messages for nine days.", status: "open", createdAt: "2026-10-04T12:00:00Z" },
      { id: "rpt-ellis-portfolio", type: "portfolio", targetId: "pf-ellis-ward-0", targetLabel: "Watercolor poppy by Ellis Ward", reporterId: "samira-patel", reason: "This image looks like it belongs to another studio's flash sheet.", status: "reviewed", createdAt: "2026-10-14T12:00:00Z" },
    ],
    activity: [
      { id: "act-1", userId: "maya-chen", role: "customer", text: "Confirmed the olive branch with Nova Reyes.", createdAt: "2026-11-02T18:10:00Z" },
      { id: "act-2", userId: "maya-chen", role: "customer", text: "Received a new date from Cass Nguyen.", createdAt: "2026-11-09T16:05:00Z" },
      { id: "act-3", userId: "maya-chen", role: "customer", text: "Sent a Japanese session request to Julian Cho.", createdAt: "2026-11-08T16:40:00Z" },
      { id: "act-4", userId: "nova-reyes", role: "artist", text: "Jordan Ellis requested a collarbone piece.", createdAt: "2026-11-10T14:20:00Z" },
      { id: "act-5", userId: "nova-reyes", role: "artist", text: "Deposit confirmed for Owen Brooks.", createdAt: "2026-11-04T20:00:00Z" },
      { id: "act-6", userId: "nova-reyes", role: "artist", text: "Proposed a new anklet date for Samira Patel.", createdAt: "2026-11-08T15:30:00Z" },
      { id: "act-7", userId: "avery-quinn", role: "admin", text: "Mina Park submitted a Long Island City application.", createdAt: "2026-11-06T10:00:00Z" },
      { id: "act-8", userId: "avery-quinn", role: "admin", text: "Recorded a refund for Owen Brooks.", createdAt: "2026-10-18T16:00:00Z" },
    ],
    settings: {
      commissionPercent: COMMISSION,
      bookingPolicy: "Artists respond to requests by accepting, declining, or proposing a new time and price. A date is held only after the deposit is confirmed.",
      cancellationPolicy: "Customers can cancel a pending or confirmed booking. Confirmed dates return to the artist's calendar.",
      platformName: "BLACKLINE",
      supportEmail: "hello@blackline.demo",
      tagline: "A curated index of New York tattoo artists.",
      city: "New York",
    },
    favorites: {
      "maya-chen": ["nova-reyes", "julian-cho", "cass-nguyen"],
    },
  };
  return deriveState(base);
}

let cached: DemoState | null = null;

export function createSeed(): DemoState {
  if (!cached) cached = buildState();
  return structuredClone(cached);
}

export function artistParams() {
  return createSeed().artists.map((artist) => ({ slug: artist.slug }));
}

export function styleParams() {
  return createSeed().styles.map((style) => ({ slug: style.slug }));
}
