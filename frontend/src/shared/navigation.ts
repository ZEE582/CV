export function returnPath(state: unknown): string | undefined {
  if (!state || typeof state !== 'object' || !('from' in state)) return;
  const from = state.from;
  const path = typeof from === 'string' ? from : from && typeof from === 'object' && 'pathname' in from && typeof from.pathname === 'string'
    ? from.pathname + ('search' in from && typeof from.search === 'string' ? from.search : '') + ('hash' in from && typeof from.hash === 'string' ? from.hash : '') : '';
  if (path.startsWith('/') && !path.startsWith('//') && !/[\\\u0000-\u0020]/.test(path) && !/^\/(login|signup|verify-email|questions|forgot-password|reset-password)([?#/]|$)/.test(path)) return path;
}
