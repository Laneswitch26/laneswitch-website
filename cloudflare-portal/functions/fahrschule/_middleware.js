import cloudflareAccessPlugin from "@cloudflare/pages-plugin-cloudflare-access";

export async function onRequest(context) {
  const domain = context.env.ACCESS_DOMAIN;
  const aud = context.env.ACCESS_AUD;
  if (!domain || !aud) return new Response("Persönlicher Fahrschulzugang noch nicht eingerichtet.", {status: 503});
  return cloudflareAccessPlugin({domain, aud})(context);
}
