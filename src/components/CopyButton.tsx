import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({
  text,
  label,
  onCopy,
  className = "",
  caption,
}: {
  text: string;
  label: string;
  onCopy: (text: string) => Promise<void>;
  className?: string;
  caption?: string;
}) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copied = copiedText === text;
  useEffect(() => {
    setCopiedText(null);
    return () => clearTimeout(timer.current);
  }, [text]);
  return (
    <button
      type="button"
      className={`copy-button ${className} ${copied ? "copied" : ""}`}
      aria-label={label}
      title={copied ? "Copied!" : label}
      onClick={async () => {
        try {
          await onCopy(text);
          clearTimeout(timer.current);
          setCopiedText(text);
          timer.current = setTimeout(() => setCopiedText(null), 1600);
        } catch {
          // The caller reports clipboard failures; never show success for them.
        }
      }}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {caption && <span>{copied ? "Copied!" : caption}</span>}
    </button>
  );
}
