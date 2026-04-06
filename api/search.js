// Vercel serverless function — searches USDA FoodData Central + Open Food Facts
// and returns merged, normalized results.
// Add USDA_API_KEY to Vercel environment variables.

const normalize = (name, brand, serving, cal, pro, carb, fat, source) => ({
  name: (name||"Unknown").trim(),
  brand: (brand||"").trim(),
  serving: (serving||"1 serving").trim(),
  cal: Math.round(+cal||0),
  pro: Math.round((+pro||0)*10)/10,
  carb: Math.round((+carb||0)*10)/10,
  fat: Math.round((+fat||0)*10)/10,
  source,
});

async function searchUSDA(query, apiKey) {
  if (!apiKey) return [];
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${apiKey}&pageSize=8&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS),Branded`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.foods||[]).map(f => {
      const get = (id) => (f.foodNutrients||[]).find(n=>n.nutrientId===id||n.nutrientNumber===String(id));
      const cal  = get(1008)?.value || get(208)?.value  || 0;
      const pro  = get(1003)?.value || get(203)?.value  || 0;
      const carb = get(1005)?.value || get(205)?.value  || 0;
      const fat  = get(1004)?.value || get(204)?.value  || 0;
      // USDA returns per 100g — estimate a serving
      const servingG = f.servingSize || 100;
      const servingUnit = f.servingSizeUnit || "g";
      const mult = servingG / 100;
      return normalize(
        f.description,
        f.brandOwner || f.brandName || "",
        `${servingG}${servingUnit}`,
        cal * mult, pro * mult, carb * mult, fat * mult,
        "usda"
      );
    });
  } catch(e) {
    console.error("USDA error:", e.message);
    return [];
  }
}

async function searchOFF(query) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&fields=product_name,brands,serving_size,nutriments&page_size=8&action=process`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.products||[])
      .filter(p => p.product_name && p.nutriments)
      .map(p => {
        const n = p.nutriments;
        // Prefer per-serving values; fall back to per-100g
        const cal  = n["energy-kcal_serving"] || n["energy-kcal_100g"] || 0;
        const pro  = n["proteins_serving"]     || n["proteins_100g"]    || 0;
        const carb = n["carbohydrates_serving"]|| n["carbohydrates_100g"]|| 0;
        const fat  = n["fat_serving"]          || n["fat_100g"]         || 0;
        return normalize(
          p.product_name,
          (p.brands||"").split(",")[0],
          p.serving_size || "1 serving",
          cal, pro, carb, fat,
          "off"
        );
      });
  } catch(e) {
    console.error("OFF error:", e.message);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://nourish-pdet.vercel.app",
  ];
  const origin = req.headers.origin || "";
  if (allowedOrigins.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { query } = req.body || {};
  if (!query || query.trim().length < 2) return res.status(400).json({ error: "Query too short" });

  const [usdaResults, offResults] = await Promise.all([
    searchUSDA(query, process.env.USDA_API_KEY),
    searchOFF(query),
  ]);

  // Interleave: alternate USDA and OFF results so both sources show up
  const merged = [];
  const maxLen = Math.max(usdaResults.length, offResults.length);
  for (let i = 0; i < maxLen; i++) {
    if (offResults[i]) merged.push(offResults[i]);
    if (usdaResults[i]) merged.push(usdaResults[i]);
  }

  // Filter out junk entries (0 calories and 0 protein = likely bad data)
  const filtered = merged.filter(f => f.cal > 0 || f.pro > 0).slice(0, 12);

  return res.status(200).json({ results: filtered });
}
