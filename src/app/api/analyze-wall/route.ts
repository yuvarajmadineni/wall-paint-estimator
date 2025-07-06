import { NextRequest, NextResponse } from "next/server";
import { getWallDimensions } from "@/lib/vertexAi";
import { calculateCost } from "../../../lib/costCalculator";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get("image");
  if (!image || typeof image === "string") {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }

  try {
    const { width, height } = await getWallDimensions(image as File | Blob);
    const cost = calculateCost(width, height);
    return NextResponse.json({ width, height, cost });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "Failed to analyze image" },
        { status: 500 }
      );
    }
  }
}
