const https = require('https');
const fs = require('fs');
const url = 'https://gist.githubusercontent.com/ertugrulyilmaz/3683932/raw/';
let data = '';
https.get(url, (res) => {
  res.on('data', (c) => { data += c; });
  res.on('end', () => { fs.writeFileSync('data/bins_raw.sql', data); console.log('OK', data.length); });
}).on('error', (e) => { console.error('ERR', e.message); });
