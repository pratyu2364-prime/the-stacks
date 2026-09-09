import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;

  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await caller.auth.getUser();
  if (error || !data.user) return new Response('unauthorized', { status: 401 });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) return new Response(deleteError.message, { status: 500 });

  return new Response(null, { status: 204 });
});
