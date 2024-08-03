// app/page.tsx
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a060ff] to-[#00e4e3]">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Welcome to ChatApp</h1>
          <p className="text-xl text-white mb-8">Connect with friends and start chatting in real-time!</p>
          <div className="space-x-4">
            {session ? (
              <Link href="/chat" className="btn btn-primary bg-white text-[#a060ff] hover:bg-gray-100">
                Go to Chat
              </Link>
            ) : (
              <>
                <Link href="/signin" className="btn btn-primary bg-white text-[#a060ff] hover:bg-gray-100">
                  Sign In
                </Link>
                <Link href="/signup" className="btn btn-outline text-white hover:bg-white hover:text-[#a060ff]">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="mt-16">
          <h2 className="text-3xl font-semibold text-white mb-8 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Real-time Messaging"
              description="Chat with your friends instantly with our real-time messaging system."
              icon="💬"
            />
            <FeatureCard
              title="Group Chats"
              description="Create and participate in group conversations with multiple friends."
              icon="👥"
            />
            <FeatureCard
              title="File Sharing"
              description="Share images, documents, and other files effortlessly in your chats."
              icon="📎"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}