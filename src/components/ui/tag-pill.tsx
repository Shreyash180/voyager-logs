export function TagPill({ name, href }: { name: string; href?: string }) {
  const className =
    "rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide text-foreground/80 transition-colors hover:border-cyan-300/40 hover:text-cyan-200";

  if (!href) {
    return <span className={className}>{name}</span>;
  }

  return (
    <a href={href} className={className}>
      {name}
    </a>
  );
}
