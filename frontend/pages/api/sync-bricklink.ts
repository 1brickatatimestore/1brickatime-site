import type { NextApiRequest, NextApiResponse } from "next";
import { buildOAuthHeader } from "@/lib/oauth";

/**
 * Fetch BrickLink inventory
 */
export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = 3092592;
    const url = `https://api.bricklink.com/api/store/v1/inventories?user_id=${userId}&limit=1000`;

    const headers = buildOAuthHeader("GET", url);
    headers.Accept = "application/json";

    const response = await fetch(url, { method: "GET", headers });
    const data = await response.json();

    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Sync error:", err);
    return res.status(500).json({ error: "Failed to sync BrickLink inventory." });
  }
}