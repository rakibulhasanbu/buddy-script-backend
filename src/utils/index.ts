export const nameToCorrectString = (name: string) => {
  return name.includes("-") ? name.split("-").join(" ") : name;
};

export const generateSlug = (text: string) => {
  return text
    .replace(/[^a-zA-Z0-9]/g, " ")
    .replace(/\s+/g, "-")
    .trim()
    .toLowerCase()
    .replace(/-+$/g, "");
};
