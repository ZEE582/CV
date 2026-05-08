import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Header from "../../components/header";

const FAQ: React.FC = () => {
  return (
    <Box m="20px">
      <Header title="FAQ" subtitle="Questions" />

      {[1,2,3].map((item) => (
        <Accordion key={item}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Question {item}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Answer {item}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default FAQ;