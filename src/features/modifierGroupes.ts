// Import des modules et types nécessaires
import { Groupe } from "../model"; // Type Groupe
import { loadGroupe, savegroupe } from "../depenseManager"; // Chargement et sauvegarde des groupes
import inquirer from "inquirer"; // Interface CLI

/**
 * Fonction pour modifier un groupe spécifique
 * @param group - le groupe à modifier
 */
export async function modifierGroupe(group: Groupe) {
    // Chargement de tous les groupes
    const { groupes } = loadGroupe();

    // Prompt pour choisir le champ à modifier
    const { listerChamps } = await inquirer.prompt([
        {
            type: "list",
            name: "listerChamps",
            message: "Quel champs souhaitez-vous modifier ?",
            choices: ["nom", "description"],
        },
    ]);

    // Prompt pour entrer la nouvelle valeur du champ choisi
    const { nouveauNiveau } = await inquirer.prompt([
        {
            type: "input",
            name: "nouveauNiveau",
            message: `Nouveau ${listerChamps} pour le groupe :`,
        },
    ]);

    // Selon le champ choisi, mettre à jour la propriété correspondante
    switch (listerChamps) {
        case "nom":
            group.nom = nouveauNiveau; // Met à jour le nom
            console.log("Nom du groupe changé avec succès !");
            const path = require('path');
            const notifier = require("node-notifier");
            notifier.notify({
                title: "Modification",
                message: "Modifications réussies",
                icon: "img/icon.jpg",
            });
            break;
        case "description":
            group.description = nouveauNiveau; // Met à jour la description
            // Notification de succès via node-notifier
            notifier.notify({
                title: "Modification",
                message: "Modifications réussies",
                icon: path.join(__dirname, 'img/icon.jpg')
            });
            console.log("Description du groupe changée avec succès !");
            break;
    }

    // Met à jour le groupe dans la liste principale
    const index = groupes.findIndex((g) => g.id === group.id);
    if (index !== -1) {
        groupes[index] = { ...group }; // Remplace le groupe existant par le nouveau
        savegroupe(groupes); // Sauvegarde la nouvelle liste
        console.log("Informations du groupe mises à jour !");
    } else {
        console.log(" Groupe introuvable lors de la mise à jour");
    }
}