const express = require("express");
const router = express.Router();

const {
  executeCode,
} = require("../controllers/submissionController");

router.post("/run", executeCode);

module.exports = router;