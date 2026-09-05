export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header className="bg-gray-900 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-4xl font-bold text-white">React Setup Kit</h1>
          <p className="text-gray-300 mt-2">A modern React project starter</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <section className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome! 👋</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Your project has been set up with a modern React structure, including
            routing, authentication guards, and Tailwind CSS styling. Everything is
            organized and ready for development.
          </p>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Feature Card 1 */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-lg font-bold text-white mb-2">React Router</h3>
            <p className="text-gray-300 text-sm">
              Complete routing setup with protected and public routes built in.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-lg font-bold text-white mb-2">Tailwind CSS</h3>
            <p className="text-gray-300 text-sm">
              Beautiful styling with Tailwind CSS and @tailwindcss/vite plugin.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">🔐</div>
            <h3 className="text-lg font-bold text-white mb-2">Auth Guards</h3>
            <p className="text-gray-300 text-sm">
              Built-in private and public route guards for authentication.
            </p>
          </div>

          {/* Feature Card 4 */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">📁</div>
            <h3 className="text-lg font-bold text-white mb-2">Organized Structure</h3>
            <p className="text-gray-300 text-sm">
              Clean folder structure with components, pages, routes, and utils.
            </p>
          </div>

          {/* Feature Card 5 */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-lg font-bold text-white mb-2">Vite</h3>
            <p className="text-gray-300 text-sm">
              Lightning-fast build tool with HMR for instant updates.
            </p>
          </div>

          {/* Feature Card 6 */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-bold text-white mb-2">TypeScript</h3>
            <p className="text-gray-300 text-sm">
              Full TypeScript support with path aliases for clean imports.
            </p>
          </div>
        </section>

        {/* Folder Structure */}
        <section className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📂 Folder Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-blue-400 mb-2">Main Directories</h3>
              <ul className="space-y-1 text-gray-300 font-mono text-sm">
                <li>📁 src/components - Reusable UI components</li>
                <li>📁 src/pages - Page components</li>
                <li>📁 src/routes - Route definitions</li>
                <li>📁 src/layouts - Layout components</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-blue-400 mb-2">Supporting Directories</h3>
              <ul className="space-y-1 text-gray-300 font-mono text-sm">
                <li>📁 src/utils - Utility functions</li>
                <li>📁 src/api - API calls</li>
                <li>📁 src/hooks - Custom hooks</li>
                <li>📁 src/types - TypeScript types</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="bg-gray-800 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🚀 Getting Started</h2>
          <div className="space-y-3">
            <p>✅ <span className="font-semibold">Dependencies installed</span> - All npm packages ready</p>
            <p>✅ <span className="font-semibold">Routing configured</span> - Private and public routes set up</p>
            <p>✅ <span className="font-semibold">Imports use plain relative paths</span> - No custom alias setup needed</p>
            <p>✅ <span className="font-semibold">Tailwind CSS enabled</span> - Start styling your app</p>
          </div>
          <p className="mt-6 text-gray-300">
            Edit files in src/ folder and start building your amazing app! 🎉
          </p>
        </section>
      </main>
    </div>
  );
}
