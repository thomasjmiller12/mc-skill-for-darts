export default function Callout({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <blockquote className={`callout ${className}`}>{children}</blockquote>;
}
