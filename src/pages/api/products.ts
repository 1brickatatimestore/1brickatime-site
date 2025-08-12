import { NextApiRequest, NextApiResponse } from "next";
import Product from "@/src/models/Product";
import dbConnect from "@/src/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  const {
    page = 1,
    limit = 24,
    theme,
    search,
    sort = "desc",
    featured,
  } = req.query;

  const filters: any = {};

  if (theme) filters.theme = theme;
  if (search) filters.name = { $regex: search, $options: "i" };
  if (featured) filters.featured = featured === "true";

  const sortOptions = sort === "asc" ? 1 : -1;

  const products = await Product.find(filters)
    .sort({ createdAt: sortOptions })
    .skip((+page - 1) * +limit)
    .limit(+limit);

  res.status(200).json(products);
}