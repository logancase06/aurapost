/**
 * scripts/deploy-check.ts — porte de pré-déploiement.
 * Vérifie que toutes les variables critiques sont présentes AVANT un déploiement,
 * liste les manquantes avec leur description, et sort en code 1 si une critique manque.
 *
 *   npx tsx scripts/deploy-check.ts            # rapport + exit 1 si critique manquante
 *   npx tsx scripts/deploy-check.ts --warn-only# n'échoue jamais (rapport seul)
 *
 * Réutilise lib/integrations.ts pour rester cohérent avec /status et /api/health/detailed.
 */
import { checkEnv } from './check-env';
import { getIntegrationStatuses } from '../lib/integrations';

const C = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

function main() {
  console.log(`\n${C.bold('AuraPost — vérification de pré-déploiement')}\n`);

  const env = checkEnv({ silent: true });
  const integrations = getIntegrationStatuses();

  // 1) Variables d'environnement
  console.log(C.bold('1. Variables d’environnement'));
  if (env.missingCritical.length === 0) {
    console.log(`   ${C.green('✓')} Toutes les variables critiques sont présentes.`);
  } else {
    console.log(`   ${C.red('✗')} ${env.missingCritical.length} variable(s) critique(s) manquante(s) :`);
    for (const name of env.missingCritical) console.log(`      ${C.red('•')} ${name}`);
  }
  if (env.missingRecommended.length) {
    console.log(`   ${C.yellow('!')} Recommandées manquantes (mock actif) : ${env.missingRecommended.join(', ')}`);
  }

  // 2) Intégrations (live vs mock)
  console.log(`\n${C.bold('2. Intégrations')}`);
  for (const it of integrations) {
    const tag = it.mode === 'live' ? C.green('LIVE') : C.yellow('MOCK');
    console.log(`   [${tag}] ${it.label} ${C.dim('— ' + it.detail)}`);
  }

  // 3) Verdict
  const liveCount = integrations.filter((i) => i.mode === 'live').length;
  console.log(`\n${C.bold('Verdict')}`);
  console.log(`   ${liveCount}/${integrations.length} intégrations en production.`);

  if (env.missingCritical.length > 0) {
    console.log(`\n   ${C.red('✗ Déploiement déconseillé : variables critiques manquantes.')}\n`);
    return 1;
  }
  if (liveCount === 0) {
    console.log(`\n   ${C.yellow('! Déploiement possible en mode démo (aucune intégration live).')}\n`);
  } else {
    console.log(`\n   ${C.green('✓ Prêt à déployer.')}\n`);
  }
  return 0;
}

const code = main();
if (!process.argv.includes('--warn-only') && code !== 0) process.exit(code);
