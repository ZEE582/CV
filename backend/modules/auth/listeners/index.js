/**
 * @fileoverview Event Listeners Loader
 * @description Imports all user event listeners for side-effect registration.
 *
 *              Importing this file once is enough to activate all listeners.
 *
 * @module listeners
 */

require("./userRegistered.js");
require("./userVerified.js");
require("./questionsCompleted.js");
require("./profileUpdated.js");