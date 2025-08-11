require('dotenv').config({ path: '.env.local' })
const OAuth  = require('oauth-1.0a')
const crypto = require('crypto')
const axios  = require('axios')

// 1) Build OAuth client
const oauth = OAuth({
  consumer: {
    key:    process.env.BL_KEY,
    secret: process.env.BL_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64')
  },
})

// 2) Token
const token = {
  key:    process.env.BL_TOKEN,
  secret: process.env.BL_TOKEN_SECRET,
}

// 3) Build URL
const userId = process.env.BL_USER_ID
const url    = `https://api.bricklink.com/api/store/v1/inventories?user_id=${userId}&offset=0&limit=1`

// 4) Generate header
const authHeader = oauth.toHeader(oauth.authorize({ url, method: 'GET' }, token)).Authorization

// 5) Log for inspection
console.log('Request URL :', url)
console.log('Auth Header :', authHeader)
console.log('Local time  :', new Date().toISOString())

// 6) Fire the request
axios.get(url, {
  headers: {
    Authorization: authHeader,
    Accept:        'application/json',
  },
})
.then(res => {
  console.log('Response Status:', res.status)
  console.log('Response Data  :', JSON.stringify(res.data, null, 2))
})
.catch(err => {
  console.error('Error Status   :', err.response?.status)
  console.error('Error Data     :', JSON.stringify(err.response?.data, null, 2) || err.message)
})
