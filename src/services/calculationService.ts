import { DimensionState, EstimationResult } from "../types";

export function calculateTiles(state: DimensionState): EstimationResult {
  const { roomLengthM, roomWidthM, tileLengthMm, tileWidthMm, wastagePercent } = state;

  const roomAreaSqM = roomLengthM * roomWidthM;
  const tileAreaSqM = (tileLengthMm / 1000) * (tileWidthMm / 1000);

  if (tileAreaSqM <= 0 || roomAreaSqM <= 0) {
    return {
      roomAreaSqM: 0,
      tileAreaSqM: 0,
      estimatedTilesCount: 0,
      wastageCount: 0,
      totalTilesCount: 0,
      totalCoverageSqM: 0,
    };
  }

  // Pure mathematical tile count
  const estimatedTilesCount = Math.ceil(roomAreaSqM / tileAreaSqM);
  // Wastage rounded up
  const wastageCount = Math.ceil(estimatedTilesCount * (wastagePercent / 100));
  const totalTilesCount = estimatedTilesCount + wastageCount;
  const totalCoverageSqM = totalTilesCount * tileAreaSqM;

  return {
    roomAreaSqM,
    tileAreaSqM,
    estimatedTilesCount,
    wastageCount,
    totalTilesCount,
    totalCoverageSqM,
  };
}
