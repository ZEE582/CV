const { randomUUID } = require('node:crypto');
const GROUPS = new Set(['health', 'live', 'auth', 'user', 'jobs', 'companies', 'messages', 'cv', 'applications', 'saved-jobs', 'admin', 'problems', 'study-plans', 'ai', 'submissions', 'management', 'company', 'docs']);
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const FAILURES = new Set(['server_error', 'oauth_email_delivery', 'oauth_callback']);

function requestObservation({ write = line => console.log(line) } = {}) {
  return (req, res, next) => {
    // Generate our own identifier: never trust or echo a caller-supplied logging value.
    const requestId = randomUUID(); const started = process.hrtime.bigint();
    req.requestId = requestId; res.setHeader('X-Request-ID', requestId);
    const segment = /^\/api\/([^/?]+)/.exec(req.originalUrl || '')?.[1];
    const group = segment ? (GROUPS.has(segment) ? segment : 'other_api') : 'web';
    const method = METHODS.has(req.method) ? req.method : 'OTHER';
    let failure;
    req.observeFailure = code => { if (FAILURES.has(code)) failure = code; };
    let recorded = false;
    function record(outcome) {
      if (recorded) return; recorded = true;
      const status = outcome === 'completed' ? res.statusCode : null;
      const record = { time: new Date().toISOString(), event: 'http_request', level: failure || status >= 500 ? 'error' : (outcome === 'aborted' || status >= 400 ? 'warn' : 'info'), request_id: requestId, method, group, status, outcome, duration_ms: Math.round(Number(process.hrtime.bigint() - started) / 1e6) };
      if (failure) record.failure_code = failure;
      // Deliberately exclude URL, query, headers, cookies, body, IP, user ID and raw errors.
      try { write(JSON.stringify(record)); } catch { /* Logging failure must not break the response. */ }
    }
    res.once('finish', () => record('completed'));
    res.once('close', () => record('aborted'));
    next();
  };
}
module.exports = { requestObservation };
