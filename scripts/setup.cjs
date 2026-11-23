const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
for (const folder of ['backend', 'frontend']) {
  const destination = path.join(__dirname, '..', folder, '.env');
  if (fs.existsSync(destination)) { console.log(`${folder}/.env already exists; preserved.`); continue; }
  let template = fs.readFileSync(`${destination}.example`, 'utf8');
  if (folder === 'backend') template = template.replace(/^JWT_SECRET=$/m, `JWT_SECRET=${randomBytes(48).toString('hex')}`);
  fs.writeFileSync(destination, template, { flag: 'wx' });
  console.log(`Created ${folder}/.env. Configure your local services before starting.`);
}
