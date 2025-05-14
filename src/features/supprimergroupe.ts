import { Groupe } from "../model";
import { loadGroupe, savegroupe } from "../depenseManager";
import inquirer from "inquirer";

export async function deleteGroup(groupe: Groupe) {
    const { groupes }: { groupes: Groupe[] } = loadGroupe();

    const { confirm } = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirm",
            message: `Voulez-vous vraiment supprimer le groupe "${groupe.nom}" ?`,
        },
    ]);
    if (confirm) {
        const newGroupes = groupes.filter((g) => g.id !== groupe.id);
        savegroupe(newGroupes);
        const notifier = require("node-notifier");
        notifier.notify({
            title : "success",
            message : "Groupe supprimer",
            icon : "img/icon.jpeg"
        });
        console.log("groupe supprimé !");
        return true;
    }
}
