import axios from "axios";
import crypto from "crypto";
import OAuth from "oauth-1.0a";

const API_BASE = "https://api.bricklink.com/api/store/v1";

const oauth = new OAuth({
  consumer: {
    key: process.env.BRICKLINK_CONSUMER_KEY!,
    secret: process.env.BRICKLINK_CONSUMER_SECRET!,
  },
  signature_method: "HMAC-SHA1",
  hash_function(base, key) {
    return crypto.createHmac("sha1", key).update(base).digest("base64");
  },
});

const token = {
  key: process.env.BRICKLINK_TOKEN!,
  secret: process.env.BRICKLINK_TOKEN_SECRET!,
};

export async function getInventory() {
  const url = `${API_BASE}/inventories`;

  const requestData = {
    url,
    method: "GET",
  };

  const headers = oauth.toHeader(oauth.authorize(requestData, token));

  const res = await axios.get(url, { headers });
  const items = res.data.data || [];

  // Filter only minifigs
  return items
    .filter((item: any) => item.item?.type === "MINIFIG")
    .map((item: any) => ({
      id: item.inventory_id,
      figNumber: item.item.no,
      name: item.description || item.item.no,
      quantity: item.quantity,
      price: item.unit_price,
      condition: item.new_or_used === "N" ? "New" : "Used",
      imageUrl: item.thumbnail_url,
    }));
}
