import { Box, Button, TextField } from "@mui/material";
import { Formik } from "formik";

const Form = () => {
  return (
    <Box m="20px">
      <Formik
        initialValues={{ name: "" }}
        onSubmit={(values) => console.log(values)}
      >
        {({ handleChange, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <TextField name="name" onChange={handleChange} />
            <Button type="submit">Submit</Button>
          </form>
        )}
      </Formik>
    </Box>
  );
};

export default Form;