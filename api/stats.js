// Read-back for the page: how many readiness checks ran in the last 7 days,
// and which business type checked most. Reads from the same Supabase table.

const TABLE = "readiness_checks";
const LABELS = { Kirana: "kirana stores", Salon: "salons", Clinic: "clinics", Other: "other businesses" };

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET." });
  }
  try {
    const key = process.env.SUPABASE_SERVICE_KEY;
    const headers = { apikey: key };
    if (key && key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;

    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const url =
      `${process.env.SUPABASE_URL}/rest/v1/${TABLE}` +
      `?select=business_type&refused=eq.false&created_at=gte.${encodeURIComponent(since)}&limit=5000`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
    const rows = await r.json();

    const byType = {};
    rows.forEach((row) => { byType[row.business_type] = (byType[row.business_type] || 0) + 1; });
    const top = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=60");
    return res.status(200).json({
      checksThisWeek: rows.length,
      topBusinessType: top ? LABELS[top[0]] || top[0] : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Stats unavailable." });
  }
};
