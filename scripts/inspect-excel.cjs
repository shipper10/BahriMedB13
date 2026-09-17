// Temporary inspector: dump the header + first few rows of the Excel to learn its real structure.
const XLSX = require('xlsx');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', 'multi - Copy.xlsx');
console.log('Reading:', file trigonom);
const wb = XLSX.readFile(file);
console.log('Sheets:', wb.SheetNames);

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
  console.log('\n===== Sheet:', name, '| rows:', aoa.length, '=====');
  // Print first 6 rows with 0-indexed columns
  const rows = aoa.slice(0, 6);
  rows.forEach((row, ri) => {
    const cells = (row || []).map((v, ci) => `${ci}:${v === null || v === undefined ? '' : String(v).slice(0, 28)}`);
    console.log(`ROW ${ri}: ${cells.join(' | ')}`);
  });
  // Print last 3 rows
  console.log('--- LAST ROWS ---');
  aoa.slice(-3).forEach((row, ri) => {
    const cells = (row || []).map((v, ci) => `${ci}:${v === null || v === undefined ? '' : String(v).slice(0, 16)}`);
    console.log(`ROW ${aoa.length - 3 + ri}: ${cells.join(' | ')}`);
  });
}
