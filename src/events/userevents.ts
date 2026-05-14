/**
 * @fileoverview User Domain Events
 * @description Implements a lightweight event emitter for user lifecycle events.
 *
 *              Using an EventEmitter decouples the route handlers from
 *              side-effect logic (logging, analytics, notifications, etc.).
 *              Route handlers emit events; listeners react without the handler
 *              needing to know what happens next.
 *
 *              Current events and their emitters:
 *              ┌─────────────────────────┬────────────────────────────┐
 *              │ Event                   │ Emitted in                 │
 *              ├─────────────────────────┼────────────────────────────┤
 *              │ userRegistered          │ authroutes → POST /signup  │
 *              │ userVerified            │ authroutes → POST /verify  │
 *              │ questionsCompleted      │ Userroutes → POST /quest.. │
 *              │ profileUpdated          │ Userroutes → PUT /profile  │
 *              └─────────────────────────┴────────────────────────────┘
 *
 *              To add a new side-effect, simply add a new `.on()` listener here
 *              without touching any route file.
 *
 * @module events/userevents
 */

import EventEmitter from "events";

const userEvents = new EventEmitter();

// ─── userRegistered ───────────────────────────────────────────────────────────
/**
 * Fired immediately after a new local account is created in the database.
 * At this point the account is NOT yet verified.
 *
 * @event userRegistered
 * @param {object} user - The newly created Mongoose user document
 */
userEvents.on("userRegistered", (user) => {
  // TODO: hook analytics / welcome queue here
  console.log(`[Event] userRegistered — ${user.email}`);
});

// ─── userVerified ─────────────────────────────────────────────────────────────
/**
 * Fired after the user successfully enters the correct verification code.
 * The user's `isVerified` flag is already true at this point.
 *
 * @event userVerified
 * @param {object} user - The verified Mongoose user document
 */
userEvents.on("userVerified", (user) => {
  // TODO: send welcome email, trigger onboarding sequence, etc.
  console.log(`[Event] userVerified — ${user.email}`);
});

// ─── questionsCompleted ───────────────────────────────────────────────────────
/**
 * Fired after the user submits the onboarding questionnaire.
 * `user.hasCompletedQuestions` is true and `user.onboardingData` is populated.
 *
 * @event questionsCompleted
 * @param {object} user - The updated Mongoose user document
 */
userEvents.on("questionsCompleted", (user) => {
  // TODO: trigger personalization pipeline, notify admin, etc.
  console.log(`[Event] questionsCompleted — ${user.email}`);
});

// ─── profileUpdated ───────────────────────────────────────────────────────────
/**
 * Fired after the user updates their profile via PUT /api/user/profile.
 *
 * @event profileUpdated
 * @param {object} user - The updated Mongoose user document
 */
userEvents.on("profileUpdated", (user) => {
  console.log(`[Event] profileUpdated — ${user.email}`);
});

export default userEvents;