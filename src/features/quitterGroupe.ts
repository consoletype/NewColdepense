import { Groupe, Utilisateur } from "../model";
import { loadGroupe, savegroupe, loadDepense, savedepense, loadData } from "../depenseManager";
import inquirer from "inquirer";
import chalk from "chalk";
import { deleteGroup } from "./supprimergroupe";


export async function quitterGroupe(user: Utilisateur, groupeId: number) {
    const { groupes } = loadGroupe();
    const groupe = groupes.find(g => g.id === groupeId);


    if (!groupe) {
        console.log(chalk.red("Groupe non trouvé."));
        return;
    }


    // Si l'utilisateur est le chef
    if (groupe.chefDeGroupe === user.id) {
        const { actionChef } = await inquirer.prompt([
            {
                type: "list",
                name: "actionChef",
                message: "Vous êtes le chef du groupe. Que souhaitez-vous faire ?",
                choices: [
                    { name: "Transférer la gestion à un autre membre", value: "transfer" },
                    { name: "Quitter sans transfert (vous quittez le groupe)", value: "quit" }
                ]
            }
        ]);


        if (actionChef === "transfer") {
            const membres = groupe.membreId?.filter(id => id !== user.id) || [];
            if (membres.length === 0) {
                console.log(chalk.red("Aucun autre membre pour transférer la gestion. Veuillez supprimer le groupe ou quitter."));
                return;
            }
            const { nouveauChefId } = await inquirer.prompt([
                {
                    type: "list",
                    name: "nouveauChefId",
                    message: "Sélectionnez un nouveau chef :",
                    choices: membres.map((id) => {
                        const u = loadData().users.find((u) => u.id === id);
                        return {
                            name: `${u ? u.nom : id} (${u ? u.email : "Email inconnu"})`,
                            value: id,
                        };
                    }),
                }
            ]);
            // Transférer la gestion
            groupe.chefDeGroupe = nouveauChefId;
            savegroupe(groupes);
            console.log(chalk.green("Gestion transférée avec succès. Vous quittez le groupe."));
        } else {
            // Quitter sans transfert
            console.log("Vous quittez le groupe sans transfert.");
        }
    }


    // Si l'utilisateur n'est pas un membre
    if (!groupe.membreId?.includes(user.id)) {
        console.log(chalk.red("Vous n'êtes pas un membre de ce groupe."));
        return;
    }


    // Confirmation pour quitter
    const { confirmer } = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirmer",
            message: `Voulez-vous vraiment quitter le groupe "${groupe.nom}" ?`,
            default: false,
        }
    ]);


    if (!confirmer) {
        console.log("Opération annulée.");
        return;
    }


    // Retirer l'utilisateur du groupe
    groupe.membreId = groupe.membreId?.filter(id => id !== user.id) || [];


    // Retirer l'utilisateur des dépenses associées
    const { depenses } = loadDepense();
    depenses.filter(d => d.groupeId === groupeId).forEach(d => {
        d.membreId = d.membreId?.filter(id => id !== user.id) || [];
    });


    // Enregistrer modifications
    savegroupe(groupes);
    savedepense(depenses);


    // Notification
    const notifier = require("node-notifier");
    notifier.notify({
        title: "Succès",
        message: "Vous avez quitté le groupe avec succès.",
        icon: "img/icon.jpeg",
    });


    console.log(chalk.bgGreenBright(`Vous avez quitté le groupe "${groupe.nom}".`));
}

