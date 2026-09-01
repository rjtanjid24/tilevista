import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing with generous limits for image uploads
app.use(express.json({ limit: "20mb" }));
app.use(cors());

// Lazy-initialize Google GenAI client to prevent crash if key is missing at startup
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured or is using the default placeholder.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AI Surface Detection API
app.post("/api/detect-surface", async (req, res) => {
  try {
    const { image, surfaceType = "floor" } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Missing image data" });
    }

    // Extract base64 details from standard Data URL
    let base64Data = image;
    let mimeType = "image/jpeg";

    if (image.includes(";base64,")) {
      const parts = image.split(";base64,");
      const mimePart = parts[0];
      base64Data = parts[1];
      if (mimePart.includes("data:")) {
        mimeType = mimePart.replace("data:", "");
      }
    }

    // Initialize Gemini API client
    const ai = getAIClient();

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const promptText = `Identify the 4 corner points of the ${surfaceType} in this room photograph.
The points must outline the main perspective-accurate quadrilateral of the ${surfaceType} where tiles can be placed.
Return the coordinates of the 4 corners in this exact clockwise/counter-clockwise loop: Top-Left, Top-Right, Bottom-Right, Bottom-Left.
Each coordinate must be a normalized number between 0.0 and 1.0 (relative to the image width and height, where (0,0) is top-left and (1,1) is bottom-right).
For the floor:
- Top-Left: the back-left corner where the floor meets the left wall and back wall.
- Top-Right: the back-right corner where the floor meets the right wall and back wall.
- Bottom-Right: the front-right corner at the bottom of the image.
- Bottom-Left: the front-left corner at the bottom of the image.

Ensure the coordinates trace a valid, wide convex quadrilateral that realistically maps the floor surface.
If no clear floor surface can be detected, set 'detected' to false, but still propose an approximate wide quadrilateral in the bottom half of the image.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        imagePart,
        { text: promptText }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected: { type: Type.BOOLEAN, description: "Whether the requested surface was successfully detected" },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
            points: {
              type: Type.ARRAY,
              description: "Four perspective corner points in order: top-left, top-right, bottom-right, bottom-left",
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER, description: "X coordinate (0.0 to 1.0)" },
                  y: { type: Type.NUMBER, description: "Y coordinate (0.0 to 1.0)" },
                  label: { type: Type.STRING, description: "Must be top-left, top-right, bottom-right, or bottom-left" }
                },
                required: ["x", "y", "label"]
              }
            }
          },
          required: ["detected", "confidence", "points"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text received from Gemini API");
    }

    const resultJson = JSON.parse(resultText.trim());
    return res.json(resultJson);

  } catch (error: any) {
    console.error("AI Surface Detection error:", error);
    // Provide a friendly error message and standard coordinates so the frontend can fallback seamlessly
    return res.status(200).json({
      detected: false,
      error: error.message || "Failed to call AI detection",
      confidence: 0,
      points: [
        { x: 0.15, y: 0.65, label: "top-left" },
        { x: 0.85, y: 0.65, label: "top-right" },
        { x: 0.95, y: 0.95, label: "bottom-right" },
        { x: 0.05, y: 0.95, label: "bottom-left" }
      ]
    });
  }
});

// Configure Vite middleware or Static files
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving built files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TileVista backend running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start TileVista full-stack server:", err);
});
