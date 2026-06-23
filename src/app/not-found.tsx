import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-pvpa-blue-500">404</h1>
        <p className="mt-4 text-lg text-gray-600">Page not found</p>
        <p className="mt-2 text-sm text-gray-500">
          The page you requested does not exist or may have been removed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary inline-block">
            Back to Library
          </Link>
          <Link href="/admin" className="btn-secondary inline-block">
            Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
