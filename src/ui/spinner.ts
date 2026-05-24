import * as p from "@clack/prompts";

/**
 * Show a spinner with `message` while `fn` runs.
 * Stops the spinner on resolve or reject; rethrows any error.
 */
export async function withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T> {
  const s = p.spinner();
  s.start(message);
  try {
    const result = await fn();
    s.stop(message);
    return result;
  } catch (err) {
    s.stop(message);
    throw err;
  }
}
