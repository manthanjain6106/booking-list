// app/api/auth/authOptions.js
import GitHubProvider from "next-auth/providers/github";
// import other providers you use

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    // other providers here
  ],
  // any other next-auth config options you have
};
