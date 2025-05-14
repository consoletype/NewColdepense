import { Groupe, Utilisateur } from "../model";
import { loadGroupe, savegroupe, loadUser } from "../depenseManager";
import inquirer from "inquirer";

export async function supprimerMembreDuGroupe(groupe: Groupe) {
    const { users } = loadUser();

    if (!groupe.membreId || groupe.membreId.length === 0) {
        console.log("\n Aucun membre à supprimer.\n");
        return;
    }

    // Filtre les membres du groupe
    const membres = users.filter(u => groupe.membreId?.includes(u.id));

    if (membres.length === 0) {
        console.log("\n Aucun membre trouvé dans ce groupe.\n");
        return;
    }

    // Affiche les membres du groupe dans une liste
    console.log(`\n **Membres du groupe "${groupe.nom}"** :\n`);
    membres.forEach((membre, index) => {
        console.log(` ${index + 1}. **${membre.nom} ${membre.prenom}** | 📞 ${membre.telephone}`);
    });

    // Demande à l'utilisateur de sélectionner un membre à supprimer
    const { membreASupprimer } = await inquirer.prompt([
        {
            type: "list",
            name: "membreASupprimer",
            message: "Sélectionnez le membre à supprimer :",
            choices: membres.map(m => ({
                name: `${m.nom} ${m.prenom} | 📞 ${m.telephone}`,
                value: m.id,
            })),
        }
    ]);

    // Supprime le membre du groupe
    groupe.membreId = groupe.membreId.filter(id => id !== membreASupprimer);

    const notifier = require("node-notifier");
    notifier.notify({
        title : "success",
        message : "Suppression effectuée",
        icon : "img/icon.jpeg"
    });

    // Confirmation de la suppression
    console.log(`\n **${membres.find(m => m.id === membreASupprimer)?.nom}** a été supprimé du groupe "${groupe.nom}".`);

    // Sauvegarde les modifications dans le groupe
    const { groupes } = loadGroupe();
    const index = groupes.findIndex(g => g.id === groupe.id);
    if (index !== -1) {
        groupes[index] = groupe;
        savegroupe(groupes);
    }
}
