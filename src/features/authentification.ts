// Importation des modules et types nécessaires
import { Utilisateur } from "../model"; // Modèle utilisateur
import { loadUser } from "../depenseManager"; // Fonction pour charger les utilisateurs
import inquirer from "inquirer"; // Librairie pour interactions CLI
import { gestionCompte } from "./gererCompte"; // Fonction pour la gestion du compte
import { createGroupe } from "../features/createGroupe"; // Fonction pour créer un groupe
import { afficherGroupes } from "./listergroupe"; // Fonction pour afficher les groupes
import chalk from "chalk"; // Pour colorer le texte CLI
import ora from "ora"; // Animation de chargement
import figlet from "figlet"; // Texte ASCII stylisé
const notifier = require('node-notifier'); // Notification système

// Fonction d'authentification
export async function seconnecter() {
    // Nettoie la console pour une nouvelle session
    console.clear();

    // Affiche un titre stylisé avec figlet, en cyan
    console.log(
        chalk.cyan(
            figlet.textSync("Authentifiez-vous", { horizontalLayout: "full" })
        )
    );

    // Demande à l'utilisateur son numéro de téléphone et mot de passe
    const loginInfo = await inquirer.prompt([
        {
            type: "input", // Entrée clavier
            name: "telephone", // nom de la réponse
            message: chalk.green(" Votre numéro de téléphone :"), // message coloré
            // Validation : doit être 8 à 15 chiffres
            validate: (input) => /^\d{8,15}$/.test(input) ? true : "Numéro invalide (8-15 chiffres)",
        },
        {
            type: "password", // Saisie masquée
            name: "password",
            message: chalk.green(" Votre mot de passe :"),
            mask: "*", // affichage masqué
            // Validation : minimum 4 caractères
            validate: (input) => input.length >= 4 ? true : "Au moins 4 caractères",
        },
    ]);

    // Démarre une animation de chargement via ora
    const spinner = ora("Connexion en cours...").start();

    // Attente de 1.5 secondes pour simuler un chargement
    await new Promise((res) => setTimeout(res, 1500));

    // Charge la liste des utilisateurs
    const { users } = loadUser();

    // Recherche un utilisateur correspondant au téléphone et mot de passe saisis
    const user = users.find(
        (u) =>
            u.telephone === loginInfo.telephone &&
            u.password === loginInfo.password
    );

    // Arrête le spinner
    spinner.stop();

    // Si utilisateur trouvé, connecte, sinon erreur
    if (user) {
        // Affiche un message de succès avec mise en forme
        console.log(
            chalk.bold.green.underline(" Connexion réussie !\n")
        );

        // Envoie une notification système de bienvenue
        notifier.notify({ 
            title: 'Authentification', 
            message: 'Bienvenue sur votre compte !',
            icon: 'img/notif.jpg', // chemin optionnel pour une icône
        });

        // Lance le menu utilisateur pour gestion future
        await menuUtilisateur(user);
    } else {
        // Si utilisateur non trouvé, message d'erreur rouge
        console.log(
            chalk.redBright(" Identifiants incorrects !\n")
        );
    }
}

// Fonction pour afficher et gérer le menu après connexion
export async function menuUtilisateur(user: Utilisateur) {
    // Nettoie la console
    console.clear();

    // Affiche un message de bienvenue personnalisé en magenta, souligné et en gras
    console.log(
        chalk.magenta.underline.bold(`\n Bienvenue sur votre compte, ${user.prenom} !\n`)
    );

    // Demande à l'utilisateur ce qu'il souhaite faire
    const { action } = await inquirer.prompt([
        {
            type: "list", // Choix parmi une liste
            name: "action",
            message: chalk.blueBright("Que souhaitez-vous faire ?"),
            choices: [
                " Créer un groupe", // Option pour créer un groupe
                " Voir mes groupes", // Voir ses groupes
                " Gérer mon compte", // Accéder à la gestion du compte
                " Me déconnecter", // Déconnexion
            ],
        },
    ]);

    // En fonction du choix, appel de la fonction correspondante
    switch (action) {
        case " Créer un groupe":
            await createGroupe(user); // Fonction pour créer un groupe
            break;
        case " Voir mes groupes":
            await afficherGroupes(user); // Fonction pour voir ses groupes
            break;
        case " Gérer mon compte":
            // Accès à la gestion du compte
            const shouldLogout = await gestionCompte(user);
            // Si l'utilisateur doit se déconnecter après gestion
            if (shouldLogout) {
                console.log(chalk.greenBright("🚪 Vous êtes maintenant déconnecté."));
                return; // Fin de la session
            }
            break;
        case " Me déconnecter":
            // Simule la déconnexion
            console.log(chalk.green("🚪 Déconnexion effectuée !"));
            return; // Fin de la session
    }

    // Petite pause avant de revenir au menu principal
    await new Promise((res) => setTimeout(res, 1000));

    // Appelle récursivement pour revenir au menu principal
    await menuUtilisateur(user);
}