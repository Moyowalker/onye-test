import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import { JWT } from "next-auth/jwt"
import Auth0Provider from "next-auth/providers/auth0"

// Extending the JWT type to include our custom FHIR fields
// This way TypeScript knows about our accessToken and fhirUser properties
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    fhirUser?: string
    scopes?: string[]
  }
}

// Also extending the Session type for our custom fields
declare module "next-auth" {
  interface Session {
    accessToken?: string
    fhirUser?: string
    scopes?: string[]
  }
}

// I'm using NextAuth.js because it handles all the OAuth 2.0 complexity for us
// The [...nextauth] folder creates the auth endpoints automatically
// This saves me from writing custom OAuth flow logic

const authOptions: NextAuthOptions = {
  providers: [
    Auth0Provider({
      // Using the official Auth0 provider - this handles the discovery automatically
      // and is more reliable than custom OAuth configuration
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: `https://${process.env.AUTH0_DOMAIN}`,
      
      // These are SMART on FHIR scopes - the whole point of this auth system!
      // patient/*.read = can read patient data (limited access)  
      // user/*.read = broader read access (for clinicians)
      // fhirUser = gives us the user's FHIR resource ID
      authorization: {
        params: {
          scope: "openid profile email patient/*.read user/*.read fhirUser",
          audience: process.env.AUTH0_AUDIENCE,
        },
      },
    }),
  ],
  
  callbacks: {
    // This is where I preserve the access token and scopes
    // The backend needs these to validate requests and enforce permissions
    async jwt({ token, account, profile }) {
      // On initial sign in, save the access token and user info
      if (account && profile) {
        token.accessToken = account.access_token
        token.fhirUser = (profile as any).fhirUser
        token.scopes = account.scope?.split(' ') || []
        
        // I'm storing these in the JWT so they persist across requests
        // This way I don't need to hit Auth0 on every API call
      }
      return token
    },
    
    async session({ session, token }) {
      // Pass token info to the client-side session
      // This lets the frontend know what permissions the user has
      if (session.user) {
        session.accessToken = token.accessToken
        session.fhirUser = token.fhirUser
        session.scopes = token.scopes
      }
      return session
    },
  },
  
  // Security settings - following best practices
  session: {
    strategy: "jwt", // Using JWTs instead of database sessions for simplicity
    maxAge: 60 * 60, // 1 hour - keeping it short for security
  },
  
  // Custom pages would go here if I wanted branded login
  // For now, Auth0's hosted login page is fine
  pages: {
    // error: '/auth/error', // Could add custom error page later
  },
}

const handler = NextAuth(authOptions)

// Next.js 13+ App Router requires named exports for HTTP methods
export { handler as GET, handler as POST }