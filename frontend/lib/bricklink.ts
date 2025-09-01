// lib/bricklink.ts
import axios from 'axios';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

const API_BASE = 'https://api.bricklink.com/api/store/v1';

const consumerKey = process.env.BRICKLINK_CONSUMER_KEY!;
const consumerSecret = process.env.BRICKLINK_CONSUMER_SECRET!;
const tokenValue = process.env.BRICKLINK_TOKEN!;
const tokenSecret = process.env.BRICKLINK_TOKEN_SECRET!;

const oauth = new OAuth({
  consumer: { key: consumerKey, secret: consumerSecret },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

export async function fetchMinifigsFromBricklink() {
  const url = `${API_BASE}/items/MINIFIG`;

  const requestData = {
    url,
    method: 'GET',
  };

  const headers = oauth.toHeader(
    oauth.authorize(requestData, {
      key: tokenValue,
      secret: tokenSecret,
    })
  );

  const response = await axios.get(url, { headers });
  return response.data;
}