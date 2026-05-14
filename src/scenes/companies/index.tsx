import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
} from "@mui/material";

import Header from "../../components/header";

type Company = {
  id: number;
  company_name: string;
  city: string;
  company_logo: string;
  industry: string;
  status: string;
};

const Companies = () => {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newCompany, setNewCompany] = useState({
    company_name: "",
    city: "",
    industry: "",
    status: "",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = () => {
    fetch("http://localhost:5001/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch((err) => console.log(err));
  };

  const handleAddCompany = () => {
    fetch("http://localhost:5001/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...newCompany,
        company_logo: "default.png",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCompanies([...companies, data]);

        setNewCompany({
          company_name: "",
          city: "",
          industry: "",
          status: "",
        });
      });
  };

  const handleDelete = (id: number) => {
    fetch(`http://localhost:5001/companies/${id}`, {
      method: "DELETE",
    }).then(() => {
      setCompanies(
        companies.filter((company) => company.id !== id)
      );
    });
  };

  const handleEdit = (company: Company) => {
    setEditingId(company.id);

    setNewCompany({
      company_name: company.company_name,
      city: company.city,
      industry: company.industry,
      status: company.status,
    });
  };

  const handleUpdateCompany = () => {
    if (editingId === null) return;

    fetch(`http://localhost:5001/companies/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...newCompany,
        company_logo: "default.png",
      }),
    })
      .then((res) => res.json())
      .then((updatedCompany) => {
        setCompanies(
          companies.map((company) =>
            company.id === editingId
              ? updatedCompany
              : company
          )
        );

        setEditingId(null);

        setNewCompany({
          company_name: "",
          city: "",
          industry: "",
          status: "",
        });
      });
  };

  const handleCancelEdit = () => {
    setEditingId(null);

    setNewCompany({
      company_name: "",
      city: "",
      industry: "",
      status: "",
    });
  };

  const filteredCompanies = companies.filter((company) =>
    company.company_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Box m="20px">
      <Header
        title="COMPANIES"
        subtitle="Manage Companies"
      />

      <Box
        display="flex"
        gap="15px"
        flexWrap="wrap"
        mb="25px"
      >
        <TextField
          label="Company Name"
          value={newCompany.company_name}
          onChange={(e) =>
            setNewCompany({
              ...newCompany,
              company_name: e.target.value,
            })
          }
        />

        <TextField
          label="City"
          value={newCompany.city}
          onChange={(e) =>
            setNewCompany({
              ...newCompany,
              city: e.target.value,
            })
          }
        />

        <TextField
          label="Industry"
          value={newCompany.industry}
          onChange={(e) =>
            setNewCompany({
              ...newCompany,
              industry: e.target.value,
            })
          }
        />

        <TextField
          label="Status"
          value={newCompany.status}
          onChange={(e) =>
            setNewCompany({
              ...newCompany,
              status: e.target.value,
            })
          }
        />

        {editingId === null ? (
          <Button
            variant="contained"
            color="success"
            onClick={handleAddCompany}
          >
            Add Company
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              color="warning"
              onClick={handleUpdateCompany}
            >
              Update
            </Button>

            <Button
              variant="outlined"
              color="inherit"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
          </>
        )}
      </Box>

      <TextField
        label="Search Company"
        fullWidth
        sx={{ mb: "25px" }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Grid container spacing={3}>
        {filteredCompanies.map((company) => (
          <Grid
            size={{ xs: 12, sm: 6, md: 4 }}
            key={company.id}
          >
            <Card
              sx={{
                backgroundColor: "#1F2A40",
                color: "white",
                borderRadius: "14px",
              }}
            >
              <CardContent>
                <Typography variant="h4" mb="10px">
                  {company.company_name}
                </Typography>

                <Typography>
                  City: {company.city}
                </Typography>

                <Typography>
                  Industry: {company.industry}
                </Typography>

                <Typography>
                  Status: {company.status}
                </Typography>

                <Box
                  display="flex"
                  gap="10px"
                  mt="15px"
                  flexWrap="wrap"
                >
                  <Button
                    variant="contained"
                    color="info"
                    onClick={() =>
                      navigate("/company-details", {
                        state: company,
                      })
                    }
                  >
                    View Details
                  </Button>

                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => handleEdit(company)}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    onClick={() =>
                      handleDelete(company.id)
                    }
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Companies;