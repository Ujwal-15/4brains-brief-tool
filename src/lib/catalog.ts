// Auto-generated from Master Deliverables.xlsx via scripts/build-catalog.py.
// DO NOT EDIT BY HAND — re-run the script to refresh.

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  fourBrainsDeliverables: readonly string[];
  clientDeliverables: readonly string[];
};

export const CATALOG_CATEGORIES = [
  "Registration",
  "Interactive & Information",
  "AI Activations",
  "Gamification",
  "Photobooth",
  "Installation",
  "App Development"
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

export const PRODUCT_CATALOG: readonly CatalogProduct[] = [
  {
    id: "ai-registration-caricature",
    name: "AI Registration (Caricature)",
    category: "Registration",
    fourBrainsDeliverables: ["Software Developemnt -UI", "UX -iPads -Printer"],
    clientDeliverables: ["iPad Stands -Internet with speed of 20mbps -Creative Content -Fabrication Support"],
  },
  {
    id: "face-registration",
    name: "Face Registration",
    category: "Registration",
    fourBrainsDeliverables: ["Software Developemnts -UI Designing -IPADS -Webcam (if necessary)"],
    clientDeliverables: ["IPAD Stands -Internet with speed of 20mbps -Data"],
  },
  {
    id: "qr-registration",
    name: "QR Registration",
    category: "Registration",
    fourBrainsDeliverables: ["Software Development -IPADS -UI Designing"],
    clientDeliverables: ["IPAD Stands -Internet with speed of 20mbps -Data"],
  },
  {
    id: "rfid-registration",
    name: "RFID Registration",
    category: "Registration",
    fourBrainsDeliverables: ["Software Development - RFID tags - RFID Scanner"],
    clientDeliverables: ["Internet with speed of 20mbps"],
  },
  {
    id: "ar-table",
    name: "AR Table",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Software Development -Content Development -Miniature 3D Models -iPads -High End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Table Placement -Content & Creatives -Fabrication Support -Power Supply"],
  },
  {
    id: "control-room",
    name: "Control Room",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Content & Creative Assets Integration -Software Development -Control Room Set-up -Responsive Optimization -High End Config System -Required Cables and Connecors"],
    clientDeliverables: ["Display -Content & Creative Assets -Fabrication Support -Power Supply"],
  },
  {
    id: "digital-flipbook",
    name: "Digital Flipbook",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Content & Creative Assets Integration -Software Development -Projector -Responsive Optimization -Flipbook -High End Config System -Required Cables and Connecors"],
    clientDeliverables: ["Table for Flip Book Display -Mounting Space for Projector -Content & Creative Assets -Fabrication Support -Power Supply"],
  },
  {
    id: "diy-laptop-sticker-pop-socket",
    name: "DIY Laptop Sticker/Pop Socket",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Software - UI", "UX - Laptop", "iPad - High end config server - Printer - Sticker Sheet"],
    clientDeliverables: ["Creatives & Content - Set-up Space - Internet - 15Mbps - Power supply - Pop sockets (If needed)"],
  },
  {
    id: "interactive-floor",
    name: "Interactive Floor",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["LIDAR Sensor -Interactive Software Development(Pre-installed & Configured) -Content & Creatives Development -Cables & Connectors -Installation & Setup -High End Config System -Required Cables and Connecors -System Calibration & Testing"],
    clientDeliverables: ["LED Panels -Mounting Space -Final Content & Creative Assets (in Required Formats) -Fabrication Support -Power Supply"],
  },
  {
    id: "interactive-screen",
    name: "Interactive Screen",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Interactive Dial -Interactive Software Development(Pre-installed & Configured) -Content & Creatives Development -Cables & Connectors -Installation & Setup -High End Config System -Required Cables and Connecors -System Calibration & Testing"],
    clientDeliverables: ["LED Display -Final Content & Creative Assets (in Required Formats) -Fabrication Support -Power Supply"],
  },
  {
    id: "leap-motion",
    name: "Leap Motion",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Leap Motion Sensor -Motion Tracking Calibration -Content Development for Gesture-based Interactions -Software & Control System Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Creative Content -Power Supply & Network Connectivity -Display to show content (LED screen or TV) -Space or fabricated stand to place the Leap Motion sensor (or to keep it hidden)"],
  },
  {
    id: "moving-screen",
    name: "Moving Screen",
    category: "Interactive & Information",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "multi-screen",
    name: "Multi Screen",
    category: "Interactive & Information",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "oled-interactive-screen",
    name: "OLED Interactive Screen",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Interactive Software Development(Pre-installed & Configured) -Content & Creatives Development -OLED Display -Cables & Connectors -Installation & Setup -High End Config System -Required Cables and Connecors -System Calibration & Testing"],
    clientDeliverables: ["Final Content & Creative Assets (in Required Formats) -Fabrication Support -Power Supply"],
  },
  {
    id: "place-to-reveal",
    name: "Place to Reveal",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Software Development -Content Development -RFID Tags and Reader -High End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Display -Object to place -Content & Creatives -Fabrication Support -Power Supply"],
  },
  {
    id: "polaroid-wall",
    name: "Polaroid Wall",
    category: "Interactive & Information",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "projection-diffusion",
    name: "Projection Diffusion",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Software - Controller", "Hardware - High end config server - Projector"],
    clientDeliverables: ["Fabrication"],
  },
  {
    id: "rfid-cube",
    name: "RFID Cube",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Software Development -Content Development -Cube -RFID Tags and Reader -High End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Display -Content & Creatives -Fabrication Support -Power Supply"],
  },
  {
    id: "rotoscope",
    name: "Rotoscope",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Motion Tracking Setup -Motorized Components Integration -Tablet-based Touch Commands -TV -IPADS -Content Development -Software & Control System Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Complete Fabrication for TV Movement -Power Supply & Network Connectivity -Creative Content"],
  },
  {
    id: "silhouette-wall",
    name: "Silhouette Wall",
    category: "Interactive & Information",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "tangible-table",
    name: "Tangible Table",
    category: "Interactive & Information",
    fourBrainsDeliverables: ["Software Development -Content Development -Smart Touch Display -Touch Tokens -High End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Table for TV Placement -Content & Creatives -Fabrication Support -Power Supply"],
  },
  {
    id: "ai-art",
    name: "AI Art",
    category: "AI Activations",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "ai-music",
    name: "AI Music",
    category: "AI Activations",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "ai-snapfinder",
    name: "AI Snapfinder",
    category: "AI Activations",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "ai-twin",
    name: "AI Twin",
    category: "AI Activations",
    fourBrainsDeliverables: ["Software & Development -User Interface Design -Printer -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Internet with speed of 20mbps - Creative Content - TV (touch enabled) - Backdrop & Fabrication Support - Sapce - Power Supply"],
  },
  {
    id: "ai-videobooth",
    name: "AI Videobooth",
    category: "AI Activations",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "path-finder",
    name: "Path Finder",
    category: "AI Activations",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "ai-art-battle",
    name: "AI Art Battle",
    category: "Gamification",
    fourBrainsDeliverables: ["Software & Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors, I-PAD"],
    clientDeliverables: ["Internet - 15 MBPS Table Power TV or LED Screen"],
  },
  {
    id: "batak-pro",
    name: "Batak Pro",
    category: "Gamification",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "catch-it",
    name: "Catch It",
    category: "Gamification",
    fourBrainsDeliverables: ["Game Developemnt - Kinect Sensor - High end config server - Required Cables"],
    clientDeliverables: ["LED Screen (p2.5) - 6x4 Dimension - 3D elements for game development - Box fabrication for Kinect Sensor"],
  },
  {
    id: "digital-claw-machine",
    name: "Digital Claw Machine",
    category: "Gamification",
    fourBrainsDeliverables: ["Software & Control System Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Fabrication Support - Touch TV (55 inches Recomended )"],
  },
  {
    id: "dino-sprint-multiplayer",
    name: "Dino Sprint (Multiplayer)",
    category: "Gamification",
    fourBrainsDeliverables: ["Game Developemnt - Foot Pad - High end config server - Required Cables"],
    clientDeliverables: ["LED Screen - Elements for game development - Fabrication Support"],
  },
  {
    id: "f1-simulator",
    name: "F1 Simulator",
    category: "Gamification",
    fourBrainsDeliverables: ["Game Developemnt - F1 Car set-up - High end config server - Required Cables"],
    clientDeliverables: ["Set-up Space - Internet - 15Mbps - Power supply - Fabrication Support"],
  },
  {
    id: "hit-it",
    name: "Hit It",
    category: "Gamification",
    fourBrainsDeliverables: ["Game Developemnt - Sensor - High end config server - Required Cables"],
    clientDeliverables: ["LED Screen - elements for game development - Fabrication Support"],
  },
  {
    id: "live-caricature-tote-bag-300-pax",
    name: "Live Caricature Tote Bag (300 pax)",
    category: "Gamification",
    fourBrainsDeliverables: ["Software - UI", "UX - iPad - High end config system - Printer - Heat press Machine - Tote Bags"],
    clientDeliverables: ["Set-up Space - Internet - 15Mbps - Power supply - Creatives & Content"],
  },
  {
    id: "matching-tiles",
    name: "Matching Tiles",
    category: "Gamification",
    fourBrainsDeliverables: ["Software & Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Fabrication Support - Touch TV (55 inches Recomended )"],
  },
  {
    id: "mindwave",
    name: "Mindwave",
    category: "Gamification",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "pedal-activity",
    name: "Pedal Activity",
    category: "Gamification",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "quiz-to-race",
    name: "Quiz to Race",
    category: "Gamification",
    fourBrainsDeliverables: ["Game Developemnt - iPads - Toy Cars - Embedded System Set-up - High end config laptop - Required Cables"],
    clientDeliverables: ["Creative Content - Display - Backdrop & Tracks Fabrication Support - Sapce - Power Supply"],
  },
  {
    id: "roadrunner",
    name: "Roadrunner",
    category: "Gamification",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "value-quest",
    name: "Value Quest",
    category: "Gamification",
    fourBrainsDeliverables: ["Software & Development -User Interface Design -High-End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Fabrication Support - Touch TV (55 inches Recomended )"],
  },
  {
    id: "action-figure-persona",
    name: "Action Figure (Persona)",
    category: "Photobooth",
    fourBrainsDeliverables: ["Camera - Software Development with UI Development - High end config server - Required Cables"],
    clientDeliverables: ["Internet with speed of 20mbps - Creative Content - TV (touch enabled) - Backdrop & Fabrication Support - Sapce"],
  },
  {
    id: "ai-photobooth",
    name: "AI Photobooth",
    category: "Photobooth",
    fourBrainsDeliverables: ["Camera - Software Development with UI Development - Printer - High end config server - Required Cables"],
    clientDeliverables: ["Internet with speed of 20mbps - Creative Content - TV (touch enabled) - Backdrop & Fabrication Support - Sapce"],
  },
  {
    id: "digital-brush-studio",
    name: "Digital Brush Studio",
    category: "Photobooth",
    fourBrainsDeliverables: ["Software & Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors - Brush ,Camera and Printer"],
    clientDeliverables: ["Fabrication Support - Touch TV (55 inches Recomended )"],
  },
  {
    id: "digital-mosaic-wall",
    name: "Digital Mosaic Wall",
    category: "Photobooth",
    fourBrainsDeliverables: ["Software & Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors"],
    clientDeliverables: ["LED Screen - 10 by 8 feet Internet - 10 to 15 MBPS"],
  },
  {
    id: "glambot",
    name: "Glambot",
    category: "Photobooth",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "magazine-booth",
    name: "Magazine Booth",
    category: "Photobooth",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "magic-motion",
    name: "Magic Motion",
    category: "Photobooth",
    fourBrainsDeliverables: ["Software & Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors, Camera"],
    clientDeliverables: ["Internet - 15 MBPS Power Touch TV (55 inches Recomended )"],
  },
  {
    id: "strip-booth",
    name: "Strip Booth",
    category: "Photobooth",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "word-cloud",
    name: "Word Cloud",
    category: "Photobooth",
    fourBrainsDeliverables: ["Camera - Software Development with UI Development - Printer - High end config server - Required Cables"],
    clientDeliverables: ["Internet with speed of 20mbps - Creative Content - TV (touch enabled) - Backdrop & Fabrication Support - Sapce"],
  },
  {
    id: "ai-personalised-sticker",
    name: "AI Personalised Sticker",
    category: "Installation",
    fourBrainsDeliverables: ["Software & Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors"],
    clientDeliverables: ["Internet - 15 MBPS Table Power"],
  },
  {
    id: "flying-screen-aero-matrix",
    name: "Flying Screen (Aero-Matrix)",
    category: "Installation",
    fourBrainsDeliverables: ["PLC Development - Mechanical and Hardware Development - LED Panels - Motors - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support -Truss -Content & Creatives"],
  },
  {
    id: "holofan-5-5ft",
    name: "Holofan (5.5ft)",
    category: "Installation",
    fourBrainsDeliverables: ["Mechanical and Hardware - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support -Content & Creatives - Power Supply"],
  },
  {
    id: "interactive-quizz-with-dispenser",
    name: "Interactive Quizz With Dispenser",
    category: "Installation",
    fourBrainsDeliverables: ["Software & Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors - Dispenser , Pully Lever"],
    clientDeliverables: ["Fabrication Support - Touch TV (55 inches Recomended )"],
  },
  {
    id: "kinect-screen",
    name: "Kinect Screen",
    category: "Installation",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "kinetic-blades",
    name: "Kinetic Blades",
    category: "Installation",
    fourBrainsDeliverables: ["PLC Development - Mechanical and Hardware Development - LED Panels - Motors - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support -Truss -Content & Creatives"],
  },
  {
    id: "kinetic-dna",
    name: "Kinetic DNA",
    category: "Installation",
    fourBrainsDeliverables: ["PLC Development - Mechanical and Hardware Development - LED Panels - Motors - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support -Content & Creatives"],
  },
  {
    id: "kinetic-dna-with-flap",
    name: "Kinetic DNA with Flap",
    category: "Installation",
    fourBrainsDeliverables: ["PLC Development - Mechanical and Hardware Development - LED Panels - Motors - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support -Content & Creatives"],
  },
  {
    id: "kinetic-ring",
    name: "Kinetic Ring",
    category: "Installation",
    fourBrainsDeliverables: ["Mechanical and Hardware Development - LED Displays -Display Holders - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support -Content & Creatives"],
  },
  {
    id: "kinetic-table",
    name: "Kinetic Table",
    category: "Installation",
    fourBrainsDeliverables: ["PLC Development - Mechanical and Hardware Development - Panels - Motors - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support - Content & Creatives"],
  },
  {
    id: "kinetic-wall",
    name: "Kinetic Wall",
    category: "Installation",
    fourBrainsDeliverables: ["PLC Development - Mechanical and Hardware Development - Panels - Motors - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support -Content & Creatives"],
  },
  {
    id: "motion-led",
    name: "Motion LED",
    category: "Installation",
    fourBrainsDeliverables: [],
    clientDeliverables: [],
  },
  {
    id: "nexus-pillars-4-pillars",
    name: "Nexus Pillars (4 Pillars)",
    category: "Installation",
    fourBrainsDeliverables: ["PLC Development - Mechanical and Hardware Development - Panels - Motors - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support - Content & Creatives"],
  },
  {
    id: "nexus-pillars-6-pillars",
    name: "Nexus Pillars (6 Pillars)",
    category: "Installation",
    fourBrainsDeliverables: ["PLC Development - Mechanical and Hardware Development - Panels - Motors - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support - Content & Creatives"],
  },
  {
    id: "social-media-wall",
    name: "Social Media Wall",
    category: "Installation",
    fourBrainsDeliverables: ["Software & Development -User Interface Design -System Testing & Quality Assurance -High-End Config System -Required Cables and Connectors -Access to Instagram, Lindin and X"],
    clientDeliverables: ["LED Screen - 8 by 10 feet - Fabrication Support"],
  },
  {
    id: "spectra",
    name: "Spectra",
    category: "Installation",
    fourBrainsDeliverables: ["Hardware Development - LED Strips - Sensors - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support - Content & Creatives - Spectra Structure"],
  },
  {
    id: "verve-tiles",
    name: "Verve Tiles",
    category: "Installation",
    fourBrainsDeliverables: ["Hardware Development - Tiles Set-up - LED Strips - Required Cables - High End Config System"],
    clientDeliverables: ["Fabrication Support -Truss"],
  },
  {
    id: "app-development",
    name: "App Development",
    category: "App Development",
    fourBrainsDeliverables: ["Software Development"],
    clientDeliverables: ["Design Elements"],
  },
] as const;

// Sentinel for a custom (off-catalog) activity inside an Activity card.
export const CUSTOM_PRODUCT_ID = "__custom__";

export function findProduct(id: string): CatalogProduct | undefined {
  return PRODUCT_CATALOG.find((p) => p.id === id);
}

// Group products by category, preserving CATALOG_CATEGORIES order.
export function productsByCategory(): Record<string, CatalogProduct[]> {
  const out: Record<string, CatalogProduct[]> = {};
  for (const cat of CATALOG_CATEGORIES) out[cat] = [];
  for (const p of PRODUCT_CATALOG) {
    if (!out[p.category]) out[p.category] = [];
    out[p.category].push(p);
  }
  return out;
}
