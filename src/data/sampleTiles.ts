import { TileData } from "../types";

// Generates realistic textures procedurally using a canvas on module load
export function generateProceduralTexture(
  type: string,
  primaryColor: string,
  secondaryColor: string,
  accentColor?: string
): string {
  if (typeof document === "undefined") {
    return ""; // Server-side safety
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Draw base background
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, 512, 512);

  if (type === "marble") {
    // Elegant organic marble veins
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.35;

    // Generate several main veins
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      let x = Math.random() * 512;
      let y = 0;
      ctx.moveTo(x, y);

      while (y < 512) {
        y += 10 + Math.random() * 20;
        x += (Math.random() - 0.5) * 35;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Branching veins
      if (Math.random() > 0.3) {
        ctx.beginPath();
        const startY = 100 + Math.random() * 300;
        ctx.moveTo(x - 10, startY);
        ctx.lineTo(x + 80 * (Math.random() - 0.5), startY + 100);
        ctx.stroke();
      }
    }

    // Add finer micro-veins
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      let x = Math.random() * 512;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < 512) {
        y += 5 + Math.random() * 10;
        x += (Math.random() - 0.5) * 15;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (type === "stone" || type === "concrete") {
    // Speckled granite/concrete noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    const intensity = type === "concrete" ? 15 : 25;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * intensity;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
    ctx.putImageData(imgData, 0, 0);

    // Add some larger structural flecks
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = secondaryColor;
    for (let i = 0; i < 150; i++) {
      const r = 1 + Math.random() * 4;
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (accentColor) {
      ctx.fillStyle = accentColor;
      for (let i = 0; i < 100; i++) {
        const r = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (type === "wood") {
    // Wood grains
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, 512, 512);

    // Grain lines
    ctx.strokeStyle = secondaryColor;
    ctx.globalAlpha = 0.25;
    
    // Base curves
    for (let i = -100; i < 612; i += 12) {
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      
      // Control points for a wavy natural grain
      ctx.bezierCurveTo(
        i + 20, 150,
        i - 20, 350,
        i + Math.sin(i / 10) * 15, 512
      );
      ctx.stroke();
    }

    // Wood knot
    if (Math.random() > 0.2) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = secondaryColor;
      const knotX = 150 + Math.random() * 200;
      const knotY = 150 + Math.random() * 200;
      
      // Draw a small concentric knot
      for (let r = 5; r < 45; r += 8) {
        ctx.beginPath();
        ctx.ellipse(knotX, knotY, r, r * 1.8, Math.PI / 12, 0, Math.PI * 2);
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }
  } else if (type === "pattern") {
    // Beautiful Portuguese style or modern geometric patterns
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;

    // Draw central circular mandala / emblem
    ctx.beginPath();
    ctx.arc(256, 256, 120, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 256, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Corner decorative arcs
    const corners = [
      [0, 0],
      [512, 0],
      [512, 512],
      [0, 512],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 100, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Intersecting diagonals
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(512, 512);
    ctx.moveTo(512, 0);
    ctx.lineTo(0, 512);
    ctx.stroke();

    // Fill details
    ctx.fillStyle = accentColor || secondaryColor;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(256, 256, 30, 0, Math.PI * 2);
    ctx.fill();

    // Star polygons
    ctx.beginPath();
    ctx.moveTo(256, 170);
    ctx.lineTo(280, 230);
    ctx.lineTo(342, 256);
    ctx.lineTo(280, 282);
    ctx.lineTo(256, 342);
    ctx.lineTo(232, 282);
    ctx.lineTo(170, 256);
    ctx.lineTo(232, 230);
    ctx.closePath();
    ctx.fill();
  }

  // Draw elegant outer border bevel for premium individual tile styling
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.15;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#FFFFFF"; // Light shine on left/top
  ctx.beginPath();
  ctx.moveTo(2, 510);
  ctx.lineTo(2, 2);
  ctx.lineTo(510, 2);
  ctx.stroke();

  ctx.strokeStyle = "#000000"; // Soft shadow on right/bottom
  ctx.beginPath();
  ctx.moveTo(510, 2);
  ctx.lineTo(510, 510);
  ctx.lineTo(2, 510);
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.9);
}

// Generate sample tiles on module evaluation
export const sampleTiles: TileData[] = [
  {
    id: "carrara-white",
    name: "Carrara White Marble",
    category: "marble",
    imageUrl: "", // Generated below lazily or in list
    widthMm: 600,
    heightMm: 600,
    colorStyle: "Calacatta Gold & Grey Veined",
  },
  {
    id: "calacatta-gold",
    name: "Calacatta Gold Marble",
    category: "marble",
    imageUrl: "",
    widthMm: 600,
    heightMm: 1200,
    colorStyle: "Premium Gold & Warm Veins",
  },
  {
    id: "royal-nero",
    name: "Royal Nero Marquina",
    category: "marble",
    imageUrl: "",
    widthMm: 600,
    heightMm: 600,
    colorStyle: "Midnight Black with White Veins",
  },
  {
    id: "sandstone-beige",
    name: "Travertine Beige Stone",
    category: "stone",
    imageUrl: "",
    widthMm: 400,
    heightMm: 400,
    colorStyle: "Honed Warm Sandstone",
  },
  {
    id: "basalt-grey",
    name: "Basaltine Slate Grey",
    category: "stone",
    imageUrl: "",
    widthMm: 300,
    heightMm: 600,
    colorStyle: "Textured Dark Charcoal",
  },
  {
    id: "terracotta-rust",
    name: "Tuscan Terracotta",
    category: "ceramic",
    imageUrl: "",
    widthMm: 300,
    heightMm: 300,
    colorStyle: "Warm Earthy Rust Red",
  },
  {
    id: "natural-oak",
    name: "Natural Forest Oak Planks",
    category: "wood",
    imageUrl: "",
    widthMm: 200,
    heightMm: 1200,
    colorStyle: "Golden Honey Oak Timber",
  },
  {
    id: "grey-ash",
    name: "Nordic Grey Ash",
    category: "wood",
    imageUrl: "",
    widthMm: 200,
    heightMm: 1200,
    colorStyle: "Distressed Silvery Birch",
  },
  {
    id: "raw-concrete",
    name: "Industrial Urban Concrete",
    category: "concrete",
    imageUrl: "",
    widthMm: 600,
    heightMm: 600,
    colorStyle: "Brushed Architectural Grey",
  },
  {
    id: "majolica-blue",
    name: "Majolica Portuguese Azulejo",
    category: "pattern",
    imageUrl: "",
    widthMm: 300,
    heightMm: 300,
    colorStyle: "Mediterranean Cobalt Blue & White",
  },
  {
    id: "art-deco-gold",
    name: "Art Deco Geometric Gold",
    category: "pattern",
    imageUrl: "",
    widthMm: 400,
    heightMm: 400,
    colorStyle: "Satin Midnight & Brushed Brass",
  },
  {
    id: "classic-white",
    name: "Classic Silk Plain White",
    category: "plain",
    imageUrl: "",
    widthMm: 300,
    heightMm: 600,
    colorStyle: "Satin Refined Eggshell White",
  },
];

// Helper to initialize textures dynamically when the client environment runs
export function getSampleTiles(): TileData[] {
  return sampleTiles.map((tile) => {
    if (tile.imageUrl) return tile;

    let img = "";
    if (tile.id === "carrara-white") {
      img = generateProceduralTexture("marble", "#F8F9FA", "#7F8C8D");
    } else if (tile.id === "calacatta-gold") {
      img = generateProceduralTexture("marble", "#FAF9F5", "#B38F4D");
    } else if (tile.id === "royal-nero") {
      img = generateProceduralTexture("marble", "#1C1C1E", "#ECEFF1");
    } else if (tile.id === "sandstone-beige") {
      img = generateProceduralTexture("stone", "#E8D8C8", "#BCAAA4", "#8D6E63");
    } else if (tile.id === "basalt-grey") {
      img = generateProceduralTexture("stone", "#3E4A52", "#263238", "#546E7A");
    } else if (tile.id === "terracotta-rust") {
      img = generateProceduralTexture("stone", "#D87040", "#A84018");
    } else if (tile.id === "natural-oak") {
      img = generateProceduralTexture("wood", "#C59A6F", "#785333");
    } else if (tile.id === "grey-ash") {
      img = generateProceduralTexture("wood", "#A59C94", "#635D5A");
    } else if (tile.id === "raw-concrete") {
      img = generateProceduralTexture("concrete", "#B0BEC5", "#78909C", "#CFD8DC");
    } else if (tile.id === "majolica-blue") {
      img = generateProceduralTexture("pattern", "#FFFFFF", "#0D47A1", "#1976D2");
    } else if (tile.id === "art-deco-gold") {
      img = generateProceduralTexture("pattern", "#121824", "#FFD700", "#FFC107");
    } else {
      // plain white
      img = generateProceduralTexture("plain", "#FFFFFF", "#E0E0E0");
    }

    return { ...tile, imageUrl: img };
  });
}
