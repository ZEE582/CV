function emailFailure(error) {
  if (error?.code === 'EMAIL_CONFIGURATION') return error.reason === 'missing_configuration' ? 'missing_configuration' : 'invalid_configuration';
  if (error?.code === 'EAUTH' || error?.responseCode === 535) return 'authentication_failed';
  if (['ETLS', 'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'ERR_TLS_CERT_ALTNAME_INVALID', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(error?.code)) return 'tls_failed';
  if (error?.code === 'EDNS' || error?.code === 'ENOTFOUND') return 'dns_failed';
  if (error?.code === 'ETIMEDOUT') return 'timeout';
  if (error?.code === 'ERECIPIENT' || error?.responseCode >= 500) return 'rejected';
  return 'connection_failed';
}
function retryableEmailFailure(error) {
  if (['authentication_failed','tls_failed','missing_configuration','invalid_configuration','rejected'].includes(emailFailure(error))) return false;
  return error?.responseCode >= 400 && error?.responseCode < 500 || ['ECONNECTION','ESOCKET','ETIMEDOUT','ECONNRESET','EAI_AGAIN'].includes(error?.code);
}
module.exports = { emailFailure, retryableEmailFailure };
