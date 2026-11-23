// Offline operator tool. There is deliberately no restore-to-live-database command.
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { pipeline } = require('node:stream/promises');
const { MongoClient, BSON } = require('mongoose').mongo;
const exec = promisify(execFile);
const ROOT = path.resolve(__dirname, '..');
const PRIVATE = path.join(ROOT, '.backups');
const MAGIC = Buffer.from('TTWARDB1\n');
const LIMIT = 512 * 1024 * 1024;
const TOOL_VERSION = '100.20.1';

async function protect(file, directory = false) {
  if (process.platform === 'win32') {
    const { stdout } = await exec('whoami.exe', ['/user', '/fo', 'csv', '/nh'], { windowsHide: true });
    const sid = stdout.match(/S-1-5-[\d-]+/)?.[0];
    if (!sid) throw new Error('Cannot determine the Windows account for private backup permissions.');
    await exec('icacls.exe', [file, '/inheritance:r', '/grant:r', '*' + sid + (directory ? ':(OI)(CI)F' : ':F')], { windowsHide: true });
  } else await fsp.chmod(file, directory ? 0o700 : 0o600);
}
async function privateRoot() {
  await fsp.mkdir(PRIVATE, { recursive: true, mode: 0o700 });
  if ((await fsp.lstat(PRIVATE)).isSymbolicLink()) throw new Error('Private backup directory must not be a symbolic link.');
  await protect(PRIVATE, true);
  return PRIVATE;
}
async function staging() {
  await privateRoot();
  const directory = await fsp.mkdtemp(path.join(PRIVATE, '.tmp-'));
  await protect(directory, true);
  return directory;
}
async function cleanup(directory) {
  const absolute = path.resolve(directory);
  if (path.dirname(absolute) !== PRIVATE || !path.basename(absolute).startsWith('.tmp-')) throw new Error('Refusing cleanup outside a private temporary backup directory.');
  if ((await fsp.lstat(absolute)).isSymbolicLink()) throw new Error('Refusing symbolic-link cleanup.');
  await fsp.rm(absolute, { recursive: true, force: true });
}
async function privateWrite(file, data) {
  const handle = await fsp.open(file, 'wx', 0o600);
  try { await protect(file); await handle.writeFile(data); } finally { await handle.close(); }
}
async function initializeKey() {
  await privateRoot();
  const file = path.join(PRIVATE, 'master.key');
  await privateWrite(file, crypto.randomBytes(32));
  return file;
}
async function readKey() {
  const file = path.join(PRIVATE, 'master.key');
  if ((await fsp.lstat(file)).isSymbolicLink()) throw new Error('Backup key must not be a symbolic link.');
  await protect(file);
  const key = await fsp.readFile(file);
  if (key.length !== 32) throw new Error('Backup key must contain exactly 32 bytes.');
  return key;
}
function databaseName(uri) {
  // Require an explicit application database, never the driver's implicit test/admin database.
  const match = /^mongodb(?:\+srv)?:\/\/[^/]+\/([A-Za-z0-9_-]{1,63})(?:\?|$)/.exec(uri || '');
  if (!match || ['admin', 'local', 'config'].includes(match[1])) throw new Error('Use a MongoDB URI with an explicit non-system application database.');
  return match[1];
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
function same(a, b) { return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)); }
function metadataValue(value) {
  if (value instanceof Date || value?._bsontype) return BSON.EJSON.serialize(value, { relaxed: false });
  if (Array.isArray(value)) return value.map(metadataValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, metadataValue(item)]));
  return value;
}
async function snapshot(uri) {
  const name = databaseName(uri);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const db = client.db(name);
    const version = await db.admin().command({ buildInfo: 1 });
    if (Number(version.version.split('.')[0]) !== 7) throw new Error('This backup workflow currently supports MongoDB 7 only.');
    const collections = Object.create(null);
    for (const info of (await db.listCollections().toArray()).sort((a, b) => a.name.localeCompare(b.name))) {
      if (info.type !== 'collection' || info.name.startsWith('system.')) throw new Error('Views and system collections require a separately reviewed backup plan.');
      const collection = db.collection(info.name);
      const hash = crypto.createHash('sha256'); let count = 0;
      for await (const document of collection.find({}, { raw: true }).sort({ _id: 1 })) {
        if (!Buffer.isBuffer(document)) throw new Error('MongoDB raw BSON is required for backup validation.');
        hash.update(document); count++;
      }
      const indexes = (await collection.listIndexes().toArray()).map(index => {
        const { v: _v, ns: _ns, background: _background, key, ...options } = index;
        // An ordered list preserves the direction and order of compound index keys.
        return { ...options, key: Object.entries(key) };
      }).sort((a, b) => a.name.localeCompare(b.name));
      collections[info.name] = { count, sha256: hash.digest('hex'), options: metadataValue(info.options || {}), indexes: metadataValue(indexes) };
    }
    return { database: name, mongoMajor: 7, collections };
  } finally { await client.close(); }
}
function toolPath(name) {
  const bin = process.env.MONGODB_TOOLS_DIR || (process.platform === 'win32' ? path.join(ROOT, '.cache/mongodb-tools/mongodb-database-tools-windows-x86_64-' + TOOL_VERSION, 'bin') : '');
  return bin ? path.join(bin, name + (process.platform === 'win32' ? '.exe' : '')) : name;
}
async function runTool(name, args) {
  try {
    // Never forward app SMTP/JWT credentials to the database tool, or print tool stderr/URIs.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(?:PATH|SYSTEMROOT|WINDIR|TEMP|TMP|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|SSL_CERT_FILE|SSL_CERT_DIR)$/i.test(key)));
    const result = await exec(toolPath(name), args, { windowsHide: true, timeout: 180000, maxBuffer: 1024 * 1024, env });
    return result.stdout;
  } catch { throw new Error(name + ' failed. Check the tools installation, database access and available disk space; credentials and tool output are withheld.'); }
}
async function toolsCheck() {
  for (const name of ['mongodump', 'mongorestore']) {
    if (!(await runTool(name, ['--version'])).includes('version: ' + TOOL_VERSION)) throw new Error('Install MongoDB Database Tools ' + TOOL_VERSION + ' for this workflow.');
  }
}
async function encrypt(plain, destination, key, metadata) {
  if ((await fsp.stat(plain)).size > LIMIT) throw new Error('Backup archive exceeds the 512 MiB workflow limit.');
  const json = Buffer.from(JSON.stringify(metadata));
  if (json.length > 65536) throw new Error('Backup metadata is too large.');
  const length = Buffer.alloc(4); length.writeUInt32BE(json.length);
  const iv = crypto.randomBytes(12); const aad = Buffer.concat([MAGIC, length, json, iv]);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(aad);
  await privateWrite(destination, Buffer.concat([aad, Buffer.alloc(16)]));
  await pipeline(fs.createReadStream(plain), cipher, fs.createWriteStream(destination, { flags: 'a' }));
  const handle = await fsp.open(destination, 'r+');
  try { await handle.write(cipher.getAuthTag(), 0, 16, aad.length); } finally { await handle.close(); }
}
async function decrypt(archive, destination, key) {
  const size = (await fsp.stat(archive)).size;
  if (size > LIMIT + 65536 + 100 || size < MAGIC.length + 4 + 12 + 16) throw new Error('Invalid or oversized encrypted backup.');
  const handle = await fsp.open(archive, 'r');
  let metadata, aad, tag, offset;
  try {
    const prefix = Buffer.alloc(MAGIC.length + 4); await handle.read(prefix, 0, prefix.length, 0);
    if (!prefix.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Invalid encrypted backup format.');
    const length = prefix.readUInt32BE(MAGIC.length);
    if (length > 65536 || size <= prefix.length + length + 28) throw new Error('Invalid encrypted backup header.');
    const rest = Buffer.alloc(length + 28); await handle.read(rest, 0, rest.length, prefix.length);
    metadata = JSON.parse(rest.subarray(0, length).toString());
    aad = Buffer.concat([prefix, rest.subarray(0, length + 12)]); tag = rest.subarray(length + 12); offset = aad.length + 16;
  } finally { await handle.close(); }
  await privateWrite(destination, Buffer.alloc(0));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, aad.subarray(-12)); decipher.setAAD(aad); decipher.setAuthTag(tag);
  try { await pipeline(fs.createReadStream(archive, { start: offset }), decipher, fs.createWriteStream(destination)); }
  catch { await fsp.unlink(destination); throw new Error('Backup authentication failed: wrong key, corrupted or incomplete file.'); }
  // Nothing from the archive is restored before authentication completes.
  if (metadata.format !== 1 || metadata.toolsVersion !== TOOL_VERSION || metadata.snapshot?.mongoMajor !== 7 || databaseName('mongodb://localhost/' + metadata.snapshot.database) !== metadata.snapshot.database) throw new Error('Unsupported backup metadata.');
  return metadata;
}
async function verify(archive, key) {
  const directory = await staging(); let server;
  try {
    const plain = path.join(directory, 'restore.archive.gz');
    const metadata = await decrypt(archive, plain, key);
    await toolsCheck();
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.join(directory, 'mongo-data'); await fsp.mkdir(dbPath, { mode: 0o700 });
    server = await MongoMemoryServer.create({ binary: { version: '7.0.24', downloadDir: path.join(ROOT, '.cache/mongodb') }, instance: { ip: '127.0.0.1', dbName: metadata.snapshot.database, dbPath } });
    const uri = server.getUri(metadata.snapshot.database);
    if (new URL(uri).port === '27171') throw new Error('Refusing to restore on the platform database port.');
    const config = path.join(directory, 'restore-config.json'); await privateWrite(config, JSON.stringify({ uri }));
    await runTool('mongorestore', ['--config=' + config, '--archive=' + plain, '--gzip', '--nsInclude=' + metadata.snapshot.database + '.*', '--stopOnError', '--quiet']);
    const restored = await snapshot(uri);
    if (!same(restored, metadata.snapshot)) throw new Error('Restored document bytes, counts, collection options or indexes do not match the backup.');
    return metadata;
  } finally { try { await server?.stop(); } finally { await cleanup(directory); } }
}
async function create(uri, key) {
  const directory = await staging();
  try {
    await toolsCheck();
    const before = await snapshot(uri);
    const config = path.join(directory, 'dump-config.json'); await privateWrite(config, JSON.stringify({ uri }));
    const plain = path.join(directory, 'dump.archive.gz');
    await runTool('mongodump', ['--config=' + config, '--archive=' + plain, '--gzip', '--quiet']);
    if (!same(before, await snapshot(uri))) throw new Error('Database changed during backup. Pause application writes and try again.');
    const metadata = { format: 1, toolsVersion: TOOL_VERSION, createdAt: new Date().toISOString(), snapshot: before };
    const encrypted = path.join(directory, 'pending.ttbackup'); await encrypt(plain, encrypted, key, metadata);
    await verify(encrypted, key);
    const filename = 'backup-' + metadata.createdAt.replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex') + '.ttbackup';
    const destination = path.join(PRIVATE, filename);
    // Same-filesystem hard link publishes only complete verified bytes, exclusively and atomically.
    await fsp.link(encrypted, destination);
    return { file: destination, bytes: (await fsp.stat(destination)).size, sha256: await fileHash(destination), verified: true, snapshot: before };
  } finally { await cleanup(directory); }
}
async function fileHash(file) { const hash = crypto.createHash('sha256'); for await (const chunk of fs.createReadStream(file)) hash.update(chunk); return hash.digest('hex'); }
async function main() {
  const [command, archive, ...extra] = process.argv.slice(2);
  if (extra.length || !['init-key', 'create', 'verify'].includes(command) || (command === 'verify' ? !archive : archive)) throw new Error('Usage: npm run backup:init | backup:create | backup:verify -- <encrypted-file>');
  if (command === 'init-key') { console.log('Private key created: ' + await initializeKey() + '. Keep a separate protected copy; it cannot be recovered.'); return; }
  const key = await readKey();
  if (command === 'verify') { const metadata = await verify(path.resolve(archive), key); console.log(JSON.stringify({ verified: true, database: metadata.snapshot.database, createdAt: metadata.createdAt })); return; }
  const env = require('dotenv').parse(await fsp.readFile(path.join(ROOT, 'backend/.env')));
  const result = await create(process.env.MONGO_URI || env.MONGO_URI, key);
  // Do not print contents, credentials, or the encryption key.
  console.log(JSON.stringify({ ...result, snapshot: Object.fromEntries(Object.entries(result.snapshot.collections).map(([name, info]) => [name, info.count])) }, null, 2));
}
if (require.main === module) main().catch(() => { console.error('Backup operation failed. Check the private key, tools version, MongoDB 7 connection and disk space. No live database restore is available.'); process.exitCode = 1; });
module.exports = { databaseName, same, encrypt, decrypt, create, verify, snapshot, staging, cleanup, initializeKey, readKey, PRIVATE, toolsCheck };
