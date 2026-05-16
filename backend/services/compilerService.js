const axios = require("axios");

const runCode = async (language, code) => {
  try {
    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language,
        version: "latest",
        files: [
          {
            content: code,
          },
        ],
      }
    );

    return {
      success: true,
      output:
        response.data.run.output || "No Output",
    };
  } catch (error) {
    return {
      success: false,
      output: "Execution Error",
    };
  }
};

module.exports = runCode;