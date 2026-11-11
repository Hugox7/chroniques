import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CampaignLayout({ children }: { children: ReactNode }) {
  return (
    <main className="campaign-workspace">
      <Link href="/dashboard" className="btn outline campaign-return">
        <ArrowLeft size={16} aria-hidden="true" />
        Revenir au tableau de bord
      </Link>
      {children}
    </main>
  );
}
