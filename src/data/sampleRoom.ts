/**
 * Procedural Room Photograph Generator
 * Generates an elegant, high-contrast room perspective outline
 * to serve as the default demo room image.
 */
export function generateProceduralRoomImage(): string {
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Draw elegant background wall color (soft warm cream/grey)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 768);
  bgGrad.addColorStop(0, "#F5F3EF");
  bgGrad.addColorStop(1, "#EAE6E1");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 768);

  // 2. Draw walls boundaries
  // Floor corners:
  // Top-left: (184, 476), Top-right: (840, 476), Bottom-right: (1004, 730), Bottom-left: (20, 730)
  const pTL = { x: 184, y: 476 };
  const pTR = { x: 840, y: 476 };
  const pBR = { x: 1004, y: 730 };
  const pBL = { x: 20, y: 730 };

  // Draw Back Wall (rectangle)
  ctx.fillStyle = "#E1DBD2";
  ctx.fillRect(pTL.x, 0, pTR.x - pTL.x, pTL.y);

  // Draw Left Wall
  ctx.fillStyle = "#D6CFC5";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(pTL.x, 0);
  ctx.lineTo(pTL.x, pTL.y);
  ctx.lineTo(0, 620);
  ctx.closePath();
  ctx.fill();

  // Draw Right Wall
  ctx.fillStyle = "#ECE7E0";
  ctx.beginPath();
  ctx.moveTo(1024, 0);
  ctx.lineTo(pTR.x, 0);
  ctx.lineTo(pTR.x, pTR.y);
  ctx.lineTo(1024, 620);
  ctx.closePath();
  ctx.fill();

  // Draw raw un-tiled Floor background (light concrete grey/brown)
  ctx.fillStyle = "#BCB5AA";
  ctx.beginPath();
  ctx.moveTo(pTL.x, pTL.y);
  ctx.lineTo(pTR.x, pTR.y);
  ctx.lineTo(pBR.x, pBR.y);
  ctx.lineTo(pBL.x, pBL.y);
  ctx.closePath();
  ctx.fill();

  // Floor shade under walls
  ctx.strokeStyle = "#8A8276";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(pBL.x, pBL.y);
  ctx.lineTo(pTL.x, pTL.y);
  ctx.lineTo(pTR.x, pTR.y);
  ctx.lineTo(pBR.x, pBR.y);
  ctx.stroke();

  // 3. Draw a large modern Minimalist Window on the left wall
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#5D5E60"; // Window frame dark iron
  ctx.fillRect(260, 80, 220, 260);

  // Window glass with blue sky gradient
  const skyGrad = ctx.createLinearGradient(260, 80, 260, 340);
  skyGrad.addColorStop(0, "#E0F2FE");
  skyGrad.addColorStop(1, "#BAE6FD");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(265, 85, 210, 250);

  // Window grid lines
  ctx.fillStyle = "#5D5E60";
  ctx.fillRect(366, 85, 8, 250); // Vertical divide
  ctx.fillRect(265, 205, 210, 8); // Horizontal divide

  // Soft window sheen reflection line
  ctx.strokeStyle = "#FFFFFF";
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(270, 310);
  ctx.lineTo(430, 90);
  ctx.stroke();
  ctx.restore();

  // 4. Draw a beautiful large plant pot on the right side
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.1)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  
  // Pot
  ctx.fillStyle = "#ECEFF1"; // Ceramic White pot
  ctx.beginPath();
  ctx.moveTo(850, 420);
  ctx.lineTo(910, 420);
  ctx.lineTo(895, 500);
  ctx.lineTo(865, 500);
  ctx.closePath();
  ctx.fill();

  // Soil
  ctx.fillStyle = "#5D4037";
  ctx.beginPath();
  ctx.ellipse(880, 420, 30, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Broad organic Monstera-like green leaves
  ctx.fillStyle = "#2E7D32"; // Leaf Dark green
  ctx.beginPath();
  // Leaf 1
  ctx.ellipse(870, 380, 25, 45, Math.PI / 4, 0, Math.PI * 2);
  // Leaf 2
  ctx.ellipse(895, 375, 20, 40, -Math.PI / 3, 0, Math.PI * 2);
  // Leaf 3
  ctx.ellipse(880, 360, 15, 35, -Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();

  // Highlight veins on leaves
  ctx.strokeStyle = "#4CAF50";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(880, 420);
  ctx.lineTo(870, 380);
  ctx.moveTo(880, 420);
  ctx.lineTo(895, 375);
  ctx.stroke();
  ctx.restore();

  // 5. Draw a beautiful modern Scandinavian lounge chair/couch
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 6;

  // Couch back cushion (warm beige)
  ctx.fillStyle = "#DFD5C6";
  ctx.fillRect(480, 320, 280, 100);

  // Couch seat cushion
  ctx.fillStyle = "#D7CCBC";
  ctx.fillRect(460, 400, 310, 65);

  // Couch armrests
  ctx.fillStyle = "#C3B7A5";
  ctx.fillRect(440, 380, 25, 90);
  ctx.fillRect(765, 380, 25, 90);

  // Couch legs (wooden black metal pegs)
  ctx.strokeStyle = "#2D2D2D";
  ctx.lineWidth = 5;
  ctx.beginPath();
  // peg left front
  ctx.moveTo(460, 470);
  ctx.lineTo(455, 520);
  // peg right front
  ctx.moveTo(770, 470);
  ctx.lineTo(775, 520);
  // peg left back
  ctx.moveTo(490, 470);
  ctx.lineTo(495, 510);
  // peg right back
  ctx.moveTo(740, 470);
  ctx.lineTo(735, 510);
  ctx.stroke();
  ctx.restore();

  // 6. Draw dynamic ambient shadows on the floor under the couch & pot to give depth
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#000000";
  // shadow under sofa
  ctx.beginPath();
  ctx.ellipse(615, 505, 170, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // shadow under plant pot
  ctx.beginPath();
  ctx.ellipse(880, 500, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 7. Render a stylish wall painting in the center of the wall
  ctx.save();
  ctx.fillStyle = "#3E2723"; // Wood frames
  ctx.fillRect(530, 100, 160, 110);
  ctx.fillStyle = "#FFFFFF"; // Mat board
  ctx.fillRect(535, 105, 150, 100);
  
  // Painting artwork (minimal abstract sun)
  ctx.fillStyle = "#E0A96D"; // sun orange
  ctx.beginPath();
  ctx.arc(610, 165, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5C3D2E";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(560, 175);
  ctx.lineTo(660, 175);
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.95);
}
