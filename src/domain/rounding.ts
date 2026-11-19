// Round line credits for display with the largest-remainder method, so the
// rounded rows always sum to the rounded total. The engine keeps exact values.
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
