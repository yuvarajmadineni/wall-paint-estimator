const RATE = parseFloat(process.env.COST_RATE || "5"); // $5 per m^2 by default

export function calculateCost(width: number, height: number): number {
  const area = width * height;
  return area * RATE;
}
