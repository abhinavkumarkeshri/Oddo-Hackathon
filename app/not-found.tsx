import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans">
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-medium text-slate-900 border-r border-slate-200 pr-6">404</h1>
        <p className="text-sm text-slate-500 uppercase tracking-wide">Under Development</p>
      </div>
      <Link 
        href="/dashboard" 
        className="mt-8 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
