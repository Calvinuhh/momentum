const PREVIEW_LIMIT_BYTES = 4 * 1024;
const CAPTURE_LIMIT_BYTES = 64 * 1024;
const REDACTED = "[REDACTED]";

function mediaType(contentType: string | null): string {
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return /(password|passwd|token|secret|authorization|cookie|apikey|privatekey|credential|cvv|cardnumber)/.test(
    normalized,
  );
}

function maskEmail(value: string): string {
  const separator = value.lastIndexOf("@");
  if (separator < 1 || separator === value.length - 1) return REDACTED;
  return `${value[0]}***@${value.slice(separator + 1)}`;
}

function sanitize(value: unknown, key = ""): unknown {
  if (isSensitiveKey(key)) return REDACTED;
  if (key.toLowerCase().includes("email") && typeof value === "string") return maskEmail(value);
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, sanitize(childValue, childKey)]),
    );
  }
  return value;
}

function truncate(value: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  if (bytes.length <= PREVIEW_LIMIT_BYTES) return value;

  return `${new TextDecoder().decode(bytes.slice(0, PREVIEW_LIMIT_BYTES))} ... [truncated at 4 KiB]`;
}

export function formatBodyPreview(body: string, contentType: string | null): string {
  if (!body) return "[empty]";

  const type = mediaType(contentType);

  if (type === "application/json" || type.endsWith("+json")) {
    try {
      return truncate(JSON.stringify(sanitize(JSON.parse(body))));
    } catch {
      return "[omitted: malformed JSON cannot be safely sanitized]";
    }
  }

  return `[omitted: unsupported content type ${type || "unknown"}]`;
}

async function readBody(source: Request | Response): Promise<string | null> {
  if (!source.body) return "";

  const reader = source.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    size += value.byteLength;
    if (size > CAPTURE_LIMIT_BYTES) {
      void reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
}

export async function captureBodyPreview(source: Request | Response): Promise<string> {
  const type = mediaType(source.headers.get("content-type"));
  if (type === "text/event-stream") return "[omitted: streaming response]";

  const supported =
    type === "application/json" ||
    type.endsWith("+json");

  if (!supported && source.body) return `[omitted: unsupported content type ${type || "unknown"}]`;

  const body = await readBody(source);
  if (body === null) return "[omitted: body exceeds 64 KiB safe capture limit]";
  return formatBodyPreview(body, source.headers.get("content-type"));
}
