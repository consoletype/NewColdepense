export interface Utilisateur {
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
    password: string;
    email: string;
}
export interface Payer {
    id: number;
    date: Date;
    sold: number;
    membreId: number;
    depenseId: number;
    statut?: "validé" | "en_attente" | "refusé";
    methode?: "espèces" | "mobile_money" | "carte_bancaire";
}
export interface Depense {
    id: number;
    nom: string;
    montant: number;
    date: Date;
    membreId: number[];
    chefDeGroupe: number;
    groupeId: number;
    paiements?: Payer[];
}
export interface Groupe {
    id: number;
    nom: string;
    description: string;
    membreId?: number[];
    chefDeGroupe: number;
}
export interface RapportHebdomadaire {
    id: number;
    dateDebut: Date;
    dateFin: Date;
    depensesTotal: number;
    paiementsTotal: number;
    solde: number;
    depensesParMembre: { membreId: number; montant: number }[];
    paiementsParMembre: { membreId: number; montant: number }[];
    groupeId: number;
}
export interface Rapport {
    id: number;
    periode: Date;
    description: string;
    membreId?: number[];
    chefDeGroupe: number;
}
