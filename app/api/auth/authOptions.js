import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Your authorization logic here
        // For example, validate email and password with DB
        const user = /* fetch user from DB and validate credentials */;
        if (user) {
          return user;
        }
        return null;
      },
    }),
  ],
  // Add any other NextAuth configuration options you need
};
