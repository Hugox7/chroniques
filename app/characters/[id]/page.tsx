"use client";

import {
  parsePortraitAppearance,
  portraitLabels,
} from "@/lib/portrait-appearance";
import AiCharacterPortrait from "@/components/ai-character-portrait";
import CharacterSnapshots from "@/components/character-snapshots";
import { supabase } from "@/lib/supabase";
import LevelUp2014 from "@/components/level-up-2014";
import CharacterResources2014 from "@/components/character-resources-2014";
import FreeInventory from "@/components/free-inventory";
import {
  classSavingThrows,
  skillAbilities,
  savingThrowBonus,
  skillBonus,
} from "@/lib/character-mechanics";
import Shell from "@/components/shell";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Character,
  abilities,
  fmt,
  mod,
  proficiency,
  roll,
  validateCharacter,
} from "@/lib/rules";
import { getCharacter, saveCharacter, removeCharacter } from "@/lib/store";
import { Heart, Dices, ArrowLeft, Trash2, Download } from "lucide-react";
import Link from "next/link";
export default function Sheet() {
  const { id } = useParams<{ id: string }>(),
    router = useRouter();
  const [engagement, setEngagement] = useState<{
      campaignId: string;
      title: string;
    } | null>(null),
    [engagementLoading, setEngagementLoading] = useState(true);
  const [c, setC] = useState<Character | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setEngagementLoading(true);
    Promise.all([
      getCharacter(id),
      supabase()
        .from("campaign_members")
        .select("campaign_id,campaigns(title,status)")
        .eq("character_id", id),
    ])
      .then(([character, memberResult]) => {
        if (!live) return;
        setC(character || null);
        if (memberResult.error) {
          setError(
            "Impossible de vérifier les droits du personnage : " +
              memberResult.error.message,
          );
          return;
        }
        const member = (memberResult.data ?? []).find(
          (m: any) => m.campaigns && m.campaigns.status !== "completed",
        );
        setEngagement(
          member
            ? {
                campaignId: member.campaign_id,
                title: (member.campaigns as any).title,
              }
            : null,
        );
        setEngagementLoading(false);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [id]);
  async function update(changes: Partial<Character>) {
    if (!c) return;
    if (engagementLoading) {
      setError("Vérification des droits en cours.");
      return;
    }
    if (
      engagement &&
      Object.keys(changes).some(
        (key) =>
          ![
            "alignment",
            "age",
            "height",
            "appearance",
            "personality_traits",
            "ideals",
            "bonds",
            "flaws",
            "languages",
            "spellbook",
            "spellcasting_notes",
            "notes",
          ].includes(key),
      )
    ) {
      setError(
        "Personnage engagé : seuls les champs de préparation sont modifiables hors séance.",
      );
      return;
    }
    const next = { ...c, ...changes };
    if (!validateCharacter(next)) {
      setError("Données invalides");
      return;
    }
    try {
      await saveCharacter(next);
      setC(next);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      const fresh = await getCharacter(c.id);
      setC(fresh ?? null);
    }
  }
  function dice(sides: number, bonus = 0) {
    const n = roll(sides);
    setMessage(`D${sides} : ${n} ${bonus ? fmt(bonus) : ""} = ${n + bonus}`);
  }
  function exportJson() {
    if (!c) return;
    const blob = new Blob([JSON.stringify(c, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Shell>
      <Link className="back-link" href="/dashboard">
        <ArrowLeft size={15} /> Mes personnages
      </Link>
      {error && <div className="notice error">{error}</div>}
      {!c ? (
        <div className="panel">
          <p>
            Chargement de la fiche… Si elle n'apparaît pas, vérifiez le
            personnage sélectionné.
          </p>
        </div>
      ) : (
        <>
          <div className="sheet-identity">
            <div className="sheet-portrait">
              <AiCharacterPortrait
                characterId={c.id}
                appearance={c.appearance ?? ""}
              />
            </div>
            <div className="sheet-identity-main">
              <span className="eyebrow">FICHE DE PERSONNAGE · D&D 5E 2014</span>
              <h1>{c.name}</h1>
              <p>
                {c.race}
                {c.subrace ? ` (${c.subrace})` : ""} · {c.class_name} ·{" "}
                {c.background}
              </p>
              <div className="sheet-quick-stats">
                <div>
                  <small>POINTS DE VIE</small>
                  <strong>
                    {c.hp_current} / {c.hp_max}
                  </strong>
                </div>
                <div>
                  <small>CLASSE D'ARMURE*</small>
                  <strong>{10 + mod(c.abilities.DEX)}</strong>
                </div>
                <div>
                  <small>INITIATIVE</small>
                  <strong>{fmt(mod(c.abilities.DEX))}</strong>
                </div>
                <div>
                  <small>MAÎTRISE</small>
                  <strong>{fmt(proficiency(c.level))}</strong>
                </div>
              </div>
              <div className="sheet-hp-control">
                <div className="sheet-hp-heading">
                  <Heart size={18} />
                  <strong>Points de vie</strong>
                  <span>
                    {c.hp_current} / {c.hp_max} PV
                  </span>
                </div>
                <div className="sheet-hp-actions">
                  <button
                    className="btn outline"
                    type="button"
                    disabled={engagementLoading || Boolean(engagement)}
                    onClick={() =>
                      update({ hp_current: Math.max(0, c.hp_current - 1) })
                    }
                  >
                    − 1 dégât
                  </button>
                  <button
                    className="btn outline"
                    type="button"
                    disabled={engagementLoading || Boolean(engagement)}
                    onClick={() =>
                      update({
                        hp_current: Math.min(c.hp_max, c.hp_current + 1),
                      })
                    }
                  >
                    + 1 soin
                  </button>
                </div>
                <label className="field-label" htmlFor="sheet-hp-max">
                  PV MAXIMUM
                </label>
                <input
                  id="sheet-hp-max"
                  className="field"
                  type="number"
                  min={1}
                  max={999}
                  disabled={engagementLoading || Boolean(engagement)}
                  value={c.hp_max}
                  onChange={(e) => {
                    const hp = Math.max(
                      1,
                      Math.min(999, Number(e.target.value) || 1),
                    );
                    update({
                      hp_max: hp,
                      hp_current: Math.min(c.hp_current, hp),
                    });
                  }}
                />
              </div>
            </div>
            <div className="level-seal">
              NIVEAU<strong>{c.level}</strong>
            </div>
          </div>
          {engagementLoading ? (
            <div className="notice">
              Vérification des droits de modification…
            </div>
          ) : engagement ? (
            <div className="notice">
              <strong>Engagé dans une campagne : {engagement.title}</strong> ·
              Les champs de préparation (personnalité, sorts, notes) restent
              accessibles. Pour les modifications de jeu, rendez-vous dans{" "}
              <Link href={`/campaigns/${engagement.campaignId}`}>
                la campagne
              </Link>
              .
            </div>
          ) : null}
          <fieldset
            disabled={engagementLoading || Boolean(engagement)}
            className="sheet-grid"
            style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
          >
            <div className="panel">
              <h2>État en combat</h2>
              <label className="field-label">VITESSE (M / TOUR)</label>
              <input
                className="field"
                type="number"
                min={0}
                max={60}
                step={1.5}
                value={c.speed ?? 9}
                onChange={(e) =>
                  update({
                    speed: Math.max(
                      0,
                      Math.min(60, Number(e.target.value) || 0),
                    ),
                  })
                }
              />
              <label className="field-label">PV TEMPORAIRES</label>
              <input
                className="field"
                type="number"
                min={0}
                max={999}
                value={c.temporary_hp ?? 0}
                onChange={(e) =>
                  update({
                    temporary_hp: Math.max(
                      0,
                      Math.min(999, Number(e.target.value) || 0),
                    ),
                  })
                }
              />
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={c.inspiration ?? false}
                  onChange={(e) => update({ inspiration: e.target.checked })}
                />{" "}
                Inspiration
              </label>
              <div className="stats">
                <div>
                  <small>SAUVEGARDES CONTRE LA MORT · RÉUSSITES</small>
                  <input
                    className="field"
                    type="number"
                    min={0}
                    max={3}
                    value={c.death_save_successes ?? 0}
                    onChange={(e) =>
                      update({
                        death_save_successes: Math.max(
                          0,
                          Math.min(3, Number(e.target.value) || 0),
                        ),
                      })
                    }
                  />
                </div>
                <div>
                  <small>ÉCHECS</small>
                  <input
                    className="field"
                    type="number"
                    min={0}
                    max={3}
                    value={c.death_save_failures ?? 0}
                    onChange={(e) =>
                      update({
                        death_save_failures: Math.max(
                          0,
                          Math.min(3, Number(e.target.value) || 0),
                        ),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="panel">
              <h2>Caractéristiques</h2>
              <div className="ability-grid">
                {abilities.map((a) => (
                  <button
                    className="ability"
                    key={a}
                    onClick={() => dice(20, mod(c.abilities[a]))}
                  >
                    <small>{a}</small>
                    <strong>{fmt(mod(c.abilities[a]))}</strong>
                    <span>{c.abilities[a]}</span>
                  </button>
                ))}
              </div>
              <div className="stats">
                <div>
                  <small>BONUS DE MAÎTRISE</small>
                  <strong>{fmt(proficiency(c.level))}</strong>
                </div>
                <div>
                  <small>INITIATIVE</small>
                  <strong>{fmt(mod(c.abilities.DEX))}</strong>
                </div>
                <div>
                  <small>CLASSE D'ARMURE*</small>
                  <strong>{10 + mod(c.abilities.DEX)}</strong>
                </div>
              </div>
              <p className="hint">
                * CA indicative sans armure, bouclier ni capacité particulière.
              </p>
            </div>
            <div className="panel full">
              <h2>Jets de sauvegarde</h2>
              <p className="hint">
                Les maîtrises de sauvegarde sont déterminées par la classe
                (règles 2014). Touchez une valeur pour lancer un D20.
              </p>
              <div className="mechanics-grid">
                {abilities.map((a) => (
                  <button
                    key={a}
                    className="mechanic-row"
                    onClick={() =>
                      dice(
                        20,
                        savingThrowBonus(
                          c.class_name,
                          a,
                          c.abilities[a],
                          c.level,
                        ),
                      )
                    }
                  >
                    <span>
                      {classSavingThrows[c.class_name]?.includes(a) ? "●" : "○"}{" "}
                      {a}
                    </span>
                    <strong>
                      {fmt(
                        savingThrowBonus(
                          c.class_name,
                          a,
                          c.abilities[a],
                          c.level,
                        ),
                      )}
                    </strong>
                  </button>
                ))}
              </div>
            </div>
            <div className="panel full">
              <h2>Compétences</h2>
              <p className="hint">
                ● Compétence maîtrisée. Les anciennes fiches sans maîtrises
                restent compatibles.
              </p>
              <div className="mechanics-grid">
                {skillAbilities.map(([label, a]) => (
                  <button
                    key={label}
                    className="mechanic-row"
                    onClick={() =>
                      dice(
                        20,
                        skillBonus(
                          c.abilities[a],
                          c.level,
                          c.skill_proficiencies?.includes(label) ?? false,
                        ),
                      )
                    }
                  >
                    <span>
                      {c.skill_proficiencies?.includes(label) ? "●" : "○"}{" "}
                      {label} <small>({a})</small>
                    </span>
                    <strong>
                      {fmt(
                        skillBonus(
                          c.abilities[a],
                          c.level,
                          c.skill_proficiencies?.includes(label) ?? false,
                        ),
                      )}
                    </strong>
                  </button>
                ))}
              </div>
            </div>
            <LevelUp2014 character={c} onSave={update} />
            <CharacterResources2014 character={c} onSave={update} />
            <FreeInventory character={c} onSave={update} />
            <div className="panel full">
              <h2>
                <Dices size={21} /> Lanceur de dés
              </h2>
              <div className="dice-row">
                {[4, 6, 8, 10, 12, 20, 100].map((d) => (
                  <button key={d} className="dice" onClick={() => dice(d)}>
                    D{d}
                  </button>
                ))}
              </div>
              {message && (
                <div className="roll-result" role="status">
                  {message}
                </div>
              )}
              <p className="hint">
                Touchez une caractéristique pour effectuer un jet D20 avec son
                modificateur.
              </p>
            </div>
          </fieldset>
          <fieldset
            disabled={engagementLoading}
            className="sheet-grid"
            style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
          >
            <div className="panel">
              <h2>Préparation · identité et personnalité</h2>
              <h3>Apparence</h3>
              <p className="hint">
                Décris les caractéristiques physiques avant de générer : visage,
                cheveux, yeux, tenue, signes distinctifs.
              </p>
              {c.appearance?.startsWith("CD_AVATAR_V1:") ? (
                <p className="hint">
                  Ancienne configuration conservée dans la fiche, sans affichage
                  ni modification pour le moment.
                </p>
              ) : (
                <div className="notice">
                  {parsePortraitAppearance(c.appearance ?? "") ? (
                    Object.entries(
                      parsePortraitAppearance(c.appearance ?? "")!.fields,
                    )
                      .map(
                        ([key, value]) =>
                          `${portraitLabels[key as keyof typeof portraitLabels]} : ${value}`,
                      )
                      .join(" · ") +
                    (parsePortraitAppearance(c.appearance ?? "")!.details
                      ? ` · Détails : ${parsePortraitAppearance(c.appearance ?? "")!.details}`
                      : "")
                  ) : (
                    <textarea
                      className="field textarea"
                      aria-label="Description de l’apparence"
                      value={c.appearance ?? ""}
                      onChange={(e) => update({ appearance: e.target.value })}
                      placeholder="Description physique du personnage…"
                    />
                  )}
                </div>
              )}
              {(
                [
                  ["Alignement", "alignment"],
                  ["Âge", "age"],
                  ["Taille", "height"],
                  ["Traits de personnalité", "personality_traits"],
                  ["Idéaux", "ideals"],
                  ["Liens", "bonds"],
                  ["Défauts", "flaws"],
                  ["Langues connues", "languages"],
                ] as const
              ).map(([label, key]) => (
                <label key={key} style={{ display: "block", marginBottom: 12 }}>
                  <span className="field-label">{label.toUpperCase()}</span>
                  {[
                    "appearance",
                    "personality_traits",
                    "ideals",
                    "bonds",
                    "flaws",
                  ].includes(key) ? (
                    <textarea
                      className="field textarea"
                      value={c[key] ?? ""}
                      onChange={(e) => update({ [key]: e.target.value })}
                    />
                  ) : (
                    <input
                      className="field"
                      value={c[key] ?? ""}
                      onChange={(e) => update({ [key]: e.target.value })}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="panel">
              <h2>Préparation · sorts et notes de magie</h2>
              <p className="hint">
                Vous pouvez préparer vos sorts et vos notes entre deux séances.
                Respectez les règles de votre classe et les repos requis.
              </p>
              {(
                [
                  ["Sorts connus et préparés", "spellbook"],
                  ["Notes de magie", "spellcasting_notes"],
                ] as const
              ).map(([label, key]) => (
                <label key={key} style={{ display: "block", marginBottom: 12 }}>
                  <span className="field-label">{label.toUpperCase()}</span>
                  <textarea
                    className="field textarea"
                    value={c[key] ?? ""}
                    onChange={(e) => update({ [key]: e.target.value })}
                  />
                </label>
              ))}
              <label className="field-label">NOTES PERSONNELLES</label>
              <textarea
                className="field textarea"
                value={c.notes ?? ""}
                onChange={(e) => update({ notes: e.target.value })}
              />
            </div>
          </fieldset>
          <CharacterSnapshots
            characterId={c.id}
            onRestored={async () => {
              const fresh = await getCharacter(c.id);
              setC(fresh ?? null);
            }}
          />
          <div className="sheet-tools">
            <button className="subtle-btn" onClick={exportJson}>
              <Download size={15} /> Exporter JSON
            </button>
            <button
              className="subtle-btn danger"
              disabled={engagementLoading || Boolean(engagement)}
              onClick={async () => {
                if (confirm("Supprimer définitivement ce personnage ?")) {
                  await removeCharacter(c.id);
                  router.push("/dashboard");
                }
              }}
            >
              <Trash2 size={15} /> Supprimer
            </button>
          </div>
          <div className="notice">
            Fiche en développement : équipement, sorts et capacités de classe
            seront intégrés dans les prochaines versions.
          </div>
        </>
      )}
    </Shell>
  );
}
