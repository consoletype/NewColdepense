// Import des dépendances nécessaires
import { Groupe } from "../model"; // Type Groupe
import { loadGroupe, savegroupe, loadUser } from "../depenseManager"; // Fonctions de gestion
import inquirer from "inquirer"; // Pour les interactions en CLI
import nodemailer from "nodemailer"; // Pour l'envoi d'emails

// Fonction principale pour ajouter un membre à un groupe
export async function ajouterMembreAuGroupe(groupe: Groupe) {
    // Chargement de la liste des utilisateurs
    const { users } = loadUser();

    // Vérification s'il y a des utilisateurs disponibles
    if (!users || users.length === 0) {
        console.log("\nAucun utilisateur trouvé.\n");
        return;
    }

    // Affichage de la liste des utilisateurs disponibles
    console.log(`\n Utilisateurs disponibles pour le groupe "${groupe.nom}" :\n`);
    users.forEach((user, index) => {
        console.log(`🔹 ${index + 1}. ${user.nom} ${user.prenom} | 📞 ${user.telephone}`);
    });

    // Prompt pour sélectionner un utilisateur par son numéro de téléphone
    const { telephone } = await inquirer.prompt([
        {
            type: "input",
            name: "telephone",
            message: "Entrez le numéro de téléphone de l'utilisateur à ajouter :",
            validate: (input: string) => {
                const user = users.find((u) => u.telephone === input);
                if (!user) return "Numéro introuvable.";
                if (user.id === groupe.id) return "Vous êtes déjà chef du groupe.";
                return true;
            },
        },
    ]);

    // Recherche de l'utilisateur sélectionné
    const utilisateurChoisi = users.find((user) => user.telephone === telephone);

    // Vérification si l'utilisateur existe
    if (!utilisateurChoisi) {
        console.log("\nUtilisateur introuvable.");
        return;
    }

    // Initialisation du tableau des membres si vide
    if (!groupe.membreId) groupe.membreId = [];

    // Vérification si l'utilisateur n'est pas déjà membre
    if (!groupe.membreId.includes(utilisateurChoisi.id)) {
        // Ajout de l'utilisateur au groupe
        groupe.membreId.push(utilisateurChoisi.id);
        console.log(`\n${utilisateurChoisi.nom} ${utilisateurChoisi.prenom} a été ajouté au groupe "${groupe.nom}".`);

        //  Notification système locale
        const notifier = require("node-notifier");
        notifier.notify({
            title: "Succès",
            message: "Membre ajouté avec succès",
            icon: "img/icon.jpg",
        });

        //  Configuration et envoi d'email de notification
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", // Serveur SMTP de Gmail
            port: 587, // Port standard pour SMTP
            secure: false, // Connection non sécurisée (STARTTLS)
            auth: {
                user: "assimtrap@gmail.com", // À remplacer par variables d'environnement
                pass: "sifg hvri yqlb xrco", // À sécuriser absolument!
            },
        });

        // Envoi de l'email
        await transporter.sendMail({
            from: '"Groupe Dépense Collective" <assimtrap@gmail.com>',
            to: utilisateurChoisi.email,
            subject: "Ajout au groupe",
            text: `Bonjour ${utilisateurChoisi.nom},\n\nVous avez été ajouté au groupe "${groupe.nom}".`,
        });

    } else {
        // Message si l'utilisateur est déjà membre
        console.log("\nL'utilisateur est déjà membre de ce groupe.");
    }

    //  Sauvegarde des modifications dans la base de données
    const { groupes } = loadGroupe();
    const index = groupes.findIndex((g) => g.id === groupe.id);
    if (index !== -1) {
        groupes[index] = groupe;
        savegroupe(groupes); // Persistance des données
    }
}