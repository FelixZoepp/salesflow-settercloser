export type DialerKind = "system" | "aircall" | "webex" | "placetel" | "custom";

type DialerConfig =
  | { kind: "system" }
  | { kind: "aircall" }
  | { kind: "webex" }
  | { kind: "placetel" }
  | { kind: "custom"; baseUrl: string };

// Configure your dialer here or via environment variable
export const dialerConfig: DialerConfig = (() => {
  const kind = import.meta.env.VITE_DIALER_KIND ?? "system";
  
  if (kind === "aircall") {
    return { kind: "aircall" } as const;
  }
  
  if (kind === "webex") {
    return { kind: "webex" } as const;
  }
  
  if (kind === "placetel") {
    return { kind: "placetel" } as const;
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
    
    case "webex":
      // Webex Click-to-Call URI scheme
      return `webextel:${normalized}`;
    
    case "placetel":
      // Placetel uses sip: scheme or custom protocol
      return `sip:${normalized}@placetel.de`;
    
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
    case "webex":
      return "Webex";
    case "placetel":
      return "Placetel";
    case "custom":
      return "Custom Dialer";
    case "system":
    default:
      return "System";
  }
}
