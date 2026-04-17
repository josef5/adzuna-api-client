export const isFrontendJob = (title: string) => {
  const frontendKeywords = [
    "frontend",
    "front-end",
    "react",
    "front end",
    "vue",
    // "javascript",
    // "typescript",
  ];

  const titleLower = title.toLowerCase();
  return frontendKeywords.some((keyword) => titleLower.includes(keyword));
};

export function formatStorageError(error: unknown, fallbackMessage: string) {
  return error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : fallbackMessage;
}
