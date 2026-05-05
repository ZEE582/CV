require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/jobs',         require('./routes/jobs'));
app.use('/api/companies',    require('./routes/companies'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/messages',     require('./routes/messages'));

// ── Static frontend
const pub = path.join(__dirname, '../frontend/public');
app.use(express.static(pub));
app.get('*', (_req, res) => res.sendFile(path.join(pub, 'index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🌿  فُرص فلسطين  — Server Started       ║');
  console.log(`║  http://localhost:${PORT}                    ║`);
  console.log('║  DB : waseem_foras                       ║');
  console.log('╚══════════════════════════════════════════╝');
});
