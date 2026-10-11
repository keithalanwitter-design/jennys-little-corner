export type Goal = { id: string; title: string; category: string; target?: string; status: "active" | "paused" | "done" };
export type Profile = {
  name: string; focus: string[]; likes: string; avoid: string; allergies: string;
  cookMinutes: number; family: boolean; onboarded: boolean;
  safeguards: { kneeCare: boolean; balance: boolean; pregnant: boolean; fluidLimit: boolean };
  waterTargetOz?: number; proteinTargetG?: number; // only if she sets them
};
export type DailyLog = { date: string; waterOz: number; proteinG: number; energyAm?: number; energyPm?: number; stress?: number; note?: string };
export type Supplement = { id: string; name: string; dose: string; times: string[]; withFood: boolean; notes?: string };
export type SuppLog = { date: string; suppId: string; time: string };
export type GroceryItem = { id: string; name: string; checked: boolean };
export type Reminder = { id: string; label: string; time: string; enabled: boolean };
export type WorkoutLog = { date: string; minutes: number; mode: string };
export type AppData = {
  profile: Profile; goals: Goal[]; logs: Record<string, DailyLog>; supplements: Supplement[]; suppLogs: SuppLog[];
  pantry: string[]; grocery: GroceryItem[]; reminders: Reminder[]; workouts: WorkoutLog[];
};
