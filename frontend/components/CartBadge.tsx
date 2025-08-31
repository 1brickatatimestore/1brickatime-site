interface CartBadgeProps {
  count: number;
}

export default function CartBadge({ count }: CartBadgeProps) {
  return (
    <span style={{ fontWeight: "bold", paddingLeft: "6px" }}>🛒 {count}</span>
  );
}
