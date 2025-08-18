// src/pages/api/minifigs-live.ts
import type { NextApiRequest, NextApiResponse } from "next";
import oauth from "oauth-1.0a";
import crypto from "crypto";

const {
  BRICKLINK_CONSUMER_KEY,
  BRICKLINK_CONSUMER_SECRET,
  BRICKLINK_OAUTH_TOKEN,
  BRICKLINK_OAUTH_TOKEN_SECRET,
} = process.env;

const API_URL = "https://api.bricklink.com/api/store/v1/inventories";

const oauthClient = oauth({
  consumer: {
    key: BRICKLINK_CONSUMER_KEY as string,
    secret: BRICKLINK_CONSUMER_SECRET as string,
  },
  signature_method: "HMAC-SHA1",
  hash_function(base_string, key) {
    return crypto.createHmac("sha1", key).update(base_string).digest("base64");
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const requestData = {
      url: API_URL,
      method: "GET",
    };

    const headers = oauthClient.toHeader(
      oauthClient.authorize(requestData, {
        key: BRICKLINK_OAUTH_TOKEN as string,
        secret: BRICKLINK_OAUTH_TOKEN_SECRET as string,
      })
    );

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    // Massage into meta + items format
    const items = data.data.filter((d: any) => d.item.type === "MINIFIG");
    return res.status(200).json({
      meta: {
        total: items.length,
      },
      items,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}