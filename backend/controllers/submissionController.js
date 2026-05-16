// const Submission = require("../models/Submission");
// const runCode = require("../services/compilerService");

// const executeCode = async (req, res) => {
//   try {
//     const { problemId, language, code } = req.body;

//     const result = await runCode(language, code);

//     const submission = await Submission.create({
//       problemId,
//       language,
//       code,
//       output: result.output,
//       status: result.success
//         ? "Executed"
//         : "Error",
//     });

//     res.json({
//       success: true,
//       data: submission,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// module.exports = {
//   executeCode,
// };
const { VM } = require("vm2");
 
// ── Controller: POST /api/submissions/run
const executeCode = async (req, res) => {
  try {
    const { code } = req.body;
 
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "code is required",
      });
    }
 
    // ── Capture console.log output
    const logs = [];
 
    const vm = new VM({
      timeout: 3000, // 3 seconds max
      sandbox: {
        console: {
          log: (...args) =>
            logs.push(args.map(String).join(" ")),
          error: (...args) =>
            logs.push("Error: " + args.map(String).join(" ")),
          warn: (...args) =>
            logs.push("Warn: " + args.map(String).join(" ")),
        },
      },
    });
 
    // ── Run the code
    const returnValue = vm.run(code);
 
    // ── Build output
    let output = logs.join("\n");
 
    // إذا ما في console.log بس في return value، عرضه
    if (!output && returnValue !== undefined) {
      output = String(returnValue);
    }
 
    return res.status(200).json({
      success: true,
      data: {
        output: output || "(no output)",
        status: "Accepted",
        statusId: 3,
        time: null,
        memory: null,
      },
    });
  } catch (error) {
    const isTimeout = error.message?.includes("Script execution timed out");
 
    return res.status(200).json({
      success: true,
      data: {
        output: error.message || "Runtime Error",
        status: isTimeout ? "Time Limit Exceeded" : "Runtime Error",
        statusId: isTimeout ? 5 : 11,
        time: null,
        memory: null,
      },
    });
  }
};
 
module.exports = { executeCode };