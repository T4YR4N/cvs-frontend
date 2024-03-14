export const parseDateIfString = (date: Date | string) => {
  if (typeof date === "string") return new Date(date);
  return date;
};

export const formatDate = (date: Date | string) => {
  const parsedDate = parseDateIfString(date);
  const formattedDate = parsedDate.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  return formattedDate;
};
