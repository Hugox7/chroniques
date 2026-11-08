/** D&D 5e (2014) class/background skill selections, SRD-oriented subset. */
export const classSkillChoices: Record<string,{count:number;options:string[]}> = {
 'Barbare':{count:2,options:['Dressage','Athlétisme','Intimidation','Nature','Perception','Survie']},
 'Barde':{count:3,options:['Acrobaties','Arcanes','Athlétisme','Discrétion','Dressage','Escamotage','Histoire','Intimidation','Investigation','Médecine','Nature','Perception','Perspicacité','Persuasion','Religion','Représentation','Survie','Tromperie']},
 'Clerc':{count:2,options:['Histoire','Médecine','Perspicacité','Persuasion','Religion']},
 'Druide':{count:2,options:['Arcanes','Dressage','Médecine','Nature','Perception','Perspicacité','Religion','Survie']},
 'Guerrier':{count:2,options:['Acrobaties','Athlétisme','Dressage','Histoire','Intimidation','Perception','Perspicacité','Survie']},
 'Moine':{count:2,options:['Acrobaties','Athlétisme','Discrétion','Histoire','Perspicacité','Religion']},
 'Paladin':{count:2,options:['Athlétisme','Intimidation','Médecine','Perspicacité','Persuasion','Religion']},
 'Rôdeur':{count:3,options:['Athlétisme','Discrétion','Dressage','Investigation','Nature','Perception','Perspicacité','Survie']},
 'Roublard':{count:4,options:['Acrobaties','Athlétisme','Discrétion','Escamotage','Intimidation','Investigation','Perception','Perspicacité','Persuasion','Représentation','Tromperie']},
 'Ensorceleur':{count:2,options:['Arcanes','Intimidation','Perspicacité','Persuasion','Religion','Tromperie']},
 'Occultiste':{count:2,options:['Arcanes','Histoire','Intimidation','Investigation','Nature','Religion','Tromperie']},
 'Magicien':{count:2,options:['Arcanes','Histoire','Investigation','Médecine','Perspicacité','Religion']}
};
export const backgroundSkills:Record<string,string[]>={
 'Acolyte':['Perspicacité','Religion'],'Artisan de guilde':['Perspicacité','Persuasion'],
 'Charlatan':['Escamotage','Tromperie'],'Criminel':['Discrétion','Tromperie'],
 'Ermite':['Médecine','Religion'],'Héros du peuple':['Dressage','Survie'],
 'Marin':['Athlétisme','Perception'],'Noble':['Histoire','Persuasion'],
 'Sage':['Arcanes','Histoire'],'Soldat':['Athlétisme','Intimidation'],
 'Artiste':['Acrobaties','Représentation']
};
export const availableClassSkills=(cls:string,bg:string)=> (classSkillChoices[cls]?.options??[]).filter(s=>!backgroundSkills[bg]?.includes(s));
export const validClassSkills=(cls:string,bg:string,selected:string[])=> {
 const rule=classSkillChoices[cls];return !!rule&&selected.length===rule.count&&new Set(selected).size===selected.length&&selected.every(s=>availableClassSkills(cls,bg).includes(s));
};
export const combinedSkills=(bg:string,selected:string[])=>[...new Set([...(backgroundSkills[bg]??[]),...selected])];
