import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";
import { permissionsForSystemRole } from "./permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      systemRole: string;
      status: string;
      permissions: string[];
      jobRoleId: string | null;
      jobRoleName: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    systemRole: string;
    status: string;
    permissions: string[];
    jobRoleId: string | null;
    jobRoleName: string | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: {
            jobRole: { include: { permissions: true } },
          },
        });

        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.password);
        if (!ok) return null;

        if (user.status === "PENDENTE") {
          throw new Error("Seu cadastro está aguardando aprovação do administrador.");
        }
        if (user.status === "BLOQUEADO" || user.status === "INATIVO") {
          throw new Error("Sua conta está inativa. Procure o administrador.");
        }

        const systemPerms = permissionsForSystemRole(user.systemRole);
        const rolePerms = user.jobRole?.permissions.map((p) => p.key) ?? [];
        const permissions = Array.from(new Set([...systemPerms, ...rolePerms]));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          systemRole: user.systemRole,
          status: user.status,
          permissions,
          jobRoleId: user.jobRoleId,
          jobRoleName: user.jobRole?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as typeof user & {
          systemRole: string;
          status: string;
          permissions: string[];
          jobRoleId: string | null;
          jobRoleName: string | null;
        };
        token.id = u.id as string;
        token.systemRole = u.systemRole;
        token.status = u.status;
        token.permissions = u.permissions;
        token.jobRoleId = u.jobRoleId;
        token.jobRoleName = u.jobRoleName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.systemRole = token.systemRole;
        session.user.status = token.status;
        session.user.permissions = token.permissions;
        session.user.jobRoleId = token.jobRoleId;
        session.user.jobRoleName = token.jobRoleName;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/cadastro");

      if (isAuthPage) {
        if (loggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }
      if (nextUrl.pathname === "/") {
        return Response.redirect(new URL(loggedIn ? "/dashboard" : "/login", nextUrl));
      }
      return loggedIn;
    },
  },
});
