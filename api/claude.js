export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://nourish-pdet.vercel.app",
  ];
  const origin = req.headers.origin || "";
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set");
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  try {
    console.log("Model:", req.body?.model, "| Max tokens:", req.body?.max_tokens);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic error", response.status, JSON.stringify(data).substring(0, 500));
    }
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err.message);
    return res.status(500).json({ error: "API proxy error", detail: err.message });
  }
}
