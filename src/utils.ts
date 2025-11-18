export const getRange = (length: number): number[] => [...Array(length).keys()];

export const getRandomFrom = <T>(...args: T[]): T =>
  args[Math.floor(Math.random() * args.length)];

export const flatten = <T>(arrays: T[][]): T[] =>
  arrays.reduce((acc, row) => [...acc, ...row], []);

export const registerListener = (
  eventName: string,
  handler: EventListener,
): (() => void) => {
  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
};
