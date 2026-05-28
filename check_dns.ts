import dns from 'node:dns';

const host = 'openrouter.ai';
dns.lookup(host, (err, address, family) => {
  if (err) {
    console.error(`DNS lookup failed for ${host}:`, err);
  } else {
    console.log(`Address: ${address}, Family: IPv${family}`);
  }
});
