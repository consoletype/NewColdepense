// Import des dépendances
import inquirer from "inquirer"; // Pour les interfaces CLI interactives
import chalk from "chalk"; // Pour le texte coloré dans la console
import { loadData, saveData } from "../depenseManager"; // Fonctions de gestion des données
import { Payer, Utilisateur } from "../model"; // Types de données

/**
 * Menu principal pour gérer les paiements
 * @param utilisateur - L'utilisateur connecté
 */
export async function menuPaiements(utilisateur: Utilisateur) {
    const data = loadData(); // Chargement des données

    // Trouver les groupes où l'utilisateur est membre ou chef
    const groupes = data.groups.filter(
        (g) =>
            g.membreId?.includes(utilisateur.id) ||
            g.chefDeGroupe === utilisateur.id
    );

    // Vérification si l'utilisateur appartient à des groupes
    if (groupes.length === 0) {
        console.log(chalk.yellow("Vous ne faites partie d'aucun groupe."));
        return;
    }

    // Filtrer les dépenses des groupes concernés
    const depenses = data.depenses.filter((d) =>
        groupes.some((g) => g.chefDeGroupe === d.chefDeGroupe)
    );

    // Vérification s'il existe des dépenses
    if (depenses.length === 0) {
        console.log(chalk.yellow("Aucune dépense disponible pour paiement."));
        return;
    }

    // Prompt pour sélectionner une dépense
    const { depenseId } = await inquirer.prompt([
        {
            type: "list",
            name: "depenseId",
            message: "Sélectionnez une dépense à payer:",
            choices: depenses.map((d) => ({
                name: `${d.nom} - ${d.montant} FCFA (${new Date(
                    d.date
                ).toLocaleDateString()})`, // Formatage d'affichage
                value: d.id,
            })),
        },
    ]);

    // Traitement du paiement
    await processPaiement(depenseId, utilisateur.id);
}

/**
 * Traite un paiement pour une dépense spécifique
 * @param depenseId - ID de la dépense
 * @param membreId - ID du membre effectuant le paiement
 */
async function processPaiement(depenseId: number, membreId: number) {
    const data = loadData();
    const depense = data.depenses.find((d) => d.id === depenseId);

    // Vérification de l'existence de la dépense
    if (!depense) {
        console.log(chalk.red("Dépense non trouvée."));
        return;
    }

    // Vérification que l'utilisateur est concerné par la dépense
    if (depense.membreId && !depense.membreId.includes(membreId)) {
        console.log(chalk.red("Vous n'êtes pas concerné par cette dépense."));
        return;
    }

    // Calcul de la part de chacun
    const nbParticipants = depense.membreId?.length || 1;
    const part = depense.montant / nbParticipants;

    // Calcul des paiements déjà effectués
    const paiements = data.Payer.filter(
        (p) => p.depenseId === depense.id && p.membreId === membreId
    );
    const totalPaye = paiements.reduce((sum, p) => sum + p.sold, 0);
    const resteAPayer = part - totalPaye;

    // Vérification si le paiement est complet
    if (resteAPayer <= 0) {
        console.log(
            chalk.green("Vous avez déjà payé votre part pour cette dépense.")
        );
        const notifier = require("node-notifier");
        notifier.notify({
            title : 'Erreur',
            message : "Deja payé",
            icon : "img/icon.jpg",
        })
        return;
    }

    // Affichage des détails de la dépense
    console.log(chalk.blue(`\nDépense: ${depense.nom}`));
    console.log(chalk.blue(`Montant total: ${depense.montant} FCFA`));
    console.log(chalk.blue(`Votre part: ${part.toFixed(2)} FCFA`));
    console.log(chalk.blue(`Déjà payé: ${totalPaye.toFixed(2)} FCFA`));
    console.log(chalk.blue(`Reste à payer: ${resteAPayer.toFixed(2)} FCFA`));

    // Prompt pour les détails du paiement
    const { montant, methode } = await inquirer.prompt([
        {
            type: "number",
            name: "montant",
            message: "Montant à payer:",
            validate: (input: unknown) => {
                const amount = Number(input);
                if (isNaN(amount)) return "Veuillez entrer un nombre valide";
                if (amount <= 0) return "Le montant doit être positif";
                if (amount > resteAPayer)
                    return `Le montant ne peut pas dépasser ${resteAPayer.toFixed(
                        2
                    )}`;
                return true;
            },
            filter: (input: unknown) => Number(input), // Conversion en nombre
        },
        {
            type: "list",
            name: "methode",
            message: "Méthode de paiement:",
            choices: [
                { name: "Espèces", value: "espèces" },
                { name: "Mobile Money", value: "mobile_money" },
                { name: "Carte bancaire", value: "carte_bancaire" },
            ],
        },
    ]);

    // Création du nouveau paiement
    const nouveauPaiement: Payer = {
        id: Date.now(), // ID unique basé sur le timestamp
        date: new Date(), // Date actuelle
        sold: montant,
        membreId,
        depenseId,
        statut: "validé",
        methode,
    };

    // Sauvegarde des données
    data.Payer.push(nouveauPaiement);
    saveData(data);

    // Confirmation du paiement
    console.log(
        chalk.green(`\n Paiement de ${montant} FCFA enregistré avec succès!`)
    );
    console.log(chalk.green(`Méthode: ${methode}`));
    console.log(chalk.green(`Date: ${nouveauPaiement.date.toLocaleString()}`));
}

/**
 * Affiche l'historique des paiements d'un utilisateur
 * @param utilisateurId - ID de l'utilisateur
 */
export function afficherPaiementsUtilisateur(utilisateurId: number) {
    const data = loadData();
    const paiements = data.Payer.filter((p) => p.membreId === utilisateurId);

    // Vérification s'il y a des paiements
    if (paiements.length === 0) {
        console.log(chalk.yellow("Aucun paiement enregistré."));
        return;
    }

    console.log(chalk.blue("\n=== VOS PAIEMENTS ==="));

    // Affichage de chaque paiement
    paiements.forEach((p) => {
        const depense = data.depenses.find((d) => d.id === p.depenseId);
        console.log(chalk.blue(`\nDépense: ${depense?.nom || "Inconnue"}`));
        console.log(`Montant: ${p.sold} FCFA`);
        console.log(`Date: ${p.date.toLocaleDateString()}`);
        console.log(`Méthode: ${p.methode || "Non spécifiée"}`);
        console.log(`Statut: ${p.statut}`);
    });
}

/**
 * Permet au chef de groupe de valider les paiements
 * @param chefDeGroupeId - ID du chef de groupe
 */
export function validerPaiements(chefDeGroupeId: number) {
    const data = loadData();

    // Trouver les groupes gérés par ce chef
    const groupes = data.groups.filter(
        (g) => g.chefDeGroupe === chefDeGroupeId
    );
    
    // Trouver les dépenses de ces groupes
    const depenses = data.depenses.filter((d) =>
        groupes.some((g) => g.chefDeGroupe === d.chefDeGroupe)
    );

    // Filtrer les paiements en attente
    const paiementsEnAttente = data.Payer.filter(
        (p) =>
            depenses.some((d) => d.id === p.depenseId) &&
            p.statut === "en_attente"
    );

    // Vérification s'il y a des paiements à valider
    if (paiementsEnAttente.length === 0) {
        console.log(chalk.yellow("Aucun paiement en attente de validation."));
        return;
    }

    console.log(chalk.blue("\n=== PAIEMENTS EN ATTENTE ==="));

    // Affichage des paiements en attente
    paiementsEnAttente.forEach((p) => {
        const depense = data.depenses.find((d) => d.id === p.depenseId);
        const membre = data.users.find((u) => u.id === p.membreId);

        console.log(chalk.blue(`\nDépense: ${depense?.nom || "Inconnue"}`));
        console.log(`Membre: ${membre?.prenom} ${membre?.nom}`);
        console.log(`Montant: ${p.sold} FCFA`);
        console.log(`Date: ${p.date.toLocaleDateString()}`);
        console.log(`Méthode: ${p.methode || "Non spécifiée"}`);
    });

    // Menu de validation
    inquirer
        .prompt([
            {
                type: "list",
                name: "action",
                message: "Que voulez-vous faire?",
                choices: [
                    { name: "Valider un paiement", value: "valider" },
                    { name: "Refuser un paiement", value: "refuser" },
                    { name: "Retour", value: "retour" },
                ],
            },
        ])
        .then((answer) => {
            if (answer.action === "retour") return;

            // Sélection du paiement à traiter
            inquirer
                .prompt([
                    {
                        type: "list",
                        name: "paiementId",
                        message: "Sélectionnez un paiement:",
                        choices: paiementsEnAttente.map((p) => {
                            const depense = data.depenses.find(
                                (d) => d.id === p.depenseId
                            );
                            const membre = data.users.find(
                                (u) => u.id === p.membreId
                            );
                            return {
                                name: `${depense?.nom} - ${membre?.prenom} ${membre?.nom} - ${p.sold} FCFA`,
                                value: p.id,
                            };
                        }),
                    },
                ])
                .then(async (selection) => {
                    const paiement = data.Payer.find(
                        (p) => p.id === selection.paiementId
                    );
                    if (!paiement) return;

                    // Traitement selon l'action choisie
                    if (answer.action === "valider") {
                        paiement.statut = "validé";
                        console.log(
                            chalk.green("Paiement validé avec succès!")
                        );
                        const notifier = require("node-notifier");
                        notifier.notify({
                            title : "succes",
                            message : "Paiement validé",
                            icon : "img/icon.jpg",

                        });
                    } else {
                        paiement.statut = "refusé";
                        console.log(chalk.yellow("Paiement refusé."));
                    }

                    saveData(data); // Sauvegarde des modifications

                    // Demande pour continuer
                    const { continuer } = await inquirer.prompt([
                        {
                            type: "confirm",
                            name: "continuer",
                            message: "Voulez-vous traiter un autre paiement?",
                            default: true,
                        },
                    ]);

                    if (continuer) {
                        validerPaiements(chefDeGroupeId); // Rappel récursif
                    }
                });
        });
}