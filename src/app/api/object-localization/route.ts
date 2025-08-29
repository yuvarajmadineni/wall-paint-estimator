import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";

// Vertex AI configuration (replace with your values if needed)
const projectId = "234063840204";
const location = "us-central1";
const endpointId = "3832461028310908928"; // AutoML Image Object Detection endpoint

// Google Auth (ADC or service account key via GOOGLE_APPLICATION_CREDENTIALS)
const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });

// Direct REST endpoint URL (regional)
const apiHost = "https://us-central1-aiplatform.googleapis.com";
const predictUrl = `${apiHost}/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}:predict`;


export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const image = formData.get("image");

		if (!image || typeof image === "string") {
			return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
		}

		// Convert Blob to base64 content
		const buffer = Buffer.from(await (image as Blob).arrayBuffer());
		const base64Image = buffer.toString("base64");

		// Build minimal payload (content only) matching curl usage
		const body = {
			instances: [{ content: base64Image }],
			parameters: {
				confidenceThreshold: 0.2,
				maxPredictions: 100,
			}
		};

		// Get OAuth token via ADC
		const client = await auth.getClient();
		const { token } = await client.getAccessToken();
		if (!token) throw new Error("Failed to obtain access token");

		// Call REST endpoint directly
		const resp = await fetch(predictUrl, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!resp.ok) {
			const text = await resp.text();
			throw new Error(text || `HTTP ${resp.status}`);
		}

		const json = await resp.json();
		return NextResponse.json({ success: true, predictions: json.predictions || [] });
	} catch (error) {
		console.error("Error calling Vertex AI endpoint:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}
