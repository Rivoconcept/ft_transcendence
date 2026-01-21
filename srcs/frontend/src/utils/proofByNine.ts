export function proofByNine(n: number): number {
  while (n > 9) {
    n = n
      .toString()
      .split("")
      .reduce((s, d) => s + Number(d), 0);
  }
  return n === 0 ? 9 : n;
}
