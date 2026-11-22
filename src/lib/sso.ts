/*
 * Single sign-on for the cvrnz apps: the browser side.
 *
 * Source: hub/sso/client.ts. Every app has a copy at src/lib/sso.ts; edit it here and copy it
 * to each app (hub/sso/readme.md lists them).
 *
 * The Supabase session lives in a cookie on .cvrnz.com instead of each app's localStorage, so
 * signing in on hub (www.cvrnz.com/sign-in) signs you in to every app, and signing out anywhere
 * signs you out everywhere. Locally (localhost) cookies ignore the port, so the apps' dev servers
 * share one sign-in the same way.
 *
 * Two kinds of app use it:
 *   * Apps with data in Supabase (stash, onda, ledger, map, vera) require it. Access is invite
 *     only: the token's `app_access` claim lists the apps the user may use (from
 *     public.app_access, added by the custom access token hook). Their middleware.ts enforces it
 *     on Vercel, `requireApp` in the app, and the database again for every row.
 *   * Public apps (weather, ivory, icon, music, photos, clip) and hub's app list work signed out.
 *     They only use `useSession` and the account button to show who is signed in.
 */
import {createBrowserClient} from '@supabase/ssr';
import type {Session} from '@supabase/supabase-js';
import {useEffect, useState} from 'react';

export const SUPABASE_URL = 'https://qlqqjsamclodxgrpcnxz.supabase.co';
// A publishable key is meant to be public (it ships in every app's bundle). Row-level security
// and app_access protect the data, not this key.
export const SUPABASE_KEY = 'sb_publishable_DvAudlpIqFmClMfBbKTRhA_29w5tF_r';

const ROOT_DOMAIN = 'cvrnz.com';
const onCvrnz = location.hostname === ROOT_DOMAIN || location.hostname.endsWith(`.${ROOT_DOMAIN}`);

/** Hub, where signing in, accepting an invite and resetting a password happen. */
export const HUB_URL: string = onCvrnz
  ? 'https://www.cvrnz.com'
  : ((import.meta.env.VITE_HUB_URL as string | undefined) ?? 'http://localhost:1779');

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY, {
  cookieOptions: {
    domain: onCvrnz ? `.${ROOT_DOMAIN}` : undefined,
    path: '/',
    sameSite: 'lax',
    secure: onCvrnz,
  },
});

/** The claims inside a Supabase access token. Read only, never trusted for anything but UI. */
function tokenClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1] ?? '';
    const json = atob(payload.replaceAll('-', '+').replaceAll('_', '/'));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(json, c => c.charCodeAt(0)))) as Record<
      string,
      unknown
    >;
  } catch {
    return {};
  }
}

/** The apps a session may use, from its token's `app_access` claim. */
export function appAccess(session: Session | null): string[] {
  if (!session) return [];
  const apps = tokenClaims(session.access_token).app_access;
  return Array.isArray(apps) ? apps.filter((app): app is string => typeof app === 'string') : [];
}

/** Hub's sign-in page, coming back to `next` afterwards. */
export function signInUrl(next: string = location.href): string {
  const url = new URL('/sign-in', HUB_URL);
  url.searchParams.set('next', next);
  return url.href;
}

/** Never settles; used after starting a navigation away from the app. */
const leaving = () => new Promise<never>(() => {});

/**
 * Resolves with the session when the signed-in user may use `app`. Otherwise sends them to hub,
 * to sign in or to be told they have no access, and never resolves.
 */
export async function requireApp(app: string): Promise<Session> {
  const {
    data: {session},
  } = await supabase.auth.getSession();
  if (!session) {
    location.replace(signInUrl());
    return leaving();
  }
  if (!appAccess(session).includes(app)) {
    location.replace(`${HUB_URL}/?denied=${encodeURIComponent(app)}`);
    return leaving();
  }
  return session;
}

/**
 * Signs out of every app. Apps that need a sign-in go on to hub's sign-in page; public apps pass
 * `{stay: true}` and carry on signed out.
 */
export async function signOut(options: {stay?: boolean} = {}): Promise<void> {
  await supabase.auth.signOut();
  if (options.stay) return;
  location.replace(signInUrl(HUB_URL));
  return leaving();
}

/** The current session: undefined while it's being read, then the session or null. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    void supabase.auth.getSession().then(({data}) => setSession(data.session));
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);
  return session;
}
