// Import des modules nécessaires
import inquirer from "inquirer"; // Interface CLI pour prompts interactifs
import { loadDepense, savedepense } from "../depenseManager"; // Chargement et sauvegarde des dépenses
import { Utilisateur } from "../model"; // Type Utilisateur
import { afficherGroupes } from "./listergroupe"; // Fonction pour revenir au menu principal des groupes

/**
 * Fonction pour modifier une dépense dans un groupe spécifique
 * @param user - l'utilisateur actuel
 * @param groupeId - l'identifiant du groupe où la dépense se trouve
 */
export async function modifierDepense(user: Utilisateur, groupeId: number) {
    const { depenses } = loadDepense(); // Charge toutes les dépenses

    // Filtre les dépenses appartenant au groupe indiqué
    const depensesDuGroupe = depenses.filter((d) => d.groupeId === groupeId);

    // Si aucune dépense dans ce groupe, on affiche un message et revient au menu
    if (depensesDuGroupe.length === 0) {
        console.log("\n Aucune dépense trouvée dans ce groupe.\n");
        return await afficherGroupes(user);
    }

    // Affiche la liste des dépenses disponibles dans le groupe
    console.log("\n💸 Liste des dépenses :\n");

    // Propose à l'utilisateur de sélectionner la dépense à modifier
    const { depenseId } = await inquirer.prompt([
        {
            type: "list", // Liste déroulante
            name: "depenseId",
            message: " Sélectionnez la dépense à modifier :",
            choices: [
                ...depensesDuGroupe.map((d) => ({
                    name: `🔹 ${d.nom} (${d.montant} FCFA)`,
                    value: d.id,
                })),
                new inquirer.Separator(), // Séparateur visuel
                { name: " Retour au menu des groupes", value: "retour" }, // Option de retour
            ],
        },
    ]);

    // Si l'utilisateur choisit de revenir, on retourne au menu principal
    if (depenseId === "retour") {
        return await afficherGroupes(user);
    }

    // Trouve la dépense sélectionnée par son identifiant
    const dep = depenses.find((d) => d.id === depenseId);
    if (!dep) {
        console.log(" Erreur : dépense introuvable.");
        return;
    }

    // Affiche un message de modification de la dépense sélectionnée
    console.log(`\n Modification de la dépense : ${dep.nom} (${dep.montant} FCFA)`);

    // Demande les nouvelles valeurs (nom et montant)
    const { nom, montant } = await inquirer.prompt([
        {
            type: "input",
            name: "nom",
            message: " Nouveau nom (laisser vide pour ne pas changer) :",
            default: dep.nom, // Valeur par défaut : current nom
        },
        {
            type: "input",
            name: "montant",
            message: " Nouveau montant (en FCFA) :",
            default: dep.montant.toString(),
            validate: (value) => {
                const val = parseFloat(value);
                if (isNaN(val) || val <= 0) {
                    return " Le montant doit être un nombre supérieur à 0.";
                }
                return true; // Validation OK
            },
        },
    ]);

    // Met à jour la dépense si le nom n'est pas vide
    dep.nom = nom.trim() !== "" ? nom : dep.nom;
    // Convertit le montant en nombre flottant
    dep.montant = parseFloat(montant);

    // Sauvegarde les dépenses mises à jour
    savedepense(depenses);

    // Utilisation de node-notifier pour afficher une notification
    const notifier = require("node-notifier");
    notifier.notify({
        title: "success",
        message: "Modification effectuée",
        icon: "img/icon.jpg"
    });

    // Confirme l'utilisateur que la modification a réussi
    console.log("\n Dépense modifiée avec succès !\n");

    // Retourne au menu principal des groupes
    return await afficherGroupes(user);
}