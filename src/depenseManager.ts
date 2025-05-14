import { Utilisateur, Groupe, Depense, Payer, Rapport } from "./model";
import * as fs from "fs";

const File_path = "data.json";

interface DataFile {
    users: Utilisateur[];
    groups: Groupe[];
    depenses: Depense[];
    Rapport: Rapport[];
    Payer: Payer[];
}

export function loadData(): DataFile {
    if (!fs.existsSync(File_path)) {
        return { users: [], groups: [], depenses: [], Rapport: [], Payer: [] };
    }

    const data = fs.readFileSync(File_path, "utf-8");

    if (!data.trim()) {
        return { users: [], groups: [], depenses: [], Rapport: [], Payer: [] };
    }

    try {
        const parsed = JSON.parse(data);
        return {
            users: parsed.users || [],
            groups: parsed.groups || [],
            depenses: parsed.depenses || [],
            Rapport: parsed.Rapport || [],
            Payer: parsed.Payer || [],
        };
    } catch (error) {
        console.error("Erreur json:", error);
        return { users: [], groups: [], depenses: [], Rapport: [], Payer: [] };
    }
}

export function saveData(data: DataFile) {
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(File_path, json, "utf-8");
}

//lire le fichier
export function loadUser(): { users: Utilisateur[] } {
    const data = loadData();
    return { users: data.users };
}

export function saveUser(users: Utilisateur[]) {
    const data = loadData();
    data.users = users;
    saveData(data);
}

export function loadGroupe(): { groupes: Groupe[] } {
    const data = loadData();
    return { groupes: data.groups }; // Retourne un objet avec une clé `groupes` contenant un tableau de groupes
}

export function savegroupe(groupes: Groupe[]) {
    const data = loadData();
    data.groups = groupes;
    saveData(data);
}

export function loadDepense(): { depenses: Depense[] } {
    const data = loadData();
    return { depenses: data.depenses };
}

export function savedepense(depenses: Depense[]) {
    const data = loadData();
    data.depenses = depenses;
    saveData(data);
}

export function loadRapport(): { Rapport: Rapport[] } {
    const data = loadData();
    return { Rapport: data.Rapport };
}

export function saveRapport(Rapport: Rapport[]) {
    const data = loadData();
    data.Rapport = Rapport;
    saveData(data);
}
export function loadPayer(): { Payer: Payer[] } {
    const data = loadData();
    return { Payer: data.Payer };
}

export function savePayer(Payer: Payer[]) {
    const data = loadData();
    data.Payer = Payer;
    saveData(data);
}
