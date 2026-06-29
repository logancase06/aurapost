import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { getPlanLimits } from '@/lib/plans';
import { logError } from '@/lib/logger';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — limite Whisper
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a',
  'video/mp4', 'video/quicktime', 'audio/ogg', 'audio/wav', 'audio/webm'];

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const limits = getPlanLimits(session.user.plan);
  if (!limits.exportEnabled) {
    return NextResponse.json({ error: 'upgrade_required' }, { status: 403 });
  }

  let tenantId: string;
  try { tenantId = await requireTenantId(); } catch {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const rl = await checkAuthRateLimit(`subtitles:${tenantId}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Limite atteinte. Reessaie dans ${Math.ceil(rl.retryAfterSec / 60)} min.` },
      { status: 429 }
    );
  }

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ error: 'Requete invalide' }, { status: 400 });
  }

  const file = formData.get('file');
  const lang = (formData.get('language') as string | null) ?? 'fr';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier recu' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} MB). La limite est 25 MB — compresse ou raccourcis la video.` },
      { status: 413 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|mp3|m4a|ogg|wav|webm)$/i)) {
    return NextResponse.json(
      { error: 'Format non supporte. Utilise MP4, MOV, MP3 ou M4A.' },
      { status: 415 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      ok: true,
      text: '[Transcription demo] Bonjour, je suis coach fitness. Aujourd\'hui on va parler de nutrition et de comment optimiser vos resultats en changeant simplement vos habitudes alimentaires.',
      srt: '1\n00:00:00,000 --> 00:00:03,000\nBonjour, je suis coach fitness.\n\n2\n00:00:03,000 --> 00:00:08,000\nAujourd\'hui on va parler de nutrition et de comment optimiser vos resultats.\n',
    });
  }

  try {
    const whisperForm = new FormData();
    whisperForm.append('file', file);
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', lang);
    whisperForm.append('response_format', 'srt');

    const srtRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperForm,
      signal: AbortSignal.timeout(55_000),
    });

    if (!srtRes.ok) {
      const errText = await srtRes.text().catch(() => '');
      logError('[subtitles/transcribe] Whisper API error', { status: srtRes.status, body: errText });
      return NextResponse.json({ error: 'Transcription impossible — reessaie.' }, { status: 502 });
    }

    const srt = await srtRes.text();
    const text = srt.replace(/^\d+\s*$/gm, '').replace(/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\s*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();

    return NextResponse.json({ ok: true, text, srt });
  } catch (err) {
    logError('[subtitles/transcribe]', { error: String(err) });
    return NextResponse.json({ error: 'Transcription impossible — reessaie.' }, { status: 500 });
  }
}
