// Importation des modules nécessaires pour la gestion des utilisateurs et l'interface CLI
import { loadUser, saveUser } from "../depenseManager"; // Chargement et sauvegarde des données utilisateur
import inquirer from "inquirer"; // Outil interactif CLI
import chalk from "chalk"; // Couleurs pour le CLI
import ora from "ora"; // Animation de chargement
const notifier = require('node-notifier'); // Notifications système

// Fonction pour créer un nouveau compte utilisateur
export async function createAcount() {
    // Nettoie la console pour une nouvelle création
    console.clear();
    // Affiche un titre stylisé en cyan et en gras
    console.log(chalk.cyan.bold("\n=== 📋 Création de Compte Utilisateur ===\n"));

    // Charge la liste existante des utilisateurs
    let { users } = loadUser();

    // Demande à l'utilisateur ses informations via prompts
    const { nom, prenom, telephone, password, email } = await inquirer.prompt([
        {
            type: "input", // Saisie simple
            name: "nom",
            message: chalk.green("👉 Quel est votre nom :"),
            validate: (input) => input ? true : "Le nom est requis !", // Validation : doit être rempli
        },
        {
            type: "input",
            name: "prenom",
            message: chalk.green("👉 Quel est votre prénom :"),
            validate: (input) => input ? true : "Le prénom est requis !",
        },
        {
            type: "input",
            name: "telephone",
            message: chalk.green("📞 Entrez votre numéro de téléphone :"),
            // Validation : doit correspondre à 8-15 chiffres
            validate: (input) => input.match(/^\d{8,15}$/) ? true : "Numéro invalide (8-15 chiffres)",
        },
        {
            type: "password", // Saisie masquée
            name: "password",
            message: chalk.green("🔒 Choisissez un mot de passe :"),
            mask: "*", // Affichage par étoiles
            // Validation : minimum 4 caractères
            validate: (input) => input.length >= 4 ? true : "Minimum 4 caractères",
        },
        {
            type: "input",
            name: "email",
            message: chalk.green("📧 Entrez votre email :"),
            // Validation email simple regex
            validate: (input) =>
                /\S+@\S+\.\S+/.test(input) ? true : "Email invalide",
        },
    ]);

    // Lance une animation de chargement


    // Petite pause pour améliorer l'expérience utilisateur
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Ajoute le nouveau utilisateur à la liste
    users.push({
        id: Date.now(), // Identifiant unique basé sur timestamp
        nom,
        prenom,
        telephone,
        password,
        email,
    });

    // Sauvegarde la nouvelle liste
    saveUser(users);

    // Envoi d'une notification système de succès
    notifier.notify({ 
        title: 'Felicitation', // Titre
        message: 'Utilisateur créé avec succès !\n', // Message
        icon: 'img/icon.jpg' // Icône optionnelle
    });

    // Affiche un message de bienvenue personnalisé
    console.log(
        chalk.magenta.underline(`🙋 Bienvenue ${prenom} ${nom}! Votre compte est prêt.\n`)
    );
}