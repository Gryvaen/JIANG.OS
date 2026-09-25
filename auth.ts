import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
export const {handlers,auth,signIn,signOut}=NextAuth({providers:[GitHub],callbacks:{async signIn({profile}){return String(profile?.id)===process.env.OWNER_GITHUB_ID},async session({session,token}){if(session.user)(session.user as typeof session.user&{role:string}).role=token.role==="owner"?"owner":"viewer";return session},async jwt({token,profile}){if(profile&&String(profile.id)===process.env.OWNER_GITHUB_ID)token.role="owner";return token}}});
