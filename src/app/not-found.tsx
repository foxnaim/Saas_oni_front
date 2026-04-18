import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="font-mono text-[10rem] font-black leading-none tracking-tighter text-foreground">
          404
        </p>
        <p className="mt-2 font-mono text-xl font-bold uppercase tracking-widest text-foreground">
          Page Not Found
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block border-2 border-foreground bg-background px-6 py-3 font-mono font-bold uppercase tracking-wide text-foreground shadow-[4px_4px_0px_0px] shadow-foreground transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px] hover:shadow-foreground"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
