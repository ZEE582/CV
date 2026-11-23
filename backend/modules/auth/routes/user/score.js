const express = require('express');
const requireAuth = require('../../middleware/authentication');
const router = express.Router();
// Awarding points requires a server-validated achievement system.
router.get('/score', requireAuth, (req, res) => res.json({ score: req.account.score || 0 }));
router.patch('/score', requireAuth, (_req, res) => res.status(403).json({ message: 'لا يمكن منح النقاط من المتصفح' }));
module.exports = router;
