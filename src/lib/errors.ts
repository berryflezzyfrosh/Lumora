const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

export function toUserError(context: string, cause: unknown): Error {
  console.error(`[${context}]`, cause);
  return new Error(GENERIC_MESSAGE);
}
