/** Client IP + user agent for LoginAudit. Honors Cloudflare / proxy headers (docs/02 §7). */
export interface RequestMeta {
  ip: string;
  userAgent: string;
}

export function requestMetaFromHeaders(headers: Headers): RequestMeta {
  const ip =
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const userAgent = (headers.get("user-agent") ?? "").slice(0, 300);
  return { ip: ip.slice(0, 64), userAgent };
}
