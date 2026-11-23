import { Box, Button } from "@mui/material";
import { Link } from 'react-router-dom';

type Props = {
  setIsSidebar?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Topbar: React.FC<Props> = () => {
  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      <Box display="flex" flexWrap="wrap" gap={1}>
        <Button component={Link} to="/home">الرئيسية</Button>
        <Button component={Link} to="/pages">كل الواجهات</Button>
      </Box>
    </Box>
  );
};

export default Topbar;
