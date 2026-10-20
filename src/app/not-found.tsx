import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-5 py-24 text-center">
      <p className="text-gradient font-mono text-8xl font-semibold">404</p>
      <p className="text-muted">Page introuvable · Page not found</p>
      <Link href="/" className="btn-ghost">← Teranga</Link>
    </div>
  );
}
