export const CUSTOM_SUBCLASS = '__custom_subclass_2014__';

export type CustomSubclass2014 = {
  name: string;
  features: { name: string; level: number; description: string }[];
};

export function validCustomSubclass2014(value: CustomSubclass2014 | null | undefined, minimumLevel: number): value is CustomSubclass2014 {
  return !!value && typeof value.name === 'string' && value.name.trim().length > 0 && value.name.length <= 120
    && Array.isArray(value.features) && value.features.length <= 30
    && value.features.every(feature => !!feature && typeof feature.name === 'string'
      && feature.name.trim().length > 0 && feature.name.length <= 120
      && Number.isInteger(feature.level) && feature.level >= minimumLevel && feature.level <= 20
      && typeof feature.description === 'string' && feature.description.length <= 2000);
}

export function cleanCustomSubclass2014(value: CustomSubclass2014): CustomSubclass2014 {
  return {
    name: value.name.trim(),
    features: value.features.map(feature => ({...feature, name: feature.name.trim(), description: feature.description.trim()})),
  };
}
