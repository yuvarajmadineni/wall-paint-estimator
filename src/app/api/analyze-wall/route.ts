import { NextRequest, NextResponse } from "next/server";
import { getWallDimensions } from "@/lib/vertexAi";
import { calculateCost } from "../../../lib/costCalculator";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get("image");
  const zoom = formData.get("zoom");

  
  if (!image || typeof image === "string") {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }

  // Parse zoom value, default to 1 if not provided
  const zoomValue = zoom ? parseFloat(zoom as string) : 1;
  if (isNaN(zoomValue) || zoomValue <= 0) {
    return NextResponse.json({ error: "Invalid zoom value" }, { status: 400 });
  }

  try {
    const { width, height } = await getWallDimensions(image as File | Blob, zoomValue);
    const cost = calculateCost(width, height);
    return NextResponse.json({ width, height, cost, zoom: zoomValue });
  } catch (err: unknown) {
    console.log("err", err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    } else {
      console.error(err);
      return NextResponse.json(
        { error: "Failed to analyze image" },
        { status: 500 }
      );
    }
  }
}
