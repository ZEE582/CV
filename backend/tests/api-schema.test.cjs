const {test}=require('node:test');const assert=require('node:assert/strict');
test('OpenAPI resolves route globs on Windows and includes calendar state and explicit version contracts',()=>{
 const spec=require('../swagger/config');
 for(const path of['/api/admin/users','/api/admin/users/{id}/access','/api/companies','/api/problems','/api/problems/{id}/check','/api/submissions/status','/api/submissions/run','/api/ai/status','/api/ai/chat','/api/management/events/list','/api/management/events/{id}','/api/management/events/{id}/state'])assert.ok(spec.paths[path],path);
 assert.equal(spec.paths['/api/management/events/{id}/state'].patch.requestBody.content['application/json'].schema.required.includes('expected_version'),true);
 assert.equal(spec.paths['/api/management/events/{id}'].delete.requestBody.content['application/json'].schema.required.includes('expected_version'),true);
});
