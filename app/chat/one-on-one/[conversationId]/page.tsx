import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page Description',
}

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Page Title</h1>
      <p>This is a generic page component. Replace this content with your actual page content.</p>
    </div>
  )
}