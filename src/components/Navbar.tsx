import Link from 'next/link';
import { BookOpen, Settings } from 'lucide-react';

interface NavbarProps {
  showAdmin?: boolean;
  transparent?: boolean;
}

export default function Navbar({ showAdmin = true, transparent = false }: NavbarProps) {
  return (
    <header className={`${transparent ? 'bg-transparent' : 'bg-pvpa-navy'} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-pvpa-teal rounded-lg flex items-center justify-center shadow-md group-hover:bg-teal-400 transition-colors">
              <BookOpen size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-white text-base tracking-tight">PVPA</span>
              <span className="text-teal-300 text-sm ml-2 font-light">Digital Flipbook</span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">
              Library
            </Link>
            {showAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <Settings size={15} />
                Admin
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
