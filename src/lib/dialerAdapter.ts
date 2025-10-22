export type DialerKind = "system" | "aircall" | "custom";

type DialerConfig =
  | { kind: "system" }
  | { kind: "aircall" }
  | { kind: "custom"; baseUrl: string };

// Configure your dialer here or via environment variable
export const dialerConfig: DialerConfig = (() => {
  const kind = import.meta.env.VITE_DIALER_KIND ?? "system";
  
  if (kind === "aircall") {
    return { kind: "aircall" } as const;
  }
  
  if (kind === "custom") {
    const baseUrl = import.meta.env.VITE_DIALER_BASE_URL;
    if (!baseUrl) {
      console.warn("VITE_DIALER_BASE_URL not set, falling back to system dialer");
      return { kind: "system" } as const;
    }
    return { kind: "custom", baseUrl } as const;
  }
  
  return { kind: "system" } as const;
})();

export function buildDialHref(phone: string): string {
  if (!phone) return "#";
  
  // Normalize phone number (remove spaces, keep + and digits)
  const normalized = phone.replace(/\s+/g, "");
  
  switch (dialerConfig.kind) {
    case "aircall":
      return `aircall://call?number=${encodeURIComponent(normalized)}`;
    
    case "custom":
      return `${(dialerConfig as any).baseUrl}?to=${encodeURIComponent(normalized)}`;
    
    case "system":
    default:
      return `tel:${normalized}`;
  }
}

export function getDialerName(): string {
  switch (dialerConfig.kind) {
    case "aircall":
      return "Aircall";
    case "custom":
      return "Custom Dialer";
    case "system":
    default:
      return "System";
  }
}
