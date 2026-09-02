export function expBackoff(base = 1) {
  return (iteration: number) => {
    return base * (Math.pow(2, iteration) + Math.random()) * 1000;
  };
}
