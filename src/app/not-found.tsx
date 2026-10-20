import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <p className="font-mono text-6xl font-bold text-accent">404</p>
      <p className="text-muted">Page introuvable · Page not found</p>
      <Link href="/" className="btn-primary">← Teranga Dev</Link>
    </div>
  );
}
