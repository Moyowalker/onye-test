"use client"

import { useSession, signIn, signOut } from "next-auth/react"
export default function AuthButton() {
  const { data: session, status } = useSession()

  // Show loading state while checking auth status
  // This prevents the login button from flashing before session loads
  if (status === "loading") {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600">Checking authentication...</span>
      </div>
    )
  }

  // User is authenticated - show their info and logout option
  if (session) {
    return (
      <div className="flex items-center space-x-4">
        {/* Show user info and their FHIR permissions */}
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            Welcome, {session.user?.name || session.user?.email}
          </div>
          {/* This is really cool - showing the user their SMART scopes */}
          {session.scopes && (
            <div className="text-xs text-gray-600">
              Permissions: {session.scopes.filter(scope => 
                scope.includes('read') || scope.includes('fhir')
              ).join(', ')}
            </div>
          )}
        </div>
        
        <button
          onClick={() => signOut()}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  // User not authenticated - show login button
  return (
    <div className="flex items-center space-x-4">
      <div className="text-sm text-gray-600">
        Sign in to query FHIR data with proper authorization
      </div>
      <button
        onClick={() => signIn("auth0")}
        className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Sign In with Auth0
      </button>
    </div>
  )
}