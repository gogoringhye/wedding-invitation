export default async function handler(req) {
  return new Response(JSON.stringify({ ok: true, message: 'Admin list endpoint placeholder' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
