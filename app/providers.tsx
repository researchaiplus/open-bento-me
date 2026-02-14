/**
 * App Providers - Global context providers
 *
 * Includes:
 * - UserProvider: Manages user state (avatar, user data updates)
 * - Toaster: Notification system
 */

"use client"

import type { PropsWithChildren } from "react"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/context/user-context"

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <UserProvider>
      <div className="relative min-h-screen">
        {children}
      </div>
      <Toaster />
    </UserProvider>
  )
}
