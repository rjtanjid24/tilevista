import { Point2D } from "../types";

/**
 * Bilinearly interpolates a point within a quadrilateral defined by four corners.
 * Coordinates are:
 * p00: Top-Left
 * p10: Top-Right
 * p11: Bottom-Right
 * p01: Bottom-Left
 * s, t: normalized interpolation weights [0.0, 1.0]
 */
export function interpolateQuad(
  p00: Point2D,
  p10: Point2D,
  p11: Point2D,
  p01: Point2D,
  s: number,
  t: number
): { x: number; y: number } {
  // Bilinear interpolation formula:
  // P(s,t) = (1-s)(1-t)p00 + s(1-t)p10 + s*t*p11 + (1-s)t*p01
  const x =
    (1 - s) * (1 - t) * p00.x +
    s * (1 - t) * p10.x +
    s * t * p11.x +
    (1 - s) * t * p01.x;

  const y =
    (1 - s) * (1 - t) * p00.y +
    s * (1 - t) * p10.y +
    s * t * p11.y +
    (1 - s) * t * p01.y;

  return { x, y };
}

/**
 * Computes the 2D affine transformation matrix coefficients mapping
 * source triangle (u0,v0), (u1,v1), (u2,v2) to target triangle (x0,y0), (x1,y1), (x2,y2).
 *
 * Equations:
 * x = a*u + c*v + e
 * y = b*u + d*v + f
 */
export function solveAffineTransform(
  u0: number, v0: number,
  u1: number, v1: number,
  u2: number, v2: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number
) {
  const delta = (u0 - u2) * (v1 - v2) - (u1 - u2) * (v0 - v2);
  if (Math.abs(delta) < 1e-6) {
    return null; // Degenerate triangle
  }

  const a = ((x0 - x2) * (v1 - v2) - (x1 - x2) * (v0 - v2)) / delta;
  const c = ((u0 - u2) * (x1 - x2) - (u1 - u2) * (x0 - x2)) / delta;
  const e = x0 - a * u0 - c * v0;

  const b = ((y0 - y2) * (v1 - v2) - (y1 - y2) * (v0 - v2)) / delta;
  const d = ((u0 - u2) * (y1 - y2) - (u1 - u2) * (y0 - y2)) / delta;
  const f = y0 - b * u0 - d * v0;

  return { a, b, c, d, e, f };
}

/**
 * Draws a single texture-mapped triangle onto a Canvas 2D context.
 * Clips the rendering region to the target triangle to avoid overlapping artifacts.
 */
export function drawTriangleTexture(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement | HTMLImageElement,
  u0: number, v0: number,
  u1: number, v1: number,
  u2: number, v2: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number
) {
  const coeff = solveAffineTransform(u0, v0, u1, v1, u2, v2, x0, y0, x1, y1, x2, y2);
  if (!coeff) return;

  ctx.save();

  // Create clipping path for the target triangle
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.clip();

  // Apply the solved affine transformation matrix
  // transform(a, b, c, d, e, f)
  ctx.transform(coeff.a, coeff.b, coeff.c, coeff.d, coeff.e, coeff.f);

  // Draw the source texture image
  ctx.drawImage(img, 0, 0);

  ctx.restore();
}

/**
 * Check if a quadrilateral is convex.
 * A simple check using cross products of adjacent vectors around the perimeter.
 */
export function isConvexQuad(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): boolean {
  const crossProduct = (a: Point2D, b: Point2D, c: Point2D) => {
    return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
  };

  const cp1 = crossProduct(p0, p1, p2);
  const cp2 = crossProduct(p1, p2, p3);
  const cp3 = crossProduct(p2, p3, p0);
  const cp4 = crossProduct(p3, p0, p1);

  // If all cross products have the same sign, it is convex
  const allPositive = cp1 > 0 && cp2 > 0 && cp3 > 0 && cp4 > 0;
  const allNegative = cp1 < 0 && cp2 < 0 && cp3 < 0 && cp4 < 0;

  return allPositive || allNegative;
}
