export function Avatar({
  name,
  imageUrl,
  size = "md",
}: {
  name?: string | null;
  imageUrl?: string | null;
  size?: "sm" | "md";
}) {
  const initials = (name ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  const dimensions = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name ?? "User avatar"}
        className={`${dimensions} rounded-full border border-cyan-300/40 object-cover`}
      />
    );
  }

  return (
    <span
      aria-label={name ?? "User avatar"}
      className={`${dimensions} inline-flex items-center justify-center rounded-full border border-violet-300/40 bg-violet-500/20 font-semibold text-foreground`}
    >
      {initials}
    </span>
  );
}
