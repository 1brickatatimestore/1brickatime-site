require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB auth succeeded')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ MongoDB auth failed:', err.message)
    process.exit(1)
  })
