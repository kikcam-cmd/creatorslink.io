# CreatorsLink — Phase 0 Setup

This bundle is the **Phase 0 foundation**: Supabase SSR auth, session middleware, a protected app shell, and an empty dashboard. After this runs, you can sign up on a live URL and land on a dashboard only you can see — and deployment can never surprise you again.

It assumes you've already run the scaffold from the Build Plan §2 (`create-next-app`, `shadcn init`, installed `@supabase/ssr` etc.) and applied migration `0001_init.sql`.

---

## 1. Drop the files in

Unzip into your project root. The structure already matches a Next.js App Router repo:

```
.env.example                          → copy to .env.local and fill in
middleware.ts                         → project root
app/layout.tsx                        → replaces the generated root layout
app/globals.css                       → SEE NOTE below before replacing
app/page.tsx
app/auth/confirm/route.ts
app/(auth)/layout.tsx
app/(auth)/login/page.tsx
app/(auth)/signup/page.tsx
app/(app)/layout.tsx
app/(app)/dashboard/page.tsx
lib/supabase/client.ts
lib/supabase/server.ts
lib/supabase/middleware.ts
lib/auth-actions.ts
supabase/migrations/0002_profiles_trigger.sql
```

> **globals.css note:** if `shadcn init` already generated `app/globals.css` with its own `:root` tokens, **don't overwrite it**. Open the provided `globals.css`, copy only the `:root { … }` block and the small font rules, and paste them into your existing file. Otherwise you'll lose the shadcn tokens your future components need.

---

## 2. Environment variables

Copy `.env.example` → `.env.local` and fill in from Supabase dashboard → **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 3. Apply the profile trigger migration

Run `0002_profiles_trigger.sql` against your project (it depends on the `profiles` table from `0001`):

```bash
npx supabase db push
```

…or paste it into the Supabase SQL editor. This makes a `profiles` row appear automatically every time someone signs up.

---

## 4. Configure Supabase Auth (the step people forget)

In the Supabase dashboard → **Authentication**:

- **URL Configuration → Site URL:** `http://localhost:3000` for dev (set to `https://creatorslink.io` in prod).
- **URL Configuration → Redirect URLs:** add `http://localhost:3000/auth/confirm` and, later, `https://creatorslink.io/auth/confirm`.
- **Providers → Email:** enabled.
- **Email confirmation:** ON by default — the confirm link routes through `app/auth/confirm/route.ts`.

> **Tip for fast local testing:** you can temporarily turn **Confirm email** OFF (Authentication → Providers → Email) so signup logs you straight in without the email round-trip. Turn it back ON before launch.

---

## 5. Run and verify

```bash
npm run dev
```

Walk the loop:
1. Visit `/` → you're bounced to `/login` (not signed in).
2. Go to `/signup`, create an account.
   - Email confirmation ON → you're told to check your email; click the link → lands on `/dashboard`.
   - Email confirmation OFF → straight to `/dashboard`.
3. You see "Hi, {your name}." and three empty placeholder cards.
4. Hit **Sign out** → back to `/login`.
5. Confirm in Supabase → **Table editor → profiles** that a row exists with your `display_name`.

If all five pass, **Phase 0 is done.**

---

## 6. Deploy (do it now, while it's small)

1. Push to GitHub; import the repo in Vercel.
2. In Vercel → Project → Settings → **Environment Variables**, add the same three vars (set `NEXT_PUBLIC_SITE_URL` to your Vercel/prod URL).
3. Add the prod `/auth/confirm` URL to Supabase Redirect URLs and update Site URL.
4. Point `creatorslink.io` at the Vercel project.

Now run the same five-step verification on the live URL.

---

## What's intentionally NOT here

No Brands/Deals/Deliverables UI yet — that's Phase 1, and it's the next artifact. The `inbox`/`brands`/`deals`/`settings` nav links exist but their pages aren't built; they'll 404 until you add them. That's expected at Phase 0.

## Notes on choices

- **Server actions over client fetch** for auth — less client JS, and the form works without hydration.
- **`getUser()` in middleware, never `getSession()`** — `getUser()` revalidates the token with Supabase; `getSession()` trusts the cookie and can be spoofed. Don't reorder code around it.
- **Auth guard lives in middleware** (primary) with a redirect in the app layout (backup). Belt and suspenders.
