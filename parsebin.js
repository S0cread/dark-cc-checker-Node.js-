const fs = require('fs');
const sql = fs.readFileSync('data/bins_raw.sql', 'utf-8');
const regex = /INSERT INTO `binlist` VALUES \('(\d+)',\s*'(\d+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\);/g;
const bins = {};
let m;
while ((m = regex.exec(sql)) !== null) {
  bins[m[1]] = {
    bank: m[3],
    bankCode: m[2],
    type: m[4],
    subType: m[5],
    virtual: m[6] === '1' || m[6].toLowerCase() === 'yes' || m[6].toLowerCase() === 'evet',
    prepaid: m[7] === '1' || m[7].toLowerCase() === 'yes' || m[7].toLowerCase() === 'evet',
  };
}
fs.writeFileSync('data/bins.json', JSON.stringify(bins, null, 2));
console.log('Parsed', Object.keys(bins).length, 'BIN entries');
