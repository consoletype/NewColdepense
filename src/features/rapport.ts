import { RapportHebdomadaire } from "../model";
import { loadData, saveData } from "../depenseManager";
import { genererRapportPDF } from "./genererpdf";
import chalk from "chalk";

export function genererRapportHebdomadaire(
  groupeId: number
): RapportHebdomadaire | null {
  const data = loadData();

  // Vérifier si le groupe existe
  const groupe = data.groups.find((g) => g.id === groupeId);
  if (!groupe) {
    console.error(chalk.red(" Groupe non trouvé"));
    return null;
  }

  // Calculer les dates (semaine précédente)
  const maintenant = new Date();
  const dateFin = new Date(maintenant);
  const dateDebut = new Date(maintenant);
  dateDebut.setDate(dateFin.getDate() - 7); // 7 jours en arrière

  // Fonction helper pour filtrer par période
  const estDansPeriode = (date: Date) => date >= dateDebut && date <= dateFin;

  // Filtrer les dépenses et paiements du groupe pour la période
  const depensesSemaine = data.depenses.filter(
    (d) => d.groupeId === groupeId && estDansPeriode(new Date(d.date))
  );

  const paiementsSemaine = data.Payer.filter((p) => {
    const depenseAssociee = data.depenses.find((d) => d.id === p.depenseId);
    return (
      depenseAssociee?.groupeId === groupeId && estDansPeriode(new Date(p.date))
    );
  });

  // Fonction helper pour calculer les totaux par membre
  const calculerTotauxParMembre = (
    items: any[],
    montantKey: string,
    filterFn: (item: any, membreId: number) => boolean,
    calculMontant: (item: any) => number
  ) => {
    const result: { [key: number]: number } = {};

    groupe.membreId?.forEach((membreId) => {
      result[membreId] = items
        .filter((item) => filterFn(item, membreId))
        .reduce((sum, item) => sum + calculMontant(item), 0);
    });

    return result;
  };

  // Calculer les totaux
  const depensesTotal = depensesSemaine.reduce((sum, d) => sum + d.montant, 0);
  const paiementsTotal = paiementsSemaine.reduce((sum, p) => sum + p.sold, 0);

  // Calculer par membre
  const depensesParMembre = calculerTotauxParMembre(
    depensesSemaine,
    "montant",
    (d, membreId) => d.membreId?.includes(membreId),
    (d) => d.montant / (d.membreId?.length || 1)
  );

  const paiementsParMembre = calculerTotauxParMembre(
    paiementsSemaine,
    "sold",
    (p, membreId) => p.membreId === membreId,
    (p) => p.sold
  );

  // Créer le rapport
  const rapport: RapportHebdomadaire = {
    id: Date.now(),
    dateDebut,
    dateFin,
    depensesTotal,
    paiementsTotal,
    solde: paiementsTotal - depensesTotal,
    depensesParMembre: Object.entries(depensesParMembre).map(
      ([membreId, montant]) => ({
        membreId: Number(membreId),
        montant,
      })
    ),
    paiementsParMembre: Object.entries(paiementsParMembre).map(
      ([membreId, montant]) => ({
        membreId: Number(membreId),
        montant,
      })
    ),
    groupeId,
  };

  // Sauvegarder le rapport
  data.Rapport.push({
    id: rapport.id,
    periode: new Date(),
    description: `Rapport hebdomadaire du ${dateDebut.toLocaleDateString()} au ${dateFin.toLocaleDateString()}`,
    membreId: groupe.membreId,
    chefDeGroupe: groupe.chefDeGroupe,
  });

  saveData(data);

  return rapport;
}

export async function afficherRapportHebdomadaire(
  rapport: RapportHebdomadaire,
  options: { pdf?: string } = {}
) {
  const data = loadData();
  const groupe = data.groups.find((g) => g.id === rapport.groupeId);

  // Fonction helper pour afficher une section
  const afficherSection = (
    titre: string,
    items: { membreId: number; montant: number }[]
  ) => {
    console.log(chalk.yellow(`\n--- ${titre} ---`));
    items.forEach((item) => {
      const membre = data.users.find((u) => u.id === item.membreId);
      console.log(
        `${chalk.blue(membre?.prenom)} ${chalk.blue(
          membre?.nom
        )}: ${chalk.green(item.montant.toFixed(2))} XOF`
      );
    });
  };

  console.log(chalk.blue.bold("\n=== RAPPORT HEBDOMADAIRE ==="));
  console.log(
    chalk.green(
      ` Période: ${rapport.dateDebut.toLocaleDateString()} - ${rapport.dateFin.toLocaleDateString()}`
    )
  );
  console.log(chalk.green(` Groupe: ${groupe?.nom}`));

  console.log(chalk.yellow("\n--- Totaux ---"));
  console.log(
    chalk.cyan(` Dépenses totales: ${rapport.depensesTotal.toFixed(2)} FCFA`)
  );
  console.log(
    chalk.cyan(` Paiements totaux: ${rapport.paiementsTotal.toFixed(2)} FCFA`)
  );
  console.log(chalk.magenta(` Solde: ${rapport.solde.toFixed(2)} FCFA`));

  afficherSection("Dépenses par membre", rapport.depensesParMembre);
  afficherSection("Paiements par membre", rapport.paiementsParMembre);

  // Générer le PDF si demandé
  if (options.pdf) {
    try {
      await genererRapportPDF(rapport, options.pdf);
      console.log(chalk.green(`\nRapport PDF généré: ${options.pdf}`));
    } catch (error) {
      console.error(chalk.red("\nErreur lors de la génération du PDF:", error));
    }
  }
}
