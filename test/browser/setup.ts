import { afterEach, beforeEach, vi } from "vitest";
import { consoleCalls } from "./helpers";

// Known library warnings. Remove each entry once the library stops emitting it.
const ALLOW = [
  /Accessing element\.ref was removed in React 19/, // B5, removed in Task 13
  /React does not recognize the `%s` prop on a DOM element.*zoomState/s, // B5, removed in Task 13
];

beforeEach(() => {
  consoleCalls.length = 0;
  for (const method of ["error", "warn"] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      consoleCalls.push(args.map(String).join(" "));
    });
  }
});

afterEach(() => {
  vi.mocked(console.error).mockRestore();
  vi.mocked(console.warn).mockRestore();
  const unexpected = consoleCalls.filter(
    (m) => !ALLOW.some((re) => re.test(m)),
  );
  if (unexpected.length) {
    throw new Error(`Unexpected console output:\n${unexpected.join("\n---\n")}`);
  }
});
