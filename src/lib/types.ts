export type GiftStatus = "idea" | "purchased" | "given";
export type GiftType = "physical" | "experience";

export interface Person {
  id: string;
  name: string;
  emoji?: string;
  group?: string; // household grouping
  birthdayDate?: string; // ISO date string "MM-DD" or full date
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  link?: string;
  price?: number;
  tags: string[];
  goodForHolidayIds: string[];
  similarProductIds: string[];
  createdAt: string;
}

export interface Gift {
  id: string;
  name: string;
  personIds: string[]; // 1-many persons
  occasionId: string;
  productId?: string; // optional — can be a one-time custom gift
  notes?: string;
  starRating?: number; // 1-5
  status: GiftStatus;
  type?: GiftType;
  suggestedProductIds: string[];
  createdAt: string;
}

export interface Occasion {
  id: string;
  name: string;
  date?: string; // ISO date string
  notes?: string;
  personIds: string[];
  giftIds: string[];
  productIds: string[]; // good-for products
  holidayId?: string; // parent holiday
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  icon: string;
  color: string;
  // Fixed: "MM-DD" (e.g. "12-25"). Relative: plain text. Birthday: "person-birthday".
  dateLogic?: string;
  productIds: string[];
  linkedPersonIds: string[]; // persons this holiday applies to
  createdAt: string;
}

export interface AppData {
  persons: Person[];
  products: Product[];
  gifts: Gift[];
  occasions: Occasion[];
  holidays: Holiday[];
}
