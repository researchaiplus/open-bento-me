import { redirect } from 'next/navigation'

export default async function HomePage() {
  // Redirect root route to profile page
  redirect('/profile')
}

