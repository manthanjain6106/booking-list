import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/app/utils/db";
import { compare } from "bcryptjs";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const db = (await clientPromise).db(process.env.MONGODB_DB);
        const user = await db.collection("users").findOne({ email: credentials.email });

        if (!user) throw new Error("No user found with this email");

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image || null,
          role: user.role || "guest",
          hasOnboarded: user.hasOnboarded || false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role || "guest";
        token.hasOnboarded = user.hasOnboarded || false;

        // When signing in with Google, create user if not exists
        if (account?.provider === "google") {
          const db = (await clientPromise).db(process.env.MONGODB_DB);
          const existingUser = await db.collection("users").findOne({ email: user.email });

          if (!existingUser) {
            const result = await db.collection("users").insertOne({
              email: user.email,
              name: user.name,
              image: user.image,
              role: "guest",
              hasOnboarded: false,
              createdAt: new Date(),
            });

            token.userId = result.insertedId.toString();
            token.role = "guest";
            token.hasOnboarded = false;
          } else {
            token.userId = existingUser._id.toString();
            token.role = existingUser.role || "guest";
            token.hasOnboarded = existingUser.hasOnboarded || false;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.hasOnboarded = token.hasOnboarded;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",  // Error page for auth errors
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
