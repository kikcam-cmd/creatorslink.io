-- Harden: these SECURITY DEFINER functions are only ever invoked as trigger
-- bodies (run as the table owner), never as RPC. Revoke the default PUBLIC
-- EXECUTE so they can't be called via /rest/v1/rpc by anon/authenticated.
-- Triggers continue to fire normally; only direct/RPC invocation is removed.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
