import { Box, Typography, Card, CardContent, Button } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/header";

type Company = {
  id: number;
  company_name: string;
  city: string;
  company_logo: string;
  industry: string;
  status: string;
};

const CompanyDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const company = location.state as Company;

  if (!company) {
    return (
      <Box m="20px">
        <Typography color="white">No company selected</Typography>
        <Button onClick={() => navigate("/companies")}>Back</Button>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header title="COMPANY DETAILS" subtitle="Company Information" />

      <Card
        sx={{
          backgroundColor: "#1F2A40",
          color: "white",
          borderRadius: "14px",
          maxWidth: "600px",
        }}
      >
        <CardContent>
          <Typography variant="h3" mb="20px">
            {company.company_name}
          </Typography>

          <Typography mb="10px">City: {company.city}</Typography>
          <Typography mb="10px">Industry: {company.industry}</Typography>
          <Typography mb="10px">Status: {company.status}</Typography>
          <Typography mb="10px">Logo: {company.company_logo}</Typography>

          <Button
            variant="contained"
            sx={{ mt: "20px" }}
            onClick={() => navigate("/companies")}
          >
            Back to Companies
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CompanyDetails;