import wizardData from '@/data/rulesets/2014/wizard-progression.json';
import classSpells from '@/data/rulesets/2014/class-spells.json';

export type RulesetId = '2014' | '2024';
export type ClassProgressionLevel = {
  level: number;
  proficiencyBonus: number;
  abilityScoreBonuses: number;
  features: Array<{ id: string; name: string }>;
  spellcasting?: Record<string, number> | null;
  classSpecific: Record<string, unknown>;
};

/** Returns undefined when a class progression has not yet been imported; never invents levels. */
export function getClassProgression2014(classId: string): ClassProgressionLevel[] | undefined {
  if (classId !== 'wizard') return undefined;
  return wizardData.levels as ClassProgressionLevel[];
}

export function getClassLevel2014(classId: string, level: number): ClassProgressionLevel | undefined {
  if (!Number.isInteger(level) || level < 1 || level > 20) return undefined;
  return getClassProgression2014(classId)?.find(row => row.level === level);
}

export function getClassSpells2014(classId: string, maxSpellLevel = 9) {
  const lists = classSpells.classes as Record<string, Array<{ id: string; name: string; level: number }>>;
  return (lists[classId] ?? []).filter(spell => spell.level <= maxSpellLevel);
}

import featureIndex from '@/data/rulesets/2014/class-features-by-level.json';
/** Feature index for all 12 classes; includes subclass features with an explicit tag.
 * This is NOT a replacement for the official per-class /levels endpoint.
 */
export function getClassFeaturesAtLevel2014(classId: string, level: number) {
  if (!Number.isInteger(level) || level < 1 || level > 20) return [];
  const rows = (featureIndex.classes as Record<string, Array<{level:number;proficiencyBonus:number;features:Array<{id:string;name:string;subclass:string|null}>}>>)[classId];
  return rows?.[level-1]?.features ?? [];
}

export function getClassFeatureTimeline2014(classId: string) {
  return (featureIndex.classes as Record<string, Array<{level:number;proficiencyBonus:number;features:Array<{id:string;name:string;subclass:string|null}>}>>)[classId] ?? [];
}
