import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export function buildOAuthHeader(
  method: 'GET' | 'POST',
  url: string
): { Authorization: string } {
  const oauth = new OAuth({
    consumer: {
      key:    process.env.BL_KEY!,
      secret: process.env.BL_SECRET!
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64');
    },
  });

  const token = {
    key:    process.env.BL_TOKEN!,
    secret: process.env.BL_TOKEN_SECRET!,
  };

  // Build the base OAuth params
  const auth = oauth.authorize({ url, method }, token);
  let header = oauth.toHeader(auth).Authorization;

  // Prefix with realm="" to match BrickLink’s example
  header = header.replace(/^OAuth /, 'OAuth realm="", ');

  return { Authorization: header };
}
