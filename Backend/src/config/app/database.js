/**
 * @fileoverview MongoDB Connection
 * @description Handles MongoDB database connection.
 *
 * @module config/app/database
 */

import mongoose from "mongoose";

export async function connectDatabase() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error(
      "❌ MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
}