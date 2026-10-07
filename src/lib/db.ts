import "server-only";
import mongoose from "mongoose";
import { env } from "@/lib/env";

const MONGODB_URI = env.MONGODB_URI;

// Reuse one connection across hot reloads in dev and across requests in prod.
const globalForMongoose = globalThis as unknown as {
  mongooseConn?: Promise<typeof mongoose>;
};

export function connectDb(): Promise<typeof mongoose> {
  globalForMongoose.mongooseConn ??= mongoose.connect(MONGODB_URI).catch((err) => {
    globalForMongoose.mongooseConn = undefined;
    throw err;
  });
  return globalForMongoose.mongooseConn;
}
