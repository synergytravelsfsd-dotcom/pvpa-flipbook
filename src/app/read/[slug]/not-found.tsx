import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-pvpa-blue-500">404</h1>
        <p className="mt-4 text-lg text-gray-600">Publication not found</p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          Back to Library
        </Link>
      </div>
    </div>
  );
}
