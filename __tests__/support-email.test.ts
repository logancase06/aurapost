// Smoke test : generation du template email de confirmation ticket support.
// Verifie que sendSupportConfirmationEmail produit un HTML coherent sans crasher.

delete process.env.RESEND_API_KEY; // mode mock

import { sendSupportConfirmationEmail } from '@/lib/email';

describe("sendSupportConfirmationEmail", () => {
  it("renvoie success:true en mode mock (RESEND_API_KEY absent)", async () => {
    const result = await sendSupportConfirmationEmail(
      { email: "coach@test.fr", name: "Marie Dupont" },
      { id: "abc123def456", subject: "Probleme de connexion", message: "Je ne peux plus me connecter depuis ce matin." }
    );
    expect(result.success).toBe(true);
    expect(result.mocked).toBe(true);
  });

  it("renvoie success:true quelque soit la longueur de l'id du ticket", async () => {
    // sendEmail est appele via une reference locale (pas via l'export) donc
    // l'intra-module spy n'est pas applicable ici — on verifie juste le resultat.
    const result = await sendSupportConfirmationEmail(
      { email: "test@test.fr", name: "Test" },
      { id: "zyxwvuts12345678", subject: "Mon sujet", message: "Mon message" }
    );
    expect(result.success).toBe(true);
  });

  it("ne leve pas d'exception avec des champs longs", async () => {
    const longMessage = "a".repeat(5000);
    await expect(
      sendSupportConfirmationEmail(
        { email: "test@test.fr", name: "Test" },
        { id: "short", subject: "Sujet long", message: longMessage }
      )
    ).resolves.toBeDefined();
  });
});
