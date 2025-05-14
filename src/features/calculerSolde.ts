import { loadData } from "../depenseManager";

// Fonction pour calculer le solde d'une dépense spécifique
export function calculerSoldeDepense(depenseId: number) {
    // Charger toutes les données (dépenses, paiements, etc.)
    const data = loadData();

    // Trouver la dépense correspondant à l'ID donné
    const depense = data.depenses.find((d) => d.id === depenseId);
    if (!depense) {
        throw new Error("Dépense introuvable");
    }

    // Récupérer la liste des membres qui participent à cette dépense
    const membresParticipants = depense.membreId || [];
    // Récupérer le montant total de la dépense
    const totalMontant = depense.montant;
    // Nombre de participants, pour répartir le montant
    const nbParticipants = membresParticipants.length || 1;
    // Calcul de la part individuelle (montant à payer par membre)
    const partParMembre = totalMontant / nbParticipants;

    // Récupérer tous les paiements liés à cette dépense
    const paiements = data.Payer.filter((p) => p.depenseId === depenseId);

    // Créer un objet pour stocker le total payé par chaque membre
    const paiementsParMembre: Record<number, number> = {};

    // Initialiser le total payé pour chaque membre participant
    membresParticipants.forEach((membreId) => {
        paiementsParMembre[membreId] = 0;
    });

    // Parcourir tous les paiements et additionner pour chaque membre
    paiements.forEach((p) => {
        if (paiementsParMembre[p.membreId]) {
            paiementsParMembre[p.membreId] += p.sold;
        } else {
            // Si jamais un membre n'a pas encore de paiement enregistré
            paiementsParMembre[p.membreId] = p.sold;
        }
    });

    // Calcul du solde pour chaque membre : ce qu'ils ont payé - leur part
    const result = membresParticipants.map((membreId) => {
        const montantPayé = paiementsParMembre[membreId] || 0; // ce qu'ils ont payé
        const montantDuaré = partParMembre; // leur part à payer
        const solde = montantPayé - montantDuaré; // positif: ils ont payé plus que leur part, négatif: ils doivent payer
        return {
            membreId,
            montantPayé,
            montantDuaré,
            solde,
        };
    });

    // Retourne un tableau avec le détail pour chaque participant
    return result;
}
