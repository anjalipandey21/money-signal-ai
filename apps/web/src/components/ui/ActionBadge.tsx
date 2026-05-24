type ActionBadgeProps = {
  action: string;
};

export function ActionBadge({ action }: ActionBadgeProps) {
  const positive =
    action.toLowerCase() === "accumulate" ||
    action.toLowerCase() === "insider buy" ||
    action.toLowerCase() === "multi-fund buying" ||
    action.toLowerCase() === "institutional accumulation" ||
    action.toLowerCase() === "new fund position";

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
        positive
          ? "bg-[#4edea3]/10 text-[#4edea3]"
          : "bg-[#ffb4ab]/10 text-[#ffb4ab]"
      }`}
    >
      {action}
    </span>
  );
}