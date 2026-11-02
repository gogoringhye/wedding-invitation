export default async function handler(req) {
  return new Response(JSON.stringify({ ok: true, message: 'Admin delete endpoint placeholder' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
