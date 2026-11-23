import { MenuItem, TextField, Typography } from '@mui/material';
import type { Company } from '../../types';
export default function CompanyPicker({ companies, selected, onSelect, isAdmin, disabled }: { companies: Company[]; selected?: Company; onSelect: (id: string) => void; isAdmin: boolean; disabled?: boolean }) {
  if (!companies.length) return null;
  return isAdmin ? <TextField select fullWidth label="الشركة" value={selected?._id || ''} onChange={event => onSelect(event.target.value)} disabled={disabled} sx={{ my: 3 }}>{!selected && <MenuItem value="" disabled>اختر شركة</MenuItem>}{companies.map(company => <MenuItem key={company._id} value={company._id}>{company.name_ar || company.name_en}{company.is_active === false ? ' (موقوفة)' : ''}</MenuItem>)}</TextField>
    : <Typography variant="h5" my={3}>{selected?.name_ar || selected?.name_en || ''}</Typography>;
}
