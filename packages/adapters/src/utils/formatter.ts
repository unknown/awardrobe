export function toTitleCase(text: string) {
  return text.replace(/\w\S*/g, (substring) => {
    return substring.charAt(0).toUpperCase() + substring.slice(1).toLowerCase();
  });
}
