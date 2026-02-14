/**
 * Editable Profile Mode - /preview
 *
 * Full editor with drag-and-drop and inline editing capabilities.
 * Data is NOT read from compiled profile-config.json like published view,
 * but loaded dynamically in the browser.
 *
 * For profile-only version, always uses LocalStorageAdapter.
 */

'use client'

import ProfilePage from '@/app/profile/page'

export default function PreviewEditPage() {
  // For profile-only version, always render the editor interface
  // No authentication or deployment mode checks needed
  return (
    <div className="min-h-screen">
      <style jsx global>{`
        /* Remove any background constraints for editor */
        body {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          min-height: 100vh;
        }
      `}</style>
      <ProfilePage />
    </div>
  )
}
