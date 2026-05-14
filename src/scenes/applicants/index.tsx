import { Box, Chip } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Header from "../../components/header";

const applicants = [
  {
    id: 1,
    name: "Ahmad Ali",
    job: "Front-End Developer",
    email: "ahmad@gmail.com",
    status: "Pending",
  },
  {
    id: 2,
    name: "Lina Salem",
    job: "UI/UX Designer",
    email: "lina@gmail.com",
    status: "Accepted",
  },
  {
    id: 3,
    name: "Omar Khaled",
    job: "Back-End Developer",
    email: "omar@gmail.com",
    status: "Rejected",
  },
];

const Applicants = () => {
  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "job", headerName: "Job", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === "Accepted"
              ? "success"
              : params.value === "Rejected"
              ? "error"
              : "warning"
          }
        />
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="APPLICANTS" subtitle="Manage Job Applicants" />

      <Box height="75vh" mt="30px">
        <DataGrid rows={applicants} columns={columns} />
      </Box>
    </Box>
  );
};

export default Applicants;