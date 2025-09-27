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
