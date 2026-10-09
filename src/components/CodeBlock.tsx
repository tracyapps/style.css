import { useEffect, useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-css";
export default function Code({
  code,
  language = "css",
  onCopy,
  title = "CSS",
}: {
  code: string;
  language?: string;
  onCopy: (s: string) => Promise<void>;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setCopied(false);
  }, [code]);
  const tokens = useMemo(
    () =>
      Prism.highlight(
        code,
        Prism.languages[language] || Prism.languages.css,
        language,
      ),
    [code, language],
  );
  return (
    <div className="codeblock">
      <div className="codebar">
        <span>
          <i />
          <i />
          <i /> <b>{title}</b>
        </span>
        <button
          aria-label={`Copy ${title}`}
          onClick={async () => {
            try {
              await onCopy(code);
              setCopied(true);
            } catch {
              return;
            }
            window.setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: tokens }} />
      </pre>
    </div>
  );
}
