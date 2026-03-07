import Link from "next/link";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "solid" | "outline";
};

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkProps = BaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function NeonButton(props: ButtonProps | LinkProps) {
  const className = `${props.variant === "outline" ? "neon-outline-btn" : "neon-btn"} ${
    props.className ?? ""
  }`;

  if ("href" in props && props.href) {
    const { href, children } = props;
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonProps;
  const { children, type, disabled, onClick } = buttonProps;

  return (
    <button className={className} type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}