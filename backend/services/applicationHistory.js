const STATUSES = ['pending', 'viewed', 'shortlisted', 'rejected', 'hired'];
const HISTORY_LIMIT = 100;
const validDate = value => value != null && Number.isFinite(new Date(value).getTime());
function initialHistory(userId, at) {
  return { status_history: [{ from_status: null, to_status: 'pending', at, version: 0, actor_role: 'seeker', actor_id: userId }], status_history_count: 1, history_from_submission: true, history_started_at: at };
}
function statusUpdate(application, desired, actor, at = new Date()) {
  const update = { $set: { status: desired }, $inc: { __v: 1 } };
  if (desired !== application.status) {
    update.$push = { status_history: { $each: [{ from_status: application.status, to_status: desired, at, version: (application.__v || 0) + 1, actor_role: actor.role, actor_id: actor.id }], $slice: -HISTORY_LIMIT } };
    update.$inc.status_history_count = 1;
    if (!application.history_started_at) update.$set.history_started_at = at;
    if (application.history_from_submission === undefined) update.$set.history_from_submission = false;
  }
  return update;
}
function historyResponse(application) {
  const raw = application.status_history || [];
  const count = application.status_history_count ?? raw.length;
  const version = application.__v ?? 0;
  if (!Array.isArray(raw) || raw.length > HISTORY_LIMIT || !Number.isSafeInteger(count) || count < raw.length || raw.length !== Math.min(count, HISTORY_LIMIT) || !Number.isSafeInteger(version) || version < 0 || !STATUSES.includes(application.status) || !validDate(application.createdAt)) return null;
  const events = [];
  for (const event of raw) {
    const previous = events.at(-1);
    if (!STATUSES.includes(event.to_status) || (event.from_status !== null && !STATUSES.includes(event.from_status)) || event.from_status === event.to_status || !validDate(event.at)
      || !Number.isSafeInteger(event.version) || event.version < 0 || event.version > version || !['seeker', 'company', 'admin'].includes(event.actor_role)
      || (event.from_status === null && (event.version !== 0 || event.to_status !== 'pending' || event.actor_role !== 'seeker'))
      || (event.from_status !== null && (event.version === 0 || event.actor_role === 'seeker'))
      || (previous && (event.version <= previous.version || event.from_status !== previous.to_status))) return null;
    events.push({ from_status: event.from_status, to_status: event.to_status, at: new Date(event.at), version: event.version, actor_role: event.actor_role });
  }
  if (events.length && events.at(-1).to_status !== application.status) return null;
  return { success: true, application_id: String(application._id), status: application.status, version, submitted_at: application.createdAt,
    history_started_at: validDate(application.history_started_at) ? application.history_started_at : null,
    complete: application.history_from_submission === true && count === events.length && events[0]?.from_status === null,
    total_events: count, truncated: count > events.length, events };
}
module.exports = { initialHistory, statusUpdate, historyResponse, HISTORY_LIMIT };
