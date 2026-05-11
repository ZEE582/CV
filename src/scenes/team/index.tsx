import { Box, Typography } from "@mui/material";
import Header from "../../components/header";
import { useEffect, useState } from "react";

type TeamMember = {
  id: number;
  name: string;
  age: number;
  phone: string;
  email: string;
  access: string;
  role: string;
  image: string;
};

const Team = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetch("http://localhost:5001/team")
      .then((res) => res.json())
      .then((data) => setTeam(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <Box m="20px">
      <Header title="TEAM" subtitle="Team Members Information" />

      <Box display="flex" gap="25px" flexWrap="wrap" mt="30px">
        {team.map((member) => (
          <Box
            key={member.id}
            sx={{
              width: "260px",
              backgroundColor: "#374151",
              borderRadius: "15px",
              padding: "20px",
              transition: "0.3s",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",

              "&:hover": {
                transform: "translateY(-10px)",
              },
            }}
          >
            <Box
              component="img"
              src={member.image}
              alt={member.name}
              sx={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                objectFit: "cover",
                mb: 2,
              }}
            />

            <Typography
              variant="h5"
              color="#fff"
              fontWeight="bold"
              mb={1}
            >
              {member.name}
            </Typography>

            <Typography variant="body1" color="#d1d5db" mb={1}>
              {member.role}
            </Typography>

            <Typography variant="body2" color="#9ca3af">
              {member.email}
            </Typography>

            <Typography
              variant="body2"
              color={
                member.access === "Leader"
                  ? "#4ade80"
                  : "#60a5fa"
              }
              mt={2}
              fontWeight="bold"
            >
              {member.access}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Team;