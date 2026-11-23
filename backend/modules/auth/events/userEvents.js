/**
 * @fileoverview User Events Emitter
 * @description Central EventEmitter instance used across the application
 *              for user-related lifecycle events.
 *
 *              Route handlers emit events while listeners react separately,
 *              allowing cleaner separation of concerns.
 *
 * @module events/userEvents
 */

const EventEmitter = require("events");

const userEvents = new EventEmitter();

module.exports = userEvents;