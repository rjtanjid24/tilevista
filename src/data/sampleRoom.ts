/**
 * Procedural Room Photograph & Overlay Generator
 * Generates an elegant, high-contrast room perspective outline
 * to serve as the default demo room image and transparent furniture overlay.
 */

// Coordinates match floor corners exactly:
// Top-left: (184, 476), Top-right: (840, 476), Bottom-right: (1004, 730), Bottom-left: (20, 730)
const pTL = { x: 184, y: 476 };
const pTR = { x: 840, y: 476 };
const pBR = { x: 1004, y: 730 };
const pBL = { x: 20, y: 730 };

/**
 * 1. Generate the Base Room Image (Background Walls, Ceiling, and Un-tiled Floor)
 */
export function generateProceduralRoomImage(): string {
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // A. Draw elegant wall gradient (soft warm sand and clay tones)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 768);
  bgGrad.addColorStop(0, "#F2EFE9");
  bgGrad.addColorStop(1, "#E5DFD5");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 768);

  // B. Draw Back Wall (rectangle)
  const backWallGrad = ctx.createLinearGradient(pTL.x, 0, pTR.x, 0);
  backWallGrad.addColorStop(0, "#DDD5C9");
  backWallGrad.addColorStop(1, "#EAE4DA");
  ctx.fillStyle = backWallGrad;
  ctx.fillRect(pTL.x, 0, pTR.x - pTL.x, pTL.y);

  // C. Draw Left Wall with shadow gradients
  const leftWallGrad = ctx.createLinearGradient(0, 0, pTL.x, 0);
  leftWallGrad.addColorStop(0, "#C7BFB2");
  leftWallGrad.addColorStop(1, "#D6CFC3");
  ctx.fillStyle = leftWallGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(pTL.x, 0);
  ctx.lineTo(pTL.x, pTL.y);
  ctx.lineTo(0, 620);
  ctx.closePath();
  ctx.fill();

  // D. Draw Right Wall with soft ambient lighting
  const rightWallGrad = ctx.createLinearGradient(pTR.x, 0, 1024, 0);
  rightWallGrad.addColorStop(0, "#E5DFD4");
  rightWallGrad.addColorStop(1, "#D2C9BD");
  ctx.fillStyle = rightWallGrad;
  ctx.beginPath();
  ctx.moveTo(1024, 0);
  ctx.lineTo(pTR.x, 0);
  ctx.lineTo(pTR.x, pTR.y);
  ctx.lineTo(1024, 620);
  ctx.closePath();
  ctx.fill();

  // E. Draw elegant floor wooden skirting boards (baseboards) to divide wall and floor
  ctx.fillStyle = "#F5F3EF"; // Off-white painted skirting
  // Back baseboard
  ctx.fillRect(pTL.x, pTL.y - 12, pTR.x - pTL.x, 12);
  
  // Left wall baseboard (skewed)
  ctx.fillStyle = "#EAE4DA";
  ctx.beginPath();
  ctx.moveTo(0, 608);
  ctx.lineTo(pTL.x, pTL.y - 12);
  ctx.lineTo(pTL.x, pTL.y);
  ctx.lineTo(0, 620);
  ctx.closePath();
  ctx.fill();

  // Right wall baseboard (skewed)
  ctx.fillStyle = "#E3DDD2";
  ctx.beginPath();
  ctx.moveTo(1024, 608);
  ctx.lineTo(pTR.x, pTR.y - 12);
  ctx.lineTo(pTR.x, pTR.y);
  ctx.lineTo(1024, 620);
  ctx.closePath();
  ctx.fill();

  // F. Draw raw, concrete grey background floor (visible under comparison slider or when untiled)
  const floorGrad = ctx.createLinearGradient(0, pTL.y, 0, pBR.y);
  floorGrad.addColorStop(0, "#AA9E90");
  floorGrad.addColorStop(1, "#8A7E70");
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(pTL.x, pTL.y);
  ctx.lineTo(pTR.x, pTR.y);
  ctx.lineTo(pBR.x, pBR.y);
  ctx.lineTo(pBL.x, pBL.y);
  ctx.closePath();
  ctx.fill();

  // G. Draw sky and outside sun glow visible through window (window glass)
  const skyGrad = ctx.createLinearGradient(260, 80, 260, 340);
  skyGrad.addColorStop(0, "#BAE6FD"); // Warm blue sky
  skyGrad.addColorStop(0.5, "#E0F2FE");
  skyGrad.addColorStop(1, "#FFEDD5"); // Sunny morning horizon orange
  ctx.fillStyle = skyGrad;
  ctx.fillRect(265, 85, 210, 250);

  // H. Draw the core artwork inside the wall painting (no frame yet)
  ctx.fillStyle = "#EADEC9"; // Art canvas
  ctx.fillRect(535, 105, 150, 100);
  
  // Abstract watercolor brush shapes
  ctx.fillStyle = "#C2A383"; // Sand texture circle
  ctx.beginPath();
  ctx.arc(610, 155, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2D5A27"; // Dark terracotta green accent
  ctx.beginPath();
  ctx.ellipse(585, 165, 15, 25, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#4D3627";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(560, 175);
  ctx.bezierCurveTo(590, 160, 620, 190, 660, 170);
  ctx.stroke();

  return canvas.toDataURL("image/jpeg", 0.95);
}

/**
 * 2. Generate the Transparent Foreground Overlay (Sofa, Plant Pot, Window frames, and Ambient shadows)
 * Draws over any rendered tiles perfectly so they look fully tucked underneath!
 */
export function generateProceduralRoomOverlay(): string {
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Ensure background is fully transparent
  ctx.clearRect(0, 0, 1024, 768);

  // A. Draw Window Frame & Dividers (Left wall)
  ctx.save();
  ctx.fillStyle = "#2D2D2F"; // High-quality iron frame
  // Left outer frame
  ctx.fillRect(260, 80, 5, 260);
  // Right outer frame
  ctx.fillRect(475, 80, 5, 260);
  // Top outer frame
  ctx.fillRect(260, 80, 220, 5);
  // Bottom outer frame (Window sill)
  ctx.fillStyle = "#202022";
  ctx.fillRect(250, 335, 240, 10);

  // Thin window panes grid
  ctx.fillStyle = "#2D2D2F";
  ctx.fillRect(366, 85, 6, 250); // Vertical divider
  ctx.fillRect(265, 200, 210, 6); // Horizontal divider

  // Glass sunlight reflections
  ctx.strokeStyle = "#FFFFFF";
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(280, 310);
  ctx.lineTo(440, 90);
  ctx.stroke();
  ctx.restore();

  // B. Draw Wall Painting Frame (Back wall)
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 4;
  
  ctx.strokeStyle = "#4D3525"; // Luxury oak wood frame
  ctx.lineWidth = 6;
  ctx.strokeRect(532, 102, 156, 106);
  ctx.restore();

  // C. Draw Ambient Occlusion / Soft Ground Shadows (Drawn in transparent black)
  // This sits directly on top of the tile floor, making tiles look shadowed!
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#000000";
  
  // Shadow under the couch
  ctx.beginPath();
  ctx.ellipse(615, 508, 175, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shadow under the plant pot
  ctx.beginPath();
  ctx.ellipse(882, 502, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // D. Draw Beautiful Modern Scandinavian Couch (Furnished)
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.14)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;

  // Couch Back Cushion (High-fidelity fabric texture)
  const backCushionGrad = ctx.createLinearGradient(480, 320, 480, 420);
  backCushionGrad.addColorStop(0, "#EDE8E1"); // Soft oatmeal cream
  backCushionGrad.addColorStop(1, "#CEBEAA");
  ctx.fillStyle = backCushionGrad;
  // Rounded cushion rectangle
  ctx.beginPath();
  ctx.roundRect(480, 320, 280, 95, 10);
  ctx.fill();

  // Couch Seat Cushion
  const seatCushionGrad = ctx.createLinearGradient(460, 400, 460, 465);
  seatCushionGrad.addColorStop(0, "#E3DACD");
  seatCushionGrad.addColorStop(1, "#BCA993");
  ctx.fillStyle = seatCushionGrad;
  ctx.beginPath();
  ctx.roundRect(460, 395, 310, 68, 8);
  ctx.fill();

  // Armrests (Oak wood tops with fabric bases)
  const armGrad = ctx.createLinearGradient(440, 380, 465, 470);
  armGrad.addColorStop(0, "#8D7C66"); // Wood grain top shading
  armGrad.addColorStop(0.3, "#C7BAA9");
  armGrad.addColorStop(1, "#9E8B75");
  ctx.fillStyle = armGrad;
  ctx.beginPath();
  ctx.roundRect(440, 380, 24, 88, 5);
  ctx.roundRect(766, 380, 24, 88, 5);
  ctx.fill();

  // Cushions piping and crease detailing lines
  ctx.strokeStyle = "#A4927B";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(480, 394);
  ctx.lineTo(760, 394); // Center cushion divide line
  ctx.stroke();

  // Tapered Wooden Couch Legs (Grounded on the floor)
  ctx.save();
  ctx.shadowColor = "transparent"; // Reset shadow for thin legs
  ctx.strokeStyle = "#403124"; // Rich teak wood color
  ctx.lineWidth = 6;
  ctx.lineCap = "round";

  // Front Left Leg
  ctx.beginPath();
  ctx.moveTo(462, 462);
  ctx.lineTo(456, 520);
  ctx.stroke();

  // Front Right Leg
  ctx.beginPath();
  ctx.moveTo(768, 462);
  ctx.lineTo(774, 520);
  ctx.stroke();

  // Back Left Leg
  ctx.strokeStyle = "#2B2117"; // Darker leg in shadow
  ctx.beginPath();
  ctx.moveTo(492, 462);
  ctx.lineTo(497, 512);
  ctx.stroke();

  // Back Right Leg
  ctx.beginPath();
  ctx.moveTo(738, 462);
  ctx.lineTo(734, 512);
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // E. Draw Beautiful Houseplant in Ceramic Pot
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.1)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  // Modern Ceramic White Pot
  const potGrad = ctx.createLinearGradient(850, 420, 910, 500);
  potGrad.addColorStop(0, "#FFFFFF");
  potGrad.addColorStop(0.7, "#ECEFF1");
  potGrad.addColorStop(1, "#CFD8DC"); // Soft grey-blue shadows
  ctx.fillStyle = potGrad;
  ctx.beginPath();
  ctx.moveTo(852, 420);
  ctx.lineTo(912, 420);
  ctx.lineTo(898, 500);
  ctx.lineTo(866, 500);
  ctx.closePath();
  ctx.fill();

  // Rich organic potting soil
  ctx.fillStyle = "#4E342E";
  ctx.beginPath();
  ctx.ellipse(882, 420, 30, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Broad organic multi-shaded Monstera Leaves (Department of Sculpture inspired design)
  // Leaf 1 (Left low leaf)
  const leafGrad1 = ctx.createLinearGradient(840, 360, 890, 420);
  leafGrad1.addColorStop(0, "#388E3C");
  leafGrad1.addColorStop(1, "#1B5E20");
  ctx.fillStyle = leafGrad1;
  ctx.beginPath();
  ctx.ellipse(855, 385, 24, 42, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Leaf 2 (Right low leaf)
  const leafGrad2 = ctx.createLinearGradient(870, 350, 920, 415);
  leafGrad2.addColorStop(0, "#4CAF50");
  leafGrad2.addColorStop(1, "#2E7D32");
  ctx.fillStyle = leafGrad2;
  ctx.beginPath();
  ctx.ellipse(898, 380, 20, 38, -Math.PI / 3, 0, Math.PI * 2);
  ctx.fill();

  // Leaf 3 (Top central leaf, upright)
  const leafGrad3 = ctx.createLinearGradient(865, 310, 895, 380);
  leafGrad3.addColorStop(0, "#81C784"); // Fresh sprout highlight
  leafGrad3.addColorStop(1, "#2E7D32");
  ctx.fillStyle = leafGrad3;
  ctx.beginPath();
  ctx.ellipse(882, 355, 16, 32, -Math.PI / 15, 0, Math.PI * 2);
  ctx.fill();

  // Delicate leaf stems & details
  ctx.strokeStyle = "#81C784";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(882, 420);
  ctx.quadraticCurveTo(865, 395, 855, 385);
  ctx.moveTo(882, 420);
  ctx.quadraticCurveTo(890, 390, 898, 380);
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL("image/png");
}
