import { AppData, Person, Product, Gift, Occasion, Holiday } from "./types";

const STORAGE_KEY = "giftify_data";

const DEFAULT_HOLIDAYS: Holiday[] = [
  {
    id: "holiday_christmas",
    name: "Christmas",
    icon: "🎄",
    color: "#dc2626",
    dateLogic: "12-25",
    productIds: [],
    linkedPersonIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "holiday_easter",
    name: "Easter",
    icon: "🐣",
    color: "#a855f7",
    dateLogic: "last Sunday of April",
    productIds: [],
    linkedPersonIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "holiday_birthday",
    name: "Birthday",
    icon: "🎂",
    color: "#f59e0b",
    dateLogic: "person-birthday",
    productIds: [],
    linkedPersonIds: [],
    createdAt: new Date().toISOString(),
  },
];

const EMPTY_DATA: AppData = {
  persons: [],
  products: [],
  gifts: [],
  occasions: [],
  holidays: DEFAULT_HOLIDAYS,
};

function migrateHoliday(h: Record<string, unknown>): Holiday {
  return {
    id: h.id as string,
    name: h.name as string,
    icon: (h.icon as string) || "🎉",
    color: (h.color as string) || "#2563eb",
    dateLogic: h.dateLogic as string | undefined,
    productIds: (h.productIds as string[]) || [],
    // migrate old field name
    linkedPersonIds: (h.linkedPersonIds as string[]) || (h.defaultPersonIds as string[]) || [],
    createdAt: (h.createdAt as string) || new Date().toISOString(),
  };
}

function loadData(): AppData {
  if (typeof window === "undefined") return { ...EMPTY_DATA };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_DATA };
    const parsed = JSON.parse(raw) as AppData;

    // Migrate holiday records (old format had isActive, isSystem, defaultPersonIds)
    parsed.holidays = (parsed.holidays as unknown as Record<string, unknown>[]).map(migrateHoliday);

    // Seed defaults if missing (only on first load for each)
    const ids = new Set(parsed.holidays.map((h) => h.id));
    if (!ids.has("holiday_christmas")) parsed.holidays.unshift(DEFAULT_HOLIDAYS[0]);
    if (!ids.has("holiday_easter")) parsed.holidays.splice(1, 0, DEFAULT_HOLIDAYS[1]);
    if (!ids.has("holiday_birthday")) parsed.holidays.splice(2, 0, DEFAULT_HOLIDAYS[2]);

    return parsed;
  } catch {
    return { ...EMPTY_DATA };
  }
}

function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---- Persons ----

export function getPersons(): Person[] {
  return loadData().persons;
}

export function getPerson(id: string): Person | undefined {
  return loadData().persons.find((p) => p.id === id);
}

export function savePerson(person: Omit<Person, "id" | "createdAt"> & { id?: string; createdAt?: string }): Person {
  const data = loadData();
  const now = new Date().toISOString();
  if (person.id) {
    const idx = data.persons.findIndex((p) => p.id === person.id);
    const updated = { ...data.persons[idx], ...person } as Person;
    data.persons[idx] = updated;
    saveData(data);
    return updated;
  }
  const newPerson: Person = { ...person, id: generateId(), createdAt: now } as Person;
  data.persons.push(newPerson);
  saveData(data);
  if (newPerson.birthdayDate) {
    autoCreateBirthdayOccasions(newPerson, data);
    saveData(data);
  }
  return newPerson;
}

export function deletePerson(id: string): void {
  const data = loadData();
  data.persons = data.persons.filter((p) => p.id !== id);
  // Remove from all holiday linkedPersonIds
  for (const h of data.holidays) {
    h.linkedPersonIds = h.linkedPersonIds.filter((pid) => pid !== id);
  }
  saveData(data);
}

// ---- Products ----

export function getProducts(): Product[] {
  return loadData().products;
}

export function getProduct(id: string): Product | undefined {
  return loadData().products.find((p) => p.id === id);
}

export function saveProduct(product: Omit<Product, "id" | "createdAt"> & { id?: string; createdAt?: string }): Product {
  const data = loadData();
  const now = new Date().toISOString();
  if (product.id) {
    const idx = data.products.findIndex((p) => p.id === product.id);
    const updated = { ...data.products[idx], ...product } as Product;
    data.products[idx] = updated;
    saveData(data);
    return updated;
  }
  const newProduct: Product = { ...product, id: generateId(), createdAt: now } as Product;
  data.products.push(newProduct);
  saveData(data);
  return newProduct;
}

export function deleteProduct(id: string): void {
  const data = loadData();
  data.products = data.products.filter((p) => p.id !== id);
  saveData(data);
}

// ---- Gifts ----

export function getGifts(): Gift[] {
  return loadData().gifts;
}

export function getGift(id: string): Gift | undefined {
  return loadData().gifts.find((g) => g.id === id);
}

export function saveGift(gift: Omit<Gift, "id" | "createdAt"> & { id?: string; createdAt?: string }): Gift {
  const data = loadData();
  const now = new Date().toISOString();
  if (gift.id) {
    const idx = data.gifts.findIndex((g) => g.id === gift.id);
    const updated = { ...data.gifts[idx], ...gift } as Gift;
    data.gifts[idx] = updated;
    saveData(data);
    return updated;
  }
  const newGift: Gift = { ...gift, id: generateId(), createdAt: now } as Gift;
  data.gifts.push(newGift);
  saveData(data);
  return newGift;
}

export function deleteGift(id: string): void {
  const data = loadData();
  data.gifts = data.gifts.filter((g) => g.id !== id);
  saveData(data);
}

// ---- Occasions ----

export function getOccasions(): Occasion[] {
  return loadData().occasions;
}

export function getOccasion(id: string): Occasion | undefined {
  return loadData().occasions.find((o) => o.id === id);
}

export function saveOccasion(occasion: Omit<Occasion, "id" | "createdAt"> & { id?: string; createdAt?: string }): Occasion {
  const data = loadData();
  const now = new Date().toISOString();
  if (occasion.id) {
    const idx = data.occasions.findIndex((o) => o.id === occasion.id);
    const updated = { ...data.occasions[idx], ...occasion } as Occasion;
    data.occasions[idx] = updated;
    saveData(data);
    return updated;
  }
  const newOccasion: Occasion = { ...occasion, id: generateId(), createdAt: now } as Occasion;
  data.occasions.push(newOccasion);
  saveData(data);
  return newOccasion;
}

export function deleteOccasion(id: string): void {
  const data = loadData();
  data.occasions = data.occasions.filter((o) => o.id !== id);
  saveData(data);
}

// ---- Holidays ----

export function getHolidays(): Holiday[] {
  return loadData().holidays;
}

export function getHoliday(id: string): Holiday | undefined {
  return loadData().holidays.find((h) => h.id === id);
}

export function saveHoliday(holiday: Omit<Holiday, "id" | "createdAt"> & { id?: string; createdAt?: string }): Holiday {
  const data = loadData();
  const now = new Date().toISOString();
  if (holiday.id) {
    const idx = data.holidays.findIndex((h) => h.id === holiday.id);
    const updated = { ...data.holidays[idx], ...holiday } as Holiday;
    data.holidays[idx] = updated;
    saveData(data);
    return updated;
  }
  const newHoliday: Holiday = { ...holiday, id: generateId(), createdAt: now } as Holiday;
  data.holidays.push(newHoliday);
  saveData(data);
  return newHoliday;
}

export function deleteHoliday(id: string): void {
  const data = loadData();
  data.holidays = data.holidays.filter((h) => h.id !== id);
  saveData(data);
}

// ---- Auto-create occasions ----

// Resolves the ISO date string for a holiday occasion in a given year.
// Returns undefined for relative date logic we can't compute (e.g. "last Sunday of April").
function resolveOccasionDate(holiday: Holiday, person: Person, year: number): string | undefined {
  const logic = holiday.dateLogic;
  if (!logic) return undefined;
  if (/^\d{2}-\d{2}$/.test(logic)) return `${year}-${logic}`;
  if (logic === "person-birthday" && person.birthdayDate) {
    return `${year}-${person.birthdayDate}`;
  }
  return undefined;
}

export function autoCreateHolidayOccasions(holiday: Holiday, person: Person, existingData?: AppData): void {
  const data = existingData || loadData();
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < 3; i++) {
    const year = currentYear + i;
    const alreadyExists = data.occasions.some(
      (o) =>
        o.holidayId === holiday.id &&
        o.personIds.includes(person.id) &&
        (
          (o.date && o.date.startsWith(String(year))) ||
          o.name === `${person.name}'s ${holiday.name} ${year}`
        )
    );
    if (alreadyExists) continue;

    data.occasions.push({
      id: generateId(),
      name: `${person.name}'s ${holiday.name} ${year}`,
      date: resolveOccasionDate(holiday, person, year),
      personIds: [person.id],
      giftIds: [],
      productIds: [],
      holidayId: holiday.id,
      createdAt: new Date().toISOString(),
    });
  }

  if (!existingData) saveData(data);
}

export function autoCreateBirthdayOccasions(person: Person, existingData?: AppData): void {
  const data = existingData || loadData();
  if (!person.birthdayDate) return;

  const birthdayHoliday = data.holidays.find((h) => h.id === "holiday_birthday");
  if (!birthdayHoliday) return;

  // Keep holiday's linkedPersonIds in sync
  if (!birthdayHoliday.linkedPersonIds.includes(person.id)) {
    const idx = data.holidays.findIndex((h) => h.id === "holiday_birthday");
    data.holidays[idx] = {
      ...birthdayHoliday,
      linkedPersonIds: [...birthdayHoliday.linkedPersonIds, person.id],
    };
  }

  autoCreateHolidayOccasions(
    data.holidays.find((h) => h.id === "holiday_birthday")!,
    person,
    data
  );

  if (!existingData) saveData(data);
}

// ---- Utility queries ----

export function getGiftsForPerson(personId: string): Gift[] {
  return loadData().gifts.filter((g) => g.personIds.includes(personId));
}

export function getOccasionsForPerson(personId: string): Occasion[] {
  return loadData().occasions.filter((o) => o.personIds.includes(personId));
}

export function getGiftsForOccasion(occasionId: string): Gift[] {
  return loadData().gifts.filter((g) => g.occasionId === occasionId);
}

export function getProductGiftCount(productId: string): { count: number; personIds: string[] } {
  const gifts = loadData().gifts.filter((g) => g.productId === productId);
  const personIds = [...new Set(gifts.flatMap((g) => g.personIds))];
  return { count: gifts.length, personIds };
}

export function getUngiftedProductsForPerson(personId: string): Product[] {
  const data = loadData();
  const giftedProductIds = new Set(
    data.gifts
      .filter((g) => g.personIds.includes(personId) && g.productId)
      .map((g) => g.productId!)
  );
  return data.products.filter((p) => !giftedProductIds.has(p.id));
}

// ---- Helpers ----

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
