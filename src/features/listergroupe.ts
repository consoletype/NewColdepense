




import { Groupe, Payer, Utilisateur } from "../model";
import { loadGroupe, loadData, loadDepense, saveData } from "../depenseManager";
import inquirer from "inquirer";
import chalk from "chalk";
import boxen from "boxen";
import figlet from "figlet";


import { deleteGroup } from "./supprimergroupe";
import { ajouterMembreAuGroupe } from "./ajoutMembre";
import { afficherMembresDuGroupe } from "./Affichermenbre";
import { supprimerMembreDuGroupe } from "./supprimermembre";
import { modifierGroupe } from "./modifierGroupes";
import { menuPaiements } from "./paiementManager";
import { afficherRapportHebdomadaire, genererRapportHebdomadaire } from "./rapport";
import { calculerSoldeDepense } from "./calculerSolde";
import { supprimerDepense } from "./supprimerDepense";
import { modifierDepense } from "./modifierDepense";
import { ajouterDepense } from "./ajouterDepense";
import { quitterGroupe } from "./quitterGroupe";
import { paymentHystorique } from "./historitquespaiements";


export async function afficherGroupes(user: Utilisateur) {
    let continuer = true;


    while (continuer) {
        const { groupes } = loadGroupe();
        const mesGroupes = groupes.filter(g => g.chefDeGroupe === user.id);
        const groupesRejoints = groupes.filter(g => g.membreId?.includes(user.id) && g.chefDeGroupe !== user.id);


        console.clear();
        console.log(
            chalk.cyan(
                figlet.textSync("Mes Groupes", { horizontalLayout: "default" })
            )
        );


        if (mesGroupes.length === 0 && groupesRejoints.length === 0) {
            console.log(
                boxen(chalk.red.bold(" Vous n'êtes membre d'aucun groupe."), {
                    padding: 1,
                    borderColor: "red",
                    borderStyle: "round",
                })
            );
            await new Promise(resolve => setTimeout(resolve, 2000));
            return;
        }


        const choixGroupes = [
            ...(mesGroupes.length > 0 ? [
                new inquirer.Separator(chalk.green('🛠️ MES GROUPES (CRÉATEUR)')),
                ...mesGroupes.map(g => ({
                    name: `${chalk.bold.green(g.nom)} - ${chalk.gray(g.description)} ${chalk.blue('(Créateur)')}`,
                    value: g.id
                }))
            ] : []),
            ...(groupesRejoints.length > 0 ? [
                new inquirer.Separator(chalk.blue('👥 GROUPES REJOINTS')),
                ...groupesRejoints.map(g => ({
                    name: `${chalk.blue(g.nom)} - ${chalk.gray(g.description)}`,
                    value: g.id
                }))
            ] : []),
            new inquirer.Separator(),
            { name: chalk.gray(" Retour au menu principal"), value: "retour" }
        ];


        const { groupeChoisi } = await inquirer.prompt([
            {
                type: "list",
                name: "groupeChoisi",
                message: chalk.yellow.bold(" Sélectionnez un groupe :"),
                choices: choixGroupes,
                pageSize: 10
            }
        ]);


        if (groupeChoisi === "retour") {
            continuer = false;
            return;
        }


        await menuGroupe(user, groupeChoisi);
    }
}


async function menuGroupe(user: Utilisateur, groupeId: number) {
    let dansLeMenu = true;
    const { groupes } = loadGroupe();
    const groupeSelectionne = groupes.find(g => g.id === groupeId);
   
    if (!groupeSelectionne) {
        console.log(chalk.red(" Groupe introuvable."));
        return;
    }


    const estCreateur = groupeSelectionne.chefDeGroupe === user.id;
    const estMembreRejoint = groupeSelectionne.membreId?.includes(user.id) && !estCreateur;


    while (dansLeMenu) {
        console.clear();
        console.log(
            boxen(
                chalk.bold.cyan(`${groupeSelectionne.nom.toUpperCase()}`) +
                chalk.gray(`\n${groupeSelectionne.description}\n`) +
                chalk.blue(`Créé par: ${loadData().users.find(u => u.id === groupeSelectionne.chefDeGroupe)?.nom || 'Inconnu'}`),
                { padding: 1, borderColor: 'cyan', borderStyle: 'round' }
            )
        );


        // Options de base pour tous les membres
        const optionsCommunes = [
            // Section Dépenses
            new inquirer.Separator(chalk.cyan(' GESTION DES DÉPENSES')),
            { name: " Lister les dépenses", value: "listerDepenses" },


            // Section Finances
            new inquirer.Separator(chalk.cyan(' FINANCES')),
            { name: " Mon solde personnel", value: "monSoldePerso" },
            { name: " Effectuer un paiement", value: "effectuerPaiement" },
            { name: " Historiques des paiements", value: "HistoriquePaiement" },


            // Section Membres
            new inquirer.Separator(chalk.cyan(' MEMBRES')),
            { name: " Voir les membres", value: "voirMembres" },
            { name: " Quitergroupe", value: "quitergroupe" },
        ];


        // Options réservées au créateur
        const optionsCreateur = [
            // Options dépenses supplémentaires
            { name: " Ajouter une dépense", value: "ajouterDepense" },
            { name: " Modifier mes dépenses", value: "modifierDepense" },
            { name: " Supprimer une dépense", value: "supprimerDepense" },


            // Options finances supplémentaires
            { name: " Générer un rapport complet", value: "afficherRapport" },
            { name: " Historiques des paiements", value: "HistoriquePaiement" },


            // Options membres supplémentaires
            { name: " Ajouter des membres", value: "ajouterMembres" },
            { name: " Supprimer un membre", value: "supprimerMembre" },


            // Options gestion groupe
            new inquirer.Separator(chalk.cyan(' GESTION DU GROUPE')),
            { name: " Modifier le groupe", value: "modifierGroupe" },
            { name: " Supprimer le groupe", value: "supprimerGroupe" },
            { name: " Quiter le groupe", value: "quitterGroupe" },
        ];


        // Option pour quitter le groupe (uniquement membres rejoints)
        const optionQuitter = estMembreRejoint
            ? [{ name: "🚪 Quitter le groupe", value: "quitterGroupe" }]
            : [];


        const { action } = await inquirer.prompt([
            {
                type: "rawlist",
                name: "action",
                message: chalk.yellow.bold(" Que voulez-vous faire ?"),
                choices: [
                    ...optionsCommunes,
                    ...(estCreateur ? optionsCreateur : []),
                    ...optionQuitter,
                    new inquirer.Separator(),
                    { name: " Retour à la liste des groupes", value: "retour" }
                ],
               
            }
        ]);


        switch (action) {
            case "ajouterDepense":
                await ajouterDepense(user, groupeId);
                break;


            case "listerDepenses":
                await afficherDepenses(groupeId, user, estCreateur);
                break;
            case "HistoriquePaiement":
                const {depenses} = loadDepense()
                const depense = depenses.find((g)=> g.groupeId === groupeId)
                if (depense) {
                    
                    await paymentHystorique(depense.id);
                }
                break;


            case "modifierDepense":
                await modifierDepense(user, groupeId);
                break;


            case "supprimerDepense":
                if (estCreateur) {
                    await supprimerDepense(user, groupeId);
                }
                break;


            case "monSoldePerso":
                await afficherMonSoldePerso(user.id, groupeId);
                break;


         


            case "effectuerPaiement":
                await menuPaiements(user);
                break;


            case "voirMembres":
                await afficherMembresDuGroupe(groupeSelectionne);
                break;


            case "ajouterMembres":
                if (estCreateur) {
                    await ajouterMembreAuGroupe(groupeSelectionne);
                }
                break;


            case "supprimerMembre":
                if (estCreateur) {
                    await supprimerMembreDuGroupe(groupeSelectionne);
                }
                break;


            case "afficherRapport":
                if (estCreateur) {
                    const rapport = genererRapportHebdomadaire(groupeId); // Utilisez groupeId au lieu de groupeChoisi
                    if (rapport) {
                       afficherRapportHebdomadaire(rapport);
                      await afficherRapportHebdomadaire(rapport, {
                          pdf: "rapport_hebdomadaire.pdf",
                     });
                     }
                }
                break;


            case "modifierGroupe":
                if (estCreateur) {
                    await modifierGroupe(groupeSelectionne);
                }
                break;


            case "supprimerGroupe":
                if (estCreateur) {
                    await handleSupprimerGroupe(groupeSelectionne);
                    dansLeMenu = false;
                }
                break;


            case "quitterGroupe":
                if (estMembreRejoint) {
                    await handleQuitterGroupe(user, groupeId);
                    dansLeMenu = false;
                }else{
                    await handleQuitterGroupe(user, groupeId);
                    dansLeMenu = false;
                }
                break;


            case "retour":
                dansLeMenu = false;
                break;
        }


        if (dansLeMenu && action !== "retour") {
            await inquirer.prompt([
                {
                    type: "input",
                    name: "continuer",
                    message: chalk.gray("Appuyez sur Entrée pour continuer..."),
                },
            ]);
        }
    }
}














// Fonction pour générer un ID unique
function generateId(): number {
    return Math.floor(Math.random() * 1000000);
}






// ✅ Fonction pour afficher le solde personnel
// Fonction pour afficher le solde personnel (pour tous les membres)
async function afficherMonSoldePerso(userId: number, groupeId: number) {
    const data = loadData();
    const groupe = data.groups.find((g: any) => g.id === groupeId);
   
    if (!groupe) {
        console.log(chalk.red(" Groupe introuvable."));
        return;
    }


    const utilisateur = data.users.find((u: any) => u.id === userId);
    if (!utilisateur) {
        console.log(chalk.red(" Utilisateur introuvable."));
        return;
    }


    const depensesGroupe = data.depenses.filter((d: any) => d.groupeId === groupeId);
    if (depensesGroupe.length === 0) {
        console.log(chalk.yellow(" Aucune dépense enregistrée dans ce groupe."));
        return;
    }


    let totalPaye = 0;
    let totalDu = 0;


    // Calcul des paiements effectués
    const paiementsMembre = data.Payer.filter((p: Payer) =>
        p.membreId === userId &&
        depensesGroupe.some((d: any) => d.id === p.depenseId)
    );
    totalPaye = paiementsMembre.reduce((sum: number, p: Payer) => sum + p.sold, 0);


    // Calcul des parts dues
    depensesGroupe.forEach((depense: any) => {
        if (depense.membreId.includes(userId)) {
            const partIndividuelle = depense.montant / depense.membreId.length;
            totalDu += partIndividuelle;
        }
    });


    const balance = totalPaye - totalDu;


    // Affichage détaillé
    console.log(chalk.blue.bold("\n VOTRE SOLDE PERSONNEL"));
    console.log(chalk.gray("════════════════════════════════════"));
    console.log(` Membre: ${chalk.yellow(utilisateur.nom)} (${chalk.blue(utilisateur.email)})`);
    console.log(` Groupe: ${chalk.cyan(groupe.nom)}`);
    console.log(chalk.gray("────────────────────────────────────────"));
    console.log(` Total payé: ${chalk.green(totalPaye + " FCFA")}`);
    console.log(` Total dû: ${chalk.red(totalDu + " FCFA")}`);
    console.log(chalk.gray("────────────────────────────────────────"));
   
    const soldeColor = balance >= 0 ? chalk.green : chalk.red;
    console.log(` Votre solde: ${soldeColor(balance + " FCFA")}`);
   
    if (balance > 0) {
        console.log(chalk.green("\n Vous êtes en crédit dans ce groupe"));
    } else if (balance < 0) {
        console.log(chalk.red("\n Vous devez de l'argent dans ce groupe"));
       
        // Proposer un paiement si l'utilisateur a une dette
        const { payer } = await inquirer.prompt([
            {
                type: "confirm",
                name: "payer",
                message: "Voulez-vous effectuer un paiement maintenant ?",
                default: false
            }
        ]);
       
        if (payer) {
            await menuPaiements(utilisateur);
        }
    } else {
        console.log(chalk.blue("\n Votre solde est à zéro"));
    }
}


//  Fonction pour payer tout ce qu'on doit
async function payerCeQueJeDois(userId: number, groupeId: number, methode: "espèces" | "mobile_money" | "carte_bancaire" = "espèces") {
    const data = loadData();
    const groupe = data.groups.find((g: any) => g.id === groupeId);
    if (!groupe) {
        console.log(chalk.red(" Groupe introuvable."));
        return;
    }


    const utilisateur = data.users.find((u: any) => u.id === userId);
    if (!utilisateur) {
        console.log(chalk.red(" Utilisateur introuvable."));
        return;
    }


    const depensesGroupe = data.depenses.filter((d: any) => d.groupeId === groupeId);
    if (depensesGroupe.length === 0) {
        console.log(chalk.yellow(" Aucune dépense enregistrée dans ce groupe."));
        return;
    }


    let totalPaye = 0;
    let totalDu = 0;


    const paiementsMembre = data.Payer.filter((p: Payer) =>
        p.membreId === userId &&
        depensesGroupe.some((d: any) => d.id === p.depenseId)
    );
    totalPaye = paiementsMembre.reduce((sum: number, p: Payer) => sum + p.sold, 0);


    depensesGroupe.forEach((depense: any) => {
        if (depense.membreId.includes(userId)) {
            const partIndividuelle = depense.montant / depense.membreId.length;
            totalDu += partIndividuelle;
        }
    });


    const montantDu = totalDu - totalPaye;


    if (montantDu <= 0) {
        console.log(chalk.green("\n Vous n’avez rien à payer. Votre solde est déjà à jour."));
        return;
    }


    // Paiement pour chaque dépense
    depensesGroupe.forEach((depense: any) => {
        if (depense.membreId.includes(userId)) {
            const partIndividuelle = depense.montant / depense.membreId.length;


            const dejaPaye = paiementsMembre
                .filter((p: Payer) => p.depenseId === depense.id)
                .reduce((sum: number, p: Payer) => sum + p.sold, 0);


            const resteAPayer = partIndividuelle - dejaPaye;


            if (resteAPayer > 0) {
                const paiement: Payer = {
                    id: generateId(),
                    date: new Date(),
                    sold: resteAPayer,
                    membreId: userId,
                    depenseId: depense.id,
                    statut: "validé",
                    methode: methode
                };
                data.Payer.push(paiement);
                console.log(chalk.green(` Paiement de ${resteAPayer} FCFA validé pour dépense ID: ${depense.id}`));
            }
        }
    });


    saveData(data);
    console.log(chalk.blue.bold(`\n Tous vos paiements ont été enregistrés. Vous êtes maintenant à jour !`));
}


//  Fonction pour payer un montant partiel
async function payerPartiellement(userId: number, groupeId: number, montantPaye: number, methode: "espèces" | "mobile_money" | "carte_bancaire" = "espèces") {
    const data = loadData();
    const groupe = data.groups.find((g: any) => g.id === groupeId);
    if (!groupe) {
        console.log(chalk.red(" Groupe introuvable."));
        return;
    }


    const utilisateur = data.users.find((u: any) => u.id === userId);
    if (!utilisateur) {
        console.log(chalk.red(" Utilisateur introuvable."));
        return;
    }


    const depensesGroupe = data.depenses.filter((d: any) => d.groupeId === groupeId);
    if (depensesGroupe.length === 0) {
        console.log(chalk.yellow(" Aucune dépense enregistrée dans ce groupe."));
        return;
    }


    let totalPaye = 0;
    let totalDu = 0;


    const paiementsMembre = data.Payer.filter((p: Payer) =>
        p.membreId === userId &&
        depensesGroupe.some((d: any) => d.id === p.depenseId)
    );
    totalPaye = paiementsMembre.reduce((sum: number, p: Payer) => sum + p.sold, 0);


    depensesGroupe.forEach((depense: any) => {
        if (depense.membreId.includes(userId)) {
            const partIndividuelle = depense.montant / depense.membreId.length;
            totalDu += partIndividuelle;
        }
    });


    const montantDu = totalDu - totalPaye;


    if (montantDu <= 0) {
        console.log(chalk.green("\n Vous n’avez rien à payer. Votre solde est déjà à jour."));
        return;
    }


    if (montantPaye > montantDu) {
        console.log(chalk.red(` Vous essayez de payer plus que ce que vous devez (${montantDu} FCFA)`));
        return;
    }


    let resteAPayer = montantPaye;


    // Paiement partiel réparti sur les dépenses
    for (const depense of depensesGroupe) {
        if (depense.membreId.includes(userId) && resteAPayer > 0) {
            const partIndividuelle = depense.montant / depense.membreId.length;


            const dejaPaye = paiementsMembre
                .filter((p: Payer) => p.depenseId === depense.id)
                .reduce((sum: number, p: Payer) => sum + p.sold, 0);


            const aPayerPourCetteDepense = Math.min(partIndividuelle - dejaPaye, resteAPayer);


            if (aPayerPourCetteDepense > 0) {
                const paiement: Payer = {
                    id: generateId(),
                    date: new Date(),
                    sold: aPayerPourCetteDepense,
                    membreId: userId,
                    depenseId: depense.id,
                    statut: "validé",
                    methode: methode
                };
                data.Payer.push(paiement);
                resteAPayer -= aPayerPourCetteDepense;


                console.log(chalk.green(` Paiement de ${aPayerPourCetteDepense} FCFA validé pour dépense ID: ${depense.id}`));
            }
        }
    }


    saveData(data);
    console.log(chalk.blue.bold(`\n Paiement partiel de ${montantPaye} FCFA enregistré avec succès.`));
}






async function afficherDepenses(groupeId: number, user: Utilisateur, estCreateur: boolean) {
    const { depenses } = loadDepense();
    const data = loadData();
   
    const depensesGroupe = depenses
        .filter(d => d.groupeId === groupeId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    console.log(chalk.green.bold("\n DÉPENSES DU GROUPE"));
    console.log(chalk.gray("════════════════════════════════════"));


    if (depensesGroupe.length === 0) {
        console.log(chalk.yellow(" Aucune dépense enregistrée dans ce groupe"));
        return;
    }


    const depensesAAfficher = estCreateur
        ? depensesGroupe
        : depensesGroupe.filter(d => d.membreId.includes(user.id));


    if (depensesAAfficher.length === 0) {
        console.log(chalk.yellow(" Vous n'avez pas encore créé de dépenses dans ce groupe"));
        return;
    }


    depensesAAfficher.forEach((d, index) => {
        const createur = data.users.find(u => u.id === d.chefDeGroupe);


        console.log(
            `${chalk.bold(`#${index + 1}`)} ${chalk.yellow(d.nom)}\n` +
            `   Montant: ${chalk.cyan(d.montant + " FCFA")}\n` +
            `   Date: ${chalk.magenta(new Date(d.date).toLocaleDateString())}\n` +
            `   Créateur: ${chalk.blue(createur?.id === user.id ? 'Vous' : createur?.nom || 'Inconnu')}\n` +
            chalk.gray("────────────────────────────────────────")
        );
    });
}


async function handleSupprimerGroupe(groupe: Groupe) {
    const { confirm } = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirm",
            message: chalk.red.bold(" Voulez-vous vraiment supprimer définitivement ce groupe ?"),
            default: false
        }
    ]);
   
    if (confirm) {
        await deleteGroup(groupe);
        console.log(chalk.green(" Groupe supprimé avec succès"));
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}


async function handleQuitterGroupe(user: Utilisateur, groupeId: number) {
    const { confirm } = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirm",
            message: chalk.yellow.bold(" Voulez-vous vraiment quitter ce groupe ?"),
            default: false
        }
    ]);
   
    if (confirm) {
        await quitterGroupe(user, groupeId);
        console.log(chalk.green(" Vous avez quitté le groupe avec succès"));
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

