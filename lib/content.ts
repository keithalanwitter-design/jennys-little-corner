export const proteins = ["Chicken breast", "Ground turkey", "Lean beef", "Salmon", "Shrimp", "Cod", "Eggs", "Greek yogurt", "Cottage cheese", "Tofu", "Tempeh", "Edamame", "Black beans", "Lentils", "Chickpeas", "Tuna"];
export const produce = ["Roasted broccoli", "Spinach", "Bell peppers", "Zucchini", "Cucumber & tomato", "Green beans", "Berries", "Mixed greens", "Cauliflower", "Carrots", "Asparagus", "Brussels sprouts", "Purple cabbage", "Mango salsa"];
export const carbsFats = ["Sweet potato", "Quinoa", "Brown rice", "Whole-wheat wrap", "Corn tortillas", "Sourdough", "Soba noodles", "Avocado", "Olive oil", "Feta", "Hummus", "Pumpkin seeds"];
export const sauces = ["Salsa verde", "Tzatziki", "Pesto", "Teriyaki", "Lemon-herb", "Peanut-lime", "Chimichurri", "Harissa yogurt", "Honey mustard"];
export const proteinEst: Record<string, number> = { "Chicken breast": 35, "Ground turkey": 28, "Lean beef": 30, Salmon: 32, Shrimp: 28, Cod: 30, Eggs: 18, "Greek yogurt": 22, "Cottage cheese": 24, Tofu: 20, Tempeh: 24, Edamame: 17, "Black beans": 14, Lentils: 16, Chickpeas: 12, Tuna: 30 };

export type Step = { name: string; cue: string; sec: number; kind: "warm" | "work" | "rest" | "cool" };
export type Routine = { id: string; name: string; vibe: string; color: string; levels: { label: string; minutes: number; steps: Step[] }[] };
const w = (name: string, cue: string, sec: number): Step => ({ name, cue, sec, kind: "work" });
const rest = (sec: number): Step => ({ name: "Soft recovery bounce", cue: "Heels stay down. Breathe out longer than you breathe in.", sec, kind: "rest" });
const warm = (sec = 120): Step => ({ name: "Warm-up health bounce", cue: "Feet stay on the mat, knees soft, arms swing loose.", sec, kind: "warm" });
const cool = (sec = 60): Step => ({ name: "Settle down", cue: "Tiny bounces, slow breaths, roll your shoulders.", sec, kind: "cool" });
const repeat = (moves: Step[], restSec: number, total: number) => { const out: Step[] = []; let t = 0, i = 0; while (t < total) { const m = moves[i++ % moves.length]; out.push(m); t += m.sec; if (restSec && t < total) { out.push(rest(restSec)); t += restSec; } } return out; };

const gentleMoves = [w("Heel bounce", "Lift the heels, keep your toes on the mat. Small and steady.", 60), w("Side sway", "Shift your weight side to side like a slow metronome.", 60), w("Arm reach bounce", "Reach up, then down to your hips with each bounce.", 60), w("Gentle twist", "Rotate softly from your ribs, not your knees.", 60)];
const cardioMoves = [w("Easy jog", "Light feet, tall chest. Lift your knees only as high as feels good.", 40), w("Scissor steps", "Step one foot forward and one back, switching with a bounce.", 40), w("Low jumping jacks", "Small jacks with feet close to the mat.", 40), w("Knee lifts", "Alternate knee lifts toward your hands at waist height.", 40), w("Side-to-side steps", "Step-bounce left and right.", 40)];
const strongMoves = [w("Bounce squat", "Sit back gently and bounce in a shallow squat. Knees over toes.", 40), w("Twist jog", "Jog while rotating your arms across your body.", 40), w("Pulse & punch", "Small bounces with alternating forward punches.", 40), w("Heel taps", "Tap one heel forward, then the other, at a lively rhythm.", 40)];

export const routines: Routine[] = [
  { id: "sunrise", name: "Sunrise Flow", vibe: "Wake up your body, no jumping.", color: "from-honey to-clay", levels: [
    { label: "Seedling", minutes: 10, steps: [warm(), ...repeat(gentleMoves, 0, 420), cool()] },
    { label: "Sprout", minutes: 15, steps: [warm(), ...repeat(gentleMoves, 0, 720), cool()] },
    { label: "Bloom", minutes: 20, steps: [warm(), ...repeat(gentleMoves, 0, 1020), cool()] }] },
  { id: "heartglow", name: "Heart Glow Intervals", vibe: "40s move · 20s soft bounce for steady cardio.", color: "from-clay to-terra", levels: [
    { label: "Seedling", minutes: 10, steps: [warm(), ...repeat(cardioMoves.map((m) => ({ ...m, sec: 30 })), 30, 420), cool()] },
    { label: "Sprout", minutes: 15, steps: [warm(), ...repeat(cardioMoves, 20, 720), cool()] },
    { label: "Bloom", minutes: 20, steps: [warm(), ...repeat(cardioMoves.map((m) => ({ ...m, sec: 45 })), 15, 1020), cool()] }] },
  { id: "kitchen", name: "Kitchen Dance Party", vibe: "Put on a favorite playlist. Pure fun.", color: "from-plum to-blush", levels: [
    { label: "Seedling", minutes: 10, steps: [warm(90), ...repeat([...gentleMoves.slice(0, 2), ...cardioMoves.slice(0, 2)].map((m) => ({ ...m, sec: 45 })), 15, 450), cool()] },
    { label: "Sprout", minutes: 15, steps: [warm(90), ...repeat([...cardioMoves, ...strongMoves.slice(1, 3)], 15, 750), cool()] },
    { label: "Bloom", minutes: 20, steps: [warm(90), ...repeat([...cardioMoves, ...strongMoves], 10, 1050), cool()] }] },
  { id: "strong", name: "Steady Strong", vibe: "Bounce plus shallow squats and arms.", color: "from-sage to-moss", levels: [
    { label: "Seedling", minutes: 10, steps: [warm(), ...repeat(strongMoves.map((m) => ({ ...m, sec: 30 })), 30, 420), cool()] },
    { label: "Sprout", minutes: 15, steps: [warm(), ...repeat(strongMoves, 20, 720), cool()] },
    { label: "Bloom", minutes: 20, steps: [warm(), ...repeat([...strongMoves, ...cardioMoves.slice(0, 2)], 20, 1020), cool()] }] },
  { id: "lymph", name: "Calm Circulation", vibe: "Slow rhythmic bounce with deep breathing.", color: "from-sky to-sage", levels: [
    { label: "Seedling", minutes: 5, steps: [warm(60), w("Breathing bounce", "Inhale for 4 bounces, exhale for 6.", 180), cool()] },
    { label: "Sprout", minutes: 10, steps: [warm(), w("Breathing bounce", "Inhale for 4 bounces, exhale for 6.", 240), ...gentleMoves.slice(0, 2), cool(120)] },
    { label: "Bloom", minutes: 15, steps: [warm(), w("Breathing bounce", "Inhale for 4 bounces, exhale for 6.", 300), ...gentleMoves, w("Breathing bounce", "Slow it down again.", 120), cool(120)] }] },
];

const s = (name: string, cue: string, sec: number): Step => ({ name, cue, sec, kind: "cool" });
export type Flow = { id: string; name: string; focus: string; minutes: number; steps: Step[] };
export const mobility: Flow[] = [
  { id: "knee", name: "Knee-Friendly Cooldown", focus: "After bouncing", minutes: 5, steps: [
    s("Standing quad stretch", "Hold a chair, bring your heel toward your glute, knees together. 30s each side.", 60),
    s("Hip-flexor lunge", "Half-kneel on a cushion, tuck your pelvis, lean gently forward.", 60),
    s("Wall calf stretch", "Back heel down, front knee bent. 30s each side.", 60),
    s("Ankle circles", "Slow circles both ways on each foot.", 30),
    s("Glute bridges", "Press through your heels, squeeze at the top, lower slowly.", 60),
    s("Strap hamstring stretch", "Lie on your back, loop a towel around your foot, keep a soft knee.", 30)] },
  { id: "hips", name: "Hip Opening", focus: "Desk & car seat relief", minutes: 8, steps: [
    s("Cat-cow", "Move with your breath, one vertebra at a time.", 60), s("90/90 hip switch", "Sit tall and let both knees fall side to side.", 90),
    s("Figure-four stretch", "Lie on your back, ankle over knee, pull the thigh in. 45s each side.", 90), s("Low lunge with reach", "Reach the same-side arm overhead. 30s each side.", 60),
    s("Butterfly fold", "Soles together, fold forward from the hips.", 60), s("Happy baby", "Rock gently side to side.", 60), s("Rest on your back", "Knees bent, hands on your belly.", 60)] },
  { id: "back", name: "Back & Shoulder Melt", focus: "Carrying kids, groceries, life", minutes: 7, steps: [
    s("Neck rolls", "Half circles only, ear toward shoulder.", 45), s("Thread the needle", "On all fours, slide one arm under. 30s each side.", 60),
    s("Child's pose side reach", "Walk your hands to one side, then the other.", 60), s("Doorway chest stretch", "Forearm on the frame, step through gently.", 60),
    s("Seated twist", "Grow tall first, then twist. Each side.", 60), s("Wall angels", "Back to the wall, slide your arms up and down slowly.", 60), s("Supported fish", "Lie on a pillow under your shoulder blades.", 75)] },
  { id: "toes", name: "Touch-Your-Toes Journey", focus: "Hamstring flexibility", minutes: 10, steps: [
    s("Ragdoll hang", "Bend your knees as much as needed and let your head hang heavy.", 60), s("Strap hamstring stretch", "30s straight leg, 30s bent knee. Each side.", 120),
    s("Pyramid pose", "Short stance, hinge over the front leg. Each side.", 90), s("Seated forward fold", "Sit on a folded blanket and lead with your chest.", 90),
    s("Wide-leg fold", "Hands to blocks or a chair.", 60), s("Legs up the wall", "Let gravity do the work.", 120), s("Breathe", "Notice how your legs feel now.", 60)] },
  { id: "bed", name: "Bedtime Unwind", focus: "Gentle floor stretches before sleep", minutes: 6, steps: [
    s("Knees-to-chest rock", "Massage your low back gently.", 60), s("Supine twist", "Knees to one side, gaze the other way. Each side.", 90),
    s("Reclined butterfly", "Pillows under your knees.", 60), s("Legs up the wall", "Long, slow exhales.", 120), s("Body scan", "Soften your jaw, shoulders, belly and feet.", 60)] },
];

export const breathPatterns = [
  { id: "box", name: "Box Breathing", desc: "Calm and focused", phases: [["Breathe in", 4], ["Hold", 4], ["Breathe out", 4], ["Hold", 4]] as [string, number][] },
  { id: "478", name: "4-7-8 Sleep Breath", desc: "Slow down for sleep", phases: [["Breathe in", 4], ["Hold", 7], ["Breathe out", 8]] as [string, number][] },
  { id: "sigh", name: "Physiological Sigh", desc: "A quick reset", phases: [["Breathe in", 3], ["Sip in more", 1], ["Long breath out", 6]] as [string, number][] },
  { id: "coherent", name: "Coherent Breathing", desc: "Even and steady", phases: [["Breathe in", 5], ["Breathe out", 5]] as [string, number][] },
];

export const selfCare: { cat: string; icon: string; items: string[] }[] = [
  { cat: "5 minutes", icon: "clock", items: ["Make a warm drink and actually sit down with it", "Step outside and find three things that are green", "Put on one song and do nothing else", "Text someone who makes you laugh", "Lotion your hands slowly, like it's a spa"] },
  { cat: "15 minutes", icon: "leaf", items: ["Read a chapter of something just for fun", "Take a slow walk around the block, no podcast", "Face mask + feet up", "Stretch on the floor while the kettle boils", "Sketch, doodle or color something"] },
  { cat: "An hour", icon: "sun", items: ["Long bath with the door locked", "Coffee shop solo date", "Browse a thrift or vintage shop", "Nap without guilt", "Start a little DIY project"] },
  { cat: "With others", icon: "heart", items: ["Ask for a hand: 'Can you take dinner tonight?'", "Walk with a friend", "Family dance party in the kitchen", "Movie night where someone else picks the snacks"] },
];

export const suppInfo = [
  { name: "Vitamin D3", when: "Morning, with food", note: "Commonly low, especially in winter. A blood test can show whether you need it and how much." },
  { name: "Magnesium glycinate", when: "Evening", note: "Often used to help with relaxation and sleep. Large doses can upset the stomach." },
  { name: "Omega-3 (fish oil)", when: "With a meal", note: "Found naturally in salmon and sardines. Can interact with blood thinners." },
  { name: "Creatine monohydrate", when: "Any time, daily", note: "One of the best-studied supplements for muscle and strength. Drink plenty of water." },
  { name: "Protein powder", when: "As a snack or in a smoothie", note: "A convenient food, not a must. Look for third-party testing (NSF Certified for Sport, Informed Choice)." },
  { name: "Psyllium fiber", when: "With a full glass of water", note: "Supports fullness and regularity. Start low and take it away from medications." },
  { name: "Electrolytes", when: "Sweaty days", note: "Can help after long workouts or in heat. Watch the sodium if you have blood-pressure concerns." },
  { name: "Ginger or peppermint tea", when: "After meals", note: "A gentle, food-based way some people support digestion." },
];
export const sources = [
  ["NIH Office of Dietary Supplements", "https://ods.od.nih.gov/factsheets/list-all/"],
  ["Harvard Healthy Eating Plate", "https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/"],
  ["CDC Physical Activity Basics", "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html"],
  ["AAOS OrthoInfo", "https://orthoinfo.aaos.org/"],
  ["NIDDK Weight Management", "https://www.niddk.nih.gov/health-information/weight-management"],
];

export const moods = [
  { id: "drained", label: "A little drained", emoji: "🌧️", msg: "A softer day is still a good day." },
  { id: "busy", label: "Busy & stretched", emoji: "🌪️", msg: "You don't have to do everything. Pick one thing for you." },
  { id: "okay", label: "Steady", emoji: "⛅", msg: "Steady is lovely. A small win will feel good." },
  { id: "good", label: "Feeling good", emoji: "☀️", msg: "Make room for something you enjoy." },
  { id: "spark", label: "Full of spark", emoji: "✨", msg: "Ride the energy, but leave some for tomorrow." },
];
