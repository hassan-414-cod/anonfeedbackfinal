import { colorsFor } from "@/lib/helpers";

export default function Avatar({
  handle,
  size = 36,
  square = false,
}: {
  handle?: string;
  size?: number;
  square?: boolean;
}) {
  const [a, b] = colorsFor(handle || "anon");
  return (
    <div
      aria-hidden
      className={`shrink-0 flex items-center justify-center font-black text-black select-none ${square ? "rounded-xl" : "rounded-full"}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${a}, ${b})`,
      }}
    >
      {(handle || "?")[0]}
    </div>
  );
}
