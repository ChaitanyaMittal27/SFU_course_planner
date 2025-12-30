import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
          {/* Left: Copyright */}
          <div className="flex items-center space-x-2">
            <span>© 2025 Anonymouse</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center">
              Made with
              <svg className="w-4 h-4 mx-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              for SFU students
            </span>
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-6">
            {/* Legal Links */}
            <Link href="/privacy" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              Terms
            </Link>

            {/* Separator */}
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>

            {/* GitHub Link */}
            <a
              href="https://github.com/ChaitanyaMittal27/SFU_course_planner"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
