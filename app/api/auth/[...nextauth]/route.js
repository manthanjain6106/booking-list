import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import  clientPromise  from "@/app/utils/db";
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Find user in database
        const db = (await clientPromise).db(process.env.MONGODB_DB);
        const user = await db.collection("users").findOne({
          email: credentials.email,
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // Check password
        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || "guest", // Default role
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.role = user.role || "guest";
        token.userId = user.id;
        token.hasOnboarded = user.hasOnboarded || false;

        if (account.provider === "google") {
          const db = (await clientPromise).db(process.env.MONGODB_DB);
          const existingUser = await db.collection("users").findOne({
            email: user.email,
          });

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
    signUp: "/register",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
