// Importe le type Groupe depuis le modèle
import { Groupe } from "../model";
// Importe la fonction loadUser depuis le gestionnaire de dépenses
import { loadUser } from "../depenseManager";
// Importe la bibliothèque figlet pour créer des ASCII art
import figlet from "figlet";
// Importe la bibliothèque chalk pour colorer la sortie console
import chalk from "chalk";

// Définit une fonction asynchrone pour afficher les membres d'un groupe
export async function afficherMembresDuGroupe(groupe: Groupe) {
            
    // Efface la console avant d'afficher les informations
    console.clear();
    // Affiche un titre stylisé en ASCII art coloré en cyan
    console.log(
        chalk.cyan(
            figlet.textSync("Membres du groupe", {horizontalLayout :"full"})
        )
    );
 

    // Charge les utilisateurs depuis le système de stockage
    const { users } = loadUser();

    // Vérifie si le groupe n'a pas de membres ou si la liste est vide
    if (!groupe.membreId || groupe.membreId.length === 0) {
        console.log("\n Aucun membre dans ce groupe.\n");
        return; // Sort de la fonction si aucun membre
    }

    // Affiche le nom du groupe entre astérisques
    console.log(`\n Membres du groupe **"${groupe.nom}"** :\n`);

    // Parcourt chaque ID de membre dans le groupe
    groupe.membreId.forEach((id) => {
        // Trouve l'utilisateur correspondant à l'ID
        const membre = users.find((u) => u.id === id);
        if (membre) {
            // Affiche les informations du membre formatées
            console.log(
                `\n **${membre.nom} ${membre.prenom}**\n   📞 Téléphone: **${membre.telephone}**\n`
            );
        }
    });

    // Affiche un message de fin stylisé
    console.log("\n Fin de la liste des membres.\n");
}