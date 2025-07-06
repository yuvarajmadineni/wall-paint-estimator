// Helper for Google Vertex AI wall dimension estimation
// For now, this is mocked. Replace with real API call when available.

import { VertexAI } from "@google-cloud/vertexai";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";


const project = process.env.GOOGLE_PROJECT_ID!;
const location = process.env.GOOGLE_LOCATION || "us-central1";
const model = "gemini-2.0-flash"; // Use Gemini Vision model

// create a vertex-ai.json file in the root of the project if doesn't exist
const vertexAiJsonPath = "/tmp/vertex-ai.json";
if (!existsSync(vertexAiJsonPath)) {
  // Write the original JSON string to preserve proper escaping
  writeFileSync(vertexAiJsonPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!);
}

const vertexAI = new VertexAI({
  project,
  location,
});

const generativeVisionModel = vertexAI.getGenerativeModel({ model });

/**
 * Accepts a File or Blob (from Next.js API route), reads it as base64, and sends to Vertex AI.
 * Returns the model's response as { width, height }.
 */
export async function getWallDimensions(
  image: File | Blob
): Promise<{ width: number; height: number }> {
  // Convert Blob to Buffer
  const buffer = Buffer.from(await image.arrayBuffer());
  const mimeType = (image as File).type || "image/jpeg";
  const base64Image = buffer.toString("base64");

  // Prompt for the model
  const filePart = { inlineData: { data: base64Image, mimeType } };
  const textPart = {
    text: 'Estimate the width and height of the wall in feet. Respond ONLY as JSON: {"width": <number>, "height": <number>}',
  };

  const request = {
    contents: [{ role: "user", parts: [textPart, filePart] }],
  };

  const result = await generativeVisionModel.generateContent(request);
  const responseText =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Try to parse the JSON from the model's response
  try {
    const match = responseText.match(/\{.*\}/);
    if (match) {
      const dims = JSON.parse(match[0]);
      if (typeof dims.width === "number" && typeof dims.height === "number") {
        return dims;
      }
    }
    throw new Error("Could not parse dimensions from model response");
  } catch (e) {
    console.error(e);
    throw new Error(
      "Vertex AI did not return valid dimensions: " + responseText
    );
  }
}
