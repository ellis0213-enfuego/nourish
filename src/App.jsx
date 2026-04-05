import { useState, useEffect } from "react";
import { DB } from "./storage.js";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const GOALS = [
  { id:"fat_loss",    icon:"🔥", label:"Lose Weight",        desc:"Reduce fat, protect muscle" },
  { id:"bulk",        icon:"📈", label:"Gain Weight",         desc:"Controlled caloric surplus" },
  { id:"muscle",      icon:"💪", label:"Build Muscle",        desc:"Maximize strength & size" },
  { id:"recomp",      icon:"⚖️", label:"Recomposition",       desc:"Lose fat, gain muscle" },
  { id:"maintain",    icon:"🎯", label:"Maintain Weight",     desc:"Hold current weight, stay consistent" },
  { id:"transition",  icon:"🔄", label:"Post-Cut Transition", desc:"Hit goal — now building" },
  { id:"cholesterol", icon:"❤️", label:"Lower Cholesterol",   desc:"Heart-healthy nutrition" },
  { id:"longevity",   icon:"🌿", label:"Longevity",           desc:"Optimize for healthspan" },
  { id:"wellness",    icon:"✨", label:"General Wellness",    desc:"Balanced, sustainable habits" },
];
const ACTIVITIES = [
  { id:"sedentary",   label:"Sedentary",      desc:"Desk job, minimal movement",    mult:1.2 },
  { id:"light",       label:"Lightly Active", desc:"1–3 workouts per week",         mult:1.375 },
  { id:"active",      label:"Active",         desc:"3–5 workouts per week",         mult:1.55 },
  { id:"very_active", label:"Very Active",    desc:"6–7 intense workouts per week", mult:1.725 },
];
const GLP1_MEDS  = ["Zepbound","Wegovy","Ozempic","Mounjaro","Other"];
const GLP1_DOSES = {
  Zepbound:["2.5mg","5mg","7.5mg","10mg","12.5mg","15mg"],
  Wegovy:  ["0.25mg","0.5mg","1mg","1.7mg","2.4mg"],
  Ozempic: ["0.25mg","0.5mg","1mg","2mg"],
  Mounjaro:["2.5mg","5mg","7.5mg","10mg","12.5mg","15mg"],
  Other:   ["Starting dose","Mid dose","Max dose"],
};
const DAYS  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const PREFS = ["High Protein","Low Carb","No Gluten","No Dairy","Meal Prep","Quick Meals","Kid Friendly","Heart Healthy"];
const NOTIFS = [
  { key:"morningProtein",    label:"Morning protein reminder",  sub:"Start the day protein-first",        glp1:false },
  { key:"middayCheckin",     label:"Midday macro check-in",     sub:"See where you stand at lunch",       glp1:false },
  { key:"eveningWarning",    label:"Evening catch-up alert",    sub:"Flag when you're behind on targets", glp1:false },
  { key:"weightLog",         label:"Daily weight reminder",     sub:"Fasted morning weigh-in prompt",     glp1:false },
  { key:"hydration",         label:"Hydration nudge",           sub:"Afternoon water reminder",           glp1:false },
  { key:"injectionReminder", label:"Injection day reminder",    sub:"Weekly dose reminder",               glp1:true  },
  { key:"postInjection",     label:"Post-injection heads-up",   sub:"Appetite suppression warning",       glp1:true  },
  { key:"doseEscalation",    label:"Dose escalation alert",     sub:"2 days before step-up",              glp1:true  },
];
const WIZARD_STEPS = ["About You","Your Goal","GLP-1","Goal Details","Activity","Macros","Alerts","Preferences"];
const MEALS = ["breakfast","lunch","dinner","snacks"];
const MEAL_LABELS = { breakfast:"Breakfast", lunch:"Lunch", dinner:"Dinner", snacks:"Snacks" };
const MEAL_ICONS  = { breakfast:"☀️", lunch:"🌤️", dinner:"🌙", snacks:"🍎" };

// ─── SEEDED FOOD LIBRARY ──────────────────────────────────────────────────────
const SEED_LIBRARY = [
  // Personal staples
  { id:"sl_1",  name:"Chobani Plain Greek Yogurt 0%", brand:"Chobani",  serving:"5.3 oz container", cal:90,  pro:15, carb:6,  fat:0,  custom:false, tags:["breakfast","snack","high-protein","quick"] },
  { id:"sl_2",  name:"Orgain Organic Protein Vanilla", brand:"Orgain", serving:"1 scoop (46g)",    cal:150, pro:21, carb:15, fat:4,  custom:false, tags:["breakfast","snack","high-protein","quick"] },
  { id:"sl_3",  name:"PB2 Peanut Butter Powder",       brand:"PB2",    serving:"2 tbsp (12g)",     cal:45,  pro:5,  carb:5,  fat:1.5,custom:false, tags:["snack","breakfast","quick"] },
  { id:"sl_4",  name:"Cottage Cheese 0% Nonfat",       brand:"Generic",serving:"½ cup (113g)",     cal:90,  pro:13, carb:5,  fat:0,  custom:false, tags:["breakfast","snack","high-protein","quick"] },
  { id:"sl_5",  name:"Collagen Peptides",               brand:"Vital Proteins",serving:"1 scoop (10g)",cal:35,pro:9, carb:0,  fat:0,  custom:false, tags:["breakfast","snack","quick"] },
  { id:"sl_6",  name:"Protein Fluff Bowl",              brand:"Custom", serving:"1 cup",            cal:347, pro:53, carb:29, fat:5,  custom:true,  tags:["breakfast","snack","high-protein","meal-prep"] },
  { id:"sl_7",  name:"Buffalo Chicken Dip",             brand:"Custom", serving:"½ cup",            cal:145, pro:22, carb:3,  fat:5,  custom:true,  tags:["snack","lunch","high-protein","meal-prep"] },
  { id:"sl_8",  name:"High-Protein Waffles (2)",        brand:"Custom", serving:"2 waffles",        cal:280, pro:18, carb:35, fat:7,  custom:true,  tags:["breakfast","meal-prep"] },
  { id:"sl_9",  name:"Ranch Chicken Dip",               brand:"Custom", serving:"½ cup",            cal:140, pro:22, carb:2,  fat:5,  custom:true,  tags:["snack","lunch","high-protein","meal-prep"] },
  // Common proteins
  { id:"sl_10", name:"Chicken Breast Cooked",           brand:"Generic",serving:"4 oz",             cal:185, pro:35, carb:0,  fat:4,  custom:false, tags:["lunch","dinner","high-protein","meal-prep"] },
  { id:"sl_11", name:"Egg Whole",                       brand:"Generic",serving:"1 large",          cal:70,  pro:6,  carb:0,  fat:5,  custom:false, tags:["breakfast","lunch","quick"] },
  { id:"sl_12", name:"Egg Whites",                      brand:"Generic",serving:"3 large whites",   cal:51,  pro:11, carb:0,  fat:0,  custom:false, tags:["breakfast","high-protein","quick"] },
  { id:"sl_13", name:"Tuna in Water",                   brand:"Generic",serving:"1 can (5 oz)",     cal:130, pro:30, carb:0,  fat:1,  custom:false, tags:["lunch","dinner","high-protein","quick"] },
  { id:"sl_14", name:"Salmon Fillet",                   brand:"Generic",serving:"4 oz",             cal:200, pro:28, carb:0,  fat:10, custom:false, tags:["lunch","dinner","high-protein"] },
  { id:"sl_15", name:"Ground Turkey 93% Lean",          brand:"Generic",serving:"4 oz raw",         cal:170, pro:22, carb:0,  fat:9,  custom:false, tags:["lunch","dinner","meal-prep"] },
  { id:"sl_16", name:"Shrimp Cooked",                   brand:"Generic",serving:"4 oz",             cal:112, pro:24, carb:0,  fat:1,  custom:false, tags:["lunch","dinner","high-protein","quick"] },
  // Dairy
  { id:"sl_17", name:"1% Milk",                         brand:"Generic",serving:"1 cup",            cal:102, pro:8,  carb:13, fat:2.4,custom:false, tags:["breakfast","snack","quick"] },
  { id:"sl_18", name:"Reduced Fat Cheddar",             brand:"Generic",serving:"1 oz",             cal:70,  pro:7,  carb:0,  fat:4.5,custom:false, tags:["snack","lunch","dinner","quick"] },
  // Carbs / grains
  { id:"sl_19", name:"Oatmeal Dry",                     brand:"Generic",serving:"½ cup (40g)",      cal:150, pro:5,  carb:27, fat:3,  custom:false, tags:["breakfast","meal-prep"] },
  { id:"sl_20", name:"Brown Rice Cooked",               brand:"Generic",serving:"1 cup",            cal:215, pro:5,  carb:45, fat:2,  custom:false, tags:["lunch","dinner","meal-prep"] },
  { id:"sl_21", name:"Sweet Potato Medium",             brand:"Generic",serving:"1 medium",         cal:103, pro:2,  carb:24, fat:0,  custom:false, tags:["lunch","dinner","meal-prep"] },
  { id:"sl_22", name:"Whole Wheat Bread",               brand:"Generic",serving:"1 slice",          cal:80,  pro:4,  carb:15, fat:1,  custom:false, tags:["breakfast","lunch","quick"] },
  { id:"sl_23", name:"Banana Medium",                   brand:"Generic",serving:"1 medium",         cal:105, pro:1,  carb:27, fat:0,  custom:false, tags:["breakfast","snack","quick"] },
  { id:"sl_24", name:"Apple Medium",                    brand:"Generic",serving:"1 medium",         cal:95,  pro:0,  carb:25, fat:0,  custom:false, tags:["snack","quick"] },
  { id:"sl_25", name:"Blueberries",                     brand:"Generic",serving:"1 cup",            cal:84,  pro:1,  carb:21, fat:0,  custom:false, tags:["breakfast","snack","quick"] },
  // Fats / misc
  { id:"sl_26", name:"Almond Butter",                   brand:"Generic",serving:"1 tbsp",           cal:98,  pro:3,  carb:3,  fat:9,  custom:false, tags:["breakfast","snack","quick"] },
  { id:"sl_27", name:"Almonds",                         brand:"Generic",serving:"1 oz (23 nuts)",   cal:164, pro:6,  carb:6,  fat:14, custom:false, tags:["snack","quick"] },
  { id:"sl_28", name:"Avocado",                         brand:"Generic",serving:"½ medium",         cal:120, pro:1,  carb:6,  fat:11, custom:false, tags:["breakfast","lunch","snack","quick"] },
  { id:"sl_29", name:"Olive Oil",                       brand:"Generic",serving:"1 tbsp",           cal:119, pro:0,  carb:0,  fat:14, custom:false, tags:["lunch","dinner"] },
  { id:"sl_30", name:"Frank's RedHot Sauce",            brand:"Frank's",serving:"1 tsp",            cal:0,   pro:0,  carb:0,  fat:0,  custom:false, tags:["lunch","dinner","snack","quick"] },
  // Family Recipes
  { id:"sl_31", name:"Buffalo Dip",                     brand:"Custom", serving:"1 serving (of 8)", cal:128, pro:16, carb:2,  fat:6,  custom:true,  tags:["snack","lunch","high-protein","meal-prep"] },
  { id:"sl_32", name:"Janna's Meatloaf",                brand:"Custom", serving:"1 serving (of 8)", cal:233, pro:22, carb:8,  fat:13, custom:true,  tags:["dinner","lunch","meal-prep"] },
  { id:"sl_33", name:"Egg Role In Bowl",                brand:"Custom", serving:"1 serving (of 7)", cal:207, pro:19, carb:3,  fat:14, custom:true,  tags:["lunch","dinner","breakfast","meal-prep"] },
  { id:"sl_34", name:"Janna Sloppy Joe",                brand:"Custom", serving:"1 serving (of 12)",cal:117, pro:14, carb:5,  fat:6,  custom:true,  tags:["lunch","dinner","meal-prep"] },
  { id:"sl_35", name:"Chicken Nuggets Homemade",        brand:"Custom", serving:"1 nugget (of 43)", cal:48,  pro:6,  carb:0,  fat:3,  custom:true,  tags:["snack","lunch","meal-prep"] },
  { id:"sl_36", name:"Protein Yogurt Cheese Parfait",   brand:"Custom", serving:"1 serving (of 10)",cal:170, pro:28, carb:14, fat:2,  custom:true,  tags:["breakfast","snack","high-protein","meal-prep"] },
  { id:"sl_37", name:"High-Protein Greek Chicken Bowl", brand:"Custom", serving:"1 bowl",          cal:595, pro:84, carb:27, fat:14, custom:true,  tags:["lunch","dinner","high-protein","meal-prep"] },
  { id:"sl_38", name:"PB Protein Fluff Bowl",           brand:"Custom", serving:"1 bowl (~1 cup)", cal:408, pro:66, carb:33, fat:5,  custom:true,  tags:["breakfast","snack","high-protein","meal-prep"] },
];

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
// ─── SEED RECIPES ─────────────────────────────────────────────────────────────
const SEED_RECIPES = [
  {
    id:"sr_1", name:"Protein Fluff Bowl", description:"High-protein frozen yogurt bowl — sweet, creamy, macro-friendly",
    servings:1, source:"manual", tags:["breakfast","snack","high-protein","meal-prep"],
    ingredients:[
      {name:"Chobani Plain Greek Yogurt 0%",amount:"1",unit:"cup",cal:130,pro:22,carb:9,fat:0},
      {name:"Orgain Protein Powder",amount:"1",unit:"scoop",cal:150,pro:21,carb:15,fat:4},
      {name:"PB2 Peanut Butter Powder",amount:"2",unit:"tbsp",cal:45,pro:5,carb:5,fat:1.5},
      {name:"Frozen blueberries",amount:"¼",unit:"cup",cal:22,pro:0.3,carb:5.5,fat:0},
    ],
    total:{cal:347,pro:48,carb:34,fat:5.5},
    perServing:{cal:347,pro:48,carb:34,fat:5.5},
    createdAt:"2026-01-01T00:00:00.000Z",
  },
  {
    id:"sr_2", name:"Buffalo Chicken Dip", description:"Game day staple — high protein, low carb, meal preppable",
    servings:8, source:"manual", tags:["snack","lunch","high-protein","meal-prep"],
    ingredients:[
      {name:"Chicken breast cooked shredded",amount:"16",unit:"oz",cal:740,pro:140,carb:0,fat:16},
      {name:"Cream cheese reduced fat",amount:"8",unit:"oz",cal:480,pro:16,carb:8,fat:40},
      {name:"Frank's RedHot Sauce",amount:"½",unit:"cup",cal:0,pro:0,carb:0,fat:0},
      {name:"Ranch dressing",amount:"¼",unit:"cup",cal:220,pro:0,carb:4,fat:24},
      {name:"Reduced fat cheddar",amount:"1",unit:"cup",cal:320,pro:28,carb:0,fat:22},
    ],
    total:{cal:1760,pro:184,carb:12,fat:102},
    perServing:{cal:220,pro:23,carb:1.5,fat:12.8},
    createdAt:"2026-01-01T00:00:00.000Z",
  },
  {
    id:"sr_3", name:"Ranch Chicken Dip", description:"Creamy ranch version of the classic protein dip",
    servings:8, source:"manual", tags:["snack","lunch","high-protein","meal-prep"],
    ingredients:[
      {name:"Chicken breast cooked shredded",amount:"16",unit:"oz",cal:740,pro:140,carb:0,fat:16},
      {name:"Cream cheese reduced fat",amount:"8",unit:"oz",cal:480,pro:16,carb:8,fat:40},
      {name:"Ranch seasoning packet",amount:"1",unit:"packet",cal:20,pro:0,carb:4,fat:0},
      {name:"Reduced fat cheddar",amount:"1",unit:"cup",cal:320,pro:28,carb:0,fat:22},
    ],
    total:{cal:1560,pro:184,carb:12,fat:78},
    perServing:{cal:195,pro:23,carb:1.5,fat:9.8},
    createdAt:"2026-01-01T00:00:00.000Z",
  },
  {
    id:"sr_4", name:"Janna's Meatloaf", description:"Family meatloaf — freezes well, solid protein per serving",
    servings:8, source:"manual", tags:["dinner","lunch","meal-prep"],
    ingredients:[
      {name:"Ground beef 90% lean",amount:"2",unit:"lbs",cal:1440,pro:160,carb:0,fat:80},
      {name:"Egg whole",amount:"2",unit:"large",cal:140,pro:12,carb:0,fat:10},
      {name:"Breadcrumbs",amount:"½",unit:"cup",cal:210,pro:7,carb:39,fat:3},
      {name:"Milk 1%",amount:"¼",unit:"cup",cal:26,pro:2,carb:3,fat:0.6},
      {name:"Ketchup",amount:"¼",unit:"cup",cal:60,pro:0,carb:16,fat:0},
    ],
    total:{cal:1876,pro:181,carb:58,fat:93.6},
    perServing:{cal:235,pro:22.6,carb:7.3,fat:11.7},
    createdAt:"2026-01-01T00:00:00.000Z",
  },
  {
    id:"sr_5", name:"Egg Roll in a Bowl", description:"All the flavors, none of the wrapper — fast and low carb",
    servings:7, source:"manual", tags:["lunch","dinner","meal-prep"],
    ingredients:[
      {name:"Ground turkey 93% lean",amount:"1.5",unit:"lbs",cal:765,pro:99,carb:0,fat:40.5},
      {name:"Coleslaw mix",amount:"14",unit:"oz",cal:98,pro:4.2,carb:18.2,fat:0},
      {name:"Soy sauce low sodium",amount:"3",unit:"tbsp",cal:15,pro:2.1,carb:2.4,fat:0},
      {name:"Sesame oil",amount:"1",unit:"tbsp",cal:120,pro:0,carb:0,fat:14},
      {name:"Garlic",amount:"3",unit:"cloves",cal:12,pro:0.6,carb:3,fat:0},
    ],
    total:{cal:1010,pro:105.9,carb:23.6,fat:54.5},
    perServing:{cal:144,pro:15.1,carb:3.4,fat:7.8},
    createdAt:"2026-01-01T00:00:00.000Z",
  },
  {
    id:"sr_6", name:"High-Protein Waffles", description:"Weekend breakfast waffles — 18g protein per 2-waffle serving",
    servings:4, source:"manual", tags:["breakfast","meal-prep"],
    ingredients:[
      {name:"Cottage cheese 0%",amount:"1",unit:"cup",cal:180,pro:26,carb:10,fat:0},
      {name:"Egg whole",amount:"4",unit:"large",cal:280,pro:24,carb:0,fat:20},
      {name:"Oat flour",amount:"1",unit:"cup",cal:400,pro:14,carb:72,fat:8},
      {name:"Baking powder",amount:"1",unit:"tsp",cal:2,pro:0,carb:1,fat:0},
      {name:"Vanilla extract",amount:"1",unit:"tsp",cal:12,pro:0,carb:0.5,fat:0},
    ],
    total:{cal:874,pro:64,carb:83.5,fat:28},
    perServing:{cal:218,pro:16,carb:20.9,fat:7},
    createdAt:"2026-01-01T00:00:00.000Z",
  },
  {
    id:"sr_7", name:"PB Protein Fluff Bowl", description:"Thick peanut butter mousse — cottage cheese, Greek yogurt, Orgain, collagen, PB2, and egg whites blended smooth. 66g protein per bowl. GLP-1 friendly. Meal preps 4 servings, keeps 3 days.",
    servings:4, source:"manual", tags:["breakfast","snack","high-protein","meal-prep"],
    ingredients:[
      {name:"Cottage Cheese nonfat",       amount:"2",    unit:"cups",       cal:320, pro:52,  carb:28, fat:0},
      {name:"Greek Yogurt plain (Chobani)",amount:"1.5",  unit:"cups",       cal:270, pro:48,  carb:18, fat:0},
      {name:"PB2 Peanut Butter Powder",    amount:"8",    unit:"tbsp",       cal:240, pro:24,  carb:20, fat:6},
      {name:"Orgain Organic Protein Vanilla",amount:"6",  unit:"scoops",     cal:480, pro:63,  carb:60, fat:13.5},
      {name:"Collagen Peptides (Vital Proteins)",amount:"6",unit:"tbsp",     cal:210, pro:54,  carb:0,  fat:0},
      {name:"Liquid Egg Whites",           amount:"¾",    unit:"cup",        cal:78,  pro:20,  carb:1,  fat:0},
      {name:"2% Milk",                     amount:"6",    unit:"tbsp",       cal:28,  pro:2,   carb:3,  fat:1.5},
      {name:"Sugar-Free Maple Syrup",      amount:"2",    unit:"tsp",        cal:5,   pro:0,   carb:2,  fat:0},
    ],
    total:{cal:1631,pro:263,carb:132,fat:21},
    perServing:{cal:408,pro:65.8,carb:33,fat:5.3},
    createdAt:"2026-04-04T00:00:00.000Z",
  },
];

const DEF_USER = {
  name:"", sex:"male", age:"", weightLbs:"", heightFt:"5", heightIn:"10",
  activityLevel:"light",
  goal:{ primary:"", targetWeightLbs:"", targetWeeks:"", targetDate:"" },
  glp1:{ active:false, medication:"Zepbound", currentDose:"2.5mg", injectionDay:"Wednesday", startDate:"" },
  notifications:{ enabled:true, morningProtein:true, middayCheckin:true, eveningWarning:true,
    weightLog:true, hydration:true, injectionReminder:true, postInjection:true, doseEscalation:true },
  settings:{ displayMacros:["cal","pro","carb","fat"], sortFoodBy:"ratio" },
  preferences:[], createdAt:null,
};
const DEF_MACROS = { calories:1900, protein:170, carbs:160, fat:60, tdee:0 };
const DEF_LOG    = { breakfast:[], lunch:[], dinner:[], snacks:[] };

// water goal calc: base 0.5oz/lb + adjustments
const calcWaterGoal = (lbs, glp1Active) => {
  const base = Math.round((+lbs||180) * 0.5);
  const glp1Adj = glp1Active ? 20 : 0;
  const protAdj = 8;
  return Math.min(200, base + glp1Adj + protAdj);
};

// protein:calorie ratio score (g protein per 100 cal)
const ratioScore = f => f.cal > 0 ? Math.round((f.pro / f.cal) * 100) : 0;
const ratioLabel = s => s >= 15 ? {l:"Excellent",c:"#008F6B"} : s >= 10 ? {l:"Strong",c:"#0072BE"} : s >= 7 ? {l:"Good",c:"#B86E00"} : {l:"Low",c:"#C93535"};

// ─── TEST PROFILE (pre-filled for dev/testing) ────────────────────────────────
const TEST_PROFILE = {
  name:"Jon", sex:"male", age:38, weightLbs:244, heightFt:"5", heightIn:"10",
  activityLevel:"light",
  goal:{ primary:"fat_loss", targetWeightLbs:210, targetWeeks:24, targetDate:"2026-09-20", weeklyRate:1.4, deficit:650, startDate:new Date().toISOString() },
  glp1:{ active:true, medication:"Zepbound", currentDose:"5mg", injectionDay:"Wednesday", startDate:"2026-03-19" },
  notifications:{ enabled:true, morningProtein:true, middayCheckin:true, eveningWarning:true, weightLog:true, hydration:true, injectionReminder:true, postInjection:true, doseEscalation:true },
  settings:{ displayMacros:["cal","pro","carb","fat"], sortFoodBy:"ratio" },
  preferences:["High Protein","Meal Prep"],
  macros:{ calories:1900, protein:190, carbs:160, fat:58, tdee:2550 },
  createdAt:new Date().toISOString(),
};
const TEST_LOG = {
  breakfast:[
    { id:"sl_2", name:"Orgain Organic Protein Vanilla", brand:"Orgain", serving:"1 scoop (46g)", cal:150, pro:21, carb:15, fat:4, logId:"t1", addedAt:new Date().toISOString() },
    { id:"sl_1", name:"Chobani Plain Greek Yogurt 0%", brand:"Chobani", serving:"5.3 oz container", cal:90, pro:15, carb:6, fat:0, logId:"t2", addedAt:new Date().toISOString() },
  ],
  lunch:[
    { id:"sl_10", name:"Chicken Breast Cooked", brand:"Generic", serving:"4 oz", cal:185, pro:35, carb:0, fat:4, logId:"t3", addedAt:new Date().toISOString() },
    { id:"sl_20", name:"Brown Rice Cooked", brand:"Generic", serving:"1 cup", cal:215, pro:5, carb:45, fat:2, logId:"t4", addedAt:new Date().toISOString() },
  ],
  dinner:[], snacks:[],
};

const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate  = d => {
  const dt = new Date(d+"T12:00:00");
  const today = new Date(); today.setHours(12,0,0,0);
  const diff = Math.round((today-dt)/864e5);
  if(diff===0) return "Today";
  if(diff===1) return "Yesterday";
  return dt.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
};
const uid = () => Math.random().toString(36).slice(2,9);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const toIn    = (ft,i)       => parseInt(ft||5)*12+parseInt(i||10);
const calcBMR = (lbs,ins,age,sex) => { const kg=lbs*.453592,cm=ins*2.54,a=+age; return 10*kg+6.25*cm-5*a+(sex==="female"?-161:5); };
const calcTDEE= (bmr,act)    => Math.round(bmr*(ACTIVITIES.find(a=>a.id===act)?.mult??1.375));
const deriveMacros=(cal,prot,prefs=[])=>{
  const lc=prefs.includes("Low Carb"),cR=lc?.35:.55,rem=Math.max(0,cal-prot*4);
  return{calories:Math.round(cal),protein:Math.round(prot),carbs:Math.max(50,Math.round(rem*cR/4)),fat:Math.max(30,Math.round(rem*(1-cR)/9))};
};
const recMacros=(lbs,goal,tdee,prefs)=>{
  const w=+lbs||180;let cal,prot;
  switch(goal){
    case"fat_loss":  cal=Math.max(1500,tdee-600);prot=Math.round(w*.9);break;
    case"bulk":      cal=tdee+300;prot=Math.round(w*.9);break;
    case"muscle":    cal=tdee+200;prot=Math.round(w*1.0);break;
    case"recomp":    cal=tdee;prot=Math.round(w*1.1);break;
    case"maintain":  cal=tdee;prot=Math.round(w*.8);break;
    case"cholesterol":cal=tdee;prot=Math.round(w*.7);break;
    case"longevity": cal=tdee-100;prot=Math.round(w*.9);break;
    default:         cal=tdee;prot=Math.round(w*.75);
  }
  return deriveMacros(cal,prot,prefs);
};
const getWarnings=(m,lbs,goal,glp1)=>{
  const w=[],ppl=m.protein/(+lbs||180);
  if(m.calories<1400) w.push({l:"red",t:"Dangerously low calories. High muscle loss risk."});
  else if(m.calories<1600&&goal==="fat_loss") w.push({l:"amber",t:"Aggressive deficit. Keep protein high to protect lean mass."});
  if(ppl<0.7&&["fat_loss","recomp","muscle","transition"].includes(goal))
    w.push({l:"red",t:`Protein too low. Target ≥${Math.round((+lbs||180)*.7)}g to prevent muscle loss.`});
  else if(ppl>=0.85&&["fat_loss","muscle","recomp","transition"].includes(goal))
    w.push({l:"green",t:"✓ Strong protein target — lean mass well protected."});
  if(m.carbs<50) w.push({l:"amber",t:"Ketogenic range. Expect 2–4 week adaptation."});
  else if(m.carbs<100) w.push({l:"amber",t:"Low carbs may reduce training energy."});
  if(m.fat<30) w.push({l:"red",t:"Fat below 30g/day impairs hormone production."});
  if(glp1&&m.protein<150) w.push({l:"amber",t:"GLP-1 suppresses appetite. Prioritize protein first."});
  if(ppl>1.2) w.push({l:"amber",t:"Above 1.2g/lb offers diminishing returns."});
  if(!w.length){
    if(goal==="fat_loss") w.push({l:"green",t:"✓ Well-balanced fat loss setup."});
    else if(["muscle","bulk"].includes(goal)) w.push({l:"green",t:"✓ Solid muscle-building setup."});
    else w.push({l:"green",t:"✓ Balanced macro setup for your goal."});
  }
  return w.slice(0,2);
};
const rateInfo=r=>{
  if(!r||r<=0) return null;
  if(r<.5)  return{label:"Conservative",c:"#4A6FD4",msg:"Slow and sustainable. Minimal muscle loss risk."};
  if(r<=1)  return{label:"Recommended ✓",c:"#008F6B",msg:"Ideal pace. Sustainable with strong muscle preservation."};
  if(r<=1.5)return{label:"Moderate",c:"#B86E00",msg:"Achievable. High protein is critical at this rate."};
  if(r<=2)  return{label:"Aggressive 🟡",c:"#B86E00",msg:"Expect hunger and energy dips."};
  return     {label:"Too Fast ⚠️",c:"#C93535",msg:"Over 2 lbs/week risks muscle loss. Consider a longer timeframe."};
};
const sumMeals=(meals)=>{
  const all=Object.values(meals).flat();
  return{ cal:Math.round(all.reduce((s,i)=>s+i.cal,0)), pro:Math.round(all.reduce((s,i)=>s+i.pro,0)),
          carb:Math.round(all.reduce((s,i)=>s+i.carb,0)), fat:Math.round(all.reduce((s,i)=>s+i.fat,0)) };
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────
// DB imported from ./storage.js

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#EFF6FF;--sf:#FFFFFF;--sf2:#DDEEFF;--br:#B8D4EE;--acc:#008F6B;--acc2:#0072BE;--red:#C93535;--warn:#B86E00;--tx:#0C1829;--tx2:#3E5F80;--tx3:#88AECB;--pro:#008F6B;--car:#0072BE;--fat:#B86E00;--kcal:#C93535}
body{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
.app{max-width:430px;min-height:100vh;margin:0 auto;background:var(--bg);position:relative}

/* SPLASH */
.splash{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 28px;text-align:center;background:radial-gradient(ellipse at 50% 30%,#008F6B10 0%,transparent 65%)}
.logo{width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,var(--acc),var(--acc2));display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:28px;color:#09090E;margin-bottom:26px;box-shadow:0 0 44px #008F6B22}
.splash h1{font-family:'Syne',sans-serif;font-size:36px;font-weight:800;letter-spacing:-1.2px;margin-bottom:10px}
.splash h1 span{color:var(--acc)}.splash p{color:var(--tx2);font-size:15px;line-height:1.65;max-width:285px;margin-bottom:48px}

/* WIZARD */
.wiz-head{padding:52px 22px 18px;background:linear-gradient(180deg,var(--bg) 70%,transparent)}
.prog{display:flex;gap:5px;margin-bottom:20px}
.pd{height:3px;border-radius:2px;background:var(--br);flex:1;transition:background .3s}
.pd.done{background:var(--acc2)}.pd.act{background:var(--acc)}
.wiz-head h2{font-family:'Syne',sans-serif;font-size:23px;font-weight:800;letter-spacing:-.5px;margin-bottom:4px}
.wiz-head .sub{color:var(--tx2);font-size:13px}
.wiz-body{padding:8px 22px 120px}
.field{margin-bottom:16px}
.field label{display:block;font-size:11px;font-weight:600;color:var(--tx2);text-transform:uppercase;letter-spacing:.9px;margin-bottom:7px}
.field input,.field select{width:100%;background:var(--sf2);border:1.5px solid var(--br);border-radius:14px;padding:14px 16px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:16px;outline:none;transition:border-color .2s;-webkit-appearance:none}
.field input:focus,.field select:focus{border-color:var(--acc)}
.field input::placeholder{color:var(--tx3)}
.field select option{background:var(--sf2)}
.r2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.seg{display:flex;gap:7px;margin-bottom:16px}
.sb{flex:1;padding:13px 8px;border-radius:12px;border:1.5px solid var(--br);background:var(--sf2);color:var(--tx2);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all .15s;text-align:center}
.sb.on{background:#00E5A012;border-color:#00E5A040;color:var(--acc)}
.gg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.gc{background:var(--sf);border:1.5px solid var(--br);border-radius:16px;padding:16px 14px;cursor:pointer;transition:all .15s;-webkit-tap-highlight-color:transparent}
.gc.on{background:#00E5A00D;border-color:#00E5A040}
.gc .gi{font-size:22px;margin-bottom:8px}.gc .gl{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;margin-bottom:3px}.gc .gd{font-size:11px;color:var(--tx2);line-height:1.4}
.acts{display:flex;flex-direction:column;gap:9px}
.ac{background:var(--sf);border:1.5px solid var(--br);border-radius:14px;padding:15px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .15s}
.ac.on{background:#00E5A00D;border-color:#00E5A040}
.adot{width:18px;height:18px;border-radius:50%;border:2px solid var(--br);flex-shrink:0;transition:all .15s}
.ac.on .adot{background:var(--acc);border-color:var(--acc)}
.ainf{flex:1}.al{font-weight:500;font-size:14px;margin-bottom:2px}.ad{font-size:12px;color:var(--tx2)}
.tc{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;background:#00E5A012;color:var(--acc);border-radius:8px;padding:4px 10px;flex-shrink:0}
.mr{background:var(--sf2);border:1.5px solid var(--br);border-radius:14px;padding:15px;margin-bottom:10px}
.mrh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.mn{display:flex;align-items:center;gap:8px;font-weight:500;font-size:14px}
.mdo{width:9px;height:9px;border-radius:50%}
.mv{font-family:'Syne',sans-serif;font-weight:800;font-size:20px}.mu{font-size:11px;color:var(--tx2);margin-left:2px}
.ab{font-size:10px;color:var(--tx2);background:var(--br);border-radius:6px;padding:2px 6px;font-style:italic;margin-left:6px}
input[type=range]{width:100%;-webkit-appearance:none;height:5px;border-radius:3px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 8px #0005;cursor:pointer}
.lb{height:5px;border-radius:3px;background:var(--br);overflow:hidden}
.lf{height:100%;border-radius:3px;transition:width .4s}
.wl{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.wi{border-radius:12px;padding:12px 14px;font-size:13px;line-height:1.5;border:1.5px solid}
.wred{background:#C935350E;border-color:#C9353530;color:#C93535}
.wamb{background:#B86E000E;border-color:#B86E0030;color:#B86E00}
.wgrn{background:#008F6B0E;border-color:#008F6B30;color:var(--acc)}
.rc{border-radius:14px;padding:15px;border:1.5px solid;margin-top:12px}
.rl{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:4px}.rm{font-size:13px;color:var(--tx2);line-height:1.5}
.ps{background:var(--sf);border:1.5px solid var(--br);border-radius:16px;padding:18px;margin-top:12px}
.pt{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--acc2);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.pr{display:flex;justify-content:space-between;font-size:13px;margin-bottom:7px}
.pk{color:var(--tx2)}.pv{font-weight:600}
.gc2{background:linear-gradient(135deg,#00E5A008,#00B8FF08);border:1.5px solid #00B8FF22;border-radius:16px;padding:18px;margin-top:14px}
.gt{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--acc2);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.ic{background:var(--sf);border:1.5px solid var(--br);border-radius:16px;padding:18px}
.ii{font-size:28px;margin-bottom:10px}.it{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:8px}.ib{font-size:13px;color:var(--tx2);line-height:1.65}
.ibul{list-style:none;display:flex;flex-direction:column;gap:7px;margin-top:10px}
.ibul li{font-size:13px;color:var(--tx2);padding-left:16px;position:relative;line-height:1.5}
.ibul li::before{content:"→";position:absolute;left:0;color:var(--acc);font-size:11px;top:1px}
.nl{display:flex;flex-direction:column;gap:8px}
.nr{background:var(--sf);border:1.5px solid var(--br);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px}
.nr.g2{border-color:#00B8FF1A;background:#00B8FF06}
.nt{flex:1}.ntl{font-size:14px;font-weight:500;margin-bottom:2px}.nts{font-size:11px;color:var(--tx2)}
.tog{width:44px;height:26px;border-radius:13px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
.tog.on{background:var(--acc)}.tog.off{background:var(--br)}
.tog::after{content:"";position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s}
.tog.on::after{left:21px}.tog.off::after{left:3px}
.pg{display:flex;flex-wrap:wrap;gap:8px}
.pc{padding:10px 16px;border-radius:100px;border:1.5px solid var(--br);background:var(--sf2);color:var(--tx2);font-size:13px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.pc.on{background:#00E5A012;border-color:#00E5A040;color:var(--acc)}
.foot{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;padding:14px 22px 32px;background:linear-gradient(0deg,var(--bg) 55%,transparent);display:flex;gap:10px;z-index:20}
.btn{flex:1;padding:17px;border-radius:16px;border:none;font-family:'Syne',sans-serif;font-weight:700;font-size:15px;cursor:pointer;transition:all .15s}
.btnp{background:var(--acc);color:#fff;box-shadow:0 4px 18px #008F6B30}
.btnp:active{transform:scale(.97)}.btnp:disabled{opacity:.3;cursor:not-allowed}
.btng{background:var(--sf2);color:var(--tx2);border:1.5px solid var(--br)}

/* ── BOTTOM TAB BAR ── */
.tabbar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;
  background:var(--sf);border-top:1px solid var(--br);display:flex;z-index:30;padding-bottom:env(safe-area-inset-bottom)}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:12px 0 10px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .15s}
.tab .ti{font-size:20px;margin-bottom:3px;transition:transform .15s}
.tab.active .ti{transform:scale(1.1)}
.tab .tl{font-size:10px;font-weight:600;font-family:'Syne',sans-serif;letter-spacing:.5px;text-transform:uppercase}
.tab{color:var(--tx3)}.tab.active{color:var(--acc)}

/* ── HOME SCREEN ── */
.home{padding:52px 20px 90px;background:radial-gradient(ellipse at 50% 0%,#008F6B07 0%,transparent 55%)}
.dg .dsub{color:var(--tx2);font-size:12px;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:5px}
.dg h2{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;letter-spacing:-.5px;margin-bottom:20px}
.dg h2 span{color:var(--acc)}
.card{background:var(--sf);border:1.5px solid var(--br);border-radius:20px;padding:20px;margin-bottom:12px}
.ctitle{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--tx2);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:14px;display:flex;align-items:center;gap:6px}
.cbadge{margin-left:auto;background:var(--sf2);border-radius:6px;padding:2px 8px;font-size:11px;color:var(--acc);font-weight:600}

/* MACRO RING */
.ring-wrap{display:flex;align-items:center;gap:18px}
.rw{position:relative;width:110px;height:110px;flex-shrink:0}
.rw svg{transform:rotate(-90deg)}
.rcc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.kcal-num{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--kcal)}
.kcal-lbl{font-size:10px;color:var(--tx2)}
.macro-bars{flex:1;display:flex;flex-direction:column;gap:10px}
.mbar-row{display:flex;align-items:center;gap:8px}
.mbar-lbl{font-size:12px;color:var(--tx2);width:50px}
.mbar-track{flex:1;height:6px;background:var(--br);border-radius:3px;overflow:hidden}
.mbar-fill{height:100%;border-radius:3px;transition:width .5s ease}
.mbar-val{font-size:12px;font-weight:600;width:48px;text-align:right}

/* REMAIN CARD */
.remain-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.rem-cell{background:var(--sf2);border-radius:12px;padding:10px 6px;text-align:center}
.rem-val{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:2px}
.rem-lbl{font-size:10px;color:var(--tx2)}
.rem-over{color:var(--red)!important}

/* STATS */
.s2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.sm{background:var(--sf);border:1.5px solid var(--br);border-radius:16px;padding:16px}
.smi{font-size:18px;margin-bottom:8px}.smv{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin-bottom:2px}.sml{font-size:11px;color:var(--tx2)}

/* GLP1 DASH */
.gd2{background:linear-gradient(135deg,#00B8FF08,#00E5A008);border:1.5px solid #00B8FF22;border-radius:20px;padding:20px;margin-bottom:12px}
.gdt{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--acc2);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px}
.gds{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.gdsv{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:var(--acc2);margin-bottom:2px}.gdsk{font-size:10px;color:var(--tx2)}

/* HOME ACTIONS */
.das{display:flex;gap:10px;margin-top:8px}
.dab{flex:1;padding:14px;border-radius:14px;border:1.5px solid var(--br);background:var(--sf2);color:var(--tx2);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:all .15s}
.dab.p{background:#00E5A012;border-color:#00E5A035;color:var(--acc);font-weight:600}

/* ── LOG SCREEN ── */
.logscreen{padding:0 0 90px}
.log-header{padding:52px 20px 0;background:var(--bg);position:sticky;top:0;z-index:15;backdrop-filter:blur(10px)}
.date-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.date-nav-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--br);background:var(--sf2);color:var(--tx2);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.date-nav-btn:disabled{opacity:.25;cursor:not-allowed}
.date-center{text-align:center}
.date-label{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;letter-spacing:-.3px}
.date-sub{font-size:12px;color:var(--tx2);margin-top:2px}
.log-macro-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:0 20px 14px}
.strip-cell{background:var(--sf2);border-radius:12px;padding:9px 6px;text-align:center;position:relative;overflow:hidden}
.strip-progress{position:absolute;bottom:0;left:0;height:3px;border-radius:0 0 0 0;transition:width .4s ease}
.strip-val{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;margin-bottom:1px}
.strip-lbl{font-size:10px;color:var(--tx2)}
.strip-pct{font-size:9px;margin-top:1px}
.log-body{padding:0 20px}

/* MEAL SECTION */
.meal-section{margin-bottom:14px}
.meal-head{display:flex;align-items:center;justify-content:space-between;padding:0 2px;margin-bottom:8px}
.meal-title{display:flex;align-items:center;gap:8px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700}
.meal-cals{font-size:12px;color:var(--tx2)}
.add-btn{width:30px;height:30px;border-radius:9px;border:1.5px solid var(--br);background:var(--sf2);color:var(--acc);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;line-height:1}
.add-btn:active{transform:scale(.9)}
.food-item{background:var(--sf);border:1.5px solid var(--br);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:6px}
.fi-name{flex:1;min-width:0}
.fi-title{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
.fi-sub{font-size:11px;color:var(--tx2)}
.fi-macros{display:flex;gap:8px;flex-shrink:0;align-items:center}
.fi-mac{font-size:11px;font-weight:600}
.fi-cal{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--kcal);width:36px;text-align:right}
.fi-del{width:28px;height:28px;border-radius:8px;border:none;background:transparent;color:var(--tx3);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .15s;flex-shrink:0}
.fi-del:active{color:var(--red)}
/* ── BACK NAV ── */
.back-btn{display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--tx2);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent}
.back-btn:active{opacity:.6}
.log-top-bar{display:flex;align-items:center;justify-content:space-between;padding:52px 20px 10px}
.log-top-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;letter-spacing:-.3px}
/* ── SHEET CLOSE ── */
.sheet-close{position:absolute;top:20px;right:20px;width:32px;height:32px;border-radius:50%;border:1.5px solid var(--br);background:var(--sf2);color:var(--tx2);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.sheet-header{position:relative}
/* ── RECOMMENDED FOOD STATE ── */
.food-item.recommended{opacity:.55;border-style:dashed}
.food-item.recommended .fi-title{font-style:italic}
.rec-badge{font-size:9px;color:var(--acc2);background:#00B8FF12;border-radius:4px;padding:1px 5px;margin-left:6px;font-style:normal;font-weight:600}
/* ── AUTO-FILL ── */
.autofill-btn{width:100%;padding:14px;border-radius:14px;border:1.5px solid #00E5A030;background:#00E5A00A;color:var(--acc);font-family:'Syne',sans-serif;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:14px;transition:all .15s}
.autofill-btn:active{transform:scale(.98)}
/* ── AUTOFILL PREVIEW MODAL ── */
.preview-sheet{background:var(--sf);border-radius:24px 24px 0 0;border:1.5px solid var(--br);width:100%;max-width:430px;margin:0 auto;max-height:88vh;display:flex;flex-direction:column;animation:su .25s ease}
.preview-head{padding:20px 20px 0;flex-shrink:0;position:relative}
.preview-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;margin-bottom:4px}
.preview-sub{font-size:13px;color:var(--tx2);margin-bottom:14px;line-height:1.5}
.preview-body{overflow-y:auto;padding:0 20px;flex:1}
.preview-meal{margin-bottom:16px}
.preview-meal-title{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--tx2);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.preview-item{background:var(--sf2);border:1.5px dashed var(--br);border-radius:12px;padding:11px 14px;display:flex;align-items:center;gap:10px;margin-bottom:6px}
.preview-item-name{flex:1;font-size:13px;font-weight:500}
.preview-item-macs{font-size:11px;color:var(--tx2)}
.preview-item-cal{font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:var(--kcal);min-width:32px;text-align:right}
.preview-totals{background:linear-gradient(135deg,#00E5A008,#00B8FF08);border:1.5px solid #00E5A025;border-radius:14px;padding:14px;margin-bottom:16px}
.preview-totals-title{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--acc);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.preview-totals-row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px}
.preview-foot{padding:14px 20px 32px;display:flex;gap:10px;flex-shrink:0;border-top:1px solid var(--br)}

/* ── WATER TRACKER (pinned) ── */
.water-bar{position:fixed;bottom:57px;left:50%;transform:translateX(-50%);width:100%;max-width:430px;
  background:var(--sf);border-top:1px solid var(--br);padding:10px 16px;z-index:25;
  display:flex;align-items:center;gap:10px}
.water-icon{font-size:18px;flex-shrink:0}
.water-track{flex:1;height:6px;background:var(--br);border-radius:3px;overflow:hidden}
.water-fill{height:100%;border-radius:3px;transition:width .4s ease}
.water-label{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;white-space:nowrap;min-width:70px;text-align:right}
.water-btns{display:flex;gap:5px}
.water-btn{padding:5px 8px;border-radius:8px;border:1.5px solid var(--br);background:var(--sf2);
  color:var(--acc2);font-size:11px;font-weight:600;cursor:pointer;font-family:'Syne',sans-serif;
  white-space:nowrap}
.water-btn:active{transform:scale(.95)}

/* ── RECIPES TAB ── */
.recipes-screen{padding:0 0 110px}
.recipes-top{display:flex;align-items:center;justify-content:space-between;padding:52px 20px 14px}
.recipes-top h2{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.5px}
.recipe-new-btn{padding:9px 16px;border-radius:100px;border:none;background:var(--acc);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer}
.recipe-search{margin:0 20px 14px;background:var(--sf2);border:1.5px solid var(--br);border-radius:14px;padding:11px 16px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;width:calc(100% - 40px)}
.recipe-search:focus{border-color:var(--acc)}
.recipe-search::placeholder{color:var(--tx3)}
.recipe-list{padding:0 20px}
.recipe-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid var(--br);
  cursor:pointer;-webkit-tap-highlight-color:transparent;transition:opacity .1s}
.recipe-row:last-child{border-bottom:none}
.recipe-row:active{opacity:.6}
.recipe-row-left{flex:1;min-width:0}
.recipe-card-name{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}
.recipe-card-source{font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;flex-shrink:0}
.source-manual{background:var(--sf2);color:var(--tx3);border:1px solid var(--br)}
.source-claude{background:#0072BE12;color:var(--acc2);border:1px solid #0072BE20}
.source-photo{background:#B86E0012;color:var(--warn);border:1px solid #B86E0020}
.recipe-row-right{display:flex;align-items:center;gap:6px;flex-shrink:0}
.recipe-mac{font-size:11px;font-weight:700}
.recipe-cal{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--kcal);min-width:34px;text-align:right}
.recipe-chevron{font-size:14px;color:var(--tx3);margin-left:2px}
/* kept for detail view compat */
.recipe-card-macros{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
/* recipe detail */
.recipe-detail{padding:0 0 110px}
.recipe-detail-head{padding:52px 20px 0}
.recipe-back{display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--tx2);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;padding:0;margin-bottom:14px}
.recipe-detail-name{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.4px;margin-bottom:4px}
.recipe-detail-desc{font-size:13px;color:var(--tx2);margin-bottom:16px;line-height:1.5}
.recipe-macro-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
.recipe-mac-cell{background:var(--sf2);border-radius:12px;padding:10px 6px;text-align:center}
.recipe-mac-val{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;margin-bottom:2px}
.recipe-mac-lbl{font-size:10px;color:var(--tx2)}
.scaler-row{display:flex;align-items:center;gap:12px;background:var(--sf);border:1.5px solid var(--br);border-radius:14px;padding:13px 16px;margin-bottom:16px}
.scaler-lbl{font-size:13px;color:var(--tx2);flex:1}
.scaler-val{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--acc);min-width:28px;text-align:center}
.scaler-btn{width:32px;height:32px;border-radius:10px;border:1.5px solid var(--br);background:var(--sf2);color:var(--tx);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}
.scaler-btn:active{transform:scale(.9)}
.ing-list{padding:0 20px}
.ing-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--br)}
.ing-item:last-child{border-bottom:none}
.ing-name{flex:1;font-size:13px}
.ing-amount{font-size:11px;color:var(--tx2);flex-shrink:0}
.ing-cal{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--kcal);flex-shrink:0;min-width:32px;text-align:right}
.log-recipe-btn{position:sticky;bottom:68px;margin:14px 20px 0;width:calc(100% - 40px);padding:16px;border-radius:16px;border:none;background:var(--acc);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 4px 20px #008F6B30}
.log-recipe-btn:active{transform:scale(.98)}
/* create flow */
.create-screen{padding:52px 20px 110px}
.create-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
.create-method-card{background:var(--sf);border:1.5px solid var(--br);border-radius:16px;padding:20px 16px;cursor:pointer;transition:all .15s;text-align:center}
.create-method-card:hover{border-color:var(--acc)}
.create-method-card.photo-card:hover{border-color:var(--warn)}
.create-method-icon{font-size:28px;margin-bottom:10px}
.create-method-label{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;margin-bottom:4px}
.create-method-sub{font-size:11px;color:var(--tx2);line-height:1.4}
.claude-prompt-area{width:100%;background:var(--sf2);border:1.5px solid var(--br);border-radius:14px;padding:14px 16px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;resize:none;min-height:100px;line-height:1.6;-webkit-appearance:none}
.claude-prompt-area:focus{border-color:var(--acc)}
.claude-prompt-area::placeholder{color:var(--tx3)}
.generate-btn{width:100%;padding:16px;border-radius:14px;border:none;background:var(--acc);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:15px;cursor:pointer;margin-top:12px}
.generate-btn:disabled{opacity:.35;cursor:not-allowed}
.draft-card{background:var(--sf);border:1.5px solid #00E5A030;border-radius:16px;padding:18px;margin-top:16px}
.draft-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:6px}
.draft-desc{font-size:13px;color:var(--tx2);margin-bottom:12px;line-height:1.5}
.draft-ing{font-size:12px;color:var(--tx2);padding:6px 0;border-bottom:1px solid var(--br);display:flex;justify-content:space-between}
.draft-ing:last-child{border-bottom:none}
.save-recipe-btn{width:100%;padding:15px;border-radius:14px;border:none;background:var(--acc);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;cursor:pointer;margin-top:14px}
.rfield{margin-bottom:14px}
.rfield label{display:block;font-size:11px;font-weight:600;color:var(--tx2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
.rfield input,.rfield select,.rfield textarea{width:100%;background:var(--sf2);border:1.5px solid var(--br);border-radius:12px;padding:12px 14px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;-webkit-appearance:none}
.rfield input:focus,.rfield select:focus,.rfield textarea:focus{border-color:var(--acc)}
.rfield input::placeholder,.rfield textarea::placeholder{color:var(--tx3)}
.rfield textarea{resize:vertical;min-height:60px}
.r2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.add-ing-btn{width:100%;padding:12px;border-radius:12px;border:1.5px dashed var(--br);background:transparent;color:var(--acc);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;margin-top:4px}
.ing-chip{background:var(--sf2);border:1.5px solid var(--br);border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:8px;margin-bottom:6px}
.ing-chip-name{flex:1;font-size:12px}
.ing-chip-macs{font-size:10px;color:var(--tx2)}
.ing-chip-del{background:none;border:none;color:var(--tx3);font-size:13px;cursor:pointer;padding:0;flex-shrink:0}
.tag-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.tag-chip{padding:6px 12px;border-radius:100px;border:1.5px solid var(--br);background:var(--sf2);color:var(--tx2);font-size:12px;cursor:pointer;transition:all .15s}
.tag-chip.on{border-color:var(--acc);color:var(--acc);background:#00E5A010}
/* recipe log quick bar */
.recipe-log-bar{background:linear-gradient(135deg,#00E5A008,#00B8FF05);border:1.5px solid #00E5A025;border-radius:14px;padding:12px 16px;margin:14px 20px 0;display:flex;align-items:center;gap:10px;cursor:pointer;transition:border-color .15s}
.recipe-log-bar:active{border-color:var(--acc)}

/* ── BODY / WEIGHT SCREEN ── */
.body-screen{padding:0 0 110px}
.body-top{padding:52px 20px 0}
.body-top h2{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.5px;margin-bottom:3px}
.body-top-sub{font-size:13px;color:var(--tx2);margin-bottom:18px}
.body-section{padding:0 20px 14px}
.weight-input{flex:1;min-width:0;background:var(--sf2);border:1.5px solid var(--br);border-radius:12px;
  padding:11px 14px;color:var(--tx);font-family:'Syne',sans-serif;
  font-size:22px;font-weight:800;outline:none;-webkit-appearance:none;transition:border-color .15s}
.weight-input:focus{border-color:var(--acc)}
.weight-input::placeholder{color:var(--tx3);font-weight:400;font-size:16px}
.weight-log-btn{padding:11px 20px;border-radius:12px;border:none;font-family:'Syne',sans-serif;
  font-weight:700;font-size:14px;cursor:pointer;transition:all .15s;white-space:nowrap;flex-shrink:0}
.weight-log-btn:active{transform:scale(.97)}
.progress-bar-track{background:var(--br);border-radius:6px;height:10px;margin-bottom:12px;overflow:hidden}
.progress-bar-fill{height:100%;border-radius:6px;background:linear-gradient(90deg,var(--acc2),var(--acc));transition:width .6s ease}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.stat-cell{background:var(--sf2);border-radius:12px;padding:12px 14px}
.stat-val{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:3px}
.stat-lbl{font-size:11px;color:var(--tx3)}
.plateau-card{background:#FFB34710;border:1.5px solid #FFB34730;border-radius:14px;
  padding:13px 16px;display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}
.weight-today-confirmed{margin-top:8px;font-size:12px;color:var(--acc);display:flex;align-items:center;gap:8px}
.chart-legend{display:flex;gap:14px;font-size:10px;color:var(--tx2);flex-wrap:wrap}
.legend-dot{width:14px;height:2px;border-radius:1px;display:inline-block;vertical-align:middle;margin-right:3px}

/* ── SUPPLEMENTS ── */
.supp-section-title{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--tx2);
  text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px}
.supp-item{background:var(--sf);border:1.5px solid var(--br);border-radius:14px;
  padding:13px 14px;display:flex;align-items:center;gap:12px;margin-bottom:8px;transition:border-color .15s}
.supp-item.done{border-color:#00E5A025;background:#00E5A005}
.supp-check{width:28px;height:28px;border-radius:50%;border:2px solid var(--br);
  background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;
  font-size:14px;transition:all .15s;flex-shrink:0}
.supp-check.done{background:var(--acc);border-color:var(--acc);color:#fff}
.supp-info{flex:1;min-width:0}
.supp-name{font-size:14px;font-weight:500;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.supp-meta{font-size:11px;color:var(--tx2)}
.supp-del{background:none;border:none;color:var(--tx3);font-size:15px;cursor:pointer;
  padding:4px;flex-shrink:0;transition:color .15s}
.supp-del:hover{color:var(--red)}
.supp-add-form{background:var(--sf2);border:1.5px dashed var(--br);border-radius:14px;padding:14px;margin-top:4px}
.supp-add-title{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;margin-bottom:10px;color:var(--acc)}
.supp-form-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.supp-input{width:100%;background:var(--sf);border:1.5px solid var(--br);border-radius:10px;
  padding:10px 12px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:13px;
  outline:none;-webkit-appearance:none;transition:border-color .15s}
.supp-input:focus{border-color:var(--acc)}
.supp-input::placeholder{color:var(--tx3)}
.supp-save-btn{width:100%;padding:11px;border-radius:10px;border:none;background:var(--acc);
  color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;margin-top:4px}
.supp-save-btn:disabled{opacity:.3;cursor:not-allowed}
.supp-add-trigger{width:100%;padding:12px;border-radius:12px;border:1.5px dashed var(--br);
  background:transparent;color:var(--acc);font-family:'DM Sans',sans-serif;
  font-size:13px;cursor:pointer;margin-top:6px;transition:border-color .15s}
.supp-add-trigger:hover{border-color:var(--acc)}

/* supplement settings management rows */
.supp-mgmt-item{background:var(--sf);border:1.5px solid var(--br);border-radius:14px;
  margin-bottom:8px;overflow:hidden;transition:border-color .15s}
.supp-mgmt-item.editing{border-color:var(--acc)}
.supp-mgmt-row{display:flex;align-items:center;gap:10px;padding:13px 14px}
.supp-mgmt-info{flex:1;min-width:0}
.supp-mgmt-name{font-size:14px;font-weight:500;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.supp-mgmt-meta{font-size:11px;color:var(--tx2)}
.supp-mgmt-note{font-size:11px;color:var(--tx3);margin-top:1px;font-style:italic}
.supp-mgmt-actions{display:flex;gap:6px;flex-shrink:0}
.supp-edit-btn{width:28px;height:28px;border-radius:8px;border:1.5px solid var(--br);
  background:var(--sf2);color:var(--tx2);font-size:12px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;transition:all .15s}
.supp-edit-btn:hover{border-color:var(--acc);color:var(--acc)}
.supp-edit-form{padding:0 14px 14px;display:flex;flex-direction:column;gap:8px}
.supp-edit-label{font-size:10px;font-weight:700;color:var(--tx2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
.supp-notes-input{width:100%;background:var(--sf2);border:1.5px solid var(--br);border-radius:10px;
  padding:9px 12px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:13px;
  outline:none;resize:none;min-height:50px;-webkit-appearance:none}
.supp-notes-input:focus{border-color:var(--acc)}
.supp-notes-input::placeholder{color:var(--tx3)}
.supp-edit-actions{display:flex;gap:8px;margin-top:2px}
.supp-edit-save{flex:2;padding:10px;border-radius:10px;border:none;background:var(--acc);
  color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer}
.supp-edit-cancel{flex:1;padding:10px;border-radius:10px;border:1.5px solid var(--br);
  background:transparent;color:var(--tx2);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer}
/* supplement bar on log screen */
.supp-log-bar{background:linear-gradient(135deg,#00B8FF08,#6B8AFF05);border:1.5px solid #00B8FF20;
  border-radius:14px;padding:12px 14px;margin:10px 20px 0}
.supp-log-bar-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.supp-log-bar-title{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--acc2);flex:1}
.supp-log-bar-count{font-size:11px;color:var(--tx2)}
.supp-log-chips{display:flex;flex-direction:column;gap:6px}
.supp-log-chip{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;
  background:var(--sf);border:1.5px solid var(--br);cursor:pointer;transition:all .15s}
.supp-log-chip.done{background:#00E5A008;border-color:#00E5A025}
.supp-chip-check{width:22px;height:22px;border-radius:50%;border:2px solid var(--br);
  display:flex;align-items:center;justify-content:center;font-size:11px;
  flex-shrink:0;transition:all .15s;background:transparent}
.supp-chip-check.done{background:var(--acc);border-color:var(--acc);color:#fff}
.supp-chip-label{flex:1;font-size:13px;font-weight:500}
.supp-chip-meta{font-size:11px;color:var(--tx2);flex-shrink:0}

/* ── RATIO BADGE ── */
.ratio-badge{font-size:9px;font-weight:700;border-radius:5px;padding:2px 5px;margin-left:5px;flex-shrink:0}

/* ── PROTEIN NUDGE ── */
.nudge-card{background:linear-gradient(135deg,#00E5A010,#00B8FF08);border:1.5px solid #00E5A030;
  border-radius:16px;padding:14px 16px;margin-bottom:12px;display:flex;align-items:center;gap:12px}
.nudge-icon{font-size:22px;flex-shrink:0}
.nudge-text{flex:1}
.nudge-title{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;margin-bottom:3px;color:var(--acc)}
.nudge-body{font-size:12px;color:var(--tx2);line-height:1.4}
.nudge-action{font-size:12px;color:var(--acc);font-weight:600;cursor:pointer;flex-shrink:0}

/* ── STREAKS ── */
.streak-row{display:flex;gap:8px;flex-wrap:wrap}
.streak-badge{display:flex;flex-direction:column;align-items:center;flex:1;min-width:60px;
  background:var(--sf2);border:1.5px solid var(--br);border-radius:14px;padding:10px 6px;
  transition:border-color .15s}
.streak-badge.alive{border-color:#FFB34740;background:#FFB34708}
.streak-badge.zero{opacity:.45}
.streak-flame{font-size:20px;margin-bottom:3px}
.streak-count{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;line-height:1;margin-bottom:2px}
.streak-label{font-size:9px;font-weight:600;color:var(--tx2);text-transform:uppercase;letter-spacing:.7px;text-align:center;line-height:1.3}

/* ── DAILY DEBRIEF ── */
.debrief-card{background:linear-gradient(135deg,#0072BE08,#008F6B06);border:1.5px solid #0072BE20;border-radius:20px;padding:20px;margin-bottom:12px}
.debrief-trigger{width:100%;padding:13px;border-radius:12px;border:1.5px solid #0072BE30;
  background:#0072BE08;color:var(--acc2);font-family:'Syne',sans-serif;font-weight:700;
  font-size:14px;cursor:pointer;transition:all .15s}
.debrief-trigger:active{transform:scale(.97)}
.debrief-trigger:disabled{opacity:.4;cursor:not-allowed}
.debrief-text{font-size:13px;color:var(--tx);line-height:1.7;margin-top:12px}
.debrief-regen{font-size:11px;color:var(--acc2);cursor:pointer;margin-top:8px;display:inline-block;font-weight:600}

/* ── WEEKLY CHECK-IN ── */
.checkin-card{background:linear-gradient(135deg,#008F6B08,#0072BE05);border:1.5px solid #008F6B20;border-radius:20px;padding:20px;margin-bottom:12px}
.checkin-trigger{width:100%;padding:13px;border-radius:12px;border:1.5px solid #008F6B30;
  background:#008F6B08;color:var(--acc);font-family:'Syne',sans-serif;font-weight:700;
  font-size:14px;cursor:pointer;transition:all .15s}
.checkin-trigger:disabled{opacity:.4;cursor:not-allowed}
.checkin-text{font-size:13px;color:var(--tx);line-height:1.7;margin-top:12px}
.checkin-meta{font-size:11px;color:var(--tx3);margin-top:8px}
.checkin-regen{font-size:11px;color:var(--acc);cursor:pointer;margin-top:6px;display:inline-block;font-weight:600}

/* ── GROCERY LIST MODAL ── */
.grocery-sheet{background:var(--sf);border-radius:24px 24px 0 0;border:1.5px solid var(--br);
  width:100%;max-width:430px;margin:0 auto;max-height:88vh;
  display:flex;flex-direction:column;animation:su .25s ease}
.grocery-head{padding:20px 20px 14px;flex-shrink:0;border-bottom:1px solid var(--br)}
.grocery-body{flex:1;overflow-y:auto;padding:16px 20px}
.grocery-category{margin-bottom:18px}
.grocery-cat-title{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;
  color:var(--tx2);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px}
.grocery-item{display:flex;align-items:center;gap:10px;padding:9px 0;
  border-bottom:1px solid var(--br);font-size:13px}
.grocery-item:last-child{border-bottom:none}
.grocery-item-name{flex:1}
.grocery-item-detail{font-size:11px;color:var(--tx3);flex-shrink:0}
.grocery-foot{padding:14px 20px 28px;flex-shrink:0;border-top:1px solid var(--br)}
.grocery-copy-btn{width:100%;padding:14px;border-radius:14px;border:none;
  background:var(--acc);color:#fff;font-family:'Syne',sans-serif;
  font-weight:700;font-size:14px;cursor:pointer}
.grocery-copy-btn.copied{background:var(--acc2)}

/* ── RECENT MEALS ── */
.recent-row{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px;margin-bottom:4px}
.recent-row::-webkit-scrollbar{display:none}
.recent-chip{flex-shrink:0;background:var(--sf2);border:1.5px solid var(--br);border-radius:12px;
  padding:10px 12px;cursor:pointer;transition:all .15s;min-width:110px}
.recent-chip:active{border-color:var(--acc)}
.rc-name{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;max-width:100px}
.rc-macs{font-size:10px;color:var(--tx2)}
.rc-cal{font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:var(--kcal)}

/* ── MEAL COMPLETE ── */
.complete-btn{padding:8px 14px;border-radius:10px;border:1.5px solid var(--br);background:var(--sf2);
  color:var(--tx2);font-size:12px;font-weight:600;cursor:pointer;font-family:'Syne',sans-serif;
  transition:all .15s;white-space:nowrap}
.complete-btn.done{background:#00E5A010;border-color:#00E5A035;color:var(--acc)}
.complete-btn.loading{opacity:.5;cursor:not-allowed}
.analysis-card{background:var(--sf2);border:1.5px solid var(--br);border-radius:14px;
  padding:13px 14px;margin-top:8px;margin-bottom:4px}
.analysis-text{font-size:13px;color:var(--tx);line-height:1.6}
.analysis-toggle{font-size:11px;color:var(--acc);cursor:pointer;margin-top:6px;display:inline-block}

/* ── SETTINGS SCREEN ── */
.settings-screen{padding:52px 20px 110px}
.settings-screen h2{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;letter-spacing:-.5px;margin-bottom:24px}
.settings-section{margin-bottom:24px}
.settings-section-title{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--tx2);
  text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px}
.settings-row{background:var(--sf);border:1.5px solid var(--br);border-radius:14px;
  padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:8px}
.settings-row-text{flex:1}
.settings-row-label{font-size:14px;font-weight:500;margin-bottom:2px}
.settings-row-sub{font-size:12px;color:var(--tx2)}
.macro-toggle-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.mac-tog{padding:8px 14px;border-radius:100px;border:1.5px solid var(--br);background:var(--sf2);
  color:var(--tx2);font-size:13px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.mac-tog.on{border-color:var(--acc);color:var(--acc);background:#00E5A012}
.sort-opts{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.sort-opt{padding:8px 14px;border-radius:100px;border:1.5px solid var(--br);background:var(--sf2);
  color:var(--tx2);font-size:13px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.sort-opt.on{border-color:var(--acc2);color:var(--acc2);background:#00B8FF12}
/* log screen extra bottom padding for water bar */
.logscreen{padding:0 0 140px}
.meal-empty{background:var(--sf2);border:1.5px dashed var(--br);border-radius:14px;padding:14px;text-align:center;font-size:13px;color:var(--tx3)}

/* ── ADD FOOD MODAL ── */
.overlay{position:fixed;inset:0;background:#000B;z-index:50;display:flex;align-items:flex-end;backdrop-filter:blur(6px)}
.sheet{background:var(--sf);border-radius:24px 24px 0 0;border:1.5px solid var(--br);width:100%;max-width:430px;margin:0 auto;max-height:88vh;display:flex;flex-direction:column;animation:su .25s ease}
@keyframes su{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
.sheet-header{padding:20px 20px 0;flex-shrink:0}
.sheet-handle{width:36px;height:4px;background:var(--br);border-radius:2px;margin:0 auto 16px}
.sheet-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:14px}
.search-input{width:100%;background:var(--sf2);border:1.5px solid var(--br);border-radius:14px;padding:13px 16px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:15px;outline:none;margin-bottom:14px;-webkit-appearance:none}
.search-input:focus{border-color:var(--acc)}
.search-input::placeholder{color:var(--tx3)}
.tab-strip{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.tab-strip::-webkit-scrollbar{display:none}
.ts-btn{white-space:nowrap;padding:7px 14px;border-radius:100px;border:1.5px solid var(--br);background:transparent;color:var(--tx2);font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;flex-shrink:0}
.ts-btn.on{background:var(--sf2);border-color:var(--acc);color:var(--acc)}
.sheet-body{overflow-y:auto;padding:0 20px 24px;flex:1}
.lib-item{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--br);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:opacity .1s}
.lib-item:active{opacity:.6}
.lib-item:last-child{border-bottom:none}
.lib-name{flex:1;min-width:0}
.lib-title{font-size:14px;font-weight:500;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lib-brand{font-size:11px;color:var(--tx2)}
.lib-macs{display:flex;gap:6px;align-items:center;flex-shrink:0}
.lib-mac{font-size:11px;font-weight:600}
.lib-cal{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--kcal);min-width:32px;text-align:right}
.add-circle{width:30px;height:30px;border-radius:50%;background:var(--acc);border:none;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700}
.fav-btn{width:28px;height:28px;border-radius:8px;border:none;background:transparent;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;opacity:.4;transition:opacity .15s,transform .15s;padding:0}
.fav-btn.on{opacity:1}
.fav-btn:active{transform:scale(.8)}
.manual-form{display:flex;flex-direction:column;gap:12px}
.mf-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mf-field label{display:block;font-size:11px;font-weight:600;color:var(--tx2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
.mf-field input{width:100%;background:var(--sf2);border:1.5px solid var(--br);border-radius:12px;padding:13px 14px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:15px;outline:none;-webkit-appearance:none}
.mf-field input:focus{border-color:var(--acc)}
.mf-field input::placeholder{color:var(--tx3)}
.mf-field.full{grid-column:1/-1}
.save-btn{width:100%;padding:16px;border-radius:14px;border:none;background:var(--acc);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:15px;cursor:pointer;margin-top:4px}
.save-btn:disabled{opacity:.3;cursor:not-allowed}

/* MODAL */
.ov{position:fixed;inset:0;background:#000A;z-index:50;display:flex;align-items:flex-end;backdrop-filter:blur(4px)}
.mod{background:var(--sf);border-radius:24px 24px 0 0;border:1.5px solid var(--br);padding:24px 22px 44px;width:100%;max-width:430px;margin:0 auto;animation:su .25s ease}
.mod h3{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:8px}
.mod p{color:var(--tx2);font-size:14px;margin-bottom:22px;line-height:1.5}
.mbtns{display:flex;gap:10px}
.mdel{flex:1;padding:15px;border-radius:14px;background:#FF6B6B14;border:1.5px solid #FF6B6B30;color:#FF9999;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;cursor:pointer}
.mcan{flex:1;padding:15px;border-radius:14px;border:1.5px solid var(--br);background:var(--sf2);color:var(--tx2);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer}

.fi{animation:fi .3s ease}
@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.pl{animation:pl 1.8s infinite}
@keyframes pl{0%,100%{opacity:1}50%{opacity:.4}}

/* ── CAMERA FAB ── */
.camera-fab{position:fixed;bottom:170px;right:18px;width:50px;height:50px;border-radius:50%;
  background:var(--warn);border:none;font-size:22px;cursor:pointer;z-index:28;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 20px #B86E0050;transition:transform .15s,box-shadow .15s}
.camera-fab:active{transform:scale(.88);box-shadow:0 2px 10px #B86E0030}

/* ── COACH FAB ── */
.coach-fab{position:fixed;bottom:80px;right:18px;
  display:flex;align-items:center;gap:8px;
  padding:12px 18px;border-radius:100px;border:none;
  background:linear-gradient(135deg,var(--acc),var(--acc2));
  color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;
  cursor:pointer;z-index:28;
  box-shadow:0 4px 20px #008F6B40;transition:transform .15s,box-shadow .15s}
.coach-fab:active{transform:scale(.93)}

/* ── COACH MODAL ── */
.coach-sheet{background:var(--sf);border-radius:24px 24px 0 0;border:1.5px solid var(--br);
  width:100%;max-width:430px;margin:0 auto;max-height:88vh;
  display:flex;flex-direction:column;animation:su .25s ease}
.coach-head{padding:20px 20px 14px;flex-shrink:0;border-bottom:1px solid var(--br)}
.coach-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;margin-bottom:2px}
.coach-sub{font-size:12px;color:var(--tx2)}
.coach-body{flex:1;overflow-y:auto;padding:16px 20px}
.coach-suggestions{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.coach-suggestion{background:var(--sf2);border:1.5px solid var(--br);border-radius:12px;
  padding:11px 14px;font-size:13px;color:var(--tx);cursor:pointer;text-align:left;
  transition:border-color .15s;line-height:1.4}
.coach-suggestion:active{border-color:var(--acc)}
.coach-answer{background:linear-gradient(135deg,#008F6B08,#0072BE06);
  border:1.5px solid #008F6B20;border-radius:16px;padding:16px;margin-bottom:14px}
.coach-answer-label{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;
  color:var(--acc);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.coach-answer-text{font-size:14px;color:var(--tx);line-height:1.7}
.coach-ask-again{font-size:12px;color:var(--acc2);cursor:pointer;font-weight:600;margin-top:10px;display:inline-block}
.coach-input-row{display:flex;gap:8px;padding:12px 20px 28px;flex-shrink:0;border-top:1px solid var(--br)}
.coach-input{flex:1;background:var(--sf2);border:1.5px solid var(--br);border-radius:14px;
  padding:12px 14px;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:14px;
  outline:none;-webkit-appearance:none;transition:border-color .2s}
.coach-input:focus{border-color:var(--acc)}
.coach-input::placeholder{color:var(--tx3)}
.coach-send{padding:12px 18px;border-radius:14px;border:none;
  background:var(--acc);color:#fff;font-family:'Syne',sans-serif;
  font-weight:700;font-size:14px;cursor:pointer;flex-shrink:0;transition:opacity .15s}
.coach-send:disabled{opacity:.35;cursor:not-allowed}

/* ── PHOTO SCANNER (inside Add modal sheet-body) ── */
.photo-drop-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;
  border:2px dashed var(--br);border-radius:18px;padding:36px 20px;text-align:center;
  cursor:pointer;transition:border-color .2s;background:var(--sf2);min-height:200px}
.photo-drop-zone:active{border-color:var(--warn)}
.photo-preview-img{width:100%;max-height:260px;object-fit:cover;border-radius:14px;
  display:block;margin-bottom:14px;border:1.5px solid var(--br)}
.scan-action-btn{width:100%;padding:15px;border-radius:14px;border:none;
  background:var(--warn);color:#fff;font-family:'Syne',sans-serif;
  font-weight:800;font-size:15px;cursor:pointer;margin-bottom:10px;
  box-shadow:0 4px 16px #B86E0030;transition:all .15s}
.scan-action-btn:active{transform:scale(.97)}
.scan-action-btn:disabled{opacity:.35;cursor:not-allowed}
.scan-ghost-btn{width:100%;padding:13px;border-radius:14px;border:1.5px solid var(--br);
  background:transparent;color:var(--tx2);font-family:'DM Sans',sans-serif;
  font-size:14px;cursor:pointer;transition:border-color .15s}
.scan-ghost-btn:active{border-color:var(--acc)}
.serving-option{background:var(--sf2);border:1.5px solid var(--br);border-radius:14px;
  padding:14px 16px;margin-bottom:8px;cursor:pointer;transition:all .15s}
.serving-option.on{background:#FFB34712;border-color:#FFB34740}
.serving-opt-label{font-size:14px;font-weight:500;margin-bottom:6px}
.serving-opt-macros{display:flex;gap:10px;font-size:12px;font-weight:600}
.scan-result-header{display:flex;align-items:center;gap:10px;background:#00E5A00A;
  border:1.5px solid #00E5A025;border-radius:14px;padding:12px 14px;margin-bottom:16px}
.scan-result-thumb{width:48px;height:48px;border-radius:10px;object-fit:cover;flex-shrink:0}
.scan-result-thumb-placeholder{width:48px;height:48px;border-radius:10px;background:var(--sf2);
  border:1.5px solid var(--br);display:flex;align-items:center;justify-content:center;
  font-size:20px;flex-shrink:0}
.scan-error-box{background:#FF6B6B0E;border:1.5px solid #FF6B6B30;border-radius:14px;
  padding:20px;text-align:center;margin-bottom:16px}
.photo-meal-picker{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px}
.photo-meal-btn{padding:10px 4px;border-radius:12px;border:1.5px solid var(--br);
  background:var(--sf2);color:var(--tx2);font-family:'DM Sans',sans-serif;
  font-size:11px;cursor:pointer;text-align:center;transition:all .15s;line-height:1.4}
.photo-meal-btn.on{border-color:var(--acc);background:#00E5A012;color:var(--acc)}
.scan-scanning{display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:40px 20px;text-align:center;min-height:220px}
`;


// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Core state ──
  const [screen,   setScreen]   = useState("loading");
  const [tab,      setTab]      = useState("home");
  const [step,     setStep]     = useState(0);
  const [user,     setUser]     = useState({...DEF_USER});
  const [tdee,     setTdee]     = useState(0);
  const [macros,   setMacros]   = useState({...DEF_MACROS});
  const [confirm,  setConfirm]  = useState(false);
  // ── Log state ──
  const [logDate,  setLogDate]  = useState(todayStr());
  const [dayLog,   setDayLog]   = useState({...DEF_LOG});
  const [library,  setLibrary]  = useState(SEED_LIBRARY);
  // ── Add food modal ──
  const [addModal, setAddModal] = useState(null); // { meal: "breakfast" }
  const [libTab,   setLibTab]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [manForm,  setManForm]  = useState({name:"",serving:"",cal:"",pro:"",carb:"",fat:""});
  const [autoFillPreview, setAutoFillPreview] = useState(null);
  // New state
  const [waterOz,        setWaterOz]        = useState(0);
  const [completedMeals, setCompletedMeals] = useState({});   // { breakfast: true, ... }
  const [mealAnalysis,   setMealAnalysis]   = useState({});   // { breakfast: { text, expanded } }
  const [analyzingMeal,  setAnalyzingMeal]  = useState(null);
  const [sortBy,         setSortBy]         = useState("ratio");
  const [showSortMenu,   setShowSortMenu]   = useState(false);
  const [recommendingMeal, setRecommendingMeal] = useState(null); // { meals: {}, projectedTotals: {} }

  const [autoFilling, setAutoFilling] = useState(false);

  // ── Weight tracking state ──
  const [weightEntries,  setWeightEntries]  = useState([]); // [{date:"YYYY-MM-DD", weight:244.0}]
  const [weightInput,    setWeightInput]    = useState("");

  // ── Supplement state ──
  const [supplements,    setSupplements]    = useState([]); // [{id,name,dose,timing}]
  const [suppLog,        setSuppLog]        = useState({}); // {suppId: true} for today
  const [suppFormOpen,   setSuppFormOpen]   = useState(false);
  const [suppForm,       setSuppForm]       = useState({name:"",dose:"",timing:"morning",notes:""});
  const [suppEditId,     setSuppEditId]     = useState(null);
  const [suppEditForm,   setSuppEditForm]   = useState({name:"",dose:"",timing:"morning",notes:""});

  // ── Streak state ──
  const [streaks, setStreaks] = useState({
    logging: {count:0,lastDate:null},
    protein: {count:0,lastDate:null},
    weighIn: {count:0,lastDate:null},
    supps:   {count:0,lastDate:null},
  });

  // ── Daily debrief state ──
  const [debriefText,    setDebriefText]    = useState(null);
  const [debriefLoading, setDebriefLoading] = useState(false);

  // ── Coach (Ask Claude) state ──
  const [coachOpen,    setCoachOpen]    = useState(false);
  const [coachQuery,   setCoachQuery]   = useState("");
  const [coachAnswer,  setCoachAnswer]  = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);

  // ── Grocery list state ──
  const [groceryOpen,    setGroceryOpen]    = useState(false);
  const [groceryData,    setGroceryData]    = useState(null); // [{category, items:[{name,detail}]}]
  const [groceryLoading, setGroceryLoading] = useState(false);
  const [groceryCopied,  setGroceryCopied]  = useState(false);

  // ── Weekly check-in state ──
  const [checkInText,    setCheckInText]    = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInDate,    setCheckInDate]    = useState(null);

  // ── Recipe state ──
  const [recipes,          setRecipes]          = useState(SEED_RECIPES);
  const [recipeView,       setRecipeView]       = useState("list"); // list | detail | create
  const [activeRecipe,     setActiveRecipe]     = useState(null);
  const [recipeDeleteConfirm, setRecipeDeleteConfirm] = useState(null); // recipe object
  const [createMode,       setCreateMode]       = useState(null);  // manual | claude | photo
  const [recipeServings,   setRecipeServings]   = useState(1);
  const [recipeSearch,     setRecipeSearch]     = useState("");
  const [claudePrompt,     setClaudePrompt]     = useState("");
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [generatedDraft,   setGeneratedDraft]   = useState(null);
  const [rForm,  setRForm]  = useState({name:"",description:"",servings:"4",tags:[],ingredients:[]});
  const [rIngForm,setRIngForm]=useState({name:"",amount:"",unit:"g",cal:"",pro:"",carb:"",fat:""});

  // ── Recipe photo scan state ──
  const [recipePhotoPreview, setRecipePhotoPreview] = useState(null);
  const [recipePhotoMime,    setRecipePhotoMime]    = useState("image/jpeg");
  const [scanningRecipe,     setScanningRecipe]     = useState(false);
  const [recipePhotoError,   setRecipePhotoError]   = useState(null);

  // ── Photo label scan state ──
  const [photoPreview,    setPhotoPreview]    = useState(null);   // data-URL for <img>
  const [photoMime,       setPhotoMime]       = useState("image/jpeg");
  const [scanningLabel,   setScanningLabel]   = useState(false);
  const [labelDraft,      setLabelDraft]      = useState(null);   // { name, brand, servingOptions[] }
  const [labelServingIdx, setLabelServingIdx] = useState(0);
  const [labelEditForm,   setLabelEditForm]   = useState(null);   // editable fields before save
  const [photoScanError,  setPhotoScanError]  = useState(null);

  // ── Auto-fill engine ──
  const autoFillDay = () => {
    if (autoFilling) return;
    setAutoFilling(true);

    try {
      const tgt = user.macros || macros;
      const logged = sumMeals(dayLog);
      const remCal = tgt.calories - logged.cal;
      const remPro = tgt.protein  - logged.pro;
      const mealBudgets = { breakfast:0.25, lunch:0.30, dinner:0.30, snacks:0.15 };

      const rankForMeal = (meal) =>
        [...library]
          .filter(f => f.cal > 0 && (f.tags||[]).includes(meal))
          .map(f => ({ ...f, ratio: ratioScore(f) }))
          .sort((a, b) => b.ratio - a.ratio);

      const emptyMeals = MEALS.filter(m => (dayLog[m] || []).length === 0);
      const fills = {};

      emptyMeals.forEach(meal => {
        const budget     = Math.max(300, Math.round(remCal * mealBudgets[meal]));
        const protBudget = Math.max(20,  Math.round(remPro  * mealBudgets[meal]));
        const ranked     = rankForMeal(meal);
        const mealItems  = [];
        let mealCal = 0, mealPro = 0;
        const usedIds = new Set(Object.values(fills).flat().map(i => i.id));

        for (const food of ranked) {
          if (mealItems.length >= 3) break;
          if (usedIds.has(food.id)) continue;
          if (mealCal + food.cal > budget * 1.3) continue;
          if (mealPro < protBudget * 0.5 && food.ratio < 3) continue;
          mealItems.push({ ...food, logId: uid(), state:"recommended", addedAt: new Date().toISOString() });
          mealCal += food.cal;
          mealPro += food.pro;
          usedIds.add(food.id);
        }
        fills[meal] = mealItems;
      });

      const projLog = { ...dayLog };
      Object.keys(fills).forEach(m => { projLog[m] = fills[m]; });
      setAutoFillPreview({ fills, projected: sumMeals(projLog) });
    } catch(e) {
      console.error("AutoFill error:", e);
    }

    setAutoFilling(false);
  };

  const applyAutoFill = () => {
    if (!autoFillPreview) return;
    const updated = { ...dayLog };
    Object.keys(autoFillPreview.fills).forEach(m => {
      updated[m] = [...(updated[m] || []), ...autoFillPreview.fills[m]];
    });
    saveLog(updated);
    setAutoFillPreview(null);
  };

  // ── Recommend a single meal ──
  const recommendMeal = (meal) => {
    if (recommendingMeal) return;
    setRecommendingMeal(meal);

    try {
      const tgt = user.macros || macros;
      const logged = sumMeals(dayLog);
      const remCal = tgt.calories - logged.cal;
      const remPro = tgt.protein  - logged.pro;
      const mealBudgets = { breakfast:0.25, lunch:0.30, dinner:0.30, snacks:0.15 };
      const budget     = Math.max(300, Math.round(remCal * mealBudgets[meal]));
      const protBudget = Math.max(20,  Math.round(remPro  * mealBudgets[meal]));

      const ranked = [...library]
        .filter(f => f.cal > 0 && (f.tags||[]).includes(meal))
        .map(f => ({ ...f, ratio: ratioScore(f) }))
        .sort((a, b) => b.ratio - a.ratio);

      const alreadyLogged = new Set(Object.values(dayLog).flat().map(i => i.id));
      const picks = [];
      let pickCal = 0, pickPro = 0;

      for (const food of ranked) {
        if (picks.length >= 3) break;
        if (alreadyLogged.has(food.id)) continue;
        if (pickCal + food.cal > budget * 1.3) continue;
        if (pickPro < protBudget * 0.5 && food.ratio < 3) continue;
        picks.push({ ...food, logId: uid(), state:"recommended", addedAt: new Date().toISOString() });
        pickCal += food.cal;
        pickPro += food.pro;
      }

      if (picks.length > 0) {
        const updated = { ...dayLog, [meal]: [...(dayLog[meal] || []), ...picks] };
        saveLog(updated);
      }
    } catch(e) {
      console.error("RecommendMeal error:", e);
    }

    setRecommendingMeal(null);
  };

  // ── Shared rich context builder used across all coaching calls ──
  const buildUserContext=()=>{
    const tgt=user.macros||macros;
    const goalObj=GOALS.find(x=>x.id===user.goal?.primary)||{label:"General Wellness"};
    const actObj=ACTIVITIES.find(a=>a.id===user.activityLevel)||{label:"Lightly Active"};
    // Weight context
    const sortedWeights=[...weightEntries].sort((a,b)=>a.date.localeCompare(b.date));
    const latestW=sortedWeights[sortedWeights.length-1]?.weight??null;
    const prev7W=sortedWeights.slice(-8,-1);
    const avg7W=prev7W.length?Math.round(prev7W.reduce((s,e)=>s+e.weight,0)/prev7W.length*10)/10:null;
    const weeklyRateW=avg7W&&latestW?(avg7W-latestW).toFixed(1):null; // positive = losing
    const goalW=+user.goal?.targetWeightLbs||null;
    const startW=+user.weightLbs||null;
    const lostSoFar=startW&&latestW?(startW-latestW).toFixed(1):null;
    const toGo=goalW&&latestW?(latestW-goalW).toFixed(1):null;
    const progressPct=startW&&goalW&&latestW&&startW!==goalW?
      Math.max(0,Math.min(100,Math.round(((startW-latestW)/(startW-goalW))*100))):null;
    // GLP-1 injection day context
    const today=new Date();
    const todayIdx=today.getDay()===0?6:today.getDay()-1; // 0=Mon
    const injIdx=DAYS.indexOf(user.glp1?.injectionDay??'');
    const daysToInj=injIdx>=0?((injIdx-todayIdx+7)%7):null;
    const glp1Context=user.glp1?.active
      ?`GLP-1: ${user.glp1.medication} ${user.glp1.currentDose}, injection ${daysToInj===0?"TODAY":daysToInj===1?"TOMORROW":`in ${daysToInj} days`} (${user.glp1.injectionDay}s). Post-injection appetite suppression typically lasts 2-3 days — protein intake is hardest on days 1-2 after injection.`
      :"GLP-1: None";
    // Today's foods by meal
    const mealSummary=MEALS.map(m=>{
      const items=(dayLog[m]||[]).filter(i=>i.state!=="recommended");
      if(!items.length) return null;
      return `${MEAL_LABELS[m]}: ${items.map(i=>i.name).join(", ")} (${items.reduce((s,i)=>s+i.cal,0)} cal, ${items.reduce((s,i)=>s+i.pro,0)}g protein)`;
    }).filter(Boolean).join("\n");
    return {tgt,goalObj,actObj,latestW,avg7W,weeklyRateW,goalW,startW,lostSoFar,toGo,progressPct,glp1Context,mealSummary};
  };

  // ── Complete a meal + Claude API analysis ──
  const completeMeal = async (meal) => {
    setCompletedMeals(c => ({ ...c, [meal]: true }));
    setAnalyzingMeal(meal);
    const tgt = user.macros || macros;
    const mealItems = (dayLog[meal] || []).filter(i => i.state !== "recommended");
    const mealTotals = { cal: mealItems.reduce((s,i)=>s+i.cal,0), pro: mealItems.reduce((s,i)=>s+i.pro,0) };
    const loggedSoFar = sumMeals(dayLog);
    const remaining = { cal: Math.max(0,tgt.calories-loggedSoFar.cal), pro: Math.max(0,tgt.protein-loggedSoFar.pro) };
    const mealsLeft = MEALS.filter(m => m !== meal && !(completedMeals[m]));

    try {
      const ctx=buildUserContext();
      const mealItems=(dayLog[meal]||[]).filter(i=>i.state!=="recommended");
      const mealFoods=mealItems.map(i=>`${i.name} (${i.cal} cal, ${i.pro}g pro, ${i.carb}g carb, ${i.fat}g fat)`).join("; ")||"no items logged";
      const hour=new Date().getHours();
      const timeOfDay=hour<10?"morning":hour<13?"late morning":hour<17?"afternoon":"evening";
      const res = await fetch("/api/claude", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:400,
          system:`You are an expert sports nutritionist and personal health coach embedded in the Nourish app. Provide a specific, data-driven post-meal analysis in 2-3 sentences. Always reference actual numbers and remaining targets. Factor in the user's specific goal, GLP-1 status and injection timing, time of day, and what meals remain. Flag any meaningful concern (protein lag, calorie surplus, post-injection appetite window). Be direct — no filler phrases like "great job" or "keep it up." No markdown, no bullet points.`,
          messages:[{ role:"user", content:
            `User: ${user.name||"Unknown"}, ${user.age}yo ${user.sex}, ${ctx.latestW?ctx.latestW+" lbs, ":""}goal: ${ctx.goalObj.label}${ctx.toGo?`, ${ctx.toGo} lbs to target`:""}.
${ctx.glp1Context}
Daily targets: ${tgt.calories} cal / ${tgt.protein}g protein / ${tgt.carbs}g carbs / ${tgt.fat}g fat.
Time: ${timeOfDay}.

Just completed ${meal}:
Foods: ${mealFoods}
Meal totals: ${mealTotals.cal} cal, ${mealTotals.pro}g protein, ${(mealItems.reduce((s,i)=>s+i.carb,0))}g carbs, ${(mealItems.reduce((s,i)=>s+i.fat,0))}g fat.

After this meal — logged today: ${loggedSoFar.cal} cal (${Math.round(loggedSoFar.cal/tgt.calories*100)}%), ${loggedSoFar.pro}g protein (${Math.round(loggedSoFar.pro/tgt.protein*100)}%), ${loggedSoFar.carb||0}g carbs, ${loggedSoFar.fat||0}g fat.
Remaining: ${remaining.cal} cal, ${remaining.pro}g protein.
Meals still to log: ${mealsLeft.join(", ")||"none — this was the last meal"}.

Give a specific, insightful 2-3 sentence post-meal analysis and forward-looking recommendation.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "Great meal logged! Keep an eye on your remaining protein target.";
      setMealAnalysis(a => ({ ...a, [meal]: { text, expanded: true } }));
    } catch {
      setMealAnalysis(a => ({ ...a, [meal]: { text: `${meal.charAt(0).toUpperCase()+meal.slice(1)} complete! You have ${remaining.pro}g protein and ${remaining.cal} cal remaining today.`, expanded: true } }));
    }
    setAnalyzingMeal(null);
  };

  // ── Water logging ──
  const waterGoal = calcWaterGoal(user.weightLbs, user.glp1?.active);
  const logWater = (oz) => setWaterOz(w => Math.min(waterGoal + 20, w + oz));

  // ── Save a weight entry ──
  const saveWeight = async (date, weight) => {
    const updated = [...weightEntries.filter(e=>e.date!==date), {date, weight}]
      .sort((a,b)=>a.date.localeCompare(b.date));
    setWeightEntries(updated);
    await DB.set("nourish:weights", updated);
    if(date===todayStr()) updateStreak("weighIn");
  };

  // ── Supplement storage & helpers ──
  const suppLogKey = d => `nourish:supplog:${d}`;
  useEffect(()=>{ DB.get("nourish:supplements").then(v=>setSupplements(v||[])); },[]);
  useEffect(()=>{ DB.get(suppLogKey(logDate)).then(v=>setSuppLog(v||{})); },[logDate]);
  const saveSupplements = async(updated) => { setSupplements(updated); await DB.set("nourish:supplements",updated); };
  const saveSuppLog = async(updated) => {
    setSuppLog(updated);
    await DB.set(suppLogKey(logDate),updated);
    // Update supp streak if all taken today
    if(logDate===todayStr()&&supplements.length>0){
      const allDone=supplements.every(s=>updated[s.id]);
      if(allDone) updateStreak("supps");
    }
  };
  const toggleSupp = (id) => { const u={...suppLog,[id]:!suppLog[id]}; saveSuppLog(u); };
  const addSupplement = () => {
    if(!suppForm.name.trim()) return;
    const s={id:uid(),name:suppForm.name.trim(),dose:suppForm.dose.trim(),timing:suppForm.timing,notes:suppForm.notes.trim()};
    saveSupplements([...supplements,s]);
    setSuppForm({name:"",dose:"",timing:"morning",notes:""}); setSuppFormOpen(false);
  };
  const deleteSupp = (id) => saveSupplements(supplements.filter(s=>s.id!==id));
  const startEditSupp = (s) => { setSuppEditId(s.id); setSuppEditForm({name:s.name,dose:s.dose||"",timing:s.timing||"morning",notes:s.notes||""}); };
  const saveEditSupp = () => {
    if(!suppEditForm.name.trim()) return;
    saveSupplements(supplements.map(s=>s.id===suppEditId?{...s,...suppEditForm,name:suppEditForm.name.trim(),dose:suppEditForm.dose.trim(),notes:suppEditForm.notes.trim()}:s));
    setSuppEditId(null);
  };

  // ── Streak helpers ──
  const yestStr=()=>{ const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().split("T")[0]; };
  useEffect(()=>{ DB.get("nourish:streaks").then(v=>{ if(v) setStreaks(v); }); },[]);
  const updateStreak=async(type)=>{
    const today=todayStr();
    const current=await DB.get("nourish:streaks")||{};
    const entry=current[type]||{count:0,lastDate:null};
    if(entry.lastDate===today) return; // already logged today
    const newCount=entry.lastDate===yestStr()?entry.count+1:1;
    const updated={...current,[type]:{count:newCount,lastDate:today}};
    setStreaks(updated);
    await DB.set("nourish:streaks",updated);
  };

  // ── Daily debrief ──
  useEffect(()=>{
    DB.get(`nourish:debrief:${todayStr()}`).then(v=>{ if(v?.text) setDebriefText(v.text); });
  },[]);
  const generateDebrief=async()=>{
    setDebriefLoading(true);
    const tgt=user.macros||macros;
    const ctx=buildUserContext();
    const suppTotal=supplements.length;
    const suppDone=Object.values(suppLog).filter(Boolean).length;
    const mealsDone=Object.values(completedMeals).filter(Boolean).length;
    const calPct=tgt.calories?Math.round(totals.cal/tgt.calories*100):0;
    const proPct=tgt.protein?Math.round(totals.pro/tgt.protein*100):0;
    try{
      const res=await fetch("/api/claude",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:550,
          system:`You are an expert nutritionist and performance coach delivering a data-driven daily debrief. Write 4-5 sentences that cover: (1) overall caloric and protein performance with exact percentages, (2) what the macro breakdown means for their specific goal, (3) hydration and supplement adherence assessment, (4) one specific concern or positive pattern worth naming, and (5) one precise, actionable recommendation for tomorrow tied to their actual numbers and goal. Use their name. Be honest about gaps — don't soften misses. No generic praise. No markdown, no bullet points.`,
          messages:[{role:"user",content:
            `Daily debrief for ${user.name||"this user"}.
PROFILE: ${user.age}yo ${user.sex}, ${ctx.latestW?ctx.latestW+" lbs":"weight not logged"}${ctx.avg7W?` (7-day avg: ${ctx.avg7W} lbs${ctx.weeklyRateW!==null?`, ${+ctx.weeklyRateW>0?`losing ~${ctx.weeklyRateW} lbs/wk`:`gaining ~${Math.abs(+ctx.weeklyRateW)} lbs/wk`}`:""})`:""}.  Goal: ${ctx.goalObj.label}${ctx.toGo?`. ${ctx.toGo} lbs to target (${ctx.progressPct||0}% there)`:""}.
${ctx.glp1Context}
TARGETS: ${tgt.calories} cal / ${tgt.protein}g protein / ${tgt.carbs}g carbs / ${tgt.fat}g fat.
TODAY'S TOTALS: ${totals.cal} cal (${calPct}%), ${totals.pro}g protein (${proPct}%), ${totals.carb}g carbs, ${totals.fat}g fat.
WHAT WAS EATEN:\n${ctx.mealSummary||"No meals logged today."}
WATER: ${waterOz}/${waterGoal}oz (${Math.round(waterOz/waterGoal*100)}%).
SUPPLEMENTS: ${suppDone}/${suppTotal} taken${suppTotal>0?` (${supplements.filter(s=>!suppLog[s.id]).map(s=>s.name).join(", ")||"all done"} missed)`:""}.
MEALS COMPLETED: ${mealsDone}/4.
STREAKS: Logging ${streaks.logging?.count||0} days, protein goal ${streaks.protein?.count||0} days.

Write the daily debrief.`
          }]
        })
      });
      const data=await res.json();
      const text=data.content?.[0]?.text||"Great effort today — keep building the habit.";
      setDebriefText(text);
      await DB.set(`nourish:debrief:${todayStr()}`,{text,generatedAt:new Date().toISOString()});
    }catch{
      setDebriefText("Couldn't generate your debrief — check your connection and try again.");
    }
    setDebriefLoading(false);
  };

  // ── Coach: build rich context system prompt ──
  const buildCoachContext=()=>{
    const ctx=buildUserContext();
    const tgt=ctx.tgt;
    const actObj=ctx.actObj;
    const suppsDone=supplements.filter(s=>suppLog[s.id]).map(s=>s.name);
    const suppsRemaining=supplements.filter(s=>!suppLog[s.id]).map(s=>s.name);
    return `You are an expert personal nutritionist, health coach, and wellness advisor embedded in the Nourish app. You have complete access to this user's real data. Answer their question with the depth and specificity of a professional coach who knows them well. Reference their actual numbers, name them directly, and tie advice back to their specific goal. If the question has a clear correct answer, give it — don't hedge. If trade-offs exist, name them explicitly. 2-5 sentences unless a detailed breakdown is genuinely needed. No markdown, no bullet points.

USER PROFILE:
Name: ${user.name||"User"} | Age: ${user.age||"?"} | Sex: ${user.sex||"?"} | Activity: ${actObj.label} (TDEE ~${tgt.tdee||"unknown"} cal)
Weight: ${ctx.latestW?ctx.latestW+" lbs":"not logged"}${ctx.avg7W?` | 7-day avg: ${ctx.avg7W} lbs${ctx.weeklyRateW!==null?` | Weekly rate: ${+ctx.weeklyRateW>0?`−${ctx.weeklyRateW}`:`+${Math.abs(+ctx.weeklyRateW)}`} lbs/wk`:""}`:""}
Goal: ${ctx.goalObj.label}${ctx.goalW?` → ${ctx.goalW} lbs target`:""} | Progress: ${ctx.progressPct!=null?ctx.progressPct+"% complete":ctx.toGo?`${ctx.toGo} lbs to go`:"no target set"}
${ctx.glp1Context}

DAILY TARGETS: ${tgt.calories} cal / ${tgt.protein}g protein / ${tgt.carbs}g carbs / ${tgt.fat}g fat

TODAY'S LOG:
Calories: ${totals.cal}/${tgt.calories} (${Math.round(totals.cal/tgt.calories*100)}%) | Protein: ${totals.pro}g/${tgt.protein}g (${Math.round(totals.pro/tgt.protein*100)}%) | Carbs: ${totals.carb}g | Fat: ${totals.fat}g
Water: ${waterOz}/${waterGoal}oz
${ctx.mealSummary?`\nMEALS LOGGED:\n${ctx.mealSummary}`:"No meals logged yet today."}

SUPPLEMENTS: ${suppsDone.length?`Taken — ${suppsDone.join(", ")}`:""} ${suppsRemaining.length?`| Remaining — ${suppsRemaining.join(", ")}`:suppsRemaining.length===0&&suppsDone.length?"| All done":"| None set up"}

STREAKS: Logging ${streaks.logging?.count||0} days | Protein goal ${streaks.protein?.count||0} days | Weigh-in ${streaks.weighIn?.count||0} days

SAVED RECIPES: ${recipes.map(r=>r.name).join(", ")||"none yet"}
FAVORITE FOODS: ${library.filter(f=>(f.tags||[]).includes("favorite")).map(f=>f.name).join(", ")||"none starred yet"}`;
  };

  const askCoach=async(question)=>{
    const q=question||coachQuery; if(!q.trim()) return;
    setCoachLoading(true); setCoachAnswer(null);
    try{
      const res=await fetch("/api/claude",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:600,
          system:buildCoachContext(),
          messages:[{role:"user",content:q}]
        })
      });
      const data=await res.json();
      setCoachAnswer(data.content?.[0]?.text||"I couldn't generate a response — please try again.");
    }catch{
      setCoachAnswer("Couldn't connect to Claude. Check your connection and try again.");
    }
    setCoachLoading(false);
  };

  // ── Weekly check-in: load last 7 days of logs ──
  const weekKey=()=>{
    const d=new Date(); const day=d.getDay();
    const mon=new Date(d); mon.setDate(d.getDate()-(day===0?6:day-1));
    return mon.toISOString().split("T")[0];
  };
  useEffect(()=>{
    const wk=weekKey();
    DB.get(`nourish:checkin:${wk}`).then(v=>{
      if(v?.text){ setCheckInText(v.text); setCheckInDate(v.generatedAt); }
    });
  },[]);
  const generateWeeklyCheckIn=async()=>{
    setCheckInLoading(true);
    const tgt=user.macros||macros;
    const ctx=buildUserContext();
    // Load last 7 days of logs
    const days=[]; const today=new Date();
    for(let i=6;i>=0;i--){
      const d=new Date(today); d.setDate(today.getDate()-i);
      days.push(d.toISOString().split("T")[0]);
    }
    const weekLogs=await Promise.all(days.map(async d=>{
      const log=await DB.get(`nourish:log:${d}`)||{breakfast:[],lunch:[],dinner:[],snacks:[]};
      const totalsDay=sumMeals(log);
      return {date:d,...totalsDay};
    }));
    // Weight context
    const recentWeights=weightEntries.slice(-7);
    const avgWeight=recentWeights.length?Math.round(recentWeights.reduce((s,e)=>s+e.weight,0)/recentWeights.length*10)/10:null;
    const oldWeights=weightEntries.slice(-14,-7);
    const prevAvgWeight=oldWeights.length?Math.round(oldWeights.reduce((s,e)=>s+e.weight,0)/oldWeights.length*10)/10:null;
    const weightDelta=avgWeight&&prevAvgWeight?(prevAvgWeight-avgWeight).toFixed(1):null; // positive=lost
    // Weekly stats
    const loggedDays=weekLogs.filter(d=>d.cal>0).length;
    const activeDays=weekLogs.filter(d=>d.cal>0);
    const proteinDays=weekLogs.filter(d=>d.pro>=(tgt.protein*.9)).length;
    const avgCal=activeDays.length?Math.round(activeDays.reduce((s,d)=>s+d.cal,0)/activeDays.length):0;
    const avgPro=activeDays.length?Math.round(activeDays.reduce((s,d)=>s+d.pro,0)/activeDays.length):0;
    const avgCarb=activeDays.length?Math.round(activeDays.reduce((s,d)=>s+d.carb,0)/activeDays.length):0;
    const avgFat=activeDays.length?Math.round(activeDays.reduce((s,d)=>s+d.fat,0)/activeDays.length):0;
    const calVariance=activeDays.length>1?Math.round(Math.sqrt(activeDays.reduce((s,d)=>s+Math.pow(d.cal-avgCal,2),0)/activeDays.length)):0;
    // Per-day breakdown
    const perDayStr=weekLogs.map(d=>{
      const dayName=new Date(d.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
      return d.cal>0?`${dayName}: ${d.cal} cal / ${d.pro}g pro`:`${dayName}: not logged`;
    }).join(" | ");
    try{
      const res=await fetch("/api/claude",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:600,
          system:`You are an expert nutritionist delivering a rigorous weekly performance review. Analyze the data like a coach reviewing game film — specific, evidence-based, and forward-focused. Write 5-6 sentences covering: (1) consistency score with what was missed and why it matters, (2) caloric accuracy — average vs target and what the variance means, (3) protein performance — days at target vs missed, and the gap's impact on their specific goal, (4) weight trend direction and what it implies about their current approach, (5) the single highest-leverage behavior change for next week, stated as a concrete action. Use exact numbers throughout. Don't soften gaps — name them directly and explain their consequence. No markdown, no bullet points.`,
          messages:[{role:"user",content:
            `Weekly review for ${user.name||"this user"}.
PROFILE: ${user.age}yo ${user.sex}, goal: ${ctx.goalObj.label}, activity: ${ctx.actObj.label}.
${ctx.glp1Context}
TARGETS: ${tgt.calories} cal / ${tgt.protein}g protein / ${tgt.carbs}g carbs / ${tgt.fat}g fat daily.

WEIGHT: Current avg ${avgWeight?avgWeight+" lbs":"not logged"}${prevAvgWeight?`, prev week avg ${prevAvgWeight} lbs`:""}.${weightDelta?` Change: ${+weightDelta>0?`−${weightDelta}`:+weightDelta<0?`+${Math.abs(+weightDelta)} gained`:"holding"} lbs this week.`:""} ${ctx.toGo?`${ctx.toGo} lbs to goal (${ctx.progressPct||0}% there).`:""}

WEEKLY LOG:
Days logged: ${loggedDays}/7
Per-day: ${perDayStr}
Averages (logged days only): ${avgCal} cal/day (target ${tgt.calories}), ${avgPro}g protein/day (target ${tgt.protein}g), ${avgCarb}g carbs, ${avgFat}g fat
Calorie variance: ±${calVariance} cal/day ${calVariance>300?"(high inconsistency)":calVariance>150?"(moderate variation)":"(consistent)"}
Protein target hit (≥90%): ${proteinDays}/${loggedDays} logged days

STREAKS: Logging ${streaks.logging?.count||0}-day streak, protein goal ${streaks.protein?.count||0}-day streak, weigh-in ${streaks.weighIn?.count||0}-day streak.

Write the weekly check-in.`
          }]
        })
      });
      const data=await res.json();
      const text=data.content?.[0]?.text||"Great week — keep the momentum going.";
      const wk=weekKey();
      setCheckInText(text); setCheckInDate(new Date().toISOString());
      await DB.set(`nourish:checkin:${wk}`,{text,generatedAt:new Date().toISOString()});
    }catch{
      setCheckInText("Couldn't generate your check-in — check your connection and try again.");
    }
    setCheckInLoading(false);
  };

  // ── Grocery list ──
  const generateGroceryList=async()=>{
    setGroceryLoading(true); setGroceryData(null);
    const favFoods=library.filter(f=>(f.tags||[]).includes("favorite")).map(f=>f.name);
    const recipeIngredients=recipes.flatMap(r=>(r.ingredients||[]).map(i=>i.name));
    try{
      const res=await fetch("/api/claude",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:600,
          system:`You are a helpful grocery assistant. Return ONLY valid JSON, no markdown. Structure: [{"category":"Proteins","items":[{"name":"Chicken breast","detail":"~2 lbs"},{"name":"Greek yogurt 0%","detail":"2 containers"}]},{"category":"Dairy","items":[...]},{"category":"Produce","items":[...]},{"category":"Pantry","items":[...]}]. Include only real grocery items. Keep detail field short (quantity/amount). Maximum 6 items per category.`,
          messages:[{role:"user",content:
            `Generate a weekly grocery list for someone with goal: ${GOALS.find(x=>x.id===user.goal?.primary)?.label||"fat loss"}, daily targets ${(user.macros||macros).calories} cal / ${(user.macros||macros).protein}g protein. Their saved recipes are: ${recipes.map(r=>r.name).join(", ")||"none"}. Their favorite foods include: ${favFoods.join(", ")||"none specified"}. Common ingredients they already use: ${[...new Set(recipeIngredients)].slice(0,15).join(", ")||"none"}. Build a practical weekly grocery list from these.`
          }]
        })
      });
      const data=await res.json();
      const raw=(data.content?.[0]?.text||"[]").replace(/```json|```/g,"").trim();
      setGroceryData(JSON.parse(raw));
    }catch(e){
      console.error("Grocery error:",e);
      setGroceryData([{category:"Error",items:[{name:"Couldn't generate list",detail:"Try again"}]}]);
    }
    setGroceryLoading(false);
  };

  const copyGroceryList=()=>{
    if(!groceryData) return;
    const text=groceryData.map(cat=>
      `${cat.category}:\n${cat.items.map(i=>`• ${i.name}${i.detail?" ("+i.detail+")":""}`).join("\n")}`
    ).join("\n\n");
    const markCopied=()=>{ setGroceryCopied(true); setTimeout(()=>setGroceryCopied(false),2000); };
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(text).then(markCopied).catch(()=>{
        // Clipboard permission denied — try legacy fallback
        try{
          const el=document.createElement("textarea");
          el.value=text; el.style.position="fixed"; el.style.opacity="0";
          document.body.appendChild(el); el.select();
          document.execCommand("copy"); document.body.removeChild(el);
          markCopied();
        }catch{ /* silent — user can manually copy */ }
      });
    } else {
      try{
        const el=document.createElement("textarea");
        el.value=text; el.style.position="fixed"; el.style.opacity="0";
        document.body.appendChild(el); el.select();
        document.execCommand("copy"); document.body.removeChild(el);
        markCopied();
      }catch{ /* silent */ }
    }
  };
  const waterKey = `nourish:water:${logDate}`;
  useEffect(() => {
    DB.get(waterKey).then(v => setWaterOz(v || 0));
  }, [logDate]);
  useEffect(() => {
    if (waterOz > 0) DB.set(waterKey, waterOz);
  }, [waterOz]);

  // ── Load weight entries ──
  useEffect(()=>{
    DB.get("nourish:weights").then(v=>setWeightEntries(v||[]));
  },[]);

  // ── Load + manage recipes ──
  useEffect(()=>{
    DB.get("nourish:recipes").then(v=>{
      if(v&&v.length) setRecipes(v);
      else { setRecipes(SEED_RECIPES); DB.set("nourish:recipes",SEED_RECIPES); }
    });
  },[]);

  // ── Reset photo state when modal closes ──
  useEffect(()=>{
    if(!addModal){
      setPhotoPreview(null); setLabelDraft(null);
      setLabelEditForm(null); setLabelServingIdx(0);
      setPhotoScanError(null); setScanningLabel(false);
    }
  },[addModal]);
  const saveRecipes=async(updated)=>{ setRecipes(updated); await DB.set("nourish:recipes",updated); };
  const deleteRecipe=(id)=>saveRecipes(recipes.filter(r=>r.id!==id));
  const calcRecipeTotals=(ings)=>{
    const t={cal:0,pro:0,carb:0,fat:0};
    ings.forEach(i=>{t.cal+=+i.cal||0;t.pro+=+i.pro||0;t.carb+=+i.carb||0;t.fat+=+i.fat||0;});
    return{cal:Math.round(t.cal),pro:Math.round(t.pro*10)/10,carb:Math.round(t.carb*10)/10,fat:Math.round(t.fat*10)/10};
  };
  const recipeToFood=(recipe,servings=1)=>({
    id:recipe.id, name:recipe.name, brand:"Recipe",
    serving:`${servings} serving${servings!==1?"s":""}`,
    cal:Math.round(recipe.perServing.cal*servings),
    pro:Math.round(recipe.perServing.pro*servings*10)/10,
    carb:Math.round(recipe.perServing.carb*servings*10)/10,
    fat:Math.round(recipe.perServing.fat*servings*10)/10,
    custom:true, tags:recipe.tags||[],
  });
  const generateRecipeWithClaude=async(prompt)=>{
    setGeneratingRecipe(true); setGeneratedDraft(null);
    try{
      const res=await fetch("/api/claude",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`You are a nutrition expert. Return ONLY valid JSON (no markdown, no backticks, no explanation) with this exact structure: {"name":"string","description":"string","servings":number,"tags":["breakfast","lunch","dinner","snack","high-protein","meal-prep"],"ingredients":[{"name":"string","amount":"string","unit":"string","cal":number,"pro":number,"carb":number,"fat":number}]}. Use realistic nutrition values per the amount listed.`,
          messages:[{role:"user",content:`Create a recipe for: ${prompt}`}]
        })
      });
      const data=await res.json();
      const raw=(data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(raw);
      const srv=Math.max(1,+parsed.servings||4);
      const total=calcRecipeTotals(parsed.ingredients||[]);
      setGeneratedDraft({
        ...parsed,id:uid(),source:"claude",
        servings:srv,total,
        perServing:{cal:Math.round(total.cal/srv),pro:Math.round(total.pro/srv*10)/10,carb:Math.round(total.carb/srv*10)/10,fat:Math.round(total.fat/srv*10)/10},
        createdAt:new Date().toISOString(),
      });
    }catch(e){console.error("Recipe gen error:",e);}
    setGeneratingRecipe(false);
  };

  // ── Recipe photo scan ──
  const handleRecipePhotoSelect=(e)=>{
    const file=e.target.files?.[0]; if(!file) return;
    setRecipePhotoError(null); setGeneratedDraft(null);
    setRecipePhotoMime(file.type||"image/jpeg");
    const reader=new FileReader();
    reader.onload=ev=>setRecipePhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const scanRecipePhoto=async()=>{
    if(!recipePhotoPreview) return;
    setScanningRecipe(true); setRecipePhotoError(null); setGeneratedDraft(null);
    try{
      const b64=recipePhotoPreview.split(",")[1];
      const res=await fetch("/api/claude",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`You are a recipe extraction assistant. Extract recipe details from the photo and return ONLY valid JSON with no markdown or backticks. Structure: {"name":"string","description":"one sentence description","servings":number,"tags":["breakfast","lunch","dinner","snack","high-protein","meal-prep"],"ingredients":[{"name":"string","amount":"string","unit":"string","cal":number,"pro":number,"carb":number,"fat":number}]}. Estimate realistic nutrition values per ingredient amount listed. If this is not a recipe, return {"error":"not_a_recipe","message":"brief explanation"}.`,
          messages:[{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:recipePhotoMime,data:b64}},
            {type:"text",text:"Extract this recipe and return the JSON."}
          ]}]
        })
      });
      const data=await res.json();
      const raw=(data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(raw);
      if(parsed.error){
        setRecipePhotoError(parsed.message||"Couldn't extract a recipe from this photo. Try a clearer shot.");
      } else {
        const srv=Math.max(1,+parsed.servings||4);
        const total=calcRecipeTotals(parsed.ingredients||[]);
        setGeneratedDraft({
          ...parsed, id:uid(), source:"photo", servings:srv, total,
          perServing:{cal:Math.round(total.cal/srv),pro:Math.round(total.pro/srv*10)/10,carb:Math.round(total.carb/srv*10)/10,fat:Math.round(total.fat/srv*10)/10},
          createdAt:new Date().toISOString(),
        });
      }
    }catch(e){
      console.error("Recipe scan error:",e);
      setRecipePhotoError("Couldn't connect to Claude. Check your connection and try again.");
    }
    setScanningRecipe(false);
  };

  // ── Photo label scan ──
  const handlePhotoSelect=(e)=>{
    const file=e.target.files?.[0]; if(!file) return;
    setPhotoScanError(null); setLabelDraft(null); setLabelEditForm(null);
    setPhotoMime(file.type||"image/jpeg");
    const reader=new FileReader();
    reader.onload=ev=>setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const scanNutritionLabel=async()=>{
    if(!photoPreview) return;
    setScanningLabel(true); setPhotoScanError(null);
    try{
      const b64=photoPreview.split(",")[1];
      const res=await fetch("/api/claude",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`You are a nutrition label reader. Return ONLY valid JSON, no markdown. Structure: {"name":"product name","brand":"brand name or empty string","servingOptions":[{"label":"serving description e.g. 1 serving (28g)","cal":number,"pro":number,"carb":number,"fat":number}]}. Include ALL serving size options listed on the label. Use 0 for any value you cannot clearly read. If the image is not a nutrition facts label, return {"error":"not_a_label","message":"one sentence explanation"}.`,
          messages:[{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:photoMime,data:b64}},
            {type:"text",text:"Read this nutrition label and return the JSON."}
          ]}]
        })
      });
      const data=await res.json();
      const raw=(data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(raw);
      if(parsed.error){
        setPhotoScanError(parsed.message||"Couldn't read a nutrition label in this photo. Try a clearer, closer shot.");
      } else {
        setLabelDraft(parsed); setLabelServingIdx(0);
      }
    }catch(e){
      console.error("Scan error:",e);
      setPhotoScanError("Couldn't connect to Claude. Check your connection and try again.");
    }
    setScanningLabel(false);
  };

  const confirmServing=(idx)=>{
    if(!labelDraft) return;
    const opt=labelDraft.servingOptions?.[idx]||{label:"1 serving",cal:0,pro:0,carb:0,fat:0};
    setLabelEditForm({
      name:labelDraft.name||"",
      brand:labelDraft.brand||"Custom",
      serving:opt.label,
      cal:String(opt.cal),
      pro:String(opt.pro),
      carb:String(opt.carb),
      fat:String(opt.fat),
      tags:[],
      meal:addModal?.meal||"breakfast",
    });
  };

  const savePhotoFood=()=>{
    if(!labelEditForm?.name||!labelEditForm?.cal) return;
    const food={
      id:uid(), name:labelEditForm.name, brand:labelEditForm.brand||"Custom",
      serving:labelEditForm.serving||"1 serving",
      cal:+labelEditForm.cal, pro:+labelEditForm.pro||0,
      carb:+labelEditForm.carb||0, fat:+labelEditForm.fat||0,
      custom:true, tags:labelEditForm.tags||[], source:"photo",
    };
    const newLib=[...library,food];
    setLibrary(newLib); DB.set("nourish:library",newLib);
    addFoodToMeal(labelEditForm.meal||addModal?.meal||"breakfast",food);
  };

  // ── Helpers ──
  const upd   = (k,v) => setUser(u=>({...u,[k]:v}));
  const updG  = (k,v) => setUser(u=>({...u,goal:{...u.goal,[k]:v}}));
  const updGlp= (k,v) => setUser(u=>({...u,glp1:{...u.glp1,[k]:v}}));
  const updN  = (k,v) => setUser(u=>({...u,notifications:{...u.notifications,[k]:v}}));
  const togP  = p     => setUser(u=>({...u,preferences:u.preferences.includes(p)?u.preferences.filter(x=>x!==p):[...u.preferences,p]}));
  const tIn   = ()    => toIn(user.heightFt,user.heightIn);
  const logKey= d     => `nourish:log:${d}`;

  // ── Load on mount ──
  useEffect(()=>{
    let done=false;
    const timer=setTimeout(()=>{ if(!done){done=true;setScreen("splash");}},3000);
    (async()=>{
      try{
        const prof=await DB.get("nourish:profile");
        if(prof?.createdAt){
          setUser(prof); setMacros(prof.macros||DEF_MACROS);
          const lib=await DB.get("nourish:library");
          if(lib) setLibrary(lib);
          done=true; clearTimeout(timer); setScreen("app"); return;
        }
        const prog=await DB.get("nourish:progress");
        if(prog){ setUser(prog.user||DEF_USER); setStep(prog.step||0); setMacros(prog.macros||DEF_MACROS); setTdee(prog.tdee||0); }
      }catch(e){console.error(e);}
      done=true; clearTimeout(timer); setScreen("splash");
    })();
  },[]);

  // ── Load day log when date changes ──
  useEffect(()=>{
    setCompletedMeals({});
    setMealAnalysis({});
    (async()=>{
      const saved=await DB.get(logKey(logDate));
      setDayLog(saved||{...DEF_LOG});
    })();
  },[logDate]);

  // ── Persist wizard progress ──
  useEffect(()=>{
    if(screen==="wizard") DB.set("nourish:progress",{step,user,macros,tdee});
  },[step,user,macros,tdee,screen]);

  // ── Recalc TDEE ──
  useEffect(()=>{
    if(user.weightLbs&&user.age){
      const b=calcBMR(+user.weightLbs,tIn(),user.age,user.sex);
      setTdee(calcTDEE(b,user.activityLevel));
    }
  },[user.weightLbs,user.age,user.sex,user.heightFt,user.heightIn,user.activityLevel]);

  useEffect(()=>{
    if(step===5&&tdee>0&&user.goal.primary)
      setMacros(recMacros(user.weightLbs||180,user.goal.primary,tdee,user.preferences));
  },[step]);

  const calMin=Math.max(1200,tdee-950)||1200, calMax=(tdee+650)||2800;
  const pLbs=+user.weightLbs||180, pMin=Math.round(pLbs*.45), pMax=Math.round(pLbs*1.5);
  const handleCal =v=>setMacros(deriveMacros(+v,macros.protein,user.preferences));
  const handleProt=v=>setMacros(deriveMacros(macros.calories,+v,user.preferences));

  const weeklyRate=()=>{
    const{targetWeightLbs:tw,targetDate:td}=user.goal;
    if(!tw||!td||!user.weightLbs) return 0;
    const wks=Math.round((new Date(td)-Date.now())/864e5/7);
    return wks>0?Math.max(0,(+user.weightLbs-+tw)/wks):0;
  };
  const [saving, setSaving] = useState(false);
  const [devTaps, setDevTaps] = useState(0);
  const canAdv=()=>{
    if(step===0) return user.name.trim().length>0&&!!user.age&&!!user.weightLbs;
    if(step===1) return !!user.goal.primary;
    if(step===3&&user.goal.primary==="fat_loss") return !!user.goal.targetWeightLbs&&!!user.goal.targetDate;
    return true;
  };
  const handleSave=()=>{
    if(saving) return;
    setSaving(true);
    const rate=weeklyRate();
    const final={...user,goal:{...user.goal,weeklyRate:rate,deficit:tdee-macros.calories,startDate:new Date().toISOString()},macros:{...macros,tdee},createdAt:new Date().toISOString()};
    setUser(final);
    setScreen("app");
    setSaving(false);
    // persist in background — non-blocking
    DB.set("nourish:profile",final).catch(console.error);
    DB.del("nourish:progress").catch(console.error);
  };
  const handleNext=()=>{ if(step<WIZARD_STEPS.length-1) setStep(s=>s+1); else handleSave(); };
  const resetAll=async()=>{
    // Clear all persisted storage
    await Promise.all([
      DB.del("nourish:profile"),  DB.del("nourish:progress"),
      DB.del("nourish:library"),  DB.del("nourish:recipes"),
      DB.del("nourish:weights"),  DB.del("nourish:supplements"),
      DB.del("nourish:streaks"),
      DB.del(`nourish:log:${logDate}`),
      DB.del(`nourish:water:${logDate}`),
      DB.del(`nourish:supplog:${logDate}`),
      DB.del(`nourish:debrief:${todayStr()}`),
      DB.del(`nourish:checkin:${weekKey()}`),
    ]);
    // Reset all in-memory state
    setUser({...DEF_USER});         setStep(0);           setTdee(0);
    setMacros({...DEF_MACROS});     setDayLog({...DEF_LOG});
    setLibrary(SEED_LIBRARY);       setRecipes(SEED_RECIPES);
    setWeightEntries([]);            setWeightInput("");
    setSupplements([]);              setSuppLog({});
    setStreaks({logging:{count:0,lastDate:null},protein:{count:0,lastDate:null},weighIn:{count:0,lastDate:null},supps:{count:0,lastDate:null}});
    setWaterOz(0);                   setCompletedMeals({});  setMealAnalysis({});
    setDebriefText(null);            setCheckInText(null);   setCheckInDate(null);
    setCoachOpen(false);             setCoachAnswer(null);   setCoachQuery("");
    setGroceryOpen(false);           setGroceryData(null);
    setConfirm(false);               setScreen("splash");    setDevTaps(0);
  };

  // ── Log actions ──
  const saveLog=async(updated)=>{
    setDayLog(updated);
    await DB.set(logKey(logDate),updated);
    // Update streaks if today
    if(logDate===todayStr()){
      const allItems=Object.values(updated).flat().filter(i=>i.state!=="recommended");
      if(allItems.length>0) updateStreak("logging");
      const tgt=user.macros||macros;
      const dayTotals=sumMeals(updated);
      if(dayTotals.pro>=(tgt.protein||1)) updateStreak("protein");
    }
  };
  const addFoodToMeal=(meal,food)=>{
    const entry={...food,logId:uid(),addedAt:new Date().toISOString()};
    const updated={...dayLog,[meal]:[...dayLog[meal],entry]};
    saveLog(updated);
    setAddModal(null); setSearch(""); setManForm({name:"",serving:"",cal:"",pro:"",carb:"",fat:""});
  };
  const removeFoodFromMeal=(meal,logId)=>{
    saveLog({...dayLog,[meal]:dayLog[meal].filter(i=>i.logId!==logId)});
  };
  const navigateDate=(dir)=>{
    const d=new Date(logDate+"T12:00:00");
    d.setDate(d.getDate()+dir);
    const next=d.toISOString().split("T")[0];
    if(next<=todayStr()) setLogDate(next);
  };

  // ── Library filter ──
  const filteredLib = libTab==="photo" ? [] : library
    .filter(f => {
      const q = search.toLowerCase();
      const matchSearch = !q || f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q);
      const matchTab = libTab==="all" || libTab==="photo" || libTab==="recipes" ||
        (libTab==="favorites" && (f.tags||[]).includes("favorite")) ||
        (libTab==="custom" && f.custom) ||
        (libTab==="protein" && f.pro >= 15) ||
        (libTab==="snacks" && (f.tags||[]).includes("snack")) ||
        (libTab==="breakfast" && (f.tags||[]).includes("breakfast")) ||
        (libTab==="manual");
      return matchSearch && matchTab && libTab!=="recipes";
    })
    .sort((a, b) => {
      if (sortBy === "ratio")   return ratioScore(b) - ratioScore(a);
      if (sortBy === "protein") return b.pro - a.pro;
      if (sortBy === "cal")     return a.cal - b.cal;
      return a.name.localeCompare(b.name);
    });

  // ── Manual add ──
  const saveManual=()=>{
    if(!manForm.name||!manForm.cal) return;
    const food={id:uid(),name:manForm.name,brand:"Custom",serving:manForm.serving||"1 serving",
      cal:+manForm.cal,pro:+manForm.pro||0,carb:+manForm.carb||0,fat:+manForm.fat||0,custom:true};
    const newLib=[...library,food];
    setLibrary(newLib); DB.set("nourish:library",newLib);
    addFoodToMeal(addModal.meal,food);
  };

  // ── Toggle favorite tag ──
  const toggleFavorite=(e,foodId)=>{
    e.stopPropagation();
    const newLib=library.map(f=>{
      if(f.id!==foodId) return f;
      const tags=f.tags||[];
      return {...f, tags: tags.includes("favorite") ? tags.filter(t=>t!=="favorite") : [...tags,"favorite"]};
    });
    setLibrary(newLib); DB.set("nourish:library",newLib);
  };

  // ── Totals ──
  const totals=sumMeals(dayLog);
  const tgt=user.macros||macros;
  const rem={cal:Math.max(0,tgt.calories-totals.cal),pro:Math.max(0,tgt.protein-totals.pro),
    carb:Math.max(0,tgt.carbs-totals.carb),fat:Math.max(0,tgt.fat-totals.fat)};
  const over={cal:totals.cal>tgt.calories,pro:totals.pro>tgt.protein,
    carb:totals.carb>tgt.carbs,fat:totals.fat>tgt.fat};
  const pct=(v,g)=>Math.min(100,Math.round((v/(g||1))*100));
  const circ=2*Math.PI*48;
  const calPct=pct(totals.cal,tgt.calories);
  const calDash=circ-(circ*(calPct/100));

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER STEP
  // ═══════════════════════════════════════════════════════════════════════════
  const renderStep=()=>{
    const rate=weeklyRate(),ri=rateInfo(rate),gl=user.glp1;
    switch(step){
      case 0: return(
        <div className="fi">
          <div className="seg">
            {["male","female"].map(s=>(
              <button key={s} className={`sb ${user.sex===s?"on":""}`} onClick={()=>upd("sex",s)}>
                {s==="male"?"♂ Male":"♀ Female"}
              </button>
            ))}
          </div>
          <div className="field"><label>First Name</label>
            <input type="text" placeholder="Your name" value={user.name} onChange={e=>upd("name",e.target.value)}/>
          </div>
          <div className="r2">
            <div className="field"><label>Age</label>
              <input type="number" inputMode="numeric" placeholder="38" value={user.age}
                onChange={e=>upd("age",e.target.value)}
                onBlur={e=>{const v=parseInt(e.target.value);if(isNaN(v)||v<=0||v>=120)upd("age","");}}/>
            </div>
            <div className="field"><label>Weight (lbs)</label>
              <input type="number" inputMode="decimal" placeholder="244" value={user.weightLbs}
                onChange={e=>upd("weightLbs",e.target.value)}
                onBlur={e=>{const v=parseFloat(e.target.value);if(isNaN(v)||v<=50||v>=700)upd("weightLbs","");}}/>
            </div>
          </div>
          <div className="field"><label>Height</label>
            <div className="r2">
              <select value={user.heightFt} onChange={e=>upd("heightFt",e.target.value)}>
                {[4,5,6,7].map(f=><option key={f} value={f}>{f} ft</option>)}
              </select>
              <select value={user.heightIn} onChange={e=>upd("heightIn",e.target.value)}>
                {Array.from({length:12},(_,i)=>i).map(i=><option key={i} value={i}>{i} in</option>)}
              </select>
            </div>
          </div>
        </div>
      );
      case 1: return(
        <div className="fi">
          <p style={{color:"var(--tx2)",fontSize:13,marginBottom:16,lineHeight:1.6}}>Your goal shapes macros, alerts, and suggestions. Change anytime.</p>
          <div className="gg">
            {GOALS.map(g=>(
              <div key={g.id} className={`gc ${user.goal.primary===g.id?"on":""}`} onClick={()=>updG("primary",g.id)}>
                <div className="gi">{g.icon}</div><div className="gl">{g.label}</div><div className="gd">{g.desc}</div>
              </div>
            ))}
          </div>
        </div>
      );
      case 2: return(
        <div className="fi">
          <p style={{color:"var(--tx2)",fontSize:13,marginBottom:16,lineHeight:1.6}}>GLP-1 medications significantly affect appetite and nutrition needs.</p>
          <div className="seg">
            <button className={`sb ${gl.active?"on":""}`} onClick={()=>updGlp("active",true)}>Yes, on GLP-1</button>
            <button className={`sb ${!gl.active?"on":""}`} onClick={()=>updGlp("active",false)}>No</button>
          </div>
          {gl.active&&(
            <div className="gc2 fi">
              <div className="gt">💉 Medication Details</div>
              <div className="field"><label>Medication</label>
                <select value={gl.medication} onChange={e=>updGlp("medication",e.target.value)}>
                  {GLP1_MEDS.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="r2">
                <div className="field"><label>Current Dose</label>
                  <select value={gl.currentDose} onChange={e=>updGlp("currentDose",e.target.value)}>
                    {(GLP1_DOSES[gl.medication]||GLP1_DOSES.Other).map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="field"><label>Injection Day</label>
                  <select value={gl.injectionDay} onChange={e=>updGlp("injectionDay",e.target.value)}>
                    {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="field"><label>Start Date</label>
                <input type="date" value={gl.startDate} style={{colorScheme:"dark"}} onChange={e=>updGlp("startDate",e.target.value)}/>
              </div>
              <div className="wi wamb" style={{marginTop:4,fontSize:12}}>Protein targets set higher. App will remind you to eat even when not hungry.</div>
            </div>
          )}
        </div>
      );
      case 3:{
        const gp=user.goal.primary;
        if(gp==="fat_loss") return(
          <div className="fi">
            <div className="field"><label>Current Weight</label>
              <input disabled value={`${user.weightLbs} lbs`} style={{opacity:.5}}/>
            </div>
            <div className="r2">
              <div className="field"><label>Target Weight (lbs)</label>
                <input type="number" inputMode="decimal" placeholder="210" value={user.goal.targetWeightLbs}
                  onChange={e=>updG("targetWeightLbs",e.target.value)}
                  onBlur={e=>{const v=parseFloat(e.target.value);if(isNaN(v)||v<=0||v>=+user.weightLbs)updG("targetWeightLbs","");}}/>
              </div>
              <div className="field"><label>Target Date</label>
                <input type="date" value={user.goal.targetDate||""} style={{colorScheme:"dark"}}
                  min={new Date(Date.now()+7*864e5).toISOString().split("T")[0]}
                  max={new Date(Date.now()+365*864e5).toISOString().split("T")[0]}
                  onChange={e=>{
                    const d=e.target.value;
                    const wks=d?Math.round((new Date(d)-Date.now())/864e5/7):0;
                    updG("targetDate",d); updG("targetWeeks",wks>0?wks:"");
                  }}/>
              </div>
            </div>
            {rate>0&&ri&&(
              <div className="rc fi" style={{background:`${ri.c}0E`,borderColor:`${ri.c}35`}}>
                <div className="rl" style={{color:ri.c}}>{ri.label} — {rate.toFixed(1)} lbs/week</div>
                <div className="rm">{ri.msg}</div>
              </div>
            )}
            {user.goal.targetWeightLbs&&user.goal.targetDate&&(
              <div className="ps fi">
                <div className="pt">📊 Your Plan</div>
                {[
                  ["To lose",`${(+user.weightLbs-+user.goal.targetWeightLbs).toFixed(1)} lbs`],
                  ["Timeline",`${user.goal.targetWeeks} weeks`],
                  ["Pace",`${rate.toFixed(1)} lbs/week`],
                  ["Est. daily deficit",`~${Math.round(rate*500)} cal`],
                  ["Goal by",user.goal.targetDate?new Date(user.goal.targetDate).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"—"],
                ].map(([k,v])=>(
                  <div key={k} className="pr"><span className="pk">{k}</span><span className="pv">{v}</span></div>
                ))}
              </div>
            )}
          </div>
        );
        const g=GOALS.find(x=>x.id===gp)||{icon:"✨",label:"Your Goal"};
        if(gp==="maintain") return(
          <div className="fi">
            <div className="ic">
              <div className="ii">🎯</div>
              <div className="it">Maintain Weight</div>
              <div className="ib">Calories set to match your TDEE exactly. Protein stays high to preserve muscle while keeping weight stable.</div>
              <ul className="ibul">
                <li>Calories = TDEE — no deficit or surplus</li>
                <li>Protein at 0.8g/lb to protect lean mass</li>
                <li>Focus on food quality and consistency</li>
                <li>Great foundation before transitioning to a new goal</li>
              </ul>
            </div>
          </div>
        );
        return(
          <div className="fi">
            <div className="ic">
              <div className="ii">{g.icon}</div><div className="it">{g.label}</div>
              <div className="ib">Macros will be set based on your TDEE and goal. You can fine-tune them next.</div>
              <ul className="ibul"><li>All macros derived from your stats</li><li>Protein optimized for your goal</li><li>Alerts and suggestions tailored accordingly</li></ul>
            </div>
          </div>
        );
      }
      case 4: return(
        <div className="fi">
          <p style={{color:"var(--tx2)",fontSize:13,marginBottom:16,lineHeight:1.6}}>Sets your TDEE — the calorie baseline everything builds from.</p>
          <div className="acts">
            {ACTIVITIES.map(a=>{
              const b=user.weightLbs&&user.age?calcBMR(+user.weightLbs,tIn(),user.age,user.sex):0;
              const t=b?calcTDEE(b,a.id):0;
              return(
                <div key={a.id} className={`ac ${user.activityLevel===a.id?"on":""}`} onClick={()=>upd("activityLevel",a.id)}>
                  <div className="adot"/>
                  <div className="ainf"><div className="al">{a.label}</div><div className="ad">{a.desc}</div></div>
                  {t>0&&<div className="tc">{t} cal</div>}
                </div>
              );
            })}
          </div>
          {tdee>0&&<div style={{marginTop:14,textAlign:"center",color:"var(--tx2)",fontSize:13}}>Your TDEE: <strong style={{color:"var(--acc)"}}>{tdee} cal/day</strong></div>}
        </div>
      );
      case 5:{
        const warn=getWarnings(macros,user.weightLbs,user.goal.primary,user.glp1.active);
        return(
          <div className="fi">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <p style={{color:"var(--tx2)",fontSize:13,lineHeight:1.5,flex:1}}>Adjust <strong style={{color:"var(--tx)"}}>calories and protein</strong> only.</p>
              <button onClick={()=>setMacros(recMacros(user.weightLbs||180,user.goal.primary,tdee,user.preferences))}
                style={{flexShrink:0,marginLeft:12,padding:"8px 14px",borderRadius:10,border:"1.5px solid #00E5A030",background:"#00E5A00A",color:"var(--acc)",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                ↺ Optimal
              </button>
            </div>
            <div className="mr">
              <div className="mrh">
                <div className="mn"><div className="mdo" style={{background:"var(--kcal)"}}/>Calories</div>
                <div><span className="mv" style={{color:"var(--kcal)"}}>{macros.calories}</span><span className="mu">kcal</span></div>
              </div>
              <input type="range" min={calMin} max={calMax} step={50} value={macros.calories} style={{accentColor:"var(--kcal)"}} onChange={e=>handleCal(e.target.value)}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                <span style={{fontSize:11,color:"var(--tx3)"}}>Min {calMin}</span>
                <span style={{fontSize:11,color:"var(--acc)",fontWeight:600}}>TDEE {tdee}</span>
                <span style={{fontSize:11,color:"var(--tx3)"}}>Max {calMax}</span>
              </div>
            </div>
            <div className="mr">
              <div className="mrh">
                <div className="mn"><div className="mdo" style={{background:"var(--pro)"}}/>Protein</div>
                <div><span className="mv" style={{color:"var(--pro)"}}>{macros.protein}</span><span className="mu">g</span></div>
              </div>
              <input type="range" min={pMin} max={pMax} step={5} value={macros.protein} style={{accentColor:"var(--pro)"}} onChange={e=>handleProt(e.target.value)}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                <span style={{fontSize:11,color:"var(--tx3)"}}>{pMin}g</span>
                <span style={{fontSize:11,color:"var(--acc)",fontWeight:600}}>{(macros.protein/pLbs).toFixed(2)}g/lb</span>
                <span style={{fontSize:11,color:"var(--tx3)"}}>{pMax}g</span>
              </div>
            </div>
            <div className="mr" style={{opacity:.75}}>
              <div className="mrh">
                <div className="mn"><div className="mdo" style={{background:"var(--car)"}}/>Carbs<span className="ab">auto</span></div>
                <div><span className="mv" style={{color:"var(--car)"}}>{macros.carbs}</span><span className="mu">g</span></div>
              </div>
              <div className="lb"><div className="lf" style={{width:`${Math.min(100,macros.carbs/350*100)}%`,background:"#00B8FF"}}/></div>
            </div>
            <div className="mr" style={{opacity:.75}}>
              <div className="mrh">
                <div className="mn"><div className="mdo" style={{background:"var(--fat)"}}/>Fat<span className="ab">auto</span></div>
                <div><span className="mv" style={{color:"var(--fat)"}}>{macros.fat}</span><span className="mu">g</span></div>
              </div>
              <div className="lb"><div className="lf" style={{width:`${Math.min(100,macros.fat/150*100)}%`,background:"#FFB347"}}/></div>
            </div>
            <div className="wl">{warn.map((w,i)=><div key={i} className={`wi w${w.l}`}>{w.t}</div>)}</div>
            <div style={{background:"var(--sf2)",borderRadius:12,padding:"11px 14px",marginTop:10,fontSize:12,color:"var(--tx2)",display:"flex",gap:14,flexWrap:"wrap"}}>
              <span style={{color:"var(--pro)"}}>{macros.protein}g×4={macros.protein*4}</span>
              <span style={{color:"var(--car)"}}>{macros.carbs}g×4={macros.carbs*4}</span>
              <span style={{color:"var(--fat)"}}>{macros.fat}g×9={macros.fat*9}</span>
              <span style={{color:"var(--tx3)",marginLeft:"auto"}}>={macros.protein*4+macros.carbs*4+macros.fat*9} cal</span>
            </div>
          </div>
        );
      }
      case 6: return(
        <div className="fi">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--sf2)",border:"1.5px solid var(--br)",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
            <div><div style={{fontWeight:500,marginBottom:2}}>Enable All Alerts</div><div style={{fontSize:12,color:"var(--tx2)"}}>Adjust individually below</div></div>
            <button className={`tog ${user.notifications.enabled?"on":"off"}`} onClick={()=>updN("enabled",!user.notifications.enabled)}/>
          </div>
          <div className="nl" style={{opacity:user.notifications.enabled?1:.4,transition:"opacity .2s",pointerEvents:user.notifications.enabled?"auto":"none"}}>
            {NOTIFS.filter(n=>!n.glp1||user.glp1.active).map(n=>(
              <div key={n.key} className={`nr ${n.glp1?"g2":""}`}>
                <div className="nt"><div className="ntl">{n.label}{n.glp1&&<span style={{fontSize:10,color:"var(--acc2)",marginLeft:5}}>GLP-1</span>}</div><div className="nts">{n.sub}</div></div>
                <button className={`tog ${user.notifications[n.key]?"on":"off"}`} onClick={()=>updN(n.key,!user.notifications[n.key])}/>
              </div>
            ))}
          </div>
        </div>
      );
      case 7: return(
        <div className="fi">
          <p style={{color:"var(--tx2)",fontSize:13,marginBottom:16,lineHeight:1.6}}>Used by the suggestion engine. <strong style={{color:"var(--acc)"}}>Low Carb</strong> shifts your carb/fat split.</p>
          <div className="pg">
            {PREFS.map(p=>(
              <button key={p} className={`pc ${user.preferences.includes(p)?"on":""}`}
                onClick={()=>{togP(p);if(p==="Low Carb")setTimeout(()=>setMacros(m=>deriveMacros(m.calories,m.protein,user.preferences.includes(p)?user.preferences.filter(x=>x!==p):[...user.preferences,p])),30);}}>
                {p}
              </button>
            ))}
          </div>
        </div>
      );
      default: return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HOME TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderHome=()=>{
    const g=user.goal, gl=user.glp1, m=user.macros||macros;
    const goalObj=GOALS.find(x=>x.id===g.primary)||{icon:"✨",label:"Wellness"};
    const daysIn=g.startDate?Math.floor((Date.now()-new Date(g.startDate))/864e5):0;
    const injIn=(()=>{
      if(!gl.active||!gl.injectionDay) return null;
      const idx=DAYS.indexOf(gl.injectionDay),tod=new Date().getDay(),ta=tod===0?6:tod-1;
      let d=idx-ta; if(d<0)d+=7; return d;
    })();
    const wksOn=gl.startDate?Math.floor((Date.now()-new Date(gl.startDate))/864e5/7):null;

    return(
      <div className="home fi">
        <div className="dg">
          <div className="dsub">Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}</div>
          <h2><span>{user.name||"Friend"}</span> 👋</h2>
        </div>

        {/* Macro Ring — now LIVE */}
        <div className="card">
          <div className="ctitle">{goalObj.icon} Today's Macros <span className="cbadge">{daysIn}d in</span></div>
          <div className="ring-wrap">
            <div className="rw">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="48" fill="none" stroke="var(--br)" strokeWidth="7"/>
                <circle cx="55" cy="55" r="48" fill="none" stroke="var(--kcal)"
                  strokeWidth="7" strokeDasharray={circ} strokeDashoffset={calDash}
                  strokeLinecap="round" style={{transition:"stroke-dashoffset .5s ease"}}/>
              </svg>
              <div className="rcc">
                <div className="kcal-num">{totals.cal}</div>
                <div className="kcal-lbl">of {m.calories}<br/>kcal</div>
              </div>
            </div>
            <div className="macro-bars">
              {[
                {l:"Protein",v:totals.pro,g:m.protein,c:"var(--pro)"},
                {l:"Carbs",  v:totals.carb,g:m.carbs, c:"var(--car)"},
                {l:"Fat",    v:totals.fat, g:m.fat,    c:"var(--fat)"},
              ].map(r=>(
                <div key={r.l} className="mbar-row">
                  <div className="mbar-lbl">{r.l}</div>
                  <div className="mbar-track"><div className="mbar-fill" style={{width:`${pct(r.v,r.g)}%`,background:r.c}}/></div>
                  <div className="mbar-val" style={{color:r.c}}>{r.v}g</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Remaining */}
        <div className="card">
          <div className="ctitle">Remaining Today</div>
          <div className="remain-grid">
            {[
              {l:"Cal",  v:over.cal?`+${totals.cal-tgt.calories}`:rem.cal,  o:over.cal,  c:"var(--kcal)"},
              {l:"Prot", v:over.pro?`+${totals.pro-tgt.protein}g`:rem.pro+"g",o:over.pro,c:"var(--pro)"},
              {l:"Carbs",v:over.carb?`+${totals.carb-tgt.carbs}g`:rem.carb+"g",o:over.carb,c:"var(--car)"},
              {l:"Fat",  v:over.fat?`+${totals.fat-tgt.fat}g`:rem.fat+"g", o:over.fat,  c:"var(--fat)"},
            ].map(r=>(
              <div key={r.l} className="rem-cell">
                <div className={`rem-val ${r.o?"rem-over":""}`} style={{color:r.o?"var(--red)":r.c}}>{r.v}</div>
                <div className="rem-lbl">{r.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* GLP1 */}
        {gl.active&&(
          <div className="gd2">
            <div className="gdt">💉 {gl.medication} — {gl.currentDose}</div>
            <div className="gds">
              <div><div className="gdsv">{injIn===0?"Today":injIn!=null?`${injIn}d`:"—"}</div><div className="gdsk">Next dose</div></div>
              <div><div className="gdsv">{gl.injectionDay?.slice(0,3)||"—"}</div><div className="gdsk">Inj. day</div></div>
              <div><div className="gdsv">{wksOn!=null?wksOn:"—"}</div><div className="gdsk">Weeks on</div></div>
            </div>
            {injIn!=null&&injIn<=1&&(
              <div style={{marginTop:10,fontSize:12,color:"var(--acc2)",lineHeight:1.5}}>
                {injIn===0?"💉 Injection day — prep high-protein meals for tomorrow.":"⏳ Dose tomorrow — have easy protein options ready."}
              </div>
            )}
          </div>
        )}

        {/* Log CTA */}
        <button className="btn btnp" onClick={()=>setTab("log")} style={{width:"100%",marginBottom:12}}>
          + Log Food
        </button>

        {/* #19 Protein gap nudge */}
        {(() => {
          const protPct = totals.pro / (tgt.protein||1);
          const calPct  = totals.cal  / (tgt.calories||1);
          if (protPct < 0.5 && calPct > 0.4) return (
            <div className="nudge-card">
              <div className="nudge-icon">⚡</div>
              <div className="nudge-text">
                <div className="nudge-title">Protein gap alert</div>
                <div className="nudge-body">You've used {Math.round(calPct*100)}% of calories but only {Math.round(protPct*100)}% of protein. Prioritize high-ratio foods now.</div>
              </div>
              <div className="nudge-action" onClick={()=>setTab("log")}>Log →</div>
            </div>
          );
          if (protPct < 0.3 && new Date().getHours() >= 14) return (
            <div className="nudge-card">
              <div className="nudge-icon">🎯</div>
              <div className="nudge-text">
                <div className="nudge-title">Behind on protein</div>
                <div className="nudge-body">Only {totals.pro}g logged by {new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}. You need {rem.pro}g more — double down at dinner.</div>
              </div>
              <div className="nudge-action" onClick={()=>setTab("log")}>Log →</div>
            </div>
          );
          return null;
        })()}

        {/* #26 Recent meals quick-add */}
        {(() => {
          const recent = Object.values(dayLog).flat().filter(i=>i.state!=="recommended").slice(-6);
          if (recent.length === 0) return null;
          return (
            <div className="card">
              <div className="ctitle">⚡ Quick Add</div>
              <div className="recent-row">
                {recent.reverse().filter((v,i,a)=>a.findIndex(x=>x.name===v.name)===i).slice(0,6).map(item=>(
                  <div key={item.logId} className="recent-chip"
                    onClick={()=>{ const meal=MEALS.find(m=>(dayLog[m]||[]).length<4)||"snacks"; addFoodToMeal(meal,item); }}>
                    <div className="rc-name">{item.name}</div>
                    <div className="rc-macs">{item.pro}p · {item.carb}c · {item.fat}f</div>
                    <div className="rc-cal">{item.cal}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:"var(--tx3)",marginTop:4}}>Tap to re-add to next available meal</div>
            </div>
          );
        })()}

        {/* ── Streaks ── */}
        {(()=>{
          const today=todayStr();
          const defs=[
            {key:"logging", icon:"📋", label:"Logging"},
            {key:"protein", icon:"💪", label:"Protein"},
            {key:"weighIn", icon:"⚖️", label:"Weigh-In"},
            ...(supplements.length>0?[{key:"supps",icon:"💊",label:"Supps"}]:[]),
          ];
          const hasAny=defs.some(d=>(streaks[d.key]?.count||0)>0);
          if(!hasAny) return null;
          return(
            <div className="card">
              <div className="ctitle">🔥 Streaks</div>
              <div className="streak-row">
                {defs.map(d=>{
                  const s=streaks[d.key]||{count:0,lastDate:null};
                  const alive=s.lastDate===today;
                  return(
                    <div key={d.key} className={`streak-badge ${alive?"alive":""} ${s.count===0?"zero":""}`}>
                      <div className="streak-flame">{alive?"🔥":"💤"}</div>
                      <div className="streak-count" style={{color:alive?"var(--warn)":"var(--tx3)"}}>{s.count}</div>
                      <div className="streak-label">{d.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Weekly Check-In ── */}
        <div className="checkin-card">
          <div className="ctitle">📅 Weekly Check-In</div>
          {checkInText?(
            <>
              <div className="checkin-text">{checkInText}</div>
              {checkInDate&&(
                <div className="checkin-meta">
                  Generated {new Date(checkInDate).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                </div>
              )}
              <div className="checkin-regen" onClick={()=>!checkInLoading&&generateWeeklyCheckIn()}>
                {checkInLoading?"Generating…":"↺ Regenerate"}
              </div>
            </>
          ):(
            <button className="checkin-trigger" disabled={checkInLoading} onClick={generateWeeklyCheckIn}>
              {checkInLoading?"📅 Reviewing your week…":"📅 Generate Weekly Check-In"}
            </button>
          )}
        </div>

        {/* ── Daily Debrief ── */}
        <div className="debrief-card">
          <div className="ctitle">✦ Daily Debrief</div>
          {debriefText?(
            <>
              <div className="debrief-text">{debriefText}</div>
              <div className="debrief-regen" onClick={()=>!debriefLoading&&generateDebrief()}>
                {debriefLoading?"Generating…":"↺ Regenerate"}
              </div>
            </>
          ):(
            <button className="debrief-trigger" disabled={debriefLoading} onClick={generateDebrief}>
              {debriefLoading?"✦ Generating your debrief…":"✦ Generate Today's Debrief"}
            </button>
          )}
        </div>

        <div className="das">
          <button className="dab p" onClick={()=>setTab("log")}>+ Log Food</button>
          <button className="dab" onClick={()=>setTab("settings")}>⚙️ Settings</button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER LOG TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderLog=()=>{
    const isToday=logDate===todayStr();
    const tgt=user.macros||macros;
    return(
      <div className="logscreen">
        {/* Top bar with back button */}
        <div className="log-top-bar">
          <button className="back-btn" onClick={()=>setTab("home")}>‹ Home</button>
          <div className="log-top-title">Food Log</div>
          <div style={{width:60}}/>
        </div>

        {/* Sticky header */}
        <div className="log-header">
          {/* Date nav */}
          <div className="date-nav" style={{padding:"0 20px"}}>
            <button className="date-nav-btn" onClick={()=>navigateDate(-1)}>‹</button>
            <div className="date-center">
              <div className="date-label">{fmtDate(logDate)}</div>
              <div className="date-sub">{new Date(logDate+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
            </div>
            <button className="date-nav-btn" onClick={()=>navigateDate(1)} disabled={isToday}>›</button>
          </div>
          {/* Macro strip */}
          <div className="log-macro-strip">
            {[
              {l:"Calories",v:totals.cal,g:tgt.calories,c:"var(--kcal)"},
              {l:"Protein", v:totals.pro,g:tgt.protein, c:"var(--pro)"},
              {l:"Carbs",   v:totals.carb,g:tgt.carbs,  c:"var(--car)"},
              {l:"Fat",     v:totals.fat, g:tgt.fat,     c:"var(--fat)"},
            ].map(s=>(
              <div key={s.l} className="strip-cell">
                <div className="strip-progress" style={{width:`${pct(s.v,s.g)}%`,background:s.c,height:3,borderRadius:0}}/>
                <div className="strip-val" style={{color:s.c}}>{s.v}</div>
                <div className="strip-lbl">{s.l}</div>
                <div className="strip-pct" style={{color:s.v>s.g?"var(--red)":"var(--tx3)"}}>{s.v>s.g?`+${s.v-s.g}`:`${s.g-s.v} left`}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Meal sections */}
        <div className="log-body fi">
          {/* Auto-fill button */}
          <button className="autofill-btn" onClick={autoFillDay} disabled={autoFilling}>
            {autoFilling ? "⏳ Building your day…" : "✦ Auto-Fill Day"}
          </button>

          {/* Quick-log a recipe */}
          <div className="recipe-log-bar" onClick={()=>{setTab("recipes");}}>
            <div style={{fontSize:18,flexShrink:0}}>📖</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,color:"var(--acc)",marginBottom:2}}>Log a Recipe</div>
              <div style={{fontSize:11,color:"var(--tx2)"}}>{recipes.length} saved · tap to browse and log a serving</div>
            </div>
            <div style={{color:"var(--tx3)",fontSize:16}}>›</div>
          </div>

          {/* Supplement checklist — only shown if supplements exist */}
          {supplements.length>0&&(
            <div className="supp-log-bar">
              <div className="supp-log-bar-head">
                <span style={{fontSize:16}}>💊</span>
                <span className="supp-log-bar-title">Today's Supplements</span>
                <span className="supp-log-bar-count">
                  {Object.values(suppLog).filter(Boolean).length}/{supplements.length} taken
                </span>
              </div>
              <div className="supp-log-chips">
                {supplements.map(s=>{
                  const done=!!suppLog[s.id];
                  return(
                    <div key={s.id} className={`supp-log-chip ${done?"done":""}`} onClick={()=>toggleSupp(s.id)}>
                      <div className={`supp-chip-check ${done?"done":""}`}>{done?"✓":""}</div>
                      <div className="supp-chip-label" style={{textDecoration:done?"line-through":"none",opacity:done?.65:1}}>
                        {s.name}
                      </div>
                      <div className="supp-chip-meta">
                        {s.dose&&<span>{s.dose}</span>}
                        {s.dose&&s.timing&&" · "}
                        {s.timing&&<span style={{textTransform:"capitalize"}}>{s.timing}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {MEALS.map(meal=>{
            const items=dayLog[meal]||[];
            const loggedItems=items.filter(i=>i.state!=="recommended");
            const recItems=items.filter(i=>i.state==="recommended");
            const mealCal=loggedItems.reduce((s,i)=>s+i.cal,0);
            return(
              <div key={meal} className="meal-section">
                <div className="meal-head">
                  <div className="meal-title">
                    <span>{MEAL_ICONS[meal]}</span>
                    <span>{MEAL_LABELS[meal]}</span>
                    {completedMeals[meal]&&<span style={{fontSize:11,color:"var(--acc)",marginLeft:4}}>✓</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {mealCal>0&&<span className="meal-cals">{mealCal} cal</span>}
                    {/* Recommend button — only when meal is empty */}
                    {loggedItems.length===0&&recItems.length===0&&(
                      <button className={`complete-btn ${recommendingMeal===meal?"loading":""}`}
                        style={{color:"var(--acc2)",borderColor:"#00B8FF30",background:"#00B8FF0A"}}
                        onClick={()=>recommendMeal(meal)}>
                        {recommendingMeal===meal?"…":"✦ Suggest"}
                      </button>
                    )}
                    {loggedItems.length>0&&(
                      <button className={`complete-btn ${completedMeals[meal]?"done":""} ${analyzingMeal===meal?"loading":""}`}
                        onClick={()=>{if(!completedMeals[meal]&&analyzingMeal!==meal)completeMeal(meal);}}>
                        {analyzingMeal===meal?"…":completedMeals[meal]?"✓ Done":"Complete"}
                      </button>
                    )}
                    <button className="add-btn" onClick={()=>{setAddModal({meal});setSearch("");setLibTab("all");}}>+</button>
                  </div>
                </div>
                {mealAnalysis[meal]&&(
                  <div className="analysis-card">
                    <div className="analysis-text">{mealAnalysis[meal].text}</div>
                  </div>
                )}
                {loggedItems.length===0&&recItems.length===0?(
                  <div className="meal-empty" onClick={()=>{setAddModal({meal});setSearch("");setLibTab("all");}}>
                    Tap + to log {MEAL_LABELS[meal].toLowerCase()}
                  </div>
                ):(
                  <>
                    {loggedItems.map(item=>{
                      const dm=user.settings?.displayMacros||["cal","pro","carb","fat"];
                      return(
                      <div key={item.logId} className="food-item">
                        <div className="fi-name">
                          <div className="fi-title">{item.name}</div>
                          <div className="fi-sub">{item.serving}</div>
                        </div>
                        <div className="fi-macros">
                          {dm.includes("pro")&&<span className="fi-mac" style={{color:"var(--pro)"}}>{item.pro}p</span>}
                          {dm.includes("carb")&&<span className="fi-mac" style={{color:"var(--car)"}}>{item.carb}c</span>}
                          {dm.includes("fat")&&<span className="fi-mac" style={{color:"var(--fat)"}}>{item.fat}f</span>}
                        </div>
                        {dm.includes("cal")&&<div className="fi-cal">{item.cal}</div>}
                        <button className="fi-del" onClick={()=>removeFoodFromMeal(meal,item.logId)}>✕</button>
                      </div>
                    );})}
                    {recItems.map(item=>{
                      const dm=user.settings?.displayMacros||["cal","pro","carb","fat"];
                      return(
                      <div key={item.logId} className="food-item recommended">
                        <div className="fi-name">
                          <div className="fi-title">{item.name}<span className="rec-badge">suggested</span></div>
                          <div className="fi-sub">{item.serving}</div>
                        </div>
                        <div className="fi-macros">
                          {dm.includes("pro")&&<span className="fi-mac" style={{color:"var(--pro)"}}>{item.pro}p</span>}
                          {dm.includes("carb")&&<span className="fi-mac" style={{color:"var(--car)"}}>{item.carb}c</span>}
                          {dm.includes("fat")&&<span className="fi-mac" style={{color:"var(--fat)"}}>{item.fat}f</span>}
                        </div>
                        {dm.includes("cal")&&<div className="fi-cal">{item.cal}</div>}
                        <button className="fi-del" style={{color:"var(--acc2)"}}
                          onClick={()=>{
                            const updated={...dayLog,[meal]:dayLog[meal].map(i=>i.logId===item.logId?{...i,state:"logged"}:i)};
                            saveLog(updated);
                          }}>✓</button>
                      </div>
                    );})}

                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD FOOD MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  const renderAddModal=()=>{
    if(!addModal) return null;
    const isManual=libTab==="manual";
    return(
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&setAddModal(null)}>
        <div className="sheet">
          <div className="sheet-header">
            <div className="sheet-handle"/>
            <button className="sheet-close" onClick={()=>setAddModal(null)}>✕</button>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div className="sheet-title" style={{marginBottom:0}}>Add to {MEAL_LABELS[addModal.meal]}</div>
              <button
                onClick={()=>setLibTab("photo")}
                style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",
                  borderRadius:12,border:"1.5px solid #FFB34730",background:"#FFB34710",
                  color:"var(--warn)",fontFamily:"'Syne',sans-serif",fontWeight:700,
                  fontSize:12,cursor:"pointer",flexShrink:0}}>
                📷 Photo
              </button>
            </div>
            {libTab!=="photo"&&<input className="search-input" placeholder="Search foods..." value={search}
              onChange={e=>setSearch(e.target.value)} autoFocus={false}/>}
            <div className="tab-strip">
              {[
                {id:"all",       label:"All"},
                {id:"favorites", label:"⭐ Favorites"},
                {id:"custom",    label:"My Foods"},
                {id:"breakfast", label:"☀️ Breakfast"},
                {id:"protein",   label:"💪 High Protein"},
                {id:"snacks",    label:"🍎 Snacks"},
                {id:"recipes",   label:"📖 Recipes"},
                {id:"photo",     label:"📷 Photo"},
                {id:"manual",    label:"+ Add New"},
              ].map(t=>(
                <button key={t.id} className={`ts-btn ${libTab===t.id?"on":""}`} onClick={()=>setLibTab(t.id)}>{t.label}</button>
              ))}
            </div>
            {/* Sort row */}
            {libTab!=="manual"&&libTab!=="photo"&&(
              <div style={{display:"flex",gap:6,marginBottom:12,overflow:"auto",scrollbarWidth:"none"}}>
                <span style={{fontSize:11,color:"var(--tx2)",alignSelf:"center",flexShrink:0}}>Sort:</span>
                {[{id:"ratio",l:"Best Ratio"},{id:"protein",l:"Protein"},{id:"cal",l:"Low Cal"},{id:"name",l:"A–Z"}].map(s=>(
                  <button key={s.id} className={`ts-btn ${sortBy===s.id?"on":""}`} style={{padding:"5px 10px"}}
                    onClick={()=>setSortBy(s.id)}>{s.l}</button>
                ))}
              </div>
            )}
          </div>
          <div className="sheet-body">
            {libTab==="recipes"?(
              <div>
                {recipes.length===0?(
                  <div style={{padding:"32px 0",textAlign:"center",color:"var(--tx2)",fontSize:13}}>
                    No recipes yet.<br/>
                    <span style={{fontSize:13,color:"var(--acc)",cursor:"pointer"}} onClick={()=>{setAddModal(null);setTab("recipes");setRecipeView("create");}}>
                      + Create a recipe
                    </span>
                  </div>
                ):(
                  recipes.filter(r=>{
                    const q=search.toLowerCase();
                    return !q||r.name.toLowerCase().includes(q)||(r.description||"").toLowerCase().includes(q);
                  }).map(recipe=>{
                    const rs=ratioScore(recipe.perServing); const rl=ratioLabel(rs);
                    return(
                      <div key={recipe.id} className="lib-item" onClick={()=>addFoodToMeal(addModal.meal,recipeToFood(recipe,1))}>
                        <div className="lib-name">
                          <div className="lib-title">
                            {recipe.name}
                            {rs>0&&<span className="ratio-badge" style={{background:`${rl.c}18`,color:rl.c}}>{rs}g/100cal</span>}
                          </div>
                          <div className="lib-brand">Recipe · {recipe.servings} servings · {recipe.perServing.cal} cal/serving</div>
                        </div>
                        <div className="lib-macs">
                          <span className="lib-mac" style={{color:"var(--pro)"}}>{recipe.perServing.pro}p</span>
                          <span className="lib-mac" style={{color:"var(--car)"}}>{recipe.perServing.carb}c</span>
                          <span className="lib-mac" style={{color:"var(--fat)"}}>{recipe.perServing.fat}f</span>
                        </div>
                        <div className="lib-cal">{recipe.perServing.cal}</div>
                        <button className="add-circle">+</button>
                      </div>
                    );
                  })
                )}
              </div>
            ) : libTab==="photo"?(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>

                {/* ── State 1: No photo selected ── */}
                {!photoPreview&&!scanningLabel&&(
                  <>
                    <label htmlFor="photo-label-input" className="photo-drop-zone">
                      <div style={{fontSize:52,marginBottom:14}}>🏷️</div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,marginBottom:8}}>Scan a Nutrition Label</div>
                      <div style={{fontSize:13,color:"var(--tx2)",lineHeight:1.65,maxWidth:250,margin:"0 auto 20px"}}>
                        Point your camera at any nutrition facts panel and Claude will read it instantly
                      </div>
                      <div style={{padding:"12px 28px",borderRadius:12,background:"var(--warn)",
                        color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14}}>
                        📷 Choose Photo
                      </div>
                    </label>
                    <input id="photo-label-input" type="file" accept="image/*" capture="environment"
                      style={{display:"none"}} onChange={handlePhotoSelect}/>
                    <div style={{fontSize:11,color:"var(--tx3)",textAlign:"center"}}>
                      Works with any packaged food nutrition facts label
                    </div>
                  </>
                )}

                {/* ── State 2: Photo selected, not yet scanned ── */}
                {photoPreview&&!scanningLabel&&!labelDraft&&!labelEditForm&&(
                  <>
                    <img src={photoPreview} className="photo-preview-img" alt="Label preview"/>
                    {photoScanError?(
                      <div className="scan-error-box">
                        <div style={{fontSize:32,marginBottom:10}}>⚠️</div>
                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:"var(--red)",marginBottom:6}}>Couldn't Read Label</div>
                        <div style={{fontSize:13,color:"var(--tx2)",lineHeight:1.6,marginBottom:4}}>{photoScanError}</div>
                      </div>
                    ):null}
                    <button className="scan-action-btn" onClick={scanNutritionLabel} disabled={scanningLabel}>
                      ✦ {photoScanError?"Try Again —":"Scan Label —"} Read with Claude
                    </button>
                    <div style={{display:"flex",gap:8}}>
                      <button className="scan-ghost-btn" style={{flex:1}}
                        onClick={()=>{setPhotoPreview(null);setPhotoScanError(null);}}>
                        Choose Different Photo
                      </button>
                      {photoScanError&&(
                        <button className="scan-ghost-btn" style={{flex:1,color:"var(--acc)",borderColor:"#00E5A030"}}
                          onClick={()=>setLibTab("manual")}>
                          Enter Manually
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* ── State 3: Scanning ── */}
                {scanningLabel&&(
                  <div className="scan-scanning">
                    <div style={{fontSize:52,marginBottom:18}} className="pl">🔍</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,marginBottom:8}}>Reading Label…</div>
                    <div style={{fontSize:13,color:"var(--tx2)"}}>Claude is analyzing the nutrition facts</div>
                  </div>
                )}

                {/* ── State 4: Multiple serving options ── */}
                {labelDraft&&!labelEditForm&&(()=>{
                  const opts=labelDraft.servingOptions||[];
                  return(
                    <div className="fi">
                      <div className="scan-result-header">
                        <div className="scan-result-thumb-placeholder">🏷️</div>
                        <div>
                          <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,color:"var(--acc)",marginBottom:2}}>✓ Label Read</div>
                          <div style={{fontSize:13,fontWeight:500}}>{labelDraft.name}</div>
                          {labelDraft.brand&&<div style={{fontSize:11,color:"var(--tx2)"}}>{labelDraft.brand}</div>}
                        </div>
                      </div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,
                        textTransform:"uppercase",letterSpacing:1,color:"var(--tx2)",marginBottom:10}}>
                        {opts.length>1?"Select Serving Size":"Confirm Serving Size"}
                      </div>
                      {opts.map((opt,i)=>(
                        <div key={i} className={`serving-option ${labelServingIdx===i?"on":""}`}
                          onClick={()=>setLabelServingIdx(i)}>
                          <div className="serving-opt-label">{opt.label}</div>
                          <div className="serving-opt-macros">
                            <span style={{color:"var(--kcal)"}}>{opt.cal} cal</span>
                            <span style={{color:"var(--pro)"}}>{opt.pro}g prot</span>
                            <span style={{color:"var(--car)"}}>{opt.carb}g carb</span>
                            <span style={{color:"var(--fat)"}}>{opt.fat}g fat</span>
                          </div>
                        </div>
                      ))}
                      <button className="scan-action-btn" style={{marginTop:6}} onClick={()=>confirmServing(labelServingIdx)}>
                        Continue →
                      </button>
                      <button className="scan-ghost-btn" onClick={()=>{setPhotoPreview(null);setLabelDraft(null);}}>
                        Scan a Different Photo
                      </button>
                    </div>
                  );
                })()}

                {/* ── State 5: Edit form ── */}
                {labelEditForm&&(
                  <div className="fi manual-form">
                    <div className="scan-result-header">
                      <div className="scan-result-thumb-placeholder">✓</div>
                      <div>
                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:800,color:"var(--acc)",marginBottom:2}}>Label Scanned — Review & Edit</div>
                        <div style={{fontSize:12,color:"var(--tx2)"}}>All fields are editable before saving</div>
                      </div>
                    </div>

                    {/* Name + Brand */}
                    <div className="mf-row">
                      <div className="mf-field">
                        <label>Food Name</label>
                        <input value={labelEditForm.name}
                          onChange={e=>setLabelEditForm(f=>({...f,name:e.target.value}))}/>
                      </div>
                      <div className="mf-field">
                        <label>Brand</label>
                        <input value={labelEditForm.brand}
                          onChange={e=>setLabelEditForm(f=>({...f,brand:e.target.value}))}/>
                      </div>
                    </div>

                    {/* Serving */}
                    <div className="mf-row">
                      <div className="mf-field full">
                        <label>Serving Size</label>
                        <input value={labelEditForm.serving}
                          onChange={e=>setLabelEditForm(f=>({...f,serving:e.target.value}))}/>
                      </div>
                    </div>

                    {/* Macros */}
                    <div className="mf-row">
                      <div className="mf-field">
                        <label>Calories</label>
                        <input type="number" inputMode="numeric" value={labelEditForm.cal}
                          onChange={e=>setLabelEditForm(f=>({...f,cal:e.target.value}))}/>
                      </div>
                      <div className="mf-field">
                        <label>Protein (g)</label>
                        <input type="number" inputMode="numeric" value={labelEditForm.pro}
                          onChange={e=>setLabelEditForm(f=>({...f,pro:e.target.value}))}/>
                      </div>
                    </div>
                    <div className="mf-row">
                      <div className="mf-field">
                        <label>Carbs (g)</label>
                        <input type="number" inputMode="numeric" value={labelEditForm.carb}
                          onChange={e=>setLabelEditForm(f=>({...f,carb:e.target.value}))}/>
                      </div>
                      <div className="mf-field">
                        <label>Fat (g)</label>
                        <input type="number" inputMode="numeric" value={labelEditForm.fat}
                          onChange={e=>setLabelEditForm(f=>({...f,fat:e.target.value}))}/>
                      </div>
                    </div>

                    {/* Meal tags */}
                    <div>
                      <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--tx2)",
                        textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Meal Tags</label>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {["breakfast","lunch","dinner","snack","high-protein","quick","meal-prep"].map(tag=>(
                          <button key={tag}
                            onClick={()=>setLabelEditForm(f=>({...f,tags:f.tags.includes(tag)?f.tags.filter(t=>t!==tag):[...f.tags,tag]}))}
                            className={`pc ${labelEditForm.tags.includes(tag)?"on":""}`}
                            style={{fontSize:12,padding:"7px 12px"}}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Log to meal picker */}
                    <div>
                      <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--tx2)",
                        textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Log To</label>
                      <div className="photo-meal-picker">
                        {MEALS.map(m=>(
                          <button key={m} className={`photo-meal-btn ${labelEditForm.meal===m?"on":""}`}
                            onClick={()=>setLabelEditForm(f=>({...f,meal:m}))}>
                            <span style={{fontSize:18,display:"block",marginBottom:3}}>{MEAL_ICONS[m]}</span>
                            {MEAL_LABELS[m]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button className="save-btn"
                      disabled={!labelEditForm.name||!labelEditForm.cal}
                      onClick={savePhotoFood}>
                      Save & Log to {MEAL_LABELS[labelEditForm.meal||addModal?.meal||"breakfast"]}
                    </button>
                    <button className="scan-ghost-btn"
                      onClick={()=>{setLabelDraft(null);setLabelEditForm(null);setPhotoPreview(null);}}>
                      Scan a Different Photo
                    </button>
                  </div>
                )}

              </div>
            ) : libTab==="manual"?(
              <div className="manual-form">
                <p style={{fontSize:13,color:"var(--tx2)",marginBottom:8,lineHeight:1.5}}>Enter details manually. Saved to your library for quick-add next time.</p>
                <div className="mf-row">
                  <div className="mf-field full">
                    <label>Food Name</label>
                    <input placeholder="e.g. Protein Fluff Bowl" value={manForm.name} onChange={e=>setManForm(f=>({...f,name:e.target.value}))}/>
                  </div>
                </div>
                <div className="mf-row">
                  <div className="mf-field full">
                    <label>Serving Size</label>
                    <input placeholder="e.g. 1 cup, 4 oz" value={manForm.serving} onChange={e=>setManForm(f=>({...f,serving:e.target.value}))}/>
                  </div>
                </div>
                <div className="mf-row">
                  <div className="mf-field">
                    <label>Calories</label>
                    <input type="number" inputMode="numeric" placeholder="350" value={manForm.cal} onChange={e=>setManForm(f=>({...f,cal:e.target.value}))}/>
                  </div>
                  <div className="mf-field">
                    <label>Protein (g)</label>
                    <input type="number" inputMode="numeric" placeholder="53" value={manForm.pro} onChange={e=>setManForm(f=>({...f,pro:e.target.value}))}/>
                  </div>
                </div>
                <div className="mf-row">
                  <div className="mf-field">
                    <label>Carbs (g)</label>
                    <input type="number" inputMode="numeric" placeholder="29" value={manForm.carb} onChange={e=>setManForm(f=>({...f,carb:e.target.value}))}/>
                  </div>
                  <div className="mf-field">
                    <label>Fat (g)</label>
                    <input type="number" inputMode="numeric" placeholder="5" value={manForm.fat} onChange={e=>setManForm(f=>({...f,fat:e.target.value}))}/>
                  </div>
                </div>
                <button className="save-btn" disabled={!manForm.name||!manForm.cal} onClick={saveManual}>
                  Save & Add to {MEAL_LABELS[addModal.meal]}
                </button>
              </div>
            ):(
              filteredLib.length===0?(
                <div style={{padding:"32px 0",textAlign:"center",color:"var(--tx2)",fontSize:14}}>
                  {libTab==="favorites"
                    ? <>No favorites yet.<br/><span style={{fontSize:12,color:"var(--tx3)"}}>Tap ☆ on any food to save it here</span></>
                    : <>No foods found.<br/><span style={{fontSize:13,color:"var(--acc)",cursor:"pointer"}} onClick={()=>setLibTab("manual")}>+ Add a new food</span></>
                  }
                </div>
              ):(
                filteredLib.map(f=>{
                  const rs=ratioScore(f); const rl=ratioLabel(rs);
                  const isFav=(f.tags||[]).includes("favorite");
                  return(
                  <div key={f.id} className="lib-item" onClick={()=>addFoodToMeal(addModal.meal,f)}>
                    <div className="lib-name">
                      <div className="lib-title">
                        {f.name}
                        {rs>0&&<span className="ratio-badge" style={{background:`${rl.c}18`,color:rl.c}}>{rs}g/100cal</span>}
                      </div>
                      <div className="lib-brand">{f.brand} · {f.serving}</div>
                    </div>
                    <div className="lib-macs">
                      <span className="lib-mac" style={{color:"var(--pro)"}}>{f.pro}p</span>
                      <span className="lib-mac" style={{color:"var(--car)"}}>{f.carb}c</span>
                      <span className="lib-mac" style={{color:"var(--fat)"}}>{f.fat}f</span>
                    </div>
                    <div className="lib-cal">{f.cal}</div>
                    <button className={`fav-btn ${isFav?"on":""}`} onClick={e=>toggleFavorite(e,f.id)}>
                      {isFav?"⭐":"☆"}
                    </button>
                    <button className="add-circle" onClick={e=>{e.stopPropagation();addFoodToMeal(addModal.meal,f);}}>+</button>
                  </div>
                );})
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER SETTINGS TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderSettings=()=>{
    const dm = user.settings?.displayMacros || ["cal","pro","carb","fat"];
    const sb = user.settings?.sortFoodBy || "ratio";
    const toggleMacro = (key) => {
      const cur = dm.includes(key) ? dm.filter(x=>x!==key) : [...dm,key];
      if(cur.length===0) return; // always keep at least one
      const updated = {...user, settings:{...user.settings, displayMacros:cur}};
      setUser(updated);
      DB.set("nourish:profile",updated).catch(()=>{});
    };
    const setSort = (key) => {
      const updated = {...user, settings:{...user.settings, sortFoodBy:key}};
      setUser(updated); setSortBy(key);
      DB.set("nourish:profile",updated).catch(()=>{});
    };
    return(
      <div className="settings-screen fi">
        <h2>Settings</h2>

        {/* Display prefs */}
        <div className="settings-section">
          <div className="settings-section-title">Macro Display</div>
          <div className="settings-row">
            <div className="settings-row-text">
              <div className="settings-row-label">Show on food cards</div>
              <div className="settings-row-sub">Choose which macros appear on food items and log entries</div>
              <div className="macro-toggle-row">
                {[{k:"cal",l:"Calories"},{k:"pro",l:"Protein"},{k:"carb",l:"Carbs"},{k:"fat",l:"Fat"}].map(m=>(
                  <button key={m.k} className={`mac-tog ${dm.includes(m.k)?"on":""}`} onClick={()=>toggleMacro(m.k)}>{m.l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Food sort */}
        <div className="settings-section">
          <div className="settings-section-title">Default Food Sort</div>
          <div className="settings-row">
            <div className="settings-row-text">
              <div className="settings-row-label">Sort food library by</div>
              <div className="settings-row-sub">Applied by default when browsing foods to add</div>
              <div className="sort-opts">
                {[{k:"ratio",l:"Best Protein Ratio"},{k:"protein",l:"Highest Protein"},{k:"cal",l:"Lowest Cal"},{k:"name",l:"A–Z"}].map(s=>(
                  <button key={s.k} className={`sort-opt ${sb===s.k?"on":""}`} onClick={()=>setSort(s.k)}>{s.l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Water goal */}
        <div className="settings-section">
          <div className="settings-section-title">Water Goal</div>
          <div className="settings-row">
            <div className="settings-row-text">
              <div className="settings-row-label">Daily water target</div>
              <div className="settings-row-sub">Auto-calculated from your weight and GLP-1 status</div>
            </div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"var(--acc2)"}}>
              {waterGoal}oz
            </div>
          </div>
        </div>

        {/* Supplements & Medications */}
        <div className="settings-section">
          <div className="settings-section-title">💊 Supplements & Medications</div>
          <div style={{fontSize:12,color:"var(--tx2)",marginBottom:12,lineHeight:1.5}}>
            Set up your stack once — it appears on your daily Body and Log screens automatically.
          </div>

          {supplements.length===0&&!suppFormOpen&&(
            <div style={{textAlign:"center",padding:"16px 0 8px",color:"var(--tx3)",fontSize:13}}>
              No supplements added yet
            </div>
          )}

          {supplements.map(s=>{
            const isEditing=suppEditId===s.id;
            return(
              <div key={s.id} className={`supp-mgmt-item ${isEditing?"editing":""}`}>
                <div className="supp-mgmt-row">
                  <div className="supp-mgmt-info">
                    <div className="supp-mgmt-name">{s.name}</div>
                    <div className="supp-mgmt-meta">
                      {s.dose&&<span>{s.dose}</span>}
                      {s.dose&&s.timing&&<span> · </span>}
                      {s.timing&&<span style={{textTransform:"capitalize"}}>{s.timing}</span>}
                    </div>
                    {s.notes&&<div className="supp-mgmt-note">{s.notes}</div>}
                  </div>
                  <div className="supp-mgmt-actions">
                    <button className="supp-edit-btn"
                      onClick={()=>isEditing?setSuppEditId(null):startEditSupp(s)}>
                      {isEditing?"✕":"✎"}
                    </button>
                    <button className="supp-edit-btn"
                      style={{color:"var(--red)",borderColor:"#FF6B6B25"}}
                      onClick={()=>{ if(suppEditId===s.id) setSuppEditId(null); deleteSupp(s.id); }}>
                      🗑
                    </button>
                  </div>
                </div>
                {isEditing&&(
                  <div className="supp-edit-form">
                    <div>
                      <div className="supp-edit-label">Name</div>
                      <input className="supp-input" style={{width:"100%"}}
                        value={suppEditForm.name} onChange={e=>setSuppEditForm(f=>({...f,name:e.target.value}))}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div>
                        <div className="supp-edit-label">Dose</div>
                        <input className="supp-input" placeholder="e.g. 2000 IU"
                          value={suppEditForm.dose} onChange={e=>setSuppEditForm(f=>({...f,dose:e.target.value}))}/>
                      </div>
                      <div>
                        <div className="supp-edit-label">Timing</div>
                        <select className="supp-input" value={suppEditForm.timing}
                          onChange={e=>setSuppEditForm(f=>({...f,timing:e.target.value}))}>
                          {["morning","midday","evening","with food","bedtime"].map(t=>(
                            <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="supp-edit-label">Notes (optional)</div>
                      <textarea className="supp-notes-input" placeholder="e.g. Take with food, avoid with coffee…"
                        value={suppEditForm.notes} onChange={e=>setSuppEditForm(f=>({...f,notes:e.target.value}))} rows={2}/>
                    </div>
                    <div className="supp-edit-actions">
                      <button className="supp-edit-save" disabled={!suppEditForm.name.trim()} onClick={saveEditSupp}>Save Changes</button>
                      <button className="supp-edit-cancel" onClick={()=>setSuppEditId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {suppFormOpen?(
            <div className="supp-add-form" style={{marginTop:8}}>
              <div className="supp-add-title">+ New Supplement or Medication</div>
              <input className="supp-input" style={{width:"100%",marginBottom:8}}
                placeholder="Name (e.g. Vitamin D3, Metformin)"
                value={suppForm.name} onChange={e=>setSuppForm(f=>({...f,name:e.target.value}))}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <input className="supp-input" placeholder="Dose (e.g. 2000 IU)"
                  value={suppForm.dose} onChange={e=>setSuppForm(f=>({...f,dose:e.target.value}))}/>
                <select className="supp-input" value={suppForm.timing}
                  onChange={e=>setSuppForm(f=>({...f,timing:e.target.value}))}>
                  {["morning","midday","evening","with food","bedtime"].map(t=>(
                    <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <textarea className="supp-notes-input" placeholder="Notes — e.g. take with food, avoid caffeine after… (optional)"
                value={suppForm.notes} onChange={e=>setSuppForm(f=>({...f,notes:e.target.value}))} rows={2}
                style={{marginBottom:8}}/>
              <div style={{display:"flex",gap:8}}>
                <button className="supp-save-btn" style={{flex:2}} disabled={!suppForm.name.trim()} onClick={addSupplement}>
                  Add to Stack
                </button>
                <button className="supp-save-btn" style={{flex:1,background:"var(--sf2)",color:"var(--tx2)"}}
                  onClick={()=>{setSuppFormOpen(false);setSuppForm({name:"",dose:"",timing:"morning",notes:""});}}>
                  Cancel
                </button>
              </div>
            </div>
          ):(
            <button className="supp-add-trigger" onClick={()=>setSuppFormOpen(true)}>
              + Add Supplement or Medication
            </button>
          )}
        </div>

        {/* Tools */}
        <div className="settings-section">
          <div className="settings-section-title">Tools</div>
          <div className="settings-row" style={{cursor:"pointer"}} onClick={()=>{setGroceryOpen(true);setGroceryData(null);setGroceryLoading(false);}}>
            <div className="settings-row-text">
              <div className="settings-row-label">🛒 Grocery List</div>
              <div className="settings-row-sub">Generate a weekly list from your recipes and favorites</div>
            </div>
            <div style={{color:"var(--tx2)",fontSize:18}}>›</div>
          </div>
        </div>

        {/* Profile */}
        <div className="settings-section">
          <div className="settings-section-title">Profile</div>
          <div className="settings-row" style={{cursor:"pointer"}} onClick={()=>{setStep(0);setScreen("wizard");}}>
            <div className="settings-row-text">
              <div className="settings-row-label">Edit Profile & Goals</div>
              <div className="settings-row-sub">{user.name} · {GOALS.find(g=>g.id===user.goal?.primary)?.label||"No goal set"}</div>
            </div>
            <div style={{color:"var(--tx2)",fontSize:18}}>›</div>
          </div>
          <div className="settings-row" style={{cursor:"pointer"}} onClick={()=>setConfirm(true)}>
            <div className="settings-row-text">
              <div className="settings-row-label" style={{color:"var(--red)"}}>Reset All Data</div>
              <div className="settings-row-sub">Permanently deletes profile and all logs</div>
            </div>
            <div style={{color:"var(--red)",fontSize:18}}>›</div>
          </div>
        </div>
      </div>
    );
  };
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER BODY TAB — Weight tracker, trend chart, goal progress
  // ═══════════════════════════════════════════════════════════════════════════
  const renderBody=()=>{
    const g=user.goal, gl=user.glp1;
    const goalWeight  = +g.targetWeightLbs||210;
    const startWeight = +user.weightLbs||244;
    const today       = todayStr();

    // 30-day window of dates
    const window30=[];
    for(let i=29;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      window30.push(d.toISOString().split("T")[0]);
    }

    // Map entries to dates
    const entryMap={};
    weightEntries.forEach(e=>{ entryMap[e.date]=e.weight; });

    const todayEntry  = entryMap[today];
    const sortedAll   = [...weightEntries].sort((a,b)=>a.date.localeCompare(b.date));
    const latestEntry = sortedAll[sortedAll.length-1];
    const currentWeight = latestEntry?.weight ?? startWeight;

    // 7-day rolling average per window date
    const rollingAvg=window30.map(date=>{
      const w7=[];
      for(let i=0;i<7;i++){
        const d=new Date(date+"T12:00:00"); d.setDate(d.getDate()-i);
        const ds=d.toISOString().split("T")[0];
        if(entryMap[ds]!=null) w7.push(entryMap[ds]);
      }
      return w7.length>=2 ? w7.reduce((a,b)=>a+b,0)/w7.length : null;
    });

    // Progress
    const totalToLose  = startWeight-goalWeight;
    const lostSoFar    = startWeight-currentWeight;
    const progressPct  = totalToLose>0 ? Math.max(0,Math.min(100,(lostSoFar/totalToLose)*100)) : 0;
    const lbsRemaining = Math.max(0,currentWeight-goalWeight);

    // Weekly rate from last 14 days
    const cutoff14=window30[16]; // 14 days ago
    const entries14=sortedAll.filter(e=>e.date>=cutoff14);
    let weeklyRate=null;
    if(entries14.length>=2){
      const first=entries14[0], last=entries14[entries14.length-1];
      const daysDiff=Math.max(1,(new Date(last.date)-new Date(first.date))/864e5);
      weeklyRate=(first.weight-last.weight)/daysDiff*7; // positive = losing
    }

    // 7-day average
    const last7=sortedAll.slice(-7);
    const avg7=last7.length>0 ? last7.reduce((s,e)=>s+e.weight,0)/last7.length : null;

    // Plateau: 14 days, 5+ entries, <1 lb change
    const weights14=entries14.map(e=>e.weight);
    const plateau=entries14.length>=5&&(Math.max(...weights14)-Math.min(...weights14))<1.0;

    // Projected date
    let projectedDate=g.targetDate||null;
    if(weeklyRate&&weeklyRate>0.05&&lbsRemaining>0){
      const weeksNeeded=lbsRemaining/weeklyRate;
      const proj=new Date(); proj.setDate(proj.getDate()+Math.round(weeksNeeded*7));
      projectedDate=proj.toISOString().split("T")[0];
    }

    // GLP-1 injection days in window
    const injDayIdx=DAYS.indexOf(gl.injectionDay||"");
    const injDates=new Set();
    if(gl.active&&injDayIdx>=0){
      window30.forEach(date=>{
        const d=new Date(date+"T12:00:00");
        const dow=d.getDay(); // 0=Sun
        const adj=dow===0?6:dow-1; // Mon=0
        if(adj===injDayIdx) injDates.add(date);
      });
    }

    // ── SVG chart math ──
    const cW=360, cH=180, pL=40, pR=12, pT=16, pB=32;
    const plotW=cW-pL-pR, plotH=cH-pT-pB;
    const entryPoints=window30.map((date,i)=>({i,w:entryMap[date],date})).filter(p=>p.w!=null);
    const avgPoints  =window30.map((date,i)=>({i,avg:rollingAvg[i]})).filter(p=>p.avg!=null);

    const allWts=[...entryPoints.map(p=>p.w),...avgPoints.map(p=>p.avg),goalWeight].filter(Boolean);
    const yMin=allWts.length ? Math.min(...allWts)-2 : goalWeight-5;
    const yMax=allWts.length ? Math.max(...allWts)+2 : startWeight+5;
    const yRange=Math.max(1,yMax-yMin);

    const xOf=i=>pL+(i/29)*plotW;
    const yOf=w=>pT+(1-(w-yMin)/yRange)*plotH;

    const linePath=entryPoints.map((p,idx)=>`${idx===0?"M":"L"}${xOf(p.i).toFixed(1)},${yOf(p.w).toFixed(1)}`).join(" ");
    const avgPath =avgPoints.map((p,idx)=>`${idx===0?"M":"L"}${xOf(p.i).toFixed(1)},${yOf(p.avg).toFixed(1)}`).join(" ");

    // Y-axis labels — 3-4 ticks
    const yStep=yRange>15?5:yRange>6?2:1;
    const yStart=Math.ceil(yMin/yStep)*yStep;
    const yLabels=[];
    for(let y=yStart;y<=yMax;y+=yStep) yLabels.push(y);

    const shortDate=d=>{const dt=new Date(d+"T12:00:00");return dt.toLocaleDateString("en-US",{month:"short",day:"numeric"});};

    const fmtProjected=d=>{
      if(!d) return "—";
      return new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",year:"numeric"});
    };

    // Dev: seed weight data helper shown inline
    const seedDevWeights=()=>{
      const entries=[];
      for(let i=27;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i);
        const date=d.toISOString().split("T")[0];
        const base=244-(27-i)*0.22;
        const noise=((i*7+3)%11-5)*0.16;
        entries.push({date,weight:Math.round((base+noise)*10)/10});
      }
      setWeightEntries(entries);
      DB.set("nourish:weights",entries);
    };

    return(
      <div className="body-screen fi">
        {/* Header */}
        <div className="body-top">
          <h2>⚖️ Body</h2>
          <div className="body-top-sub">Track weight · monitor trends · stay on target</div>
        </div>

        {/* Today's entry */}
        <div className="body-section">
          <div className="card" style={{marginBottom:0}}>
            <div className="ctitle">Today's Weight
              {!weightEntries.length&&(
                <span style={{marginLeft:"auto",fontSize:10,color:"var(--acc2)",cursor:"pointer",fontWeight:600}}
                  onClick={seedDevWeights}>⚡ Seed test data</span>
              )}
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <input className="weight-input" type="number" inputMode="decimal" step="0.1"
                placeholder={todayEntry?String(todayEntry):"244.0"}
                value={weightInput}
                onChange={e=>setWeightInput(e.target.value)}/>
              <button className="weight-log-btn"
                disabled={!weightInput||isNaN(+weightInput)||+weightInput<50||+weightInput>700}
                onClick={async()=>{
                  const w=parseFloat(weightInput);
                  if(!w||isNaN(w)) return;
                  await saveWeight(today,w);
                  setWeightInput("");
                }}
                style={{background:(!weightInput||isNaN(+weightInput)||+weightInput<50)?"var(--br)":"var(--acc)",
                  color:(!weightInput||isNaN(+weightInput)||+weightInput<50)?"var(--tx3)":"#fff"}}>
                {todayEntry?"Update":"Log"}
              </button>
            </div>
            {todayEntry&&(
              <div className="weight-today-confirmed">
                ✓ {todayEntry} lbs logged today
                {avg7&&<span style={{color:"var(--tx2)",fontSize:12}}>· 7-day avg: {avg7.toFixed(1)} lbs</span>}
              </div>
            )}
          </div>
        </div>

        {/* Plateau alert */}
        {plateau&&(
          <div className="body-section">
            <div className="plateau-card">
              <div style={{fontSize:18,flexShrink:0,marginTop:1}}>📊</div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:"var(--warn)",marginBottom:3}}>Plateau detected</div>
                <div style={{fontSize:12,color:"var(--tx2)",lineHeight:1.5}}>Less than 1 lb change over 14 days. Consider adjusting calories, adding a refeed day, or varying your workouts.</div>
              </div>
            </div>
          </div>
        )}

        {/* Goal progress */}
        <div className="body-section">
          <div className="card" style={{marginBottom:0}}>
            <div className="ctitle">🎯 Goal Progress</div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--tx2)",margin:"8px 0 6px"}}>
              <span>{startWeight} <span style={{color:"var(--tx3)"}}>start</span></span>
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:currentWeight===startWeight?"var(--tx)":"var(--acc)"}}>
                {currentWeight.toFixed(1)} lbs
              </span>
              <span>{goalWeight} <span style={{color:"var(--tx3)"}}>goal</span></span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{width:`${progressPct}%`}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[
                {l:"Lost",    v:Math.max(0,lostSoFar)>0?`${lostSoFar.toFixed(1)} lbs`:"—", c:"var(--acc)"},
                {l:"To Go",   v:lbsRemaining>0?`${lbsRemaining.toFixed(1)} lbs`:"Done! 🎉",c:"var(--warn)"},
                {l:"Complete",v:`${progressPct.toFixed(0)}%`,c:"var(--acc2)"},
              ].map(s=>(
                <div key={s.l} style={{textAlign:"center",background:"var(--sf2)",borderRadius:10,padding:"10px 6px"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:10,color:"var(--tx3)",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 30-day trend chart */}
        <div className="body-section">
          <div className="card" style={{marginBottom:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
              <div className="ctitle" style={{marginBottom:0}}>📈 30-Day Trend</div>
              <div className="chart-legend">
                <span><span className="legend-dot" style={{background:"var(--acc)"}}/> Daily</span>
                <span><span className="legend-dot" style={{background:"var(--acc2)"}}/> 7-day avg</span>
                <span><span className="legend-dot" style={{background:"var(--warn)",height:1,borderTop:"1px dashed var(--warn)"}}/> Goal</span>
                {gl.active&&<span><span className="legend-dot" style={{background:"#00B8FF60"}}/> Inj. day</span>}
              </div>
            </div>
            {entryPoints.length===0?(
              <div style={{textAlign:"center",padding:"28px 0",color:"var(--tx3)",fontSize:13}}>
                Log your first weight above to start the trend chart
              </div>
            ):(
              <svg width="100%" viewBox={`0 0 ${cW} ${cH}`} style={{overflow:"visible"}}>
                {/* Y grid lines + labels */}
                {yLabels.map(y=>(
                  <g key={y}>
                    <line x1={pL} y1={yOf(y).toFixed(1)} x2={cW-pR} y2={yOf(y).toFixed(1)}
                      stroke="var(--br)" strokeWidth="0.5"/>
                    <text x={pL-5} y={yOf(y)+4} textAnchor="end" fontSize="9" fill="var(--tx3)">{y}</text>
                  </g>
                ))}
                {/* GLP-1 injection day markers */}
                {gl.active&&window30.map((date,i)=>injDates.has(date)&&(
                  <line key={`inj-${date}`} x1={xOf(i).toFixed(1)} y1={pT} x2={xOf(i).toFixed(1)} y2={cH-pB}
                    stroke="#00B8FF" strokeWidth="1" strokeDasharray="3,3" opacity="0.4"/>
                ))}
                {/* Goal weight line */}
                {goalWeight>=yMin&&goalWeight<=yMax&&(
                  <line x1={pL} y1={yOf(goalWeight).toFixed(1)} x2={cW-pR} y2={yOf(goalWeight).toFixed(1)}
                    stroke="var(--warn)" strokeWidth="1" strokeDasharray="5,4" opacity="0.75"/>
                )}
                {/* Actual entry line */}
                {linePath&&<path d={linePath} fill="none" stroke="var(--acc)" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>}
                {/* Rolling avg line */}
                {avgPath&&<path d={avgPath} fill="none" stroke="var(--acc2)" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>}
                {/* Entry dots */}
                {entryPoints.map(p=>(
                  <circle key={p.date} cx={xOf(p.i).toFixed(1)} cy={yOf(p.w).toFixed(1)}
                    r={p.date===today?"4":"2.5"}
                    fill={p.date===today?"var(--acc)":"var(--sf)"}
                    stroke="var(--acc)"
                    strokeWidth={p.date===today?"0":"1.5"}/>
                ))}
                {/* Today label */}
                {todayEntry&&(
                  <text x={xOf(29).toFixed(1)} y={(yOf(todayEntry)-8).toFixed(1)}
                    textAnchor="middle" fontSize="10" fill="var(--acc)" fontWeight="700">
                    {todayEntry}
                  </text>
                )}
                {/* X axis labels every 7 days */}
                {[0,7,14,21,29].map(i=>(
                  <text key={i} x={xOf(i).toFixed(1)} y={cH-pB+14}
                    textAnchor={i===0?"start":i===29?"end":"middle"}
                    fontSize="9" fill="var(--tx3)">
                    {shortDate(window30[i])}
                  </text>
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="body-section">
          <div className="card" style={{marginBottom:0}}>
            <div className="ctitle">Stats</div>
            <div className="stat-grid">
              {[
                {l:"Current",       v:`${currentWeight.toFixed(1)} lbs`,                                            c:"var(--tx)"},
                {l:"7-Day Average", v:avg7?`${avg7.toFixed(1)} lbs`:"—",                                           c:"var(--acc2)"},
                {l:"Weekly Rate",   v:weeklyRate!=null?(weeklyRate>0.05?`−${weeklyRate.toFixed(1)} lbs/wk`:weeklyRate<-0.05?`+${Math.abs(weeklyRate).toFixed(1)} lbs/wk`:"Holding"):"—",
                  c:weeklyRate>0.05?"var(--acc)":weeklyRate!=null&&weeklyRate<-0.05?"var(--red)":"var(--tx2)"},
                {l:"Projected Date",v:fmtProjected(projectedDate),                                                  c:"var(--warn)"},
              ].map(s=>(
                <div key={s.l} className="stat-cell">
                  <div className="stat-val" style={{color:s.c}}>{s.v}</div>
                  <div className="stat-lbl">{s.l}</div>
                </div>
              ))}
            </div>
            {gl.active&&(
              <div style={{marginTop:10,fontSize:12,color:"var(--acc2)",background:"#00B8FF08",
                border:"1px solid #00B8FF18",borderRadius:10,padding:"8px 12px"}}>
                💉 Blue markers on chart = {gl.medication} injection days
              </div>
            )}
          </div>
        </div>

        {/* ── Supplements ── */}
        <div className="body-section" style={{paddingTop:8}}>
          <div className="card" style={{marginBottom:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div>
                <div className="ctitle" style={{marginBottom:2}}>💊 Daily Supplements</div>
                {supplements.length>0&&(
                  <div style={{fontSize:11,color:"var(--tx2)"}}>
                    {Object.values(suppLog).filter(Boolean).length} / {supplements.length} taken today
                  </div>
                )}
              </div>
              <button onClick={()=>setTab("settings")}
                style={{fontSize:12,color:"var(--acc2)",fontWeight:600,background:"none",
                  border:"none",cursor:"pointer",padding:0,flexShrink:0}}>
                Manage →
              </button>
            </div>

            {supplements.length===0?(
              <div style={{textAlign:"center",padding:"16px 0 8px"}}>
                <div style={{fontSize:13,color:"var(--tx3)",marginBottom:10}}>No supplements added yet</div>
                <button onClick={()=>setTab("settings")}
                  style={{padding:"10px 20px",borderRadius:10,border:"1.5px solid var(--br)",
                    background:"var(--sf2)",color:"var(--acc)",fontFamily:"'DM Sans',sans-serif",
                    fontSize:13,cursor:"pointer",fontWeight:600}}>
                  Set Up in Settings →
                </button>
              </div>
            ):(
              supplements.map(s=>{
                const done=!!suppLog[s.id];
                return(
                  <div key={s.id} className={`supp-item ${done?"done":""}`}>
                    <button className={`supp-check ${done?"done":""}`} onClick={()=>toggleSupp(s.id)}>
                      {done?"✓":""}
                    </button>
                    <div className="supp-info">
                      <div className="supp-name" style={{textDecoration:done?"line-through":"none",opacity:done?.7:1}}>
                        {s.name}
                      </div>
                      <div className="supp-meta">
                        {s.dose&&<span>{s.dose}</span>}
                        {s.dose&&s.timing&&<span> · </span>}
                        {s.timing&&<span style={{textTransform:"capitalize"}}>{s.timing}</span>}
                        {s.notes&&<span style={{color:"var(--tx3)"}}> · {s.notes}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER RECIPES TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderRecipes=()=>{
    const RECIPE_TAGS=["breakfast","lunch","dinner","snack","high-protein","meal-prep"];

    // ── LIST ────────────────────────────────────────────────────────────────
    if(recipeView==="list"){
      const filtered=recipes.filter(r=>{
        const q=recipeSearch.toLowerCase();
        return !q||r.name.toLowerCase().includes(q)||(r.description||"").toLowerCase().includes(q);
      });
      return(
        <div className="recipes-screen fi">
          <div className="recipes-top">
            <div>
              <h2>📖 Recipes</h2>
              <div style={{fontSize:12,color:"var(--tx2)",marginTop:2}}>{recipes.length} saved · tap to view or log</div>
            </div>
            <button className="recipe-new-btn" onClick={()=>{setCreateMode(null);setRecipeView("create");setRForm({name:"",description:"",servings:"4",tags:[],ingredients:[]});setGeneratedDraft(null);setClaudePrompt("");}}>+ New</button>
          </div>
          <input className="recipe-search" placeholder="Search recipes…" value={recipeSearch} onChange={e=>setRecipeSearch(e.target.value)}/>
          {filtered.length===0?(
            <div style={{padding:"40px 20px",textAlign:"center",color:"var(--tx3)",fontSize:13}}>
              No recipes found<br/>
              <span style={{color:"var(--acc)",cursor:"pointer",fontSize:12}} onClick={()=>{setCreateMode(null);setRecipeView("create");}}>+ Create one</span>
            </div>
          ):(
            <div className="recipe-list">
              {filtered.map(recipe=>{
                const rs=ratioScore(recipe.perServing);
                const rl=ratioLabel(rs);
                const dm=user.settings?.displayMacros||["cal","pro","carb","fat"];
                return(
                  <div key={recipe.id} className="recipe-row fi" onClick={()=>{setActiveRecipe(recipe);setRecipeServings(1);setRecipeView("detail");}}>
                    <div className="recipe-row-left">
                      <div className="recipe-card-name">{recipe.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span className={`recipe-card-source source-${recipe.source||"manual"}`}>
                          {recipe.source==="claude"?"✦ AI":recipe.source==="photo"?"📷":"Manual"}
                        </span>
                        <span style={{fontSize:10,color:"var(--tx3)"}}>
                          {recipe.servings} srv
                        </span>
                        {rs>0&&<span className="ratio-badge" style={{background:`${rl.c}18`,color:rl.c,fontSize:9,padding:"1px 5px",borderRadius:4}}>{rs}g/100</span>}
                      </div>
                    </div>
                    <div className="recipe-row-right">
                      {dm.includes("pro")&&<span className="recipe-mac" style={{color:"var(--pro)"}}>{recipe.perServing.pro}p</span>}
                      {dm.includes("carb")&&<span className="recipe-mac" style={{color:"var(--car)"}}>{recipe.perServing.carb}c</span>}
                      {dm.includes("fat")&&<span className="recipe-mac" style={{color:"var(--fat)"}}>{recipe.perServing.fat}f</span>}
                      {dm.includes("cal")&&<span className="recipe-cal">{recipe.perServing.cal}</span>}
                      <span className="recipe-chevron">›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{height:20}}/>
        </div>
      );
    }

    // ── DETAIL ───────────────────────────────────────────────────────────────
    if(recipeView==="detail"&&activeRecipe){
      const r=activeRecipe;
      const scale=recipeServings;
      const scaled={
        cal:Math.round(r.perServing.cal*scale),
        pro:Math.round(r.perServing.pro*scale*10)/10,
        carb:Math.round(r.perServing.carb*scale*10)/10,
        fat:Math.round(r.perServing.fat*scale*10)/10,
      };
      const rs=ratioScore(r.perServing); const rl=ratioLabel(rs);
      return(
        <div className="recipe-detail fi">
          <div className="recipe-detail-head" style={{padding:"52px 20px 0"}}>
            <button className="recipe-back" onClick={()=>{setRecipeView("list");setActiveRecipe(null);}}>‹ Recipes</button>
            <div className="recipe-detail-name">{r.name}</div>
            {r.description&&<div className="recipe-detail-desc">{r.description}</div>}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              {(r.tags||[]).map(t=><span key={t} style={{fontSize:10,background:"var(--sf2)",border:"1px solid var(--br)",borderRadius:100,padding:"2px 9px",color:"var(--tx2)"}}>{t}</span>)}
              {rs>0&&<span className="ratio-badge" style={{background:`${rl.c}18`,color:rl.c,fontSize:10,padding:"2px 9px",borderRadius:100}}>{rs}g/100cal</span>}
            </div>

            {/* Scaler */}
            <div className="scaler-row">
              <div className="scaler-lbl">Servings</div>
              <button className="scaler-btn" onClick={()=>setRecipeServings(s=>Math.max(0.5,+(s-0.5).toFixed(1)))}>−</button>
              <div className="scaler-val">{scale}</div>
              <button className="scaler-btn" onClick={()=>setRecipeServings(s=>Math.min(20,+(s+0.5).toFixed(1)))}>+</button>
            </div>

            {/* Scaled macros */}
            <div className="recipe-macro-row">
              {[
                {l:"Calories",v:scaled.cal,c:"var(--kcal)"},
                {l:"Protein", v:`${scaled.pro}g`,c:"var(--pro)"},
                {l:"Carbs",   v:`${scaled.carb}g`,c:"var(--car)"},
                {l:"Fat",     v:`${scaled.fat}g`,c:"var(--fat)"},
              ].map(m=>(
                <div key={m.l} className="recipe-mac-cell">
                  <div className="recipe-mac-val" style={{color:m.c}}>{m.v}</div>
                  <div className="recipe-mac-lbl">{m.l}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:"var(--tx3)",marginBottom:16,textAlign:"center"}}>
              {scale} of {r.servings} total servings · {Math.round(r.perServing.cal*r.servings)} cal total
            </div>
          </div>

          {/* Ingredients */}
          {r.ingredients?.length>0&&(
            <div>
              <div style={{padding:"0 20px",marginBottom:8}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,color:"var(--tx2)",textTransform:"uppercase",letterSpacing:"1.2px"}}>Ingredients</div>
              </div>
              <div className="ing-list">
                {r.ingredients.map((ing,i)=>(
                  <div key={i} className="ing-item">
                    <div className="ing-name">{ing.name}</div>
                    <div className="ing-amount">{ing.amount} {ing.unit}</div>
                    <div className="ing-cal">{ing.cal}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{padding:"16px 20px",display:"flex",gap:10}}>
            <button onClick={()=>{
              const meal=addModal?.meal||MEALS.find(m=>(dayLog[m]||[]).length<4)||"lunch";
              addFoodToMeal(meal,recipeToFood(r,scale));
              setRecipeView("list"); setTab("log");
            }} style={{flex:2,padding:14,borderRadius:14,border:"none",background:"var(--acc)",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer"}}>
              + Log {scale===1?"1 serving":`${scale} servings`}
            </button>
            <button onClick={()=>setRecipeDeleteConfirm(r)} style={{flex:1,padding:14,borderRadius:14,border:"1.5px solid #FF6B6B25",background:"#FF6B6B08",color:"var(--red)",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>
              Delete
            </button>
          </div>
        </div>
      );
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    if(recipeView==="create"){
      // Method selection
      if(!createMode) return(
        <div className="create-screen fi">
          <button className="recipe-back" onClick={()=>setRecipeView("list")}>‹ Recipes</button>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,marginBottom:6}}>New Recipe</div>
          <div style={{fontSize:13,color:"var(--tx2)",marginBottom:20,lineHeight:1.5}}>How do you want to create it?</div>
          <div className="create-method-grid">
            <div className="create-method-card" onClick={()=>setCreateMode("manual")}>
              <div className="create-method-icon">✏️</div>
              <div className="create-method-label">Manual</div>
              <div className="create-method-sub">Enter name, ingredients, and macros yourself</div>
            </div>
            <div className="create-method-card" onClick={()=>setCreateMode("claude")}>
              <div className="create-method-icon">✦</div>
              <div className="create-method-label">Ask Claude</div>
              <div className="create-method-sub">Describe the dish, AI fills in ingredients and macros</div>
            </div>
          </div>
          <div className="create-method-card photo-card" style={{display:"flex",alignItems:"center",gap:14,textAlign:"left",padding:"16px"}}
            onClick={()=>setCreateMode("photo")}>
            <div className="create-method-icon" style={{marginBottom:0,fontSize:24}}>📷</div>
            <div>
              <div className="create-method-label">Import from Photo</div>
              <div className="create-method-sub">Photograph a recipe card or cookbook page — Claude extracts it</div>
            </div>
          </div>
        </div>
      );

      // Photo stub
      if(createMode==="photo") return(
        <div className="create-screen fi">
          <button className="recipe-back" onClick={()=>{ setCreateMode(null); setRecipePhotoPreview(null); setGeneratedDraft(null); setRecipePhotoError(null); setScanningRecipe(false); }}>‹ Back</button>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>📷 Import from Photo</div>
          <div style={{fontSize:13,color:"var(--tx2)",marginBottom:16,lineHeight:1.5}}>
            Photograph a recipe card, cookbook page, or handwritten recipe — Claude will extract all the ingredients and estimate macros.
          </div>

          {/* State 1: No photo yet */}
          {!recipePhotoPreview&&!scanningRecipe&&(
            <>
              <label htmlFor="recipe-photo-input" className="photo-drop-zone" style={{marginBottom:12}}>
                <div style={{fontSize:48,marginBottom:14}}>📖</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,marginBottom:8}}>Choose a Recipe Photo</div>
                <div style={{fontSize:13,color:"var(--tx2)",lineHeight:1.6,maxWidth:240,margin:"0 auto 20px"}}>
                  Works with recipe cards, cookbook pages, screenshots, or handwritten notes
                </div>
                <div style={{padding:"12px 28px",borderRadius:12,background:"var(--warn)",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14}}>
                  📷 Choose Photo
                </div>
              </label>
              <input id="recipe-photo-input" type="file" accept="image/*" capture="environment"
                style={{display:"none"}} onChange={handleRecipePhotoSelect}/>
            </>
          )}

          {/* State 2: Photo selected, not yet scanned */}
          {recipePhotoPreview&&!scanningRecipe&&!generatedDraft&&(
            <>
              <img src={recipePhotoPreview} className="photo-preview-img" alt="Recipe preview"/>
              {recipePhotoError&&(
                <div className="scan-error-box">
                  <div style={{fontSize:28,marginBottom:8}}>⚠️</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:"var(--red)",marginBottom:6}}>Couldn't Read Recipe</div>
                  <div style={{fontSize:13,color:"var(--tx2)",lineHeight:1.6}}>{recipePhotoError}</div>
                </div>
              )}
              <button className="scan-action-btn" style={{background:"var(--warn)"}}
                onClick={scanRecipePhoto} disabled={scanningRecipe}>
                ✦ {recipePhotoError?"Try Again —":"Extract Recipe —"} Read with Claude
              </button>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button className="scan-ghost-btn" style={{flex:1}}
                  onClick={()=>{setRecipePhotoPreview(null);setRecipePhotoError(null);setGeneratedDraft(null);}}>
                  Choose Different Photo
                </button>
                {recipePhotoError&&(
                  <button className="scan-ghost-btn" style={{flex:1,color:"var(--acc)",borderColor:"#008F6B30"}}
                    onClick={()=>setCreateMode("manual")}>
                    Enter Manually
                  </button>
                )}
              </div>
            </>
          )}

          {/* State 3: Scanning */}
          {scanningRecipe&&(
            <div className="scan-scanning">
              <div style={{fontSize:48,marginBottom:16}} className="pl">📖</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,marginBottom:8}}>Reading Recipe…</div>
              <div style={{fontSize:13,color:"var(--tx2)"}}>Claude is extracting ingredients and estimating macros</div>
            </div>
          )}

          {/* State 4: Draft ready — reuse existing draft card pattern */}
          {generatedDraft&&!scanningRecipe&&(
            <div className="draft-card fi">
              <div style={{fontSize:10,fontWeight:700,color:"var(--warn)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>📷 Extracted Recipe</div>
              <div className="draft-title">{generatedDraft.name}</div>
              {generatedDraft.description&&<div className="draft-desc">{generatedDraft.description}</div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>
                {[
                  {l:"Cal",  v:generatedDraft.perServing.cal,        c:"var(--kcal)"},
                  {l:"Pro",  v:`${generatedDraft.perServing.pro}g`,   c:"var(--pro)"},
                  {l:"Carbs",v:`${generatedDraft.perServing.carb}g`,  c:"var(--car)"},
                  {l:"Fat",  v:`${generatedDraft.perServing.fat}g`,   c:"var(--fat)"},
                ].map(m=>(
                  <div key={m.l} style={{background:"var(--sf2)",borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:m.c}}>{m.v}</div>
                    <div style={{fontSize:9,color:"var(--tx3)"}}>{m.l}/serving</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:"var(--tx2)",marginBottom:10}}>
                {generatedDraft.servings} servings · {generatedDraft.ingredients?.length} ingredients
              </div>
              {(generatedDraft.ingredients||[]).map((ing,i)=>(
                <div key={i} className="draft-ing">
                  <span>{ing.name} ({ing.amount} {ing.unit})</span>
                  <span>{ing.cal} cal · {ing.pro}p</span>
                </div>
              ))}
              <button className="save-recipe-btn" onClick={()=>{
                saveRecipes([...recipes,generatedDraft]);
                setRecipeView("list"); setCreateMode(null);
                setGeneratedDraft(null); setRecipePhotoPreview(null); setRecipePhotoError(null);
              }}>Save Recipe</button>
              <button onClick={()=>{setGeneratedDraft(null);setRecipePhotoPreview(null);setRecipePhotoError(null);}}
                style={{width:"100%",padding:12,marginTop:8,borderRadius:12,border:"1.5px solid var(--br)",
                  background:"transparent",color:"var(--tx2)",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>
                Scan a Different Photo
              </button>
            </div>
          )}
        </div>
      );

      // Claude generation
      if(createMode==="claude") return(
        <div className="create-screen fi">
          <button className="recipe-back" onClick={()=>setCreateMode(null)}>‹ Back</button>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>✦ Ask Claude</div>
          <div style={{fontSize:13,color:"var(--tx2)",marginBottom:14,lineHeight:1.5}}>
            Describe your recipe — ingredients, style, or how you make it. Claude will generate the full recipe with macros.
          </div>
          <textarea className="claude-prompt-area" placeholder="e.g. Buffalo chicken dip with cream cheese, Frank's hot sauce, shredded chicken breast, and cheddar. Makes 8 servings."
            value={claudePrompt} onChange={e=>setClaudePrompt(e.target.value)} rows={4}/>
          <button className="generate-btn" disabled={!claudePrompt.trim()||generatingRecipe}
            onClick={()=>generateRecipeWithClaude(claudePrompt)}>
            {generatingRecipe?"✦ Generating…":"✦ Generate Recipe"}
          </button>
          {generatingRecipe&&(
            <div style={{textAlign:"center",padding:"24px 0",color:"var(--acc2)",fontSize:13}} className="pl">
              Claude is building your recipe…
            </div>
          )}
          {generatedDraft&&(
            <div className="draft-card fi">
              <div style={{fontSize:10,fontWeight:700,color:"var(--acc)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>✦ Generated Recipe</div>
              <div className="draft-title">{generatedDraft.name}</div>
              <div className="draft-desc">{generatedDraft.description}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>
                {[
                  {l:"Cal",v:generatedDraft.perServing.cal,c:"var(--kcal)"},
                  {l:"Pro",v:`${generatedDraft.perServing.pro}g`,c:"var(--pro)"},
                  {l:"Carbs",v:`${generatedDraft.perServing.carb}g`,c:"var(--car)"},
                  {l:"Fat",v:`${generatedDraft.perServing.fat}g`,c:"var(--fat)"},
                ].map(m=>(
                  <div key={m.l} style={{background:"var(--sf2)",borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:m.c}}>{m.v}</div>
                    <div style={{fontSize:9,color:"var(--tx3)"}}>{m.l}/serving</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:"var(--tx2)",marginBottom:10}}>{generatedDraft.servings} servings · {generatedDraft.ingredients?.length} ingredients</div>
              {(generatedDraft.ingredients||[]).map((ing,i)=>(
                <div key={i} className="draft-ing">
                  <span>{ing.name} ({ing.amount} {ing.unit})</span>
                  <span>{ing.cal} cal · {ing.pro}p</span>
                </div>
              ))}
              <button className="save-recipe-btn" onClick={()=>{
                saveRecipes([...recipes,generatedDraft]);
                setRecipeView("list"); setCreateMode(null); setGeneratedDraft(null); setClaudePrompt("");
              }}>Save Recipe</button>
              <button onClick={()=>setGeneratedDraft(null)} style={{width:"100%",padding:12,marginTop:8,borderRadius:12,border:"1.5px solid var(--br)",background:"transparent",color:"var(--tx2)",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>
                Try Again
              </button>
            </div>
          )}
        </div>
      );

      // Manual form
      if(createMode==="manual"){
        const totalMacros=calcRecipeTotals(rForm.ingredients);
        const srv=Math.max(1,+rForm.servings||1);
        const perSrv={cal:Math.round(totalMacros.cal/srv),pro:Math.round(totalMacros.pro/srv*10)/10,carb:Math.round(totalMacros.carb/srv*10)/10,fat:Math.round(totalMacros.fat/srv*10)/10};
        const canSave=rForm.name.trim()&&rForm.ingredients.length>0;
        return(
          <div className="create-screen fi">
            <button className="recipe-back" onClick={()=>setCreateMode(null)}>‹ Back</button>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,marginBottom:16}}>Manual Recipe</div>

            <div className="rfield"><label>Recipe Name</label>
              <input placeholder="e.g. High-Protein Waffles" value={rForm.name} onChange={e=>setRForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div className="rfield"><label>Description (optional)</label>
              <textarea placeholder="Short description…" value={rForm.description} onChange={e=>setRForm(f=>({...f,description:e.target.value}))} style={{minHeight:52}}/>
            </div>
            <div className="rfield"><label>Total Servings</label>
              <input type="number" inputMode="numeric" placeholder="4" value={rForm.servings} onChange={e=>setRForm(f=>({...f,servings:e.target.value}))}/>
            </div>

            {/* Tags */}
            <div className="rfield"><label>Tags</label>
              <div className="tag-row">
                {RECIPE_TAGS.map(t=>(
                  <button key={t} className={`tag-chip ${rForm.tags.includes(t)?"on":""}`}
                    onClick={()=>setRForm(f=>({...f,tags:f.tags.includes(t)?f.tags.filter(x=>x!==t):[...f.tags,t]}))}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing ingredients */}
            {rForm.ingredients.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:600,color:"var(--tx2)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:8}}>Ingredients</div>
                {rForm.ingredients.map((ing,i)=>(
                  <div key={i} className="ing-chip">
                    <div className="ing-chip-name">{ing.name} · {ing.amount} {ing.unit}</div>
                    <div className="ing-chip-macs">{ing.cal}cal · {ing.pro}p</div>
                    <button className="ing-chip-del" onClick={()=>setRForm(f=>({...f,ingredients:f.ingredients.filter((_,j)=>j!==i)}))}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add ingredient */}
            <div style={{background:"var(--sf)",border:"1.5px solid var(--br)",borderRadius:14,padding:14,marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--tx2)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:10}}>Add Ingredient</div>
              <div className="rfield"><label>Name</label>
                <input placeholder="Chicken breast" value={rIngForm.name} onChange={e=>setRIngForm(f=>({...f,name:e.target.value}))}/>
              </div>
              <div className="r2" style={{marginBottom:10}}>
                <div className="rfield" style={{marginBottom:0}}><label>Amount</label>
                  <input placeholder="4" value={rIngForm.amount} onChange={e=>setRIngForm(f=>({...f,amount:e.target.value}))}/>
                </div>
                <div className="rfield" style={{marginBottom:0}}><label>Unit</label>
                  <input placeholder="oz / cup / g" value={rIngForm.unit} onChange={e=>setRIngForm(f=>({...f,unit:e.target.value}))}/>
                </div>
              </div>
              <div className="r2" style={{marginBottom:10}}>
                <div className="rfield" style={{marginBottom:0}}><label>Calories</label>
                  <input type="number" inputMode="numeric" placeholder="185" value={rIngForm.cal} onChange={e=>setRIngForm(f=>({...f,cal:e.target.value}))}/>
                </div>
                <div className="rfield" style={{marginBottom:0}}><label>Protein (g)</label>
                  <input type="number" inputMode="numeric" placeholder="35" value={rIngForm.pro} onChange={e=>setRIngForm(f=>({...f,pro:e.target.value}))}/>
                </div>
              </div>
              <div className="r2" style={{marginBottom:10}}>
                <div className="rfield" style={{marginBottom:0}}><label>Carbs (g)</label>
                  <input type="number" inputMode="numeric" placeholder="0" value={rIngForm.carb} onChange={e=>setRIngForm(f=>({...f,carb:e.target.value}))}/>
                </div>
                <div className="rfield" style={{marginBottom:0}}><label>Fat (g)</label>
                  <input type="number" inputMode="numeric" placeholder="4" value={rIngForm.fat} onChange={e=>setRIngForm(f=>({...f,fat:e.target.value}))}/>
                </div>
              </div>
              <button className="add-ing-btn" disabled={!rIngForm.name||!rIngForm.cal}
                onClick={()=>{
                  setRForm(f=>({...f,ingredients:[...f.ingredients,{...rIngForm,cal:+rIngForm.cal||0,pro:+rIngForm.pro||0,carb:+rIngForm.carb||0,fat:+rIngForm.fat||0}]}));
                  setRIngForm({name:"",amount:"",unit:"g",cal:"",pro:"",carb:"",fat:""});
                }}>
                + Add Ingredient
              </button>
            </div>

            {/* Live totals preview */}
            {rForm.ingredients.length>0&&(
              <div style={{background:"linear-gradient(135deg,#00E5A008,#00B8FF08)",border:"1.5px solid #00E5A025",borderRadius:14,padding:14,marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--acc)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>Per Serving Preview</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                  {[{l:"Cal",v:perSrv.cal,c:"var(--kcal)"},{l:"Pro",v:`${perSrv.pro}g`,c:"var(--pro)"},{l:"Carbs",v:`${perSrv.carb}g`,c:"var(--car)"},{l:"Fat",v:`${perSrv.fat}g`,c:"var(--fat)"}].map(m=>(
                    <div key={m.l} style={{background:"var(--sf2)",borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:m.c}}>{m.v}</div>
                      <div style={{fontSize:9,color:"var(--tx3)"}}>{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button disabled={!canSave} onClick={()=>{
              const newRecipe={
                id:uid(), name:rForm.name.trim(), description:rForm.description.trim(),
                servings:srv, tags:rForm.tags, source:"manual",
                ingredients:rForm.ingredients,
                total:totalMacros, perServing:perSrv,
                createdAt:new Date().toISOString(),
              };
              saveRecipes([...recipes,newRecipe]);
              setRecipeView("list"); setCreateMode(null);
              setRForm({name:"",description:"",servings:"4",tags:[],ingredients:[]});
            }} style={{width:"100%",padding:16,borderRadius:14,border:"none",background:canSave?"var(--acc)":"var(--br)",color:canSave?"#fff":"var(--tx3)",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:canSave?"pointer":"not-allowed"}}>
              Save Recipe
            </button>
          </div>
        );
      }
    }
    return null;
  };

  if(screen==="loading") return(
    <><style>{CSS}</style>
    <div className="app"><div className="splash">
      <div className="logo">N</div>
      <p style={{color:"var(--tx2)"}}>Loading your profile…</p>
    </div></div></>
  );

  if(screen==="splash") return(
    <><style>{CSS}</style>
    <div className="app"><div className="splash fi">
      <div className="logo" onClick={()=>setDevTaps(t=>t+1)}>N</div>
      <h1>Nour<span>ish</span></h1>
      <p>Your personal nutrition OS — smart macros, goal-aware tracking, and AI-powered meal guidance.</p>
      <button className="btn btnp" style={{width:"100%",maxWidth:320,marginBottom:12}} onClick={()=>setScreen("wizard")}>Get Started →</button>

      {/* ── DEV JUMP MENU — hidden until 7 logo taps ── */}
      {devTaps>=7&&(
        <div style={{width:"100%",maxWidth:320,background:"var(--sf)",border:"1.5px solid var(--br)",borderRadius:16,padding:16,marginTop:8}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,color:"var(--tx2)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>
            ⚡ Dev — Jump to Screen
        </div>
        {[
          { label:"🏠 Home (empty)",        action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setDayLog({...DEF_LOG}); setScreen("app"); setTab("home"); }},
          { label:"🏠 Home (with food)",    action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setDayLog(TEST_LOG); setScreen("app"); setTab("home"); }},
          { label:"📋 Log (empty)",         action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setDayLog({...DEF_LOG}); setScreen("app"); setTab("log"); }},
          { label:"📋 Log (with food)",     action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setDayLog(TEST_LOG); setScreen("app"); setTab("log"); }},
          { label:"⚖️ Body (empty)",        action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setWeightEntries([]); setScreen("app"); setTab("body"); }},
          { label:"⚖️ Body (seeded weights)",action:()=>{
              setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros);
              const entries=[];
              for(let i=27;i>=0;i--){
                const d=new Date(); d.setDate(d.getDate()-i);
                const date=d.toISOString().split("T")[0];
                const base=244-(27-i)*0.22;
                const noise=((i*7+3)%11-5)*0.16;
                entries.push({date,weight:Math.round((base+noise)*10)/10});
              }
              setWeightEntries(entries);
              DB.set("nourish:weights",entries);
              setScreen("app"); setTab("body");
            }},
          { label:"🧙 Wizard — Step 1",     action:()=>{ setUser({...DEF_USER}); setStep(0); setScreen("wizard"); }},
          { label:"🧙 Wizard — Macros",     action:()=>{ setUser({...TEST_PROFILE,createdAt:null}); setMacros(TEST_PROFILE.macros); setTdee(TEST_PROFILE.macros.tdee); setStep(5); setScreen("wizard"); }},
          { label:"🧙 Wizard — Prefs",      action:()=>{ setUser({...TEST_PROFILE,createdAt:null}); setMacros(TEST_PROFILE.macros); setTdee(TEST_PROFILE.macros.tdee); setStep(7); setScreen("wizard"); }},
          { label:"📖 Recipes (list)",      action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setRecipeView("list"); setScreen("app"); setTab("recipes"); }},
          { label:"📖 Recipes (manual)",    action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setRecipeView("create"); setCreateMode("manual"); setRForm({name:"",description:"",servings:"4",tags:[],ingredients:[]}); setScreen("app"); setTab("recipes"); }},
          { label:"📖 Recipes (Claude AI)", action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setRecipeView("create"); setCreateMode("claude"); setClaudePrompt(""); setGeneratedDraft(null); setScreen("app"); setTab("recipes"); }},
          { label:"📷 Recipe Photo (empty)", action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setRecipeView("create"); setCreateMode("photo"); setRecipePhotoPreview(null); setGeneratedDraft(null); setRecipePhotoError(null); setScanningRecipe(false); setScreen("app"); setTab("recipes"); }},
          { label:"📷 Recipe Photo (draft)", action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setRecipeView("create"); setCreateMode("photo"); const placeholder="data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#1B1B25"/><text x="150" y="110" text-anchor="middle" fill="#40405A" font-size="48">📖</text></svg>'); setRecipePhotoPreview(placeholder); const draft={id:uid(),name:"Janna's Chicken Soup",description:"Classic family chicken soup — light, protein-rich, and meal-prep friendly",source:"photo",servings:6,tags:["lunch","dinner","meal-prep"],ingredients:[{name:"Chicken breast",amount:"2",unit:"lbs",cal:740,pro:140,carb:0,fat:16},{name:"Carrots",amount:"3",unit:"medium",cal:75,pro:1.5,carb:17,fat:0},{name:"Celery",amount:"4",unit:"stalks",cal:24,pro:1,carb:4,fat:0},{name:"Chicken broth low sodium",amount:"8",unit:"cups",cal:80,pro:8,carb:4,fat:0},{name:"Egg noodles",amount:"2",unit:"cups dry",cal:420,pro:14,carb:84,fat:4}],createdAt:new Date().toISOString()}; const total=calcRecipeTotals(draft.ingredients); draft.total=total; draft.perServing={cal:Math.round(total.cal/6),pro:Math.round(total.pro/6*10)/10,carb:Math.round(total.carb/6*10)/10,fat:Math.round(total.fat/6*10)/10}; setGeneratedDraft(draft); setRecipePhotoError(null); setScanningRecipe(false); setScreen("app"); setTab("recipes"); }},
          { label:"📷 Photo Scan (empty)",  action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setPhotoPreview(null); setLabelDraft(null); setLabelEditForm(null); setPhotoScanError(null); setAddModal({meal:"breakfast"}); setLibTab("photo"); setScreen("app"); setTab("log"); }},
          { label:"📷 Photo Scan (serving pick)", action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); const placeholder="data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#1B1B25"/><text x="150" y="110" text-anchor="middle" fill="#40405A" font-size="56">🏷️</text></svg>'); setPhotoPreview(placeholder); setLabelDraft({name:"Chobani Plain Greek Yogurt 0%",brand:"Chobani",servingOptions:[{label:"1 container (170g)",cal:90,pro:15,carb:6,fat:0},{label:"½ cup (113g)",cal:60,pro:10,carb:4,fat:0}]}); setLabelEditForm(null); setLabelServingIdx(0); setScanningLabel(false); setPhotoScanError(null); setAddModal({meal:"breakfast"}); setLibTab("photo"); setScreen("app"); setTab("log"); }},
          { label:"📷 Photo Scan (edit form)", action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); const placeholder="data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#1B1B25"/><text x="150" y="110" text-anchor="middle" fill="#40405A" font-size="56">🏷️</text></svg>'); setPhotoPreview(placeholder); setLabelDraft(null); setLabelEditForm({name:"Chobani Plain Greek Yogurt 0%",brand:"Chobani",serving:"1 container (170g)",cal:"90",pro:"15",carb:"6",fat:"0",tags:["breakfast","snack","high-protein","quick"],meal:"breakfast"}); setLabelServingIdx(0); setScanningLabel(false); setPhotoScanError(null); setAddModal({meal:"breakfast"}); setLibTab("photo"); setScreen("app"); setTab("log"); }},
          { label:"💊 Supplements (empty)",    action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setSupplements([]); setSuppLog({}); setScreen("app"); setTab("body"); }},
          { label:"💊 Supplements (seeded)",   action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); const seeds=[{id:"ts1",name:"Vitamin D3",dose:"2000 IU",timing:"morning",notes:""},{id:"ts2",name:"Magnesium Glycinate",dose:"400mg",timing:"bedtime",notes:"Helps with sleep"},{id:"ts3",name:"Omega-3 Fish Oil",dose:"2 capsules",timing:"with food",notes:"Take with largest meal"},{id:"ts4",name:"Creatine Monohydrate",dose:"5g",timing:"morning",notes:""}]; setSupplements(seeds); setSuppLog({ts1:true,ts3:true}); setScreen("app"); setTab("body"); }},
          { label:"💊 Supplements in Settings",  action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); const seeds=[{id:"ts1",name:"Vitamin D3",dose:"2000 IU",timing:"morning",notes:""},{id:"ts2",name:"Magnesium Glycinate",dose:"400mg",timing:"bedtime",notes:"Helps with sleep"},{id:"ts3",name:"Omega-3 Fish Oil",dose:"2 capsules",timing:"with food",notes:"Take with largest meal"}]; setSupplements(seeds); setSuppLog({ts1:true}); setSuppEditId(null); setScreen("app"); setTab("settings"); }},
          { label:"💊 Supplements on Log",     action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); const seeds=[{id:"ts1",name:"Vitamin D3",dose:"2000 IU",timing:"morning"},{id:"ts2",name:"Magnesium Glycinate",dose:"400mg",timing:"bedtime"},{id:"ts3",name:"Omega-3 Fish Oil",dose:"2 capsules",timing:"with food"}]; setSupplements(seeds); setSuppLog({ts1:true}); setScreen("app"); setTab("log"); }},
          { label:"🔥 Streaks (seeded)",       action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); const today=todayStr(); setStreaks({logging:{count:12,lastDate:today},protein:{count:5,lastDate:today},weighIn:{count:18,lastDate:today},supps:{count:3,lastDate:today}}); setScreen("app"); setTab("home"); }},
          { label:"🔥 Streaks (some broken)",  action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); const today=todayStr(); const yest=new Date(); yest.setDate(yest.getDate()-2); const old=yest.toISOString().split("T")[0]; setStreaks({logging:{count:12,lastDate:today},protein:{count:5,lastDate:old},weighIn:{count:18,lastDate:today},supps:{count:0,lastDate:null}}); setScreen("app"); setTab("home"); }},
          { label:"✦ Daily Debrief (loaded)",  action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setDebriefText("Great day overall — you hit 94% of your calorie target and logged all four meals consistently. Protein came in at 178g, just 12g short of your 190g goal, which is a solid result for a non-lifting day. Water was strong at 96oz, well above your target. Tomorrow, aim to front-load protein at breakfast to give yourself more cushion throughout the day."); setScreen("app"); setTab("home"); }},
          { label:"✦ Ask Coach (open)",        action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setCoachOpen(true); setCoachAnswer(null); setCoachQuery(""); setScreen("app"); setTab("home"); }},
          { label:"✦ Ask Coach (with answer)", action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setCoachOpen(true); setCoachAnswer(`You're doing well today, Jon — protein is at 156g with dinner still to go, so you're on track to hit your 190g target. Calories are at 1,420 of 1,900, leaving you about 480 to work with for dinner. Given it's a non-injection day, your appetite should be more reliable, so this is a good night to hit a complete meal. A chicken breast with some cottage cheese after would close the gap cleanly.`); setCoachQuery("How am I tracking against my goals today?"); setScreen("app"); setTab("home"); }},
          { label:"📅 Weekly Check-In (loaded)", action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setCheckInText("Strong week overall, Jon — you logged 6 out of 7 days and averaged 1,840 calories, right in line with your 1,900 target. Protein averaged 172g per day, which is solid but still 18g below your 190g goal on most days. Your weight trend is moving in the right direction at roughly 0.8 lbs down from last week's average. Next week, focus on adding a protein-first snack mid-morning to close that protein gap before dinner."); setCheckInDate(new Date().toISOString()); setScreen("app"); setTab("home"); }},
          { label:"🛒 Grocery List (loaded)",    action:()=>{ setUser(TEST_PROFILE); setMacros(TEST_PROFILE.macros); setGroceryOpen(true); setGroceryData([{category:"Proteins",items:[{name:"Chicken breast",detail:"3 lbs"},{name:"Ground turkey 93%",detail:"2 lbs"},{name:"Shrimp cooked",detail:"1 lb"},{name:"Eggs",detail:"2 dozen"},{name:"Tuna in water",detail:"4 cans"}]},{category:"Dairy",items:[{name:"Chobani plain Greek yogurt 0%",detail:"8 containers"},{name:"Cottage cheese 0%",detail:"2 tubs"},{name:"Reduced fat cheddar",detail:"1 block"},{name:"Cream cheese reduced fat",detail:"8 oz"}]},{category:"Produce",items:[{name:"Coleslaw mix",detail:"2 bags"},{name:"Blueberries",detail:"2 cups"},{name:"Bananas",detail:"bunch"},{name:"Avocados",detail:"3"}]},{category:"Pantry",items:[{name:"Orgain protein powder",detail:"1 tub"},{name:"PB2 peanut butter powder",detail:"1 jar"},{name:"Frank's RedHot sauce",detail:"1 bottle"},{name:"Brown rice",detail:"2 lbs"}]}]); setScreen("app"); setTab("settings"); }},
        ].map(({label,action})=>(
          <button key={label} onClick={action}
            style={{width:"100%",padding:"11px 14px",marginBottom:7,borderRadius:10,border:"1.5px solid var(--br)",background:"var(--sf2)",color:"var(--tx)",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",textAlign:"left",transition:"border-color .15s"}}
            onMouseEnter={e=>e.target.style.borderColor="var(--acc)"}
            onMouseLeave={e=>e.target.style.borderColor="var(--br)"}>
            {label}
          </button>
        ))}
          <div style={{fontSize:10,color:"var(--tx3)",textAlign:"center",marginTop:6}}>tap logo to hide</div>
        </div>
      )}
    </div></div></>
  );

  if(screen==="wizard") return(
    <><style>{CSS}</style>
    <div className="app">
      <div className="wiz-head">
        <div className="prog">{WIZARD_STEPS.map((_,i)=><div key={i} className={`pd ${i<step?"done":i===step?"act":""}`}/>)}</div>
        <h2>{WIZARD_STEPS[step]}</h2>
        <div className="sub">Step {step+1} of {WIZARD_STEPS.length}</div>
      </div>
      <div className="wiz-body">{renderStep()}</div>
      <div className="foot">
        {step>0&&<button className="btn btng" onClick={()=>setStep(s=>s-1)}>Back</button>}
        <button className="btn btnp" disabled={!canAdv()||saving} onClick={handleNext}>
          {saving?"Saving…":step===WIZARD_STEPS.length-1?"Launch Nourish →":"Continue"}
        </button>
      </div>
    </div></>
  );

  // ── MAIN APP ──
  return(
    <><style>{CSS}</style>
    <div className="app">
      {tab==="home"&&renderHome()}
      {tab==="log"&&renderLog()}
      {tab==="body"&&renderBody()}
      {tab==="recipes"&&renderRecipes()}
      {tab==="settings"&&renderSettings()}

      {/* Bottom tab bar */}
      <div className="tabbar">
        {[
          {id:"home",    icon:"⬡",  label:"Home"},
          {id:"log",     icon:"📋", label:"Log"},
          {id:"body",    icon:"⚖️", label:"Body"},
          {id:"recipes", icon:"📖", label:"Recipes"},
          {id:"settings",icon:"⚙️", label:"More"},
        ].map(t=>(
          <div key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
            <div className="ti">{t.icon}</div>
            <div className="tl" style={{fontSize:9}}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Camera FAB — quick photo scan shortcut on log screen */}
      {tab==="log"&&(
        <button className="camera-fab" title="Scan a nutrition label"
          onClick={()=>{
            const firstMeal=MEALS.find(m=>!completedMeals[m])||"breakfast";
            setAddModal({meal:firstMeal}); setLibTab("photo"); setSearch("");
          }}>
          📷
        </button>
      )}

      {/* Coach FAB — home screen only */}
      {tab==="home"&&(
        <button className="coach-fab" onClick={()=>{setCoachOpen(true);setCoachAnswer(null);setCoachQuery("");}}>
          ✦ Ask Coach
        </button>
      )}

      {/* Water tracker — pinned above tab bar, shown on log screen */}
      {tab==="log"&&(
        <div className="water-bar">
          <div className="water-icon">💧</div>
          <div className="water-track">
            <div className="water-fill" style={{
              width:`${Math.min(100,(waterOz/waterGoal)*100)}%`,
              background: waterOz/waterGoal >= 0.7 ? "var(--acc2)" : waterOz/waterGoal >= 0.3 ? "var(--warn)" : "var(--red)"
            }}/>
          </div>
          <div className="water-label" style={{color: waterOz>=waterGoal?"var(--acc2)":"var(--tx2)"}}>
            {waterOz} / {waterGoal} oz
          </div>
          <div className="water-btns">
            <button className="water-btn" style={{color:"var(--red)"}}
              onClick={()=>setWaterOz(w=>Math.max(0,w-8))}>−8</button>
            {[8,16].map(oz=>(
              <button key={oz} className="water-btn" onClick={()=>logWater(oz)}>+{oz}</button>
            ))}
          </div>
        </div>
      )}

      {/* Add food modal — must be outside log render so it sits above everything */}
      {addModal&&renderAddModal()}

      {/* Auto-fill preview modal */}
      {autoFillPreview&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setAutoFillPreview(null)}>
          <div className="preview-sheet">
            <div className="preview-head">
              <div className="sheet-handle"/>
              <button className="sheet-close" onClick={()=>setAutoFillPreview(null)}>✕</button>
              <div className="preview-title">✦ Auto-Fill Preview</div>
              <div className="preview-sub">Suggested foods for empty meal slots ranked by protein efficiency. Tap Accept to add as recommendations — then confirm each one as you eat it.</div>
            </div>
            <div className="preview-body">
              {/* Projected totals */}
              <div className="preview-totals">
                <div className="preview-totals-title">Projected Day Totals</div>
                {[
                  {l:"Calories",v:autoFillPreview.projected.cal,g:(user.macros||macros).calories,c:"var(--kcal)"},
                  {l:"Protein", v:autoFillPreview.projected.pro,g:(user.macros||macros).protein, c:"var(--pro)"},
                  {l:"Carbs",   v:autoFillPreview.projected.carb,g:(user.macros||macros).carbs,  c:"var(--car)"},
                  {l:"Fat",     v:autoFillPreview.projected.fat, g:(user.macros||macros).fat,     c:"var(--fat)"},
                ].map(r=>(
                  <div key={r.l} className="preview-totals-row">
                    <span style={{color:"var(--tx2)"}}>{r.l}</span>
                    <span style={{color:r.v>r.g*1.05?"var(--red)":r.v>=r.g*.9?"var(--acc)":"var(--warn)",fontWeight:600}}>
                      {r.v} / {r.g}
                    </span>
                  </div>
                ))}
              </div>
              {/* Meal fills */}
              {Object.entries(autoFillPreview.fills).filter(([,items])=>items.length>0).map(([meal,items])=>(
                <div key={meal} className="preview-meal">
                  <div className="preview-meal-title">{MEAL_ICONS[meal]} {MEAL_LABELS[meal]}</div>
                  {items.map(item=>(
                    <div key={item.id} className="preview-item">
                      <div className="preview-item-name">{item.name}</div>
                      <div className="preview-item-macs">{item.pro}p · {item.carb}c · {item.fat}f</div>
                      <div className="preview-item-cal">{item.cal}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="preview-foot">
              <button className="btn btng" style={{flex:1}} onClick={()=>setAutoFillPreview(null)}>Cancel</button>
              <button className="btn btnp" style={{flex:2}} onClick={applyAutoFill}>Accept as Suggestions</button>
            </div>
          </div>
        </div>
      )}

      {/* Grocery list modal */}
      {groceryOpen&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setGroceryOpen(false)}>
          <div className="grocery-sheet">
            <div className="grocery-head">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800}}>🛒 Grocery List</div>
                <button className="sheet-close" onClick={()=>setGroceryOpen(false)}>✕</button>
              </div>
              <div style={{fontSize:12,color:"var(--tx2)"}}>Based on your recipes, favorites & goal</div>
            </div>
            <div className="grocery-body">
              {!groceryData&&!groceryLoading&&(
                <div style={{textAlign:"center",padding:"40px 0"}}>
                  <div style={{fontSize:48,marginBottom:16}}>🛒</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,marginBottom:8}}>Ready to build your list</div>
                  <div style={{fontSize:13,color:"var(--tx2)",marginBottom:24,lineHeight:1.6}}>
                    Claude will generate a weekly grocery list from your saved recipes and favorite foods.
                  </div>
                  <button className="scan-action-btn" style={{background:"var(--acc)"}} onClick={generateGroceryList}>
                    ✦ Generate Grocery List
                  </button>
                </div>
              )}
              {groceryLoading&&(
                <div style={{textAlign:"center",padding:"40px 0"}}>
                  <div style={{fontSize:36,marginBottom:12}} className="pl">🛒</div>
                  <div style={{fontSize:13,color:"var(--tx2)"}}>Building your list…</div>
                </div>
              )}
              {groceryData&&!groceryLoading&&(
                <>
                  {groceryData.map((cat,ci)=>(
                    <div key={ci} className="grocery-category">
                      <div className="grocery-cat-title">{cat.category}</div>
                      {(cat.items||[]).map((item,ii)=>(
                        <div key={ii} className="grocery-item">
                          <div className="grocery-item-name">{item.name}</div>
                          {item.detail&&<div className="grocery-item-detail">{item.detail}</div>}
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{textAlign:"center",marginTop:8,marginBottom:4}}>
                    <span style={{fontSize:12,color:"var(--acc)",cursor:"pointer",fontWeight:600}}
                      onClick={()=>{setGroceryData(null);generateGroceryList();}}>
                      ↺ Regenerate
                    </span>
                  </div>
                </>
              )}
            </div>
            {groceryData&&!groceryLoading&&(
              <div className="grocery-foot">
                <button className={`grocery-copy-btn ${groceryCopied?"copied":""}`} onClick={copyGroceryList}>
                  {groceryCopied?"✓ Copied to clipboard":"Copy List"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coach modal */}
      {coachOpen&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setCoachOpen(false)}>
          <div className="coach-sheet">
            <div className="coach-head">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <div className="coach-title">✦ Ask Your Coach</div>
                <button className="sheet-close" onClick={()=>setCoachOpen(false)}>✕</button>
              </div>
              <div className="coach-sub">Knows your macros, weight, supplements & recipes</div>
            </div>
            <div className="coach-body">
              {!coachAnswer&&!coachLoading&&(
                <>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--tx2)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>
                    Suggested questions
                  </div>
                  <div className="coach-suggestions">
                    {[
                      `How am I tracking against my goals today?`,
                      totals.pro < (user.macros||macros).protein
                        ? `What should I eat for my remaining ${(user.macros||macros).protein - totals.pro}g of protein?`
                        : `I've hit my protein target — what should I focus on for the rest of my macros?`,
                      `Is my current rate of progress on track?`,
                      `What's the best meal from my recipes for tonight?`,
                      `Any advice given my GLP-1 injection schedule this week?`,
                    ].filter((_,i)=>i<4||(user.glp1?.active&&i===4)).map(q=>(
                      <button key={q} className="coach-suggestion"
                        onClick={()=>{ setCoachQuery(q); askCoach(q); }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {coachLoading&&(
                <div style={{textAlign:"center",padding:"40px 0"}}>
                  <div style={{fontSize:36,marginBottom:12}} className="pl">✦</div>
                  <div style={{fontSize:13,color:"var(--tx2)"}}>Your coach is thinking…</div>
                </div>
              )}
              {coachAnswer&&!coachLoading&&(
                <div className="coach-answer">
                  <div className="coach-answer-label">✦ Coach</div>
                  <div className="coach-answer-text">{coachAnswer}</div>
                  <div className="coach-ask-again" onClick={()=>{setCoachAnswer(null);setCoachQuery("");}}>
                    ← Ask another question
                  </div>
                </div>
              )}
            </div>
            <div className="coach-input-row">
              <input className="coach-input" placeholder="Ask anything about your nutrition…"
                value={coachQuery} onChange={e=>setCoachQuery(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!coachLoading&&askCoach()}
                disabled={coachLoading}/>
              <button className="coach-send" disabled={!coachQuery.trim()||coachLoading}
                onClick={()=>askCoach()}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe delete confirm */}
      {recipeDeleteConfirm&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setRecipeDeleteConfirm(null)}>
          <div className="mod">
            <h3>Delete Recipe?</h3>
            <p>"{recipeDeleteConfirm.name}" will be permanently removed from your recipe library.</p>
            <div className="mbtns">
              <button className="mcan" onClick={()=>setRecipeDeleteConfirm(null)}>Cancel</button>
              <button className="mdel" onClick={()=>{
                deleteRecipe(recipeDeleteConfirm.id);
                setRecipeView("list"); setActiveRecipe(null);
                setRecipeDeleteConfirm(null);
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm */}
      {confirm&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setConfirm(false)}>
          <div className="mod">
            <h3>Reset Everything?</h3>
            <p>This permanently deletes your profile and all settings. Cannot be undone.</p>
            <div className="mbtns">
              <button className="mcan" onClick={()=>setConfirm(false)}>Cancel</button>
              <button className="mdel" onClick={resetAll}>Yes, Reset</button>
            </div>
          </div>
        </div>
      )}
    </div></>
  );
}
