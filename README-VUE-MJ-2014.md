# Vue de campagne du maître du jeu

## Disposition

| Écran | De haut en bas |
| --- | --- |
| Téléphone | Titre, statut et menu ⋯. Onglet Séance avec sa commande de fin, l’initiative et une liste compacte. Les panneaux d’action s’ouvrent par le bas. Barre fixe Séance, Journal, Discussion, Plus. |
| Tablette | Navigation en haut. Sur Séance, liste de combat à gauche et journal à droite à partir de 48 rem. En dessous, disposition du téléphone. |
| Ordinateur | Deux colonnes centrées dans une largeur maximale de 96 rem. Séance et liste à gauche, journal à droite. Journal et Plus se consultent aussi séparément. Discussion est un onglet dédié. |

## Composants

| Composant | Changement |
| --- | --- |
| Page de campagne | Menu ⋯ pour la gestion, navigation MJ et organisation responsive. Compagnie, documents, défenses et corrections déplacés dans Plus. La discussion a son propre onglet et affiche une pastille de non-lus propre au navigateur. |
| Séances | En-tête compact avec Terminer la séance. Historique, annulation et suppression dans un accordéon. Les anciens raccourcis en double et la seconde rangée d’actions de la séance active sont retirés de la vue MJ. |
| Initiative | Liste unique des personnages et créatures. Personnages sans score à la suite. Ajout et lancement derrière + Combattant. Fin du combat dans les options. |
| Fiche collaborative | La grande carte cède sa place à une ligne MJ. Le panneau du personnage réutilise les commandes de PV, d’états et de jets. |
| Panneau du bas | Nouveau composant de présentation partagé pour les commandes du personnage et l’ajout de combattants. |
| Journal | Un flux chronologique MJ fusionne événements et jets publiés. Filtres Tout, Dégâts, Jets et Notes. L’annulation demande une confirmation. |

La vue joueur conserve sa disposition. Les opérations de séance, d’initiative, de dégâts et de journal utilisent les données et les droits existants.

## Périmètre et propositions

Les créatures et PNJ affichent le nom, le score et le rang disponibles. Leurs PV, CA et états se gèrent à table. Le retrait de l’initiative reste disponible pendant la préparation. Pour les personnages, la CA affichée vient de l’équipement.

Avant le combat, le MJ peut corriger le score depuis le panneau d’un personnage, d’une créature ou d’un PNJ. La liste est recalculée selon le score et conserve l’ordre d’ajout en cas d’égalité. Les fiches de créatures persistantes, l’ajustement direct de la CA et la modification des combattants en cours de round restent des évolutions distinctes.

Chaque participant peut ajouter une note privée dans son journal. La note reste visible par son auteur uniquement, MJ compris. Le filtre Notes du MJ affiche ses notes personnelles. Côté joueur, elles se trouvent dans Mes notes privées.

Appliquer la migration `20261110000200_initiative_edit_private_notes_2014.sql` pour activer ces deux fonctions.
