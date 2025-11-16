import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db/drizzle"
import { dbServer } from "./db/drizzle-server"
import { users, accounts, sessions, verificationTokens } from "./db/schema"
import { eq, and } from "drizzle-orm"
import type { AdapterAccountType } from "next-auth/adapters"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in - save account data to database
      // Ensure we have a string user.id before using it in DB queries
      if (account && user && typeof user.id === "string") {
        console.log('JWT callback - Initial sign in', {
          userId: user.id,
          provider: account.provider,
          hasRefreshToken: !!account.refresh_token,
          hasAccessToken: !!account.access_token,
        });

        // Manually save account data to database since we're using JWT strategy
        try {
          // Check if account already exists
          const existingAccount = await dbServer
            .select()
            .from(accounts)
            .where(
              and(
                eq(accounts.userId, user.id),
                eq(accounts.provider, account.provider)
              )
            )
            .limit(1);

          if (existingAccount.length > 0) {
            // Update existing account
            await dbServer
              .update(accounts)
              .set({
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                // session_state can be JsonValue (number|string/etc). Convert to string or null for the DB column.
                session_state:
                  account.session_state == null
                    ? null
                    : String(account.session_state),
              })
              .where(
                and(
                  eq(accounts.userId, user.id),
                  eq(accounts.provider, account.provider)
                )
              );
            console.log('Updated existing account in database');
          } else {
            // Insert new account
            await dbServer.insert(accounts).values({
              userId: user.id,
              // account.type is ProviderType; the DB column expects AdapterAccountType
              // Cast via unknown to AdapterAccountType to satisfy the Drizzle types.
              type: account.type as unknown as AdapterAccountType,
              provider: account.provider as string,
              providerAccountId: account.providerAccountId as string,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              // normalize session_state to string|null
              session_state:
                account.session_state == null ? null : String(account.session_state),
            });
            console.log('Inserted new account into database');
          }
        } catch (error) {
          console.error('Error saving account to database:', error);
        }

        return {
          ...token,
          userId: user.id,
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
      }
      return session
    },
  },
  trustHost: true,
})
