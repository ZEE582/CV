import { Box, useTheme, Chip } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/header";
import { mockDataTeam } from "../../data/src/data/mockData";

const Team: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
    },

    {
      field: "role",
      headerName: "Job Role",
      flex: 1,
    },

    {
      field: "phone",
      headerName: "Phone",
      flex: 1,
    },

    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },

    {
      field: "access",
      headerName: "Position",
      flex: 1,

      renderCell: (params) => {
        const color =
          params.value === "Leader"
            ? colors.greenAccent[500]
            : params.value === "Team Member"
            ? colors.blueAccent[500]
            : colors.redAccent[500];

        return (
          <Chip
            label={params.value}
            sx={{
              backgroundColor: color,
              color: "#fff",
              fontWeight: "bold",
            }}
          />
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header title="TEAM" subtitle="Team Members Information" />

      <Box
        m="40px 0 0 0"
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
        <DataGrid rows={mockDataTeam} columns={columns} />
      </Box>
    </Box>
  );
};

export default Team;