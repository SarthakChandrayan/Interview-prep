import mongoose from "mongoose";
import { connection } from "next/server";
import { isAiEnabled } from "@/lib/ai/client";
import { connectDb } from "@/lib/db";

/** Liveness/readiness probe for the host: checks the database round-trip. */
export async function GET() {
  await connection();
  try {
    await connectDb();
    await mongoose.connection.db?.admin().ping();
    return Response.json({ status: "ok", database: "up", ai: isAiEnabled() ? "enabled" : "disabled" });
  } catch {
    return Response.json({ status: "error", database: "down" }, { status: 503 });
  }
}
