// Importation des modules nécessaires
import PDFDocument from 'pdfkit'; // Librairie pour générer des PDFs
import fs from 'fs'; // Module de système de fichiers
import { RapportHebdomadaire } from '../model'; // Modèle de rapport hebdomadaire
import { loadData } from '../depenseManager'; // Fonction pour charger toutes les données

/**
 * Fonction pour générer un rapport PDF à partir d'un rapport hebdomadaire fourni
 * @param rapport - objet rapport hebdomadaire
 * @param filePath - chemin où sauvegarder le PDF
 * @returns Promise qui se résout quand le PDF est généré
 */
export function genererRapportPDF(rapport: RapportHebdomadaire, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Charge toutes les données nécessaires (utilisateurs, groupes, etc.)
        const data = loadData();

        // Recherche le groupe correspondant à l'ID du rapport
        const groupe = data.groups.find(g => g.id === rapport.groupeId);

        // Création d’un nouveau document PDF
        const doc = new PDFDocument();

        // Création d'un flux d'écriture vers le fichier cible
        const stream = fs.createWriteStream(filePath);
        // Association du flux au document PDF
        doc.pipe(stream);

        // Ajout d’un titre centré en haut du PDF
        doc.fontSize(20).text('RAPPORT HEBDOMADAIRE', { align: 'center' });
        doc.moveDown(); // saut de ligne

        // Informations de base : groupe et période
        doc.fontSize(14).text(`Groupe: ${groupe?.nom || 'Inconnu'}`);
        // Affiche la période en utilisant les dates de début et fin
        doc.text(`Période: ${rapport.dateDebut.toLocaleDateString()} - ${rapport.dateFin.toLocaleDateString()}`);
        doc.moveDown();

        // Section "Totaux" avec soulignement
        doc.fontSize(16).text('TOTAUX', { underline: true });
        // Affiche les totaux de dépenses, paiements et solde
        doc.text(`Dépenses totales: ${rapport.depensesTotal.toFixed(2)} FCFA`);
        //doc.text(`Paiements totaux: ${rapport.paiementsTotal.toFixed(2)} €`);
        doc.text(`Solde: ${rapport.solde.toFixed(2)} FCFA`);
        doc.moveDown();

        // Section "Dépenses par membre" avec soulignement
        doc.fontSize(16).text('DÉPENSES PAR MEMBRE', { underline: true });
        // Parcours chaque dépense par membre pour l'afficher
        rapport.depensesParMembre.forEach(item => {
            const membre = data.users.find(u => u.id === item.membreId);
            // Affiche prénom, nom et montant dépensé, avec format monétaire
            doc.text(`${membre?.prenom} ${membre?.nom}: ${item.montant.toFixed(2)} FCFA`);
        });
        doc.moveDown();

        // Section "Paiements par membre" avec soulignement
        doc.fontSize(16).text('PAIEMENTS PAR MEMBRE', { underline: true });
        // Parcours chaque paiement par membre
        rapport.paiementsParMembre.forEach(item => {
            const membre = data.users.find(u => u.id === item.membreId);
            // Affiche prénom, nom et montant payé
            doc.text(`${membre?.prenom} ${membre?.nom}: ${item.montant.toFixed(2)} FCFA`);
        });

        // Finalise le PDF
        doc.end();

        // Lors de la fin de l'écriture, résout la promesse
        stream.on('finish', () => resolve());
        // Si erreur lors de l'écriture, rejeute la promesse
        stream.on('error', err => reject(err));
    });
}