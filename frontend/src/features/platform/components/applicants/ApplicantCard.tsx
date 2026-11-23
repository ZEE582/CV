import CvDownloadButton from '../applications/CvDownloadButton';
import { useId, useState } from 'react';
import { Box, Button, Chip, TextField, Typography } from '@mui/material';
import { applicationStatuses, safeDocumentUrl, type ApplicationRecord, type ApplicationStatus } from '../../api/recruitment';
import { applicantDate } from '../../utils/applicants';
export default function ApplicantCard({ application, disabled, onSave }: { application: ApplicationRecord; disabled: boolean; onSave: (status: ApplicationStatus) => void }) {
  const id = useId(); const [draft, setDraft] = useState(application.status); const name = application.user_id?.name || 'حساب غير متاح'; const documentUrl = safeDocumentUrl(application.cv_url);
  return <Box component="article" aria-labelledby={id + '-name'} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 0, overflowWrap: 'anywhere', fontFamily: "'Tajawal', 'Segoe UI', sans-serif", '& .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiButton-root, & .MuiFormHelperText-root, & .MuiChip-root': { fontFamily: 'inherit' }, '& .MuiInputBase-input': { fontSize: 16 }, '& .MuiInputLabel-root': { fontSize: 14 }, '& .MuiFormHelperText-root': { fontSize: 12, lineHeight: 1.7 } }}>
    <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={1}><Typography id={id + '-name'} component="h2" variant="h5">{name}</Typography><Chip size="small" label={applicationStatuses[application.status]} /></Box>
    {application.user_id?.email && <Typography dir="ltr" textAlign="right" sx={{ fontSize: 14, overflowWrap: 'anywhere' }}>{application.user_id.email}</Typography>}
    {application.user_id?.phone && <Typography dir="ltr" textAlign="right" fontSize={14}>{application.user_id.phone}</Typography>}
    <Typography variant="body2" color="text.secondary" mt={1}>تاريخ التقديم: {applicantDate(application.createdAt)}{application.updatedAt ? ' · آخر تحديث: ' + applicantDate(application.updatedAt) : ''}</Typography>
    {application.cover_letter ? <Box component="details" my={2}><Typography component="summary" sx={{ cursor: 'pointer' }}>عرض رسالة التقديم</Typography><Typography sx={{ whiteSpace: 'pre-wrap', mt: 2, fontSize: 14, lineHeight: 1.9 }}>{application.cover_letter}</Typography></Box> : <Typography variant="body2" color="text.secondary" my={2}>لم يرفق المتقدم رسالة تقديم.</Typography>}
    {application.cv_file ? <CvDownloadButton applicationId={application._id} file={application.cv_file} disabled={disabled} /> : documentUrl ? <Button color="inherit" variant="outlined" component="a" href={documentUrl} target="_blank" rel="noopener noreferrer">فتح السيرة الذاتية</Button> : <Typography variant="body2" color="text.secondary">{application.cv_url ? 'رابط السيرة الذاتية المرفق غير صالح.' : 'لم يرفق المتقدم رابط سيرة ذاتية.'}</Typography>}
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'minmax(0, 1fr) auto auto' }} alignItems="start" gap={2} mt={3}>
      <TextField id={id + '-status'} select fullWidth label="الحالة الجديدة للطلب" SelectProps={{ native: true }} value={draft} disabled={disabled} onChange={event => setDraft(event.target.value as ApplicationStatus)} helperText="اختيار الحالة لا يحفظها تلقائيًا.">{Object.entries(applicationStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</TextField>
      <Button color="secondary" variant="contained" type="button" disabled={disabled || draft === application.status} aria-label={'حفظ حالة طلب ' + name} onClick={() => onSave(draft)}>حفظ الحالة</Button>
      <Button color="inherit" type="button" disabled={disabled || draft === application.status} onClick={() => setDraft(application.status)}>إلغاء التغيير</Button>
    </Box>
  </Box>;
}
