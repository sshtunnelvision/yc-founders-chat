import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";

import { getUser, createOAuthUser, getUserByProviderAccountId } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID as string,
      clientSecret: process.env.APPLE_SECRET as string
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);
        if (users.length === 0) return null;
        // biome-ignore lint: Forbidden non-null assertion.
        const passwordsMatch = await compare(password, users[0].password!);
        if (!passwordsMatch) return null;
        return users[0] as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('Sign in callback:', { 
        user: { id: user.id, email: user.email }, 
        account: account ? { provider: account.provider } : null 
      });
      
      // Only handle OAuth sign-ins
      if (account && account.provider && account.providerAccountId && user.email) {
        try {
          // Check if user exists with this provider account
          const existingUsers = await getUserByProviderAccountId(
            account.provider,
            account.providerAccountId
          );
          
          if (existingUsers.length === 0) {
            // Check if user exists with this email
            const emailUsers = await getUser(user.email);
            
            if (emailUsers.length > 0) {
              console.log('Found existing user by email:', emailUsers[0].id);
              // Update existing user with OAuth info
              await createOAuthUser({
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              });
              // Use the existing user's ID
              user.id = emailUsers[0].id;
            } else {
              console.log('Creating new user for:', user.email);
              // Create new user
              const newUser = await createOAuthUser({
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              });
              // Use the new user's ID
              if (newUser) {
                console.log('Created new user with ID:', newUser.id);
                user.id = newUser.id;
              }
            }
          } else {
            console.log('Found existing user by provider:', existingUsers[0].id);
            // Use the existing OAuth user's ID
            user.id = existingUsers[0].id;
          }
          
          return true;
        } catch (error) {
          console.error('Error during OAuth sign in:', error);
          return false;
        }
      }
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      
      // If the URL is relative, prepend the base URL
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // If the URL is already absolute but on the same host, allow it
      else if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Otherwise, redirect to the base URL
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback:', { 
        tokenId: token.id, 
        userId: user?.id,
        provider: account?.provider 
      });
      
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          provider: account.provider,
          email: user.email,
          name: user.name,
          picture: user.image,
        };
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      console.log('Session callback:', { 
        tokenId: token.id,
        sessionUserId: session.user?.id 
      });
      
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string || null;
        session.user.image = token.picture as string || null;
      }

      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
