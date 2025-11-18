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

export const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

export const withoutElement = <T>(array: T[], element: T): T[] =>
  array.filter((item) => item !== element);

export const updateElement = <T>(
  array: T[],
  oldElement: T,
  newElement: T,
): T[] => array.map((item) => (item === oldElement ? newElement : item));
