'use client';

import type { CustomSubclass2014 } from '@/lib/custom-subclass-2014';

export default function CustomSubclassEditor2014({ value, onChange, minimumLevel, domain = false }: {
  value: CustomSubclass2014;
  onChange: (value: CustomSubclass2014) => void;
  minimumLevel: number;
  domain?: boolean;
}) {
  function updateFeature(index: number, patch: Partial<CustomSubclass2014['features'][number]>) {
    onChange({...value, features: value.features.map((feature,i) => i === index ? {...feature,...patch} : feature)});
  }
  return <fieldset className="notice">
    <legend>{domain ? 'Domaine personnalisé' : 'Sous-classe personnalisée'}</legend>
    <label>{domain ? 'Nom du domaine' : 'Nom de la sous-classe'}
      <input className="field" maxLength={120} value={value.name} onChange={e=>onChange({...value,name:e.target.value})}/>
    </label>
    <p className="hint">Décris les capacités et leur niveau de déblocage. Les effets se résolvent à table.</p>
    {value.features.map((feature,i)=><div key={i} className="notice">
      <label>Nom de la capacité {i+1}
        <input className="field" maxLength={120} value={feature.name} onChange={e=>updateFeature(i,{name:e.target.value})}/>
      </label>
      <label>Niveau de déblocage {i+1}
        <input className="field" type="number" min={minimumLevel} max={20} value={feature.level||''}
          onChange={e=>updateFeature(i,{level:Number(e.target.value)})}/>
      </label>
      <label>Description {i+1}
        <textarea className="field textarea" rows={2} maxLength={2000} value={feature.description}
          onChange={e=>updateFeature(i,{description:e.target.value})}/>
      </label>
      <button className="btn outline" type="button" onClick={()=>onChange({...value,features:value.features.filter((_,index)=>index!==i)})}>
        Retirer cette capacité
      </button>
    </div>)}
    <button className="btn outline" type="button" disabled={value.features.length>=30}
      onClick={()=>onChange({...value,features:[...value.features,{name:'',level:minimumLevel,description:''}]})}>+ Ajouter une capacité</button>
  </fieldset>;
}
