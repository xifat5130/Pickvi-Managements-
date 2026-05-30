import fetch from 'node-fetch';

async function test(url: string, method: string, bodyJson?: any) {
  try {
    const opts: any = {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Api-Key': 'dummy-key',
        'Secret-Key': 'dummy-secret'
      }
    };
    if (bodyJson) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(bodyJson);
    }
    const res = await fetch(url, opts);
    console.log(`[${method}] ${url} => Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text.substring(0, 200)}`);
  } catch (err: any) {
    console.log(`Error on ${url}: ${err.message}`);
  }
}

async function run() {
  await test("https://portal.packzy.com/api/v1/check_client/01712345678", "GET");
  await test("https://portal.packzy.com/api/v1/check_client?phone=01712345678", "GET");
  await test("https://portal.packzy.com/api/v1/check_delivery/01712345678", "GET");
  await test("https://portal.packzy.com/api/v1/check_delivery?phone=01712345678", "GET");
  await test("https://portal.packzy.com/api/v1/check_client", "POST", { phone: '01712345678' });
  await test("https://portal.packzy.com/api/v1/check_delivery", "POST", { phone: '01712345678' });
  await test("https://portal.packzy.com/api/v1/get_balance", "GET");
}

run();
