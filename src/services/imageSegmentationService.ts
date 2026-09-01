import { Point2D, SurfaceType } from "../types";

export interface SegmentationResponse {
  detected: boolean;
  confidence: number;
  points: Point2D[];
  error?: string;
}

/**
 * Service to request AI-powered surface detection.
 * Calls our server-side proxy which wraps the Gemini 3.7 Vision API.
 */
export async function detectSurfaceAI(
  imageBase64: string,
  surfaceType: SurfaceType
): Promise<SegmentationResponse> {
  try {
    const response = await fetch("/api/detect-surface", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: imageBase64,
        surfaceType,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Service returned ${response.status}: ${response.statusText}`);
    }

    const data: SegmentationResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("AI Surface Detection Service Error:", error);
    
    // Graceful fallback points representing a standard perspective floor
    return {
      detected: false,
      confidence: 0,
      points: [
        { x: 0.20, y: 0.65, label: "top-left" },
        { x: 0.80, y: 0.65, label: "top-right" },
        { x: 0.95, y: 0.95, label: "bottom-right" },
        { x: 0.05, y: 0.95, label: "bottom-left" }
      ],
      error: error.message || "Failed to establish server connection. Using fallback manual selection."
    };
  }
}
