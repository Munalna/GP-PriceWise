const http = require('http');
const data = JSON.stringify({mappedData: [{productName:'test', quantity:1}], userId:'testuser'});
const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/salesData/import',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(options, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('status', res.statusCode);
    console.log(d);
  });
});
req.on('error', e => { console.error('ERR', e.message); });
req.write(data);
req.end();
