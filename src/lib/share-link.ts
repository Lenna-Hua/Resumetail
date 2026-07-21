/**
 * Client-side share payload encoding for view-only /share links.
 * Uses gzip when available; falls back to URI-safe base64 for short payloads.
 */

export interface SharePayload {
  name: string;
  resumeText: string;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function gzipEncode(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gzipDecode(bytes: Uint8Array): Promise<string> {
  const copy = Uint8Array.from(bytes);
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

export async function encodeSharePayload(payload: SharePayload): Promise<string> {
  const json = JSON.stringify(payload);
  if (typeof CompressionStream !== "undefined" && json.length > 400) {
    const compressed = await gzipEncode(json);
    return `c.${toBase64Url(compressed)}`;
  }
  return `u.${toBase64Url(new TextEncoder().encode(json))}`;
}

export async function decodeSharePayload(token: string): Promise<SharePayload | null> {
  try {
    const dot = token.indexOf(".");
    if (dot === -1) return null;
    const mode = token.slice(0, dot);
    const data = token.slice(dot + 1);
    const bytes = fromBase64Url(data);

    let json: string;
    if (mode === "c" && typeof DecompressionStream !== "undefined") {
      json = await gzipDecode(bytes);
    } else if (mode === "u") {
      json = new TextDecoder().decode(bytes);
    } else {
      return null;
    }

    const parsed = JSON.parse(json) as SharePayload;
    if (!parsed.resumeText?.trim()) return null;
    return {
      name: parsed.name ?? "Resume",
      resumeText: parsed.resumeText,
    };
  } catch {
    return null;
  }
}

export async function buildShareUrl(
  payload: SharePayload,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): Promise<string> {
  const token = await encodeSharePayload(payload);
  return `${origin}/share#${token}`;
}

export async function copyShareLink(payload: SharePayload): Promise<string> {
  const url = await buildShareUrl(payload);
  await navigator.clipboard.writeText(url);
  return url;
}
