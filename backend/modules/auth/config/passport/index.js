const passport = require('passport');
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) require('./googlePassport');
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) require('./githubPassport');
module.exports = passport;
