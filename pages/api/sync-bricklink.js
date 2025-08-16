import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { writeFile } from 'fs/promises';
import { fetchWithTimeout } from '../../lib/fetchWithTimeout.js';

function makeOAuthHeader(url, method = 'GET') {
  const oauth = new OAuth({
    consumer: {
      key: process.env.BL_KEY || process.env.BRICKLINK_KEY || process.env.BRICKLINK_CONSUMER_KEY,
      secret: process.env.BL_SECRET || process.env.BRICKLINK_SECRET || process.env.BRICKLINK_CONSUMER_SECRET,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64');
    },
  });

  const token = {
    key: process.env.BL_TOKEN || process.env.BRICKLINK_TOKEN || process.env.BRICKLINK_OAUTH_TOKEN,
    secret: process.env.BL_TOKEN_SECRET || process. PAYPAL_CLIENT_SECRET_REDACTED|| process.env.BRICKLINK_OAUTH_TOKEN_SECRET,
  };

  const request_data = { url, method };
  return oauth.toHeader(oauth.authorize(request_data, token));
}

export default async function handler(req, res) {
  console.log('sync-bricklink: handler START', { query: req.query });
  try {
    const userId = process.env.BL_USER_ID || process.env.BRICKLINK_USER_ID;
    const url = `https://api.bricklink.com/api/store/v1/inventories?user_id=${userId}&limit=100&offset=0`;
    console.log('sync-bricklink: about to fetch', url);

    const authHeader = makeOAuthHeader(url, 'GET');
    console.log('sync-bricklink: auth header preview:', String(authHeader).slice(0, 80));

    const r = await fetchWithTimeout(url, {
      headers: {
        Accept: 'application/json',
        ...authHeader
      }
    }, 20000);

    if (!r) throw new Error('fetch returned no response object');
    console.log('sync-bricklink: fetch completed, status', r.status);

    const text = await r.text();

    // save raw response to disk so we don't return a huge body
    try {
      await writeFile('/tmp/bricklink-last.json', text, 'utf8');
      console.log('sync-bricklink: wrote /tmp/bricklink-last.json');
    } catch (wfErr) {
      console.error('sync-bricklink: failed writing raw file', wfErr && wfErr.message);
    }

    // try parse, but we'll only return a small summary
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      console.error('sync-bricklink: JSON parse error', err && err.message);
      return res.status(200).json({
        success: true,
        fetchedStatus: r.status,
        savedTo: '/tmp/bricklink-last.json',
        note: 'raw saved; parse failed'
      });
    }

    const items = Array.isArray(data?.data) ? data.data : [];
    const total = items.length;
    const sample = items.slice(0, 3).map(it => ({
      inventory_id: it.inventory_id,
      item_no: it.item?.no ?? it.item_no ?? null,
      color_id: it.color_id,
      quantity: it.quantity,
      unit_price: it.unit_price
    }));

    console.log('sync-bricklink: returning summary total=%d sample=%d', total, sample.length);

    return res.status(200).json({
      success: true,
      fetchedStatus: r.status,
      total,
      sampleCount: sample.length,
      sample,
      savedTo: '/tmp/bricklink-last.json'
    });

  } catch (err) {
    console.error('sync-bricklink: ERROR', err && (err.stack || err.message || err));
    res.status(500).json({ success: false, error: String(err && err.message ? err.message : err) });
  } finally {
    console.log('sync-bricklink: handler END');
  }
}
