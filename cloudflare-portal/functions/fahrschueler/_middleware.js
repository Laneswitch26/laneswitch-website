import {readCookie, verifySessionToken} from "../_lib/auth.js";

export async function onRequest(context) {
  if (!context.env.SESSION_SECRET) return new Response("Zugang noch nicht eingerichtet.", {status: 503});
  const token = readCookie(context.request, "ls_student");
  const session = await verifySessionToken(context.env.SESSION_SECRET, token);
  if (!session) {
    const redirect = new URL("/zugang/", context.request.url);
    return Response.redirect(redirect.toString(), 303);
  }
  context.data.partnerSchoolId = session.schoolId;
  return context.next();
}
