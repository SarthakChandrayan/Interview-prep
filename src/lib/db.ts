import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/interview-prep";

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
