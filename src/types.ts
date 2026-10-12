export type Mode = "colors" | "tailwind" | "css" | "selectors";
export type Category = string;
export interface Support {
  browser: string;
  version: string | boolean | null;
  partial?: boolean;
  notes?: string;
}
export interface Entry {
  id: string;
  mode: Mode;
  name: string;
  category: string;
  description: string;
  syntax: string;
  values: string[];
  code: string;
  example?: string;
  tags: string[];
  related: string[];
  docs: string;
  cssProperty?: string;
  support?: Support[];
  status?: string;
}
export interface Metadata {
  generated: string;
  mdnVersion: string;
  compatVersion: string;
  tailwindVersion: string;
  compatDate: string;
}
