import { NextRequest, NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";
import { existsSync, writeFileSync } from "fs";

const project = process.env.GOOGLE_PROJECT_ID!;
const location = process.env.GOOGLE_LOCATION || "us-central1";
const model = "gemini-2.0-flash";
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const buffer = Buffer.from(await image.arrayBuffer());
    const mimeType = image.type || "image/jpeg";
    const base64Image = buffer.toString("base64");

    const filePart = { inlineData: { data: base64Image, mimeType } };
    const textPart = {
      text: `Analyze this image comprehensively and detect ALL objects, elements, and features present with precise bounding box coordinates. Be extremely thorough and do not miss any visible elements.

Please identify EVERYTHING visible in the image:

1. **Architectural Elements (Primary Focus):**
   - All walls (vertical surfaces, including partial walls)
   - Ceilings (horizontal upper surfaces)
   - Floors (horizontal lower surfaces)
   - All windows (including window frames, sills, and glass)
   - All doors (including door frames, handles, hinges)
   - Doorways and openings
   - Wall corners and edges
   - Baseboards and trim
   - Moldings and architectural details (explicitly include dentil crown moulding)
   - Stairs and railings (note curved railings where applicable)
   - Columns and structural supports
   - Built-in cabinetry and shelving
   - Tray ceilings and coffered ceilings
   - Triangular wall segments and other non-orthogonal walls
   - Curved walls or segments
   - Decorative trim, paneling, wainscoting, and accent walls

2. **Furniture and Objects:**
   - All furniture (tables, chairs, beds, sofas, cabinets, etc.)
   - Appliances (refrigerators, stoves, dishwashers, etc.)
   - Electronics (TVs, computers, phones, etc.)
   - Decorative items (pictures, plants, vases, etc.)
   - Storage items (boxes, containers, etc.)
   - Any other objects visible


3. **Environmental Elements:**
   - Lighting fixtures and lamps
   - Outlets and switches
   - Heating/cooling vents
   - Smoke detectors
   - Any other fixtures or hardware

Respond with a comprehensive JSON object containing:
{
  "objects": [
    {
      "name": "specific object name (be descriptive)",
      "confidence": "high/medium/low",
      "bounding_box": {
        "x": percentage_from_left_edge,
        "y": percentage_from_top_edge,
        "width": percentage_of_image_width,
        "height": percentage_of_image_height
      },
      "description": "detailed description of the object",
      "type": "wall/window/door/ceiling/floor/furniture/appliance/electronics/decorative/text/fixture/molding/trim/railing/cabinetry/accent_wall"
    }
  ],
  "architectural_elements": {
    "walls": [
      {
        "name": "specific wall description (e.g., 'left wall', 'back wall', 'partial wall')",
        "confidence": "high/medium/low",
        "bounding_box": {
          "x": percentage_from_left_edge,
          "y": percentage_from_top_edge,
          "width": percentage_of_image_width,
          "height": percentage_of_image_height
        },
        "orientation": "vertical/horizontal/angled/curved",
        "shape": "rectangular/triangular/curved/irregular",
        "accent": true,
        "surface_area": "estimated area in square feet"
      }
    ],
    "moldings": [
      {
        "name": "crown/dentil/base/casing/other",
        "confidence": "high/medium/low",
        "bounding_box": {
          "x": percentage_from_left_edge,
          "y": percentage_from_top_edge,
          "width": percentage_of_image_width,
          "height": percentage_of_image_height
        },
        "style": "dentil/cove/ogee/etc"
      }
    ],
    "railings": [
      {
        "name": "railing description (e.g., 'curved stair railing')",
        "confidence": "high/medium/low",
        "bounding_box": {
          "x": percentage_from_left_edge,
          "y": percentage_from_top_edge,
          "width": percentage_of_image_width,
          "height": percentage_of_image_height
        },
        "curved": true
      }
    ],
    "cabinetry": [
      {
        "name": "built-in cabinetry/shelving description",
        "confidence": "high/medium/low",
        "bounding_box": {
          "x": percentage_from_left_edge,
          "y": percentage_from_top_edge,
          "width": percentage_of_image_width,
          "height": percentage_of_image_height
        }
      }
    ],
    "ceilings": [
      {
        "name": "ceiling description",
        "confidence": "high/medium/low",
        "bounding_box": {
          "x": percentage_from_left_edge,
          "y": percentage_from_top_edge,
          "width": percentage_of_image_width,
          "height": percentage_of_image_height
        },
        "surface_area": "estimated area in square feet"
      }
    ],
    "ceilings_special": [
      {
        "name": "tray/coffered ceiling description",
        "confidence": "high/medium/low",
        "bounding_box": {
          "x": percentage_from_left_edge,
          "y": percentage_from_top_edge,
          "width": percentage_of_image_width,
          "height": percentage_of_image_height
        },
        "type": "tray/coffered/other"
      }
    ],
    "floors": [
      {
        "name": "floor description",
        "confidence": "high/medium/low",
        "bounding_box": {
          "x": percentage_from_left_edge,
          "y": percentage_from_top_edge,
          "width": percentage_of_image_width,
          "height": percentage_of_image_height
        },
        "surface_area": "estimated area in square feet"
      }
    ]
  },
  "scene": "detailed overall scene description",
  "summary": "comprehensive summary of all detected elements",
  "room_dimensions": {
    "estimated_width": "estimated room width in feet",
    "estimated_height": "estimated room height in feet",
    "estimated_length": "estimated room length in feet"
  }
}

CRITICAL REQUIREMENTS:
- Be extremely thorough - do not miss any visible objects or elements
- Pay special attention to walls, windows, doors, and architectural features
- All bounding box coordinates must be percentages (0-100) relative to image dimensions
- Provide detailed, specific names for each object (not generic terms)
- Include confidence levels based on clarity and visibility
- Ensure comprehensive coverage of the entire image area
- Explicitly identify irregular geometries such as triangular segments, curved walls/railings, tray ceilings, dentil crown moulding, built-in cabinetry, decorative trim, and accent walls`,
    };

    const request_data = {
      contents: [{ role: "user", parts: [textPart, filePart] }],
    };

    const result = await generativeVisionModel.generateContent(request_data);
    const responseText =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON from the response
    try {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        const parsedResponse = JSON.parse(match[0]);
        return NextResponse.json(parsedResponse);
      }
      throw new Error("Could not parse JSON from model response");
    } catch (e) {
      console.error("Error parsing response:", e);
      return NextResponse.json(
        { 
          error: "Failed to parse model response",
          raw_response: responseText 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Object detection error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
