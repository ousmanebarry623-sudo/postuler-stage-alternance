import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Job Search Platform',
  description: 'Recherche d\'emploi intelligente',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b px-6 py-3 flex gap-6 text-sm font-medium sticky top-0 z-10">
          <Link href="/" className="text-gray-700 hover:text-blue-600 transition">Accueil</Link>
          <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition">Mon Profil</Link>
          <Link href="/jobs" className="text-gray-700 hover:text-blue-600 transition">Offres</Link>
        </nav>
        <div className="py-6">
          {children}
        </div>
      </body>
    </html>
  )
}
