const fs = require('fs');
const mongoose = require('mongoose');

function loadEnv(path = '.env.local') {
  if (!fs.existsSync(path)) return;
  const raw = fs.readFileSync(path,'utf8');
  raw.split(/\r?\n/).forEach(line=>{
    const m=line.match(/^([^#=]+)=(.*)$/);
    if(m){ const k=m[1].trim(); let v=m[2].trim();
      if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
      process.env[k]=v;
    }
  });
}

async function main(){
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if(!uri){ console.error('MONGODB_URI missing'); process.exit(2); }
  console.log('Testing URI:', uri.replace(/(\/\/[^:]+:).+@/,'$1***@'));
  try{
    await mongoose.connect(uri,{ dbName:'bricklink', serverSelectionTimeoutMS:8000, autoIndex:false });
    console.log('Mongo OK: connected');
    await mongoose.disconnect();
    process.exit(0);
  }catch(err){
    console.error('Mongo connect ERROR:', err && err.message ? err.message : err);
    process.exit(3);
  }
}
main();
