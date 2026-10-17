/** Convert each amount to cents before adding; all finance views use the same rounding. */
export const sumMoney = (values: number[]): number =>
  values.reduce((total, value) => total + Math.round(value * 100), 0) / 100
