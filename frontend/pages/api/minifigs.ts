// src/pages/api/minifigs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Minifig from "@/models/Minifig";

const MONGO_URI = process.env.MONGODB_URI!;

async function connectDB() {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(MONGO_URI);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await connectDB();

  try {
    const minifigs = await Minifig.find().sort({ figNumber: 1 }).lean();
    res.status(200).json({ content: minifigs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch minifigs" });
  }
}
