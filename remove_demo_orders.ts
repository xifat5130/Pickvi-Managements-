
import fs from 'fs';
const rawData = fs.readFileSync('./private/pickvi_orders.json', 'utf-8');
const orders = JSON.parse(rawData);
const filtered = orders.filter((o: any) => o.customer_note !== "Simulated online shop transaction.");
fs.writeFileSync('./private/pickvi_orders.json', JSON.stringify(filtered, null, 2));
console.log(`Removed ${orders.length - filtered.length} demo orders.`);
