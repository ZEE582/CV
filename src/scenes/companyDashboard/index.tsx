import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  Button,
} from "@mui/material";

import Header from "../../components/header";

type Job = {
  id: number;
  title: string;
  applicants: number;
  status: "Open" | "Closed";
};

const CompanyDashboard = () => {
  const company = {
    name: "Xngage",
    city: "Nablus",
    industry: "Software",
    status: "Active",
  };

  const [jobs, setJobs] = useState<Job[]>([
    { id: 1, title: "Front-End Developer", applicants: 12, status: "Open" },
    { id: 2, title: "UI/UX Designer", applicants: 8, status: "Open" },
    { id: 3, title: "Back-End Developer", applicants: 5, status: "Closed" },
  ]);

  const [newJob, setNewJob] = useState({
    title: "",
    applicants: "",
    status: "Open" as "Open" | "Closed",
  });

  const totalApplicants = jobs.reduce((sum, job) => sum + job.applicants, 0);
  const openJobs = jobs.filter((job) => job.status === "Open").length;

  const handleAddJob = () => {
    if (!newJob.title) return;

    const job: Job = {
      id: Date.now(),
      title: newJob.title,
      applicants: Number(newJob.applicants) || 0,
      status: newJob.status,
    };

    setJobs([...jobs, job]);

    setNewJob({
      title: "",
      applicants: "",
      status: "Open",
    });
  };

  const handleDeleteJob = (id: number) => {
    setJobs(jobs.filter((job) => job.id !== id));
  };

  return (
    <Box m="20px">
      <Header title="COMPANY DASHBOARD" subtitle="Company workspace" />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ backgroundColor: "#1F2A40", color: "white" }}>
            <CardContent>
              <Typography variant="h4">{company.name}</Typography>
              <Typography>City: {company.city}</Typography>
              <Typography>Industry: {company.industry}</Typography>
              <Chip label={company.status} color="success" sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ backgroundColor: "#26354f", color: "white" }}>
                <CardContent>
                  <Typography variant="h3">{jobs.length}</Typography>
                  <Typography>Jobs</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ backgroundColor: "#26354f", color: "white" }}>
                <CardContent>
                  <Typography variant="h3">{totalApplicants}</Typography>
                  <Typography>Applicants</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ backgroundColor: "#26354f", color: "white" }}>
                <CardContent>
                  <Typography variant="h3">{openJobs}</Typography>
                  <Typography>Open Jobs</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ backgroundColor: "#1F2A40", color: "white" }}>
            <CardContent>
              <Typography variant="h4" mb="20px">
                Add New Job
              </Typography>

              <Box display="flex" gap="15px" flexWrap="wrap" mb="25px">
                <TextField
                  label="Job Title"
                  value={newJob.title}
                  onChange={(e) =>
                    setNewJob({ ...newJob, title: e.target.value })
                  }
                />

                <TextField
                  label="Applicants"
                  type="number"
                  value={newJob.applicants}
                  onChange={(e) =>
                    setNewJob({ ...newJob, applicants: e.target.value })
                  }
                />

                <TextField
                  label="Status"
                  value={newJob.status}
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      status: e.target.value as "Open" | "Closed",
                    })
                  }
                />

                <Button variant="contained" color="success" onClick={handleAddJob}>
                  Add Job
                </Button>
              </Box>

              <Typography variant="h4" mb="20px">
                Company Jobs
              </Typography>

              {jobs.map((job) => (
                <Box
                  key={job.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p="12px"
                  mb="10px"
                  borderRadius="8px"
                  sx={{ backgroundColor: "#374151" }}
                >
                  <Typography>{job.title}</Typography>
                  <Typography>{job.applicants} Applicants</Typography>

                  <Chip
                    label={job.status}
                    color={job.status === "Open" ? "success" : "error"}
                  />

                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleDeleteJob(job.id)}
                  >
                    Delete
                  </Button>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanyDashboard;