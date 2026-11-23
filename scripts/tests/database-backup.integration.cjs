const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const path = require('node:path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId, Long, Binary } = require('mongoose').mongo;
const backup = require('../database-backup.cjs');
const pdf = require('../../backend/tests/fixtures/resume-pdf.cjs')();

test('official tools round-trip encrypted BSON including a CV, empty collections, options and indexes without changing source', { timeout: 240000 }, async () => {
  await backup.toolsCheck();
  const server = await MongoMemoryServer.create({ binary: { version: '7.0.24', downloadDir: path.resolve(__dirname, '../../.cache/mongodb') }, instance: { ip: '127.0.0.1' } });
  const uri = server.getUri('backup_roundtrip_fixture'); assert.notEqual(new URL(uri).port, '27171');
  const client = new MongoClient(uri); let result;
  try {
    await client.connect(); const db = client.db();
    await db.createCollection('empty');
    await db.createCollection('applications', { validator: { $jsonSchema: { bsonType: 'object', required: ['email'] } }, validationLevel: 'strict' });
    await db.collection('applications').createIndex({ email: 1, createdAt: -1 }, { unique: true, name: 'email_created' });
    await db.collection('applications').createIndex({ createdAt: 1 }, { name: 'dated_partial', partialFilterExpression: { createdAt: { $gte: new Date('2020-01-01T00:00:00Z') } } });
    await db.collection('applications').insertOne({ _id: new ObjectId(), email: 'synthetic@example.com', createdAt: new Date('2026-11-01T00:00:00Z'), cv_file_data: new Binary(pdf), serial: Long.fromString('9223372036854775806'), nested: { arabic: 'سيرة تجريبية', enabled: true, nullable: null, list: [1, 'two'] } });
    await db.collection('expiring').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('expiring').insertOne({ expiresAt: new Date('2099-01-01T00:00:00Z') });
    const before = await backup.snapshot(uri); const key = crypto.randomBytes(32);
    result = await backup.create(uri, key); assert.equal(result.verified, true); assert.equal(result.snapshot.collections.applications.count, 1); assert.equal(result.snapshot.collections.empty.count, 0);
    const verified = await backup.verify(result.file, key); assert.equal(backup.same(verified.snapshot, before), true);
    await assert.rejects(backup.verify(result.file, crypto.randomBytes(32)), /authentication failed/);
    assert.equal(backup.same(before, await backup.snapshot(uri)), true);
  } finally { await client.close(); await server.stop(); if (result) await fs.unlink(result.file); }
});
