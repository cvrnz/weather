/*
 * Single sign-on: the account button for apps that work signed out (and hub).
 *
 * Source: hub/sso/account.tsx, copied to apps as src/lib/SsoAccount.tsx by `pnpm sso:sync`.
 * Plain elements and the theme's Tailwind tokens, so it works with any HeroUI version.
 */
import {signInUrl, signOut, useSession} from './sso';

/** "Sign in" when signed out (coming back to this page afterwards); "Sign out" when signed in. */
export const SsoAccount = ({className = ''}: {className?: string}) => {
  const session = useSession();
  if (session === undefined) return null;

  const style = `shrink-0 rounded-md px-2 py-1 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-(--focus) ${className}`;

  if (!session) {
    return (
      <a
        className={style}
        href={signInUrl()}
      >
        Sign in
      </a>
    );
  }

  return (
    <button
      className={style}
      onClick={() => void signOut({stay: true})}
      title={`Signed in as ${session.user.email ?? 'you'}`}
      type='button'
    >
      Sign out
    </button>
  );
};
