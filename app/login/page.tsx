"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { configured, supabase } from "@/lib/supabase";
import { Mail, Lock, ArrowRight, UserRound } from "lucide-react";
export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [username, setUsername] = useState("");
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const client = supabase();
      if (mode === "signup") {
        const name = username.trim();
        if (!/^[A-Za-z0-9_]{3,24}$/.test(name))
          throw new Error(
            "Pseudonyme : 3 à 24 caractères, lettres, chiffres et _ uniquement.",
          );
        const availabilityResponse = await fetch(
          "/api/usernames/availability",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: name }),
            cache: "no-store",
          },
        );
        const availability = (await availabilityResponse.json()) as {
          available?: boolean;
          error?: string;
        };
        if (!availabilityResponse.ok)
          throw new Error(
            availability.error || "Impossible de vérifier le pseudonyme.",
          );
        if (!availability.available)
          throw new Error("Ce pseudonyme est déjà utilisé.");
        const { error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { username: name },
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage(
          "Compte créé. Vérifiez votre messagerie si la confirmation par email est activée.",
        );
      } else {
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link href="/dashboard" className="brand auth-brand">
          <span className="brand-mark">✦</span>
          <span>
            CHRONIQUES <em>&</em> DÉS<small>LE GRIMOIRE DES AVENTURIERS</small>
          </span>
        </Link>
        <span className="eyebrow">ENTREZ DANS LA LÉGENDE</span>
        <h1>
          {mode === "login"
            ? "Bon retour, aventurier."
            : "Rejoignez la compagnie."}
        </h1>
        <p>Vos personnages et campagnes vous attendent.</p>
        {!configured() ? (
          <div className="notice">Supabase n'est pas encore configuré.</div>
        ) : (
          <form onSubmit={submit}>
            {mode === "signup" && (
              <>
                <label className="field-label">
                  <UserRound size={14} /> PSEUDONYME
                </label>
                <input
                  className="field"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-z0-9_]+"
                  autoComplete="nickname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre nom d'aventurier"
                />
                <p className="hint">
                  Visible par les autres joueurs. Différent du nom de vos
                  personnages.
                </p>
              </>
            )}
            <label className="field-label">
              <Mail size={14} /> ADRESSE EMAIL
            </label>
            <input
              className="field"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="field-label">
              <Lock size={14} /> MOT DE PASSE
            </label>
            <input
              className="field"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn gold auth-submit" disabled={busy}>
              {busy
                ? "Patientez…"
                : mode === "login"
                  ? "Se connecter"
                  : "Créer mon compte"}{" "}
              <ArrowRight size={16} />
            </button>
            {message && (
              <div className="notice" role="status">
                {message}
              </div>
            )}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setMessage("");
              }}
            >
              {mode === "login"
                ? "Pas encore de compte ? S’inscrire"
                : "Déjà inscrit ? Se connecter"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
