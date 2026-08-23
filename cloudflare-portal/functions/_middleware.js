export async function onRequest(context) {
  try {
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Content-Security-Policy", "default-src 'self'; style-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
  } catch (error) {
    console.error(JSON.stringify({event: "unhandled_error", message: error instanceof Error ? error.message : "unknown"}));
    return Response.json({message: "Der Dienst ist vorübergehend nicht verfügbar."}, {status: 500});
  }
}
