function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    if (typeof error.message === "string") {
      return error.message;
    }
    return String(error.message);
  }
  return String(error);
}

export { getErrorMessage };
