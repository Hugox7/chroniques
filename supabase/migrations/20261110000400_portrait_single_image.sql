-- La génération valide directement une image. Les anciens portraits à deux choix restent valides.
alter table public.character_ai_portraits
  drop constraint portrait_choice_valid,
  add constraint portrait_choice_valid check (
    status <> 'chosen'
    or (
      cardinality(image_paths) in (1, 2)
      and chosen_index is not null
      and chosen_index >= 0
      and chosen_index < cardinality(image_paths)
      and image_paths[chosen_index + 1] is not null
    )
  );
