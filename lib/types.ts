export type Goal = { id: string; title: string; category: string; target?: string; status: "active" | "paused" | "done"; createdAt?: string };
export type Profile = {
  name: string; focus: string[]; likes: string; avoid: string; allergies: string;
  cookMinutes: number; family: boolean; householdSize: number; onboarded: boolean;
  safeguards: { kneeCare: boolean; balance: boolean; pregnant: boolean; fluidLimit: boolean };
  waterTargetOz?: number; proteinTargetG?: number; moveTargetMin?: number;
  theme: "system" | "light" | "dark"; trackMeasurements: boolean; celebrate: boolean;
};
export type DailyLog = { date: string; waterOz: number; proteinG: number; energyAm?: number; energyPm?: number; stress?: number; mood?: string; sleepHours?: number; sleepQuality?: number; note?: string };
export type Supplement = { id: string; name: string; dose: string; times: string[]; withFood: boolean; notes?: string; stock?: number; perDose?: number };
export type SuppLog = { date: string; suppId: string; time: string };
export type GroceryItem = { id: string; name: string; qty?: string; aisle?: string; checked: boolean };
export type Reminder = { id: string; label: string; time: string; enabled: boolean; days?: number[] };
export type WorkoutLog = { date: string; minutes: number; mode: string; routineId?: string; feel?: number };
export type Slot = "breakfast" | "lunch" | "dinner" | "snack";
export type MealPlan = Record<string, Partial<Record<Slot, string>>>;
export type JournalEntry = { id: string; date: string; text: string; gratitude: string[]; mood?: string };
export type Win = { id: string; date: string; text: string; kind: string };
export type Measurement = { date: string; weight?: number; waist?: number; hips?: number; note?: string };
export type PrepPlan = { recipeIds: string[]; servings: Record<string, number>; day: string };
export type AppData = {
  profile: Profile; goals: Goal[]; logs: Record<string, DailyLog>; supplements: Supplement[]; suppLogs: SuppLog[];
  pantry: string[]; grocery: GroceryItem[]; reminders: Reminder[]; workouts: WorkoutLog[];
  favorites: string[]; mealPlan: MealPlan; journal: JournalEntry[]; wins: Win[]; measurements: Measurement[];
  prep: PrepPlan; routineLevels: Record<string, number>; selfCareFavs: string[]; customSelfCare: string[];
};
