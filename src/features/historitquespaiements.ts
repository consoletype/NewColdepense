import { loadPayer, loadUser } from "../depenseManager";

export async function paymentHystorique(depenseId: number) {
  const { Payer } = loadPayer();
  const { users } = loadUser();

  const paiements = Payer.filter((p) => p.depenseId === depenseId);

  if (paiements.length === 0) {
    console.log("📭 Il n'y a pas de paiement pour cette dépense.");
    return;
  }

  console.log(`📜 Historique des paiements pour la dépense #${depenseId}:`);
  paiements.forEach((paiement) => {
    const user = users.find((u) => u.id === paiement.membreId);
    const nom = user ? user.nom : "Inconnu";
    console.log(`- Membre: ${nom}, Paiement ID: ${paiement.id}, Montant: ${paiement.sold} FCFA`);
  });
}
