const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const backup = require('../../scripts/database-backup.cjs');

test('backup requires an explicit application database and rejects system databases', () => {
  for (const uri of [undefined, '', 'mongodb://localhost', 'mongodb://localhost/', 'mongodb://localhost/admin', 'mongodb://localhost/local', 'mongodb://localhost/config', 'mongodb://localhost/db/path', 'mongodb://localhost/%2f']) assert.throws(() => backup.databaseName(uri));
  assert.equal(backup.databaseName('mongodb://127.0.0.1:27171/ttwar_cv1_local'), 'ttwar_cv1_local');
  assert.equal(backup.databaseName('mongodb+srv://user:password@example.com/app?retryWrites=true'), 'app');
});
test('encrypted backups authenticate their contents, header and key before restoration', async () => {
  const directory = await backup.staging();
  try {
    const plain = path.join(directory, 'fixture.gz'); const archive = path.join(directory, 'fixture.ttbackup'); const output = path.join(directory, 'decoded.gz');
    const payload = crypto.randomBytes(4096); const key = crypto.randomBytes(32);
    const metadata = { format: 1, toolsVersion: '100.20.1', snapshot: { mongoMajor: 7, database: 'backup_fixture' } };
    await fs.writeFile(plain, payload); await backup.encrypt(plain, archive, key, metadata);
    assert.deepEqual(await backup.decrypt(archive, output, key), metadata); assert.deepEqual(await fs.readFile(output), payload);
    const original = await fs.readFile(archive); assert.equal(original.includes(payload), false);
    await fs.unlink(output);
    await assert.rejects(backup.decrypt(archive, output, crypto.randomBytes(32)), /authentication failed/); await assert.rejects(fs.stat(output), { code: 'ENOENT' });
    for (const position of [original.length - 1, original.indexOf(Buffer.from('backup_fixture'))]) {
      const tampered = Buffer.from(original); tampered[position] ^= 1; await fs.writeFile(archive, tampered);
      await assert.rejects(backup.decrypt(archive, output, key)); await assert.rejects(fs.stat(output), { code: 'ENOENT' });
    }
    await fs.writeFile(archive, original.subarray(0, 20)); await assert.rejects(backup.decrypt(archive, output, key));
    await fs.writeFile(archive, original); await assert.rejects(backup.encrypt(plain, archive, key, metadata), { code: 'EEXIST' });
  } finally { await backup.cleanup(directory); }
});
test('temporary backup cleanup refuses any non-owned path', async () => {
  await assert.rejects(backup.cleanup(backup.PRIVATE), /Refusing cleanup/);
  await assert.rejects(backup.cleanup(path.resolve(backup.PRIVATE, '../.tmp-foreign')), /Refusing cleanup/);
});
