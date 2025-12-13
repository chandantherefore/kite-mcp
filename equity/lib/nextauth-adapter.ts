/**
 * Custom NextAuth MySQL Adapter
 * This adapter provides database session storage for NextAuth
 * with support for long-lived sessions
 */

import type { Adapter, AdapterSession, AdapterUser } from "next-auth/adapters";
import { query, queryOne, insert, execute } from "./db";
import { randomUUID } from 'crypto';

function generateId(): string {
  return randomUUID();
}

export function MySQLAdapter(): Adapter {
  return {
    // Create a new user
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      const userId = await insert(
        `INSERT INTO users (username, email, password, first_name, last_name, dob, gender, expertise_level, google_id, is_active, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          user.email?.split("@")[0] + "_" + Date.now(),
          user.email,
          null, // No password for OAuth users
          user.name?.split(" ")[0] || "User",
          user.name?.split(" ").slice(1).join(" ") || "Name",
          "1990-01-01", // Default DOB
          "prefer_not_to_say",
          "0-1", // Default expertise
          null,
          true, // Auto-activate
          user.emailVerified ? true : false,
        ]
      );

      const dbUser = await queryOne<any>(
        "SELECT * FROM users WHERE id = ?",
        [userId]
      );

      if (!dbUser) {
        throw new Error("Failed to create user");
      }

      return {
        id: dbUser.id.toString(),
        email: dbUser.email,
        emailVerified: dbUser.email_verified ? new Date() : null,
        name: `${dbUser.first_name} ${dbUser.last_name}`,
      };
    },

    // Get a user by ID
    async getUser(id: string): Promise<AdapterUser | null> {
      const user = await queryOne<any>("SELECT * FROM users WHERE id = ?", [
        parseInt(id),
      ]);

      if (!user) {
        return null;
      }

      return {
        id: user.id.toString(),
        email: user.email,
        emailVerified: user.email_verified ? new Date() : null,
        name: `${user.first_name} ${user.last_name}`,
      };
    },

    // Get a user by email
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const user = await queryOne<any>("SELECT * FROM users WHERE email = ?", [
        email,
      ]);

      if (!user) {
        return null;
      }

      return {
        id: user.id.toString(),
        email: user.email,
        emailVerified: user.email_verified ? new Date() : null,
        name: `${user.first_name} ${user.last_name}`,
      };
    },

    // Get a user by account (provider + providerAccountId)
    async getUserByAccount({
      providerAccountId,
      provider,
    }): Promise<AdapterUser | null> {
      if (provider === "google") {
        const user = await queryOne<any>(
          "SELECT * FROM users WHERE google_id = ?",
          [providerAccountId]
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          emailVerified: user.email_verified ? new Date() : null,
          name: `${user.first_name} ${user.last_name}`,
        };
      }

      return null;
    },

    // Update a user
    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, "id">): Promise<AdapterUser> {
      const updates: string[] = [];
      const params: any[] = [];

      if (user.email) {
        updates.push("email = ?");
        params.push(user.email);
      }

      if (user.emailVerified !== undefined) {
        updates.push("email_verified = ?");
        params.push(user.emailVerified ? true : false);
      }

      if (user.name) {
        const names = user.name.split(" ");
        updates.push("first_name = ?", "last_name = ?");
        params.push(names[0] || "User", names.slice(1).join(" ") || "Name");
      }

      updates.push("updated_at = NOW()");
      params.push(parseInt(user.id));

      await execute(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      const updatedUser = await queryOne<any>(
        "SELECT * FROM users WHERE id = ?",
        [parseInt(user.id)]
      );

      if (!updatedUser) {
        throw new Error("Failed to update user");
      }

      return {
        id: updatedUser.id.toString(),
        email: updatedUser.email,
        emailVerified: updatedUser.email_verified ? new Date() : null,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`,
      };
    },

    // Delete a user
    async deleteUser(userId: string): Promise<void> {
      await execute("DELETE FROM users WHERE id = ?", [parseInt(userId)]);
    },

    // Link an account to a user
    async linkAccount(account: any): Promise<void> {
      if (account.provider === "google") {
        await execute(
          "UPDATE users SET google_id = ? WHERE id = ?",
          [account.providerAccountId, parseInt(account.userId)]
        );
      }
    },

    // Unlink an account from a user
    async unlinkAccount({ providerAccountId, provider }): Promise<void> {
      if (provider === "google") {
        await execute("UPDATE users SET google_id = NULL WHERE google_id = ?", [
          providerAccountId,
        ]);
      }
    },

    // Create a session
    async createSession(session: {
      sessionToken: string;
      userId: string;
      expires: Date;
    }): Promise<AdapterSession> {
      const sessionId = generateId();
      
      await insert(
        "INSERT INTO sessions (id, user_id, session_token, expires, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
        [sessionId, parseInt(session.userId), session.sessionToken, session.expires]
      );

      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    // Get a session and user by session token
    async getSessionAndUser(sessionToken: string): Promise<{
      session: AdapterSession;
      user: AdapterUser;
    } | null> {
      const result = await queryOne<any>(
        `SELECT 
          s.session_token, s.user_id, s.expires,
          u.id, u.email, u.first_name, u.last_name, u.email_verified, u.role
         FROM sessions s
         INNER JOIN users u ON s.user_id = u.id
         WHERE s.session_token = ? AND s.expires > NOW()`,
        [sessionToken]
      );

      if (!result) {
        return null;
      }

      return {
        session: {
          sessionToken: result.session_token,
          userId: result.user_id.toString(),
          expires: new Date(result.expires),
        },
        user: {
          id: result.id.toString(),
          email: result.email,
          emailVerified: result.email_verified ? new Date() : null,
          name: `${result.first_name} ${result.last_name}`,
        },
      };
    },

    // Update a session (e.g., extend expiry)
    async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">): Promise<AdapterSession | null | undefined> {
      const updates: string[] = [];
      const params: any[] = [];

      if (session.expires) {
        updates.push("expires = ?");
        params.push(session.expires);
      }

      if (session.userId) {
        updates.push("user_id = ?");
        params.push(parseInt(session.userId));
      }

      updates.push("updated_at = NOW()");
      params.push(session.sessionToken);

      await execute(
        `UPDATE sessions SET ${updates.join(", ")} WHERE session_token = ?`,
        params
      );

      const updatedSession = await queryOne<any>(
        "SELECT * FROM sessions WHERE session_token = ?",
        [session.sessionToken]
      );

      if (!updatedSession) {
        return null;
      }

      return {
        sessionToken: updatedSession.session_token,
        userId: updatedSession.user_id.toString(),
        expires: new Date(updatedSession.expires),
      };
    },

    // Delete a session
    async deleteSession(sessionToken: string): Promise<void> {
      await execute("DELETE FROM sessions WHERE session_token = ?", [
        sessionToken,
      ]);
    },

    // Create a verification token
    async createVerificationToken(verificationToken: {
      identifier: string;
      expires: Date;
      token: string;
    }): Promise<any> {
      await insert(
        "INSERT INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?)",
        [
          verificationToken.identifier,
          verificationToken.token,
          verificationToken.expires,
        ]
      );

      return verificationToken;
    },

    // Use a verification token
    async useVerificationToken({
      identifier,
      token,
    }: {
      identifier: string;
      token: string;
    }): Promise<any | null> {
      const verificationToken = await queryOne<any>(
        "SELECT * FROM verification_tokens WHERE identifier = ? AND token = ? AND expires > NOW()",
        [identifier, token]
      );

      if (!verificationToken) {
        return null;
      }

      await execute(
        "DELETE FROM verification_tokens WHERE identifier = ? AND token = ?",
        [identifier, token]
      );

      return {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: new Date(verificationToken.expires),
      };
    },
  };
}

