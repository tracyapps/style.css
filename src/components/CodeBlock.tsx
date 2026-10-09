import { useMemo } from "react";
import CopyButton from "./CopyButton";
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
        <CopyButton
          text={code}
          label={`Copy ${title}`}
          caption="Copy"
          onCopy={onCopy}
        />
      </div>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: tokens }} />
      </pre>
    </div>
  );
}
