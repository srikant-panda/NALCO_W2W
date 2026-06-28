// All waste stream types from NALCO operations
export interface WasteStream {
  id: string;
  name: string;
  chemicalFormula: string;
  source: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  applications: string[];
  avgPrice: number; // ₹ per MT
  carbonFactor: number; // tCO₂e saved per MT reused
  currentStock: number; // MT
  monthlyProduction: number; // MT/month
  moistureRange: string;
  phRange: string;
  description: string;
}

export const wasteStreams: WasteStream[] = [
  {
    id: "red-mud",
    name: "Red Mud (Bauxite Residue)",
    chemicalFormula: "Fe₂O₃ + Al₂O₃ + SiO₂ + TiO₂",
    source: "Bayer Process - Alumina Refining",
    color: "#DC2626",
    bgColor: "#FEF2F2",
    borderColor: "#FECACA",
    icon: "🔴",
    applications: ["Eco-Bricks", "Portland Cement", "Highway Sub-base", "Geopolymer", "Iron Recovery"],
    avgPrice: 350,
    carbonFactor: 0.44,
    currentStock: 42500,
    monthlyProduction: 12000,
    moistureRange: "18-35%",
    phRange: "10.5-13.0",
    description: "Primary residue from alumina extraction. Rich in iron oxide, suitable for construction materials."
  },
  {
    id: "fly-ash",
    name: "Fly Ash (Coal Combustion)",
    chemicalFormula: "SiO₂ + Al₂O₃ + CaO",
    source: "Captive Power Plant - Coal Combustion",
    color: "#6B7280",
    bgColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    icon: "⚫",
    applications: ["Fly Ash Bricks", "PPC Cement", "Road Embankment", "Mine Fill", "Agriculture"],
    avgPrice: 180,
    carbonFactor: 0.38,
    currentStock: 28700,
    monthlyProduction: 8500,
    moistureRange: "5-15%",
    phRange: "8.0-12.0",
    description: "Fine particulate from coal-fired power generation. Class F fly ash ideal for cement blending."
  },
  {
    id: "spent-pot-lining",
    name: "Spent Pot Lining (SPL)",
    chemicalFormula: "C + NaF + Al₂O₃ + Cyanides",
    source: "Aluminium Smelter - Pot Relining",
    color: "#1F2937",
    bgColor: "#F3F4F6",
    borderColor: "#D1D5DB",
    icon: "⬛",
    applications: ["Cement Kiln Co-processing", "Carbon Recovery", "Fluoride Recovery", "Steel Industry"],
    avgPrice: 520,
    carbonFactor: 0.56,
    currentStock: 3200,
    monthlyProduction: 450,
    moistureRange: "2-8%",
    phRange: "11.0-14.0",
    description: "Hazardous waste from smelter pots. High calorific value for cement kiln co-processing."
  },
  {
    id: "dross",
    name: "Aluminium Dross",
    chemicalFormula: "Al + Al₂O₃ + MgAl₂O₄",
    source: "Cast House - Molten Metal Processing",
    color: "#9CA3AF",
    bgColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    icon: "🔘",
    applications: ["Secondary Aluminium", "Refractory Materials", "Slag Conditioner", "Alumina Recovery"],
    avgPrice: 890,
    carbonFactor: 0.72,
    currentStock: 1850,
    monthlyProduction: 320,
    moistureRange: "0-2%",
    phRange: "7.0-9.0",
    description: "Metal-rich residue from casting. Up to 70% aluminium recovery possible with proper processing."
  },
  {
    id: "caustic-soda-liquor",
    name: "Spent Caustic Liquor",
    chemicalFormula: "NaOH + Na₂CO₃ + NaAlO₂",
    source: "Bayer Process - Digestion Circuit",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
    icon: "🟡",
    applications: ["Water Treatment", "Paper Industry", "Soap Manufacturing", "pH Neutralization"],
    avgPrice: 220,
    carbonFactor: 0.31,
    currentStock: 5600,
    monthlyProduction: 1800,
    moistureRange: "85-95%",
    phRange: "12.0-14.0",
    description: "Alkaline liquor from the Bayer cycle. Can be regenerated or sold for industrial neutralization."
  },
  {
    id: "lime-grit",
    name: "Lime Grit / White Mud",
    chemicalFormula: "CaCO₃ + Ca(OH)₂",
    source: "Causticization Plant",
    color: "#F5F5F4",
    bgColor: "#FAFAF9",
    borderColor: "#E7E5E4",
    icon: "⚪",
    applications: ["Soil Amendment", "Construction Fill", "Cement Raw Mix", "Acid Mine Drainage"],
    avgPrice: 120,
    carbonFactor: 0.22,
    currentStock: 8900,
    monthlyProduction: 2200,
    moistureRange: "25-40%",
    phRange: "9.0-11.0",
    description: "Calcium-rich waste from causticization. Excellent soil conditioner and cement additive."
  }
];

export interface Batch {
  id: string;
  wasteStreamId: string;
  batchCode: string;
  date: string;
  tonnes: number;
  moisture: number;
  ph: number;
  grade: "A" | "B" | "C";
  status: "Available" | "Reserved" | "In Transit" | "Delivered" | "Rejected";
  location: string;
  treatmentMethod: string;
  certifications: string[];
}

export const initialBatches: Batch[] = [
  { id: "1", wasteStreamId: "red-mud", batchCode: "RM-2025-0847", date: "2025-01-15", tonnes: 2400, moisture: 22, ph: 11.2, grade: "A", status: "Available", location: "Damanjodi Yard-A", treatmentMethod: "Filter Press + Solar Drying", certifications: ["ISO-14001", "CPCB-HW"] },
  { id: "2", wasteStreamId: "red-mud", batchCode: "RM-2025-0848", date: "2025-01-18", tonnes: 1850, moisture: 28, ph: 11.8, grade: "B", status: "Reserved", location: "Damanjodi Yard-B", treatmentMethod: "Pressure Filter", certifications: ["ISO-14001"] },
  { id: "3", wasteStreamId: "red-mud", batchCode: "RM-2025-0849", date: "2025-01-22", tonnes: 3100, moisture: 19, ph: 10.8, grade: "A", status: "Available", location: "Damanjodi Yard-A", treatmentMethod: "Filter Press + Solar Drying", certifications: ["ISO-14001", "CPCB-HW", "BIS-Quality"] },
  { id: "4", wasteStreamId: "fly-ash", batchCode: "FA-2025-0312", date: "2025-01-20", tonnes: 4500, moisture: 8, ph: 9.2, grade: "A", status: "Available", location: "CPP Silo-1", treatmentMethod: "Electrostatic Precipitator", certifications: ["IS-3812", "ISO-14001"] },
  { id: "5", wasteStreamId: "fly-ash", batchCode: "FA-2025-0313", date: "2025-01-23", tonnes: 3200, moisture: 12, ph: 10.1, grade: "B", status: "In Transit", location: "In Transit → ACC Bargarh", treatmentMethod: "Bag Filter", certifications: ["IS-3812"] },
  { id: "6", wasteStreamId: "spent-pot-lining", batchCode: "SPL-2025-0089", date: "2025-01-19", tonnes: 280, moisture: 4, ph: 12.5, grade: "A", status: "Available", location: "Smelter Hazmat Bay", treatmentMethod: "Size Reduction + Detox", certifications: ["CPCB-HW", "Basel-Convention"] },
  { id: "7", wasteStreamId: "dross", batchCode: "AD-2025-0156", date: "2025-01-21", tonnes: 180, moisture: 1, ph: 8.2, grade: "A", status: "Available", location: "Cast House Yard", treatmentMethod: "Cooling + Crushing", certifications: ["ISO-14001"] },
  { id: "8", wasteStreamId: "caustic-soda-liquor", batchCode: "CSL-2025-0201", date: "2025-01-17", tonnes: 1200, moisture: 92, ph: 13.1, grade: "B", status: "Available", location: "Tank Farm-3", treatmentMethod: "Evaporation + Concentration", certifications: ["CPCB-HW"] },
  { id: "9", wasteStreamId: "lime-grit", batchCode: "LG-2025-0445", date: "2025-01-24", tonnes: 2800, moisture: 32, ph: 10.2, grade: "A", status: "Available", location: "Causticization Yard", treatmentMethod: "Dewatering + Air Drying", certifications: ["ISO-14001"] },
  { id: "10", wasteStreamId: "red-mud", batchCode: "RM-2025-0850", date: "2025-01-25", tonnes: 2100, moisture: 24, ph: 11.5, grade: "A", status: "Delivered", location: "Delivered → UltraTech Jharsuguda", treatmentMethod: "Filter Press + Solar Drying", certifications: ["ISO-14001", "CPCB-HW"] },
  { id: "11", wasteStreamId: "fly-ash", batchCode: "FA-2025-0314", date: "2025-01-26", tonnes: 5100, moisture: 7, ph: 8.8, grade: "A", status: "Available", location: "CPP Silo-2", treatmentMethod: "Electrostatic Precipitator", certifications: ["IS-3812", "ISO-14001"] },
  { id: "12", wasteStreamId: "dross", batchCode: "AD-2025-0157", date: "2025-01-27", tonnes: 220, moisture: 1, ph: 7.8, grade: "B", status: "Reserved", location: "Cast House Yard", treatmentMethod: "Cooling + Crushing", certifications: ["ISO-14001"] },
];

export interface Buyer {
  id: string;
  company: string;
  industry: string;
  location: string;
  state: string;
  distance: number; // km from Damanjodi
  verified: boolean;
  wasteInterests: string[];
  totalOrdered: number; // MT
  carbonCredits: number; // tCO₂e
  contactPerson: string;
  phone: string;
  gstNumber: string;
  rating: number;
}

export const buyers: Buyer[] = [
  { id: "B001", company: "UltraTech Cement Ltd", industry: "Cement", location: "Jharsuguda, Odisha", state: "Odisha", distance: 420, verified: true, wasteInterests: ["red-mud", "fly-ash", "lime-grit"], totalOrdered: 18500, carbonCredits: 7400, contactPerson: "Rajesh Kumar", phone: "+91-9876543210", gstNumber: "21AABCU9603R1ZM", rating: 4.8 },
  { id: "B002", company: "ACC Limited", industry: "Cement", location: "Bargarh, Odisha", state: "Odisha", distance: 385, verified: true, wasteInterests: ["fly-ash", "red-mud", "spent-pot-lining"], totalOrdered: 14200, carbonCredits: 5396, contactPerson: "Priya Sharma", phone: "+91-9876543211", gstNumber: "21AABCA1584R1ZX", rating: 4.6 },
  { id: "B003", company: "NHAI - NH-26 Project", industry: "Highway Construction", location: "Rayagada, Odisha", state: "Odisha", distance: 95, verified: true, wasteInterests: ["red-mud", "fly-ash"], totalOrdered: 8900, carbonCredits: 3204, contactPerson: "Amit Patel", phone: "+91-9876543212", gstNumber: "21AABCN8795R1ZJ", rating: 4.9 },
  { id: "B004", company: "Jindal Steel Works", industry: "Steel", location: "Angul, Odisha", state: "Odisha", distance: 340, verified: true, wasteInterests: ["spent-pot-lining", "dross", "lime-grit"], totalOrdered: 4500, carbonCredits: 2520, contactPerson: "Vikram Singh", phone: "+91-9876543213", gstNumber: "21AABCJ0901R1Z3", rating: 4.5 },
  { id: "B005", company: "Eco Brick Manufacturers", industry: "Brick Making", location: "Berhampur, Odisha", state: "Odisha", distance: 180, verified: true, wasteInterests: ["red-mud", "fly-ash"], totalOrdered: 6200, carbonCredits: 2356, contactPerson: "Sunita Devi", phone: "+91-9876543214", gstNumber: "21AABCE4521R1ZP", rating: 4.3 },
  { id: "B006", company: "Tata Chemicals Ltd", industry: "Chemicals", location: "Visakhapatnam, AP", state: "Andhra Pradesh", distance: 510, verified: true, wasteInterests: ["caustic-soda-liquor", "lime-grit"], totalOrdered: 3800, carbonCredits: 1178, contactPerson: "Arjun Reddy", phone: "+91-9876543215", gstNumber: "37AABCT1234R1Z5", rating: 4.7 },
  { id: "B007", company: "Green Build Solutions", industry: "Construction", location: "Bhubaneswar, Odisha", state: "Odisha", distance: 460, verified: false, wasteInterests: ["red-mud", "fly-ash", "lime-grit"], totalOrdered: 0, carbonCredits: 0, contactPerson: "Manoj Behera", phone: "+91-9876543216", gstNumber: "21AABCG7890R1ZK", rating: 0 },
  { id: "B008", company: "Hindalco Industries", industry: "Aluminium", location: "Hirakud, Odisha", state: "Odisha", distance: 400, verified: true, wasteInterests: ["dross", "spent-pot-lining"], totalOrdered: 2100, carbonCredits: 1344, contactPerson: "Deepak Agarwal", phone: "+91-9876543217", gstNumber: "21AABCH5678R1Z2", rating: 4.4 },
];

export interface Order {
  id: string;
  buyerId: string;
  batchId: string;
  wasteStreamId: string;
  tonnes: number;
  pricePerMT: number;
  totalValue: number;
  carbonCredits: number;
  status: "Pending" | "Confirmed" | "Dispatched" | "Delivered" | "Cancelled";
  orderDate: string;
  estimatedDelivery: string;
  freightCost: number;
  distance: number;
  truckCount: number;
  highway: string;
}

export const initialOrders: Order[] = [
  { id: "ORD-001", buyerId: "B001", batchId: "10", wasteStreamId: "red-mud", tonnes: 2100, pricePerMT: 350, totalValue: 735000, carbonCredits: 924, status: "Delivered", orderDate: "2025-01-10", estimatedDelivery: "2025-01-14", freightCost: 396900, distance: 420, truckCount: 84, highway: "NH-49 → NH-53" },
  { id: "ORD-002", buyerId: "B002", batchId: "5", wasteStreamId: "fly-ash", tonnes: 3200, pricePerMT: 180, totalValue: 576000, carbonCredits: 1216, status: "Dispatched", orderDate: "2025-01-20", estimatedDelivery: "2025-01-25", freightCost: 554400, distance: 385, truckCount: 128, highway: "NH-26 → NH-53" },
  { id: "ORD-003", buyerId: "B003", batchId: "1", wasteStreamId: "red-mud", tonnes: 2400, pricePerMT: 350, totalValue: 840000, carbonCredits: 1056, status: "Confirmed", orderDate: "2025-01-22", estimatedDelivery: "2025-01-24", freightCost: 102600, distance: 95, truckCount: 96, highway: "NH-26" },
  { id: "ORD-004", buyerId: "B004", batchId: "6", wasteStreamId: "spent-pot-lining", tonnes: 280, pricePerMT: 520, totalValue: 145600, carbonCredits: 157, status: "Pending", orderDate: "2025-01-25", estimatedDelivery: "2025-01-30", freightCost: 42840, distance: 340, truckCount: 12, highway: "NH-26 → NH-55" },
  { id: "ORD-005", buyerId: "B005", batchId: "3", wasteStreamId: "red-mud", tonnes: 1500, pricePerMT: 350, totalValue: 525000, carbonCredits: 660, status: "Confirmed", orderDate: "2025-01-24", estimatedDelivery: "2025-01-27", freightCost: 121500, distance: 180, truckCount: 60, highway: "NH-26 → NH-59" },
  { id: "ORD-006", buyerId: "B006", batchId: "8", wasteStreamId: "caustic-soda-liquor", tonnes: 1200, pricePerMT: 220, totalValue: 264000, carbonCredits: 372, status: "Pending", orderDate: "2025-01-26", estimatedDelivery: "2025-02-02", freightCost: 275400, distance: 510, truckCount: 48, highway: "NH-26 → NH-16" },
];

export interface CarbonData {
  month: string;
  redMud: number;
  flyAsh: number;
  spl: number;
  dross: number;
  caustic: number;
  limeGrit: number;
  total: number;
}

export const carbonHistory: CarbonData[] = [
  { month: "Aug", redMud: 1200, flyAsh: 800, spl: 120, dross: 85, caustic: 95, limeGrit: 180, total: 2480 },
  { month: "Sep", redMud: 1350, flyAsh: 920, spl: 145, dross: 92, caustic: 110, limeGrit: 195, total: 2812 },
  { month: "Oct", redMud: 1100, flyAsh: 750, spl: 98, dross: 78, caustic: 88, limeGrit: 165, total: 2279 },
  { month: "Nov", redMud: 1480, flyAsh: 1050, spl: 168, dross: 105, caustic: 125, limeGrit: 210, total: 3138 },
  { month: "Dec", redMud: 1620, flyAsh: 1180, spl: 185, dross: 112, caustic: 138, limeGrit: 230, total: 3465 },
  { month: "Jan", redMud: 1750, flyAsh: 1280, spl: 210, dross: 128, caustic: 155, limeGrit: 250, total: 3773 },
];

export const routeData = [
  { from: "Damanjodi", to: "Rayagada", distance: 95, highway: "NH-26", freight: 4.5, time: "2h 30m" },
  { from: "Damanjodi", to: "Berhampur", distance: 180, highway: "NH-26 → NH-59", freight: 4.5, time: "4h 15m" },
  { from: "Damanjodi", to: "Angul", distance: 340, highway: "NH-26 → NH-55", freight: 4.5, time: "7h 30m" },
  { from: "Damanjodi", to: "Bargarh", distance: 385, highway: "NH-26 → NH-53", freight: 4.5, time: "8h 45m" },
  { from: "Damanjodi", to: "Hirakud", distance: 400, highway: "NH-26 → NH-53", freight: 4.5, time: "9h 00m" },
  { from: "Damanjodi", to: "Jharsuguda", distance: 420, highway: "NH-49 → NH-53", freight: 4.5, time: "9h 30m" },
  { from: "Damanjodi", to: "Bhubaneswar", distance: 460, highway: "NH-26 → NH-16", freight: 4.5, time: "10h 00m" },
  { from: "Damanjodi", to: "Visakhapatnam", distance: 510, highway: "NH-26 → NH-16", freight: 4.5, time: "11h 15m" },
];
