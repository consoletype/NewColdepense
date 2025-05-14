import inquirer from "inquirer";
import { createAcount } from "./features/createCompte";
import { seconnecter } from "./features/authentification";
import chalk from "chalk";
import figlet = require("figlet");


async function main() {
    console.clear();
    console.log(
        chalk.cyan(
            figlet.textSync(" Aw Bismillah ! ", { horizontalLayout: "full" })
        )
    );

    const { action } = await inquirer.prompt([
        {
            type: "list",
            name: "action",
            message: "Bienvenue dans coldepense 😁😁",
            choices: ["Creer un compte", "Se connecter", "Quitter"],
        },
    ]);

    switch (action) {
        case "Creer un compte":
            await createAcount();
            break;
        case "Se connecter":
            await seconnecter();
            break;
        case "Quitter":
            console.log("Au revoir");
            return;
    }
    await main();
}

main();
