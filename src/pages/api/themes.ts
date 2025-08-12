import { NextApiRequest, NextApiResponse } from "next";
import Product from "@/src/models/Product";
import dbConnect from "@/src/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  const themes = await Product.aggregate([
    {
      $group: {
        _id: "$theme",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  res.status(200).json(themes.map((t) => t._id));
}