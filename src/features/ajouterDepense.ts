// Import des dépendances
import inquirer from "inquirer"; // Pour les prompts interactifs
import { Depense, Groupe, Utilisateur } from "../model"; // Types de données
import { loadDepense, loadGroupe, loadUser, savedepense } from "../depenseManager"; // Fonctions de gestion
import chalk from "chalk"; // Pour le texte coloré
import boxen from "boxen"; // Pour encadrer les messages

// Fonction principale pour ajouter une dépense
export async function ajouterDepense(user: Utilisateur, groupeIdParam?: number) {
    // Chargement des données
    const groupes: Groupe[] = loadGroupe().groupes; 
    const depenses: Depense[] = loadDepense().depenses; 
    const users: Utilisateur[] = loadUser().users; 

    // Filtrage des groupes où l'utilisateur est membre ou chef
    const mesGroupes = groupes.filter(
        (g) => g.chefDeGroupe === user.id || g.membreId?.includes(user.id) 
    );

    // Vérification si l'utilisateur appartient à des groupes
    if (mesGroupes.length === 0) {
        console.log(chalk.red(" Vous n'êtes membre d'aucun groupe."));
        return;
    }

    // Gestion du paramètre optionnel groupeId
    let groupeId: number | undefined = groupeIdParam;

    // Si aucun groupe n'est spécifié en paramètre
    if (!groupeId) {
        // Prompt pour choisir un groupe
        const { groupeId: selectedGroupeId } = await inquirer.prompt([
            {
                type: "list",
                name: "groupeId",
                message: chalk.cyan("Dans quel groupe voulez-vous ajouter une dépense ?"),
                choices: [
                    ...mesGroupes.map((g) => ({ name: g.nom, value: g.id })),
                    { name: chalk.yellow(" Retour au menu"), value: "retour" }, // Option de retour
                ],
            },
        ]);
        
        // Gestion du retour au menu
        if (selectedGroupeId === "retour") {
            console.log(chalk.yellow(" Retour au menu principal..."));
            return;
        }
        groupeId = selectedGroupeId;
    }

    // Vérification de l'existence du groupe
    const groupe = groupes.find((g) => g.id === groupeId!);
    if (!groupe) {
        console.log(chalk.red(" Groupe introuvable."));
        return;
    }

    // Prompt pour les détails de la dépense
    const { nom, montant } = await inquirer.prompt([
        {
            type: "input",
            name: "nom",
            message: chalk.green("Nom de la dépense :"),
            validate: (input) => input.trim() !== "" || "Le nom ne peut pas être vide.",
        },
        {
            type: "number",
            name: "montant",
            message: chalk.green("Montant de la dépense :"),
            validate: (value) => {
                const num = Number(value);
                return num > 0 || "Le montant doit être supérieur à 0.";
            },
        },
    ]);

    // Filtrage des membres du groupe
    const membres = users.filter((u) => groupe.membreId?.includes(u.id));

    // Sélection des membres concernés
    const { membresConcerne } = await inquirer.prompt([
        {
            type: "checkbox",
            name: "membresConcerne",
            message: chalk.cyan("Quels membres sont concernés par cette dépense ?"),
            choices: membres.map((m) => ({
                name: `${m.prenom} (${m.telephone})`, // Affichage formaté
                value: m.id,
            })),
            validate: (selected) =>
                selected.length > 0 || "Veuillez sélectionner au moins un membre.",
        },
    ]);

    // Création de la nouvelle dépense
    const nouvelleDepense: Depense = {
        id: Date.now(), // ID basé sur le timestamp
        nom,
        montant: Number(montant),
        date: new Date(), // Date actuelle
        chefDeGroupe: user.id,
        groupeId: groupeId!,
        membreId: membresConcerne,
    };

    // Sauvegarde de la dépense
    depenses.push(nouvelleDepense);
    savedepense(depenses);

    // Notification système
    const notifier = require("node-notifier");
    notifier.notify({
        title: "success",
        message: "Depense Ajoutée avec success",
        icon: "img/icon.jpg"
    });

    // Confirmation visuelle
    console.log(
        boxen(chalk.green(" Dépense ajoutée avec succès !"), {
            padding: 1,
            margin: 1,
            borderColor: "green",
            borderStyle: "double",
        })
    );
}