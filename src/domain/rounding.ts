// Credit amounts can be fractional (e.g. 15.5 credits), but the UI shows whole
// credits. Rounding each line independently lets the rounded rows drift from the
// rounded total, so a table can read "16 + 1" under a total of "16". This spreads
// the rounding across the lines with the largest-remainder (Hamilton) method, so
// the rounded rows always sum to the rounded total and nothing is ever off by a
// single credit. The exact total is preserved for the engine and CSV precision.
export function allocateRoundedCredits(amounts: readonly number[]): number[] {
  const floors = amounts.map((amount) => Math.floor(amount));
  const floorTotal = floors.reduce((sum, value) => sum + value, 0);
  const exactTotal = amounts.reduce((sum, value) => sum + value, 0);
  let toDistribute = Math.round(exactTotal) - floorTotal;
  const byRemainder = amounts
    .map((amount, index) => ({ index, remainder: amount - Math.floor(amount) }))
    .sort((a, b) => b.remainder - a.remainder);
  const result = [...floors];
  for (let i = 0; i < byRemainder.length && toDistribute > 0; i += 1) {
    result[byRemainder[i].index] += 1;
    toDistribute -= 1;
  }
  return result;
}
