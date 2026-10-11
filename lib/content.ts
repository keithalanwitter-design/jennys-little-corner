export const proteins = ["Chicken breast", "Ground turkey", "Lean beef", "Salmon", "Shrimp", "Eggs", "Greek yogurt", "Cottage cheese", "Tofu", "Black beans", "Lentils", "Tuna"];
export const produce = ["Roasted broccoli", "Spinach", "Bell peppers", "Zucchini", "Cucumber & tomato", "Green beans", "Berries", "Mixed greens", "Cauliflower", "Carrots"];
export const carbsFats = ["Sweet potato", "Quinoa", "Brown rice", "Whole-wheat wrap", "Corn tortillas", "Avocado", "Olive oil dressing", "Feta", "Hummus", "Nuts & seeds"];
export const sauces = ["Salsa", "Tzatziki", "Pesto", "Teriyaki", "Lemon-herb", "Peanut sauce", "Chimichurri"];
export type Recipe = { id: string; title: string; style: "15-Min Dinner" | "Fridge Staple" | "Grab & Go Breakfast" | "Family Style"; minutes: number; proteinG: number; servings: number; ingredients: string[]; steps: string };
export const recipes: Recipe[] = [
  { id: "r1", title: "Greek yogurt berry bowl", style: "Grab & Go Breakfast", minutes: 5, proteinG: 25, servings: 1, ingredients: ["greek yogurt", "berries", "granola", "honey"], steps: "Layer 1 cup yogurt, berries, a spoon of granola, drizzle honey." },
  { id: "r2", title: "Egg & spinach muffins", style: "Grab & Go Breakfast", minutes: 25, proteinG: 20, servings: 4, ingredients: ["eggs", "spinach", "bell peppers", "cheese"], steps: "Whisk 10 eggs, fold in veg & cheese, bake in muffin tin 20 min at 350°F. Keeps 4 days." },
  { id: "r3", title: "Cottage cheese toast", style: "Grab & Go Breakfast", minutes: 5, proteinG: 22, servings: 1, ingredients: ["cottage cheese", "bread", "tomato", "everything seasoning"], steps: "Toast, top with cottage cheese, tomato and seasoning." },
  { id: "r4", title: "Sheet-pan chicken & veggies", style: "Family Style", minutes: 35, proteinG: 35, servings: 4, ingredients: ["chicken breast", "broccoli", "sweet potato", "olive oil"], steps: "Cube everything, toss in oil & spices, roast 425°F for 25–30 min." },
  { id: "r5", title: "Turkey taco skillet", style: "15-Min Dinner", minutes: 15, proteinG: 30, servings: 4, ingredients: ["ground turkey", "black beans", "salsa", "corn tortillas", "bell peppers"], steps: "Brown turkey with taco spices, add beans, peppers & salsa. Serve in tortillas or over greens." },
  { id: "r6", title: "Garlic shrimp & quinoa", style: "15-Min Dinner", minutes: 15, proteinG: 28, servings: 3, ingredients: ["shrimp", "quinoa", "garlic", "zucchini", "lemon"], steps: "Sauté shrimp with garlic & zucchini; serve on quinoa with lemon." },
  { id: "r7", title: "Salmon, rice & cucumber bowl", style: "15-Min Dinner", minutes: 20, proteinG: 32, servings: 2, ingredients: ["salmon", "brown rice", "cucumber", "avocado", "teriyaki"], steps: "Air-fry or bake salmon 12 min; bowl with rice, cucumber, avocado, sauce." },
  { id: "r8", title: "Batch shredded chicken", style: "Fridge Staple", minutes: 30, proteinG: 30, servings: 6, ingredients: ["chicken breast", "broth", "garlic", "onion"], steps: "Simmer or pressure-cook chicken in broth; shred. Use in wraps, salads, tacos through day 3–4." },
  { id: "r9", title: "Lentil & veggie soup", style: "Fridge Staple", minutes: 40, proteinG: 18, servings: 6, ingredients: ["lentils", "carrots", "onion", "spinach", "broth"], steps: "Sauté onion & carrots, add lentils & broth, simmer 25 min, stir in spinach. Freezes well." },
  { id: "r10", title: "Tuna salad lettuce wraps", style: "15-Min Dinner", minutes: 10, proteinG: 27, servings: 2, ingredients: ["tuna", "greek yogurt", "celery", "lettuce", "lemon"], steps: "Mix tuna with yogurt, celery, lemon; spoon into lettuce cups." },
  { id: "r11", title: "Beef & broccoli stir-fry", style: "Family Style", minutes: 25, proteinG: 32, servings: 4, ingredients: ["lean beef", "broccoli", "brown rice", "soy sauce", "garlic"], steps: "Sear thin-sliced beef, add broccoli & sauce, serve over rice." },
  { id: "r12", title: "Tofu peanut noodle bowl", style: "Family Style", minutes: 25, proteinG: 22, servings: 3, ingredients: ["tofu", "noodles", "carrots", "cucumber", "peanut sauce"], steps: "Crisp tofu, toss with noodles, veg and peanut sauce." },
];
export const rebounderModes = {
  gentle: { label: "Gentle Health Bounce", desc: "Feet stay on the mat. Soft, rhythmic bouncing for circulation and a calm mood.", work: 60, rest: 0, moves: ["Soft heel bounce", "Gentle sway side to side", "Arm circles while bouncing", "Small twist bounce"] },
  interval: { label: "Interval Cardio Bounce", desc: "40 seconds of light jogging or scissor steps, 20 seconds of soft recovery bounce.", work: 40, rest: 20, moves: ["Light jog", "Scissor steps", "Jumping jack arms (low)", "Knee lifts", "Side-to-side steps"] },
} as const;
export const cooldown = [
  { name: "Standing quad stretch (hold a chair)", sec: 60 },
  { name: "Kneeling or standing hip-flexor stretch", sec: 60 },
  { name: "Calf stretch against wall", sec: 60 },
  { name: "Ankle circles", sec: 30 },
  { name: "Glute bridges, slow", sec: 60 },
  { name: "Hamstring stretch lying down", sec: 30 },
];
export const suppInfo = [
  { name: "Vitamin D", note: "Commonly low, especially in winter. A blood test can show whether you need it." },
  { name: "Magnesium (glycinate)", note: "Often used for sleep and muscle relaxation. High doses can upset the stomach." },
  { name: "Omega-3 (fish oil)", note: "Found in fatty fish. Can interact with blood thinners." },
  { name: "Creatine monohydrate", note: "Well studied for strength and muscle. Drink plenty of water." },
  { name: "Protein powder", note: "A convenient food, not a must. Look for third-party testing (NSF, Informed Choice)." },
  { name: "Fiber (psyllium)", note: "Helps fullness and digestion. Start low and take it with water." },
  { name: "Electrolytes", note: "Can help on sweaty days. Watch the sodium if you have blood-pressure concerns." },
];
export const sources = [
  ["NIH Office of Dietary Supplements", "https://ods.od.nih.gov/factsheets/list-all/"],
  ["Harvard Healthy Eating Plate", "https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/"],
  ["CDC Physical Activity Basics", "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html"],
  ["AAOS OrthoInfo (knees)", "https://orthoinfo.aaos.org/"],
];
