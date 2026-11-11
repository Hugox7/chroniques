"use client";

import CharacterSheet from "@/components/character-sheet";
import Shell from "@/components/shell";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function Sheet() {
  const { id } = useParams<{ id: string }>();
  return (
    <Shell>
      <Link className="back-link" href="/dashboard">
        <ArrowLeft size={15} /> Mes personnages
      </Link>
      <CharacterSheet key={id} id={id} />
    </Shell>
  );
}
