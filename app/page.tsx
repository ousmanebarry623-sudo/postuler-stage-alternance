import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">Trouve ton prochain poste</h1>
      <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
        Crée ton profil, laisse le système rechercher les offres sur LinkedIn, Indeed,
        Welcome to the Jungle, APEC et HelloWork, et consulte les meilleures correspondances.
      </p>
      <div className="flex gap-4">
        <Link href="/profile"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
          Créer mon profil
        </Link>
        <Link href="/jobs"
          className="border border-blue-600 text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition">
          Voir les offres
        </Link>
      </div>
    </main>
  )
}
