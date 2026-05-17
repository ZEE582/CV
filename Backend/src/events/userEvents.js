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

import EventEmitter from "events";

const userEvents = new EventEmitter();

export default userEvents;