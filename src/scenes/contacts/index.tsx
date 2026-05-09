import { useState } from "react";
import { Box, TextField, useTheme } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/header";
import { mockDataContacts } from "../../data/src/data/mockData";

const Contacts: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [searchText, setSearchText] = useState("");

  const filteredContacts = mockDataContacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchText.toLowerCase()) ||
    contact.phone.includes(searchText)
  );

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "role", headerName: "Role", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "phone", headerName: "Phone", flex: 1 },
    { field: "address", headerName: "Address", flex: 1 },
  ];

  return (
    <Box m="20px">
      <Header title="CONTACTS" subtitle="Search Team Contacts" />

      <TextField
        label="Search by name, email or phone"
        variant="outlined"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{
          mb: 2,
          width: "350px",
          input: { color: colors.grey[100] },
          label: { color: colors.grey[100] },
        }}
      />

      <Box
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: colors.blueAccent[700],
            borderTop: "none",
          },
        }}
      >
        <DataGrid rows={filteredContacts} columns={columns} />
      </Box>
    </Box>
  );
};

export default Contacts;