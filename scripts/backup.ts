/**
 * scripts/backup.ts — sauvegarde quotidienne de la base vers Cloudflare R2.
 *
 *   npx tsx scripts/backup.ts
 *
 * Exporte toutes les tables en un JSON horodaté, l'écrit localement dans /backups,
 * applique une rétention de 30 jours, puis l'envoie sur R2 si configuré (sinon mock local).
 * À planifier 1×/jour (cron / Netlify Scheduled Function appelant ce script en CI).
 */
import { mkdirSync, writeFileSync, readdirSync, statSync, rmSync } from 'fs';
import { join } from 'path';
import {
  tenants, users, coachProfiles, generatedPosts, subscriptions, websites,
  magicTokens, activityLogs, referrals, referralCodes, notifications,
} from '../lib/db/schema';
import { db } from '../lib/db';

const RETENTION_DAYS = 30;
const DIR = 'backups';

const TABLES = {
  tenants, users, coachProfiles, generatedPosts, subscriptions, websites,
  magicTokens, activityLogs, referrals, referralCodes, notifications,
} as const;

async function dumpAll(): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {};
  for (const [name, table] of Object.entries(TABLES)) {
    try {
      out[name] = await db.select().from(table as never);
    } catch (err) {
      out[name] = [];
      console.warn(`⚠ dump ${name} échoué :`, String(err));
    }
  }
  return out;
}

async function uploadToR2(filename: string, body: string): Promise<boolean> {
  const account = process.env.R2_ACCOUNT_ID;
  if (!account || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
    return false;
  }
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${account}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: `backups/${filename}`,
        Body: body,
        ContentType: 'application/json',
      })
    );
    return true;
  } catch (err) {
    console.warn('⚠ upload R2 échoué :', String(err));
    return false;
  }
}

function applyRetention() {
  try {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    for (const f of readdirSync(DIR)) {
      const full = join(DIR, f);
      if (statSync(full).mtimeMs < cutoff) {
        rmSync(full);
        console.log('🗑  rétention : supprimé', f);
      }
    }
  } catch {
    /* dossier vide / absent */
  }
}

async function main() {
  mkdirSync(DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const filename = `aurapost-${date}.json`;

  console.log('Sauvegarde AuraPost…');
  const dump = await dumpAll();
  const payload = JSON.stringify({ backedUpAt: new Date().toISOString(), tables: dump }, null, 0);

  writeFileSync(join(DIR, filename), payload);
  const rows = Object.values(dump).reduce((n, t) => n + t.length, 0);
  console.log(`✓ Dump local : ${DIR}/${filename} (${rows} lignes)`);

  const uploaded = await uploadToR2(filename, payload);
  console.log(uploaded ? '✓ Envoyé sur R2 (backups/)' : '· R2 non configuré — backup conservé en local (mock)');

  applyRetention();
  console.log('Terminé.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
