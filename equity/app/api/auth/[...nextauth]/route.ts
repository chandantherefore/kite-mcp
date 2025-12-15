import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db, execute } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  // Note: Cannot use database adapter with Credentials provider
  // Credentials provider requires JWT strategy
  // Database sessions only work with OAuth providers
  
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await db.findUserByEmail(credentials.email);

          if (!user) {
            return null;
          }

          if (!user.password) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            return null;
          }

          if (!user.is_active) {
            throw new Error("Please verify your email before logging in");
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role,
          };
        } catch (error: any) {
          console.error("Authorization error:", error);
          // Re-throw specific errors (like email verification)
          if (error.message && error.message.includes("verify")) {
            throw error;
          }
          // Return null for other errors to show generic error message
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign in
      if (account?.provider === "google" && profile?.email) {
        try {
          let dbUser = await db.findUserByEmail(profile.email);

          // If user doesn't exist, create a new one
          if (!dbUser) {
            const names = (user.name || "").split(" ");
            const firstName = names[0] || "User";
            const lastName = names.slice(1).join(" ") || "Name";

            const userId = await db.createUser({
              username: profile.email.split("@")[0] + "_" + Date.now(),
              email: profile.email,
              password: null, // No password for Google users
              first_name: firstName,
              last_name: lastName,
              dob: "1990-01-01", // Default DOB, user can update later
              gender: "prefer_not_to_say",
              expertise_level: "0-1", // Default expertise
              google_id: account.providerAccountId,
              is_active: true, // Auto-activate Google users
              email_verified: true, // Google emails are pre-verified
            });

            dbUser = await db.findUserById(userId);
          } else if (!dbUser.google_id) {
            // Link existing account with Google
            await execute(
              'UPDATE users SET google_id = ?, is_active = TRUE, email_verified = TRUE WHERE id = ?',
              [account.providerAccountId, dbUser.id]
            );
          }

          return true;
        } catch (error) {
          console.error("Error during Google sign in:", error);
          return false;
        }
      }

      // For credentials provider, allow sign in
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Add role and id to the token for JWT strategy (credentials provider)
      if (user) {
        token.role = (user as any).role || "user";
        token.id = user.id;
      }
      
      // Refresh user data from database on every request or when triggered
      if (token.email && (trigger === "update" || !token.role)) {
        const dbUser = await db.findUserByEmail(token.email);
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id.toString();
          token.name = `${dbUser.first_name} ${dbUser.last_name}`;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add role and id from token to session (JWT strategy)
      if (session.user && token) {
        (session.user as any).role = token.role || "user";
        (session.user as any).id = token.id;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    // Use JWT strategy because we have Credentials provider
    // Database strategy doesn't work with Credentials provider
    strategy: "jwt",
    // Session will be valid for 30 days (in seconds)
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // Update session expiry every time user is active (every 1 day)
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    // JWT tokens will last 30 days
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",
  // Cookies configuration for longer persistence
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

