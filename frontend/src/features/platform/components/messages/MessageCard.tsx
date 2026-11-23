import { Box, Button, Chip, Typography } from '@mui/material';
import type { InboxMessage } from '../../api/inboxClient';
import { messageDate, replyLink } from '../../utils/messages';
export default function MessageCard({ message, disabled, onRead }: { message: InboxMessage; disabled: boolean; onRead: (desired: boolean) => void }) {
  const reply = replyLink(message.sender_email, message.subject);
  return <Box component="article" sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowWrap: 'anywhere', minWidth: 0 }}>
    <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap"><Typography component="h2" variant="h5" fontWeight={700}>{message.subject || 'استفسار'}</Typography><Chip size="small" color={message.is_read ? 'default' : 'secondary'} label={message.is_read ? 'مقروءة' : 'غير مقروءة'} /></Box>
    <Typography mt={1.5} fontWeight={700}>{message.sender_name}</Typography><Typography component="p" dir="ltr" sx={{ textAlign: 'right', my: .5 }}>{message.sender_email}</Typography>{message.sender_phone && <Typography dir="ltr" sx={{ textAlign: 'right' }}>{message.sender_phone}</Typography>}
    <Typography color="text.secondary" variant="body2" mt={1}>{messageDate(message.createdAt)}</Typography>
    <Box component="details" sx={{ my: 2, '& summary': { cursor: 'pointer', fontWeight: 700, py: 1 }, '& summary:focus-visible': { outline: '2px solid currentColor', outlineOffset: 2 } }}><summary>عرض نص الرسالة</summary><Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, mt: 1 }}>{message.message}</Typography></Box>
    <Box display="flex" gap={1.5} flexWrap="wrap"><Button color="secondary" variant={message.is_read ? 'outlined' : 'contained'} disabled={disabled} onClick={() => onRead(!message.is_read)}>{message.is_read ? 'تعليم كغير مقروءة' : 'تعليم كمقروءة'}</Button>{reply && <Button color="inherit" variant="outlined" component="a" href={reply} aria-disabled={disabled} onClick={event => { if (disabled) event.preventDefault(); }}>فتح الرد في البريد</Button>}</Box>
  </Box>;
}
