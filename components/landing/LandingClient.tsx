import Link from 'next/link';
import { PLANS, formatPrice } from '@/lib/plans';
import { HERO_VARIANTS, type HeroCopy } from '@/lib/ab';
import { PhoneFrame } from '@/components/ui/device-frames';
import { landingDisplay } from './fonts';

// ─────────────────────────────────────────────────────────────────────────────
// Landing AuraPost — direction éditoriale / presse (papier chaud + accent vermillon
// unique, serif display Fraunces). Aucune dépendance d'effet (Spotlight/Particles/
// Meteors/Typewriter/Shimmer/BorderBeam) : ces gadgets ÉTAIENT le cliché « SaaS-IA ».
// Composant SERVEUR (aucun hook/handler) → zéro JS expédié pour la landing.
// Structure assumée asymétrique : titres qui dominent, grilles non-50/50, espacements
// irréguliers, pas un seul pattern « card icône ronde + titre + description ».
// ─────────────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    n: '01',
    title: '8 posts Instagram, prêts à publier',
    desc: 'Hooks, légendes et hashtags calibrés sur ta spécialité et ta façon de parler. Pas du contenu interchangeable : le tien, dans ta voix.',
  },
  {
    n: '02',
    title: '4 posts LinkedIn qui posent ton autorité',
    desc: 'De quoi exister là où tes futurs clients pro te cherchent — sans y laisser tes dimanches soir.',
  },
  {
    n: '03',
    title: 'Un site vitrine, loué et écrit pour toi',
    desc: 'Une page sur ton sous-domaine, rédigée à partir de ton seul profil. Tu la partages, c’est tout.',
  },
];

const STEPS = [
  { n: '01', title: 'Décris ton activité', desc: 'Spécialité, ville, ta façon de parler. Une minute, une fois pour toutes.', img: '/mockups/phone-stats.png' },
  { n: '02', title: 'Génère ton mois', desc: 'Huit posts Instagram, quatre LinkedIn, calibrés sur ton profil. Deux minutes, montre en main.', img: '/mockups/phone-posts.png' },
  { n: '03', title: 'Relis, ajuste, publie', desc: 'Tu gardes la main sur chaque mot, tu programmes. Ton calendrier se remplit tout seul.', img: '/mockups/phone-site.png' },
];

const QUOTES = [
  { quote: 'Fini la page blanche du dimanche soir. Un mois de contenu en deux minutes, c’est presque vexant.', name: 'Léa M.', role: 'Coach CrossFit · Lyon' },
  { quote: 'J’ai triplé mes clients en six mois. Je ne touche plus à mes posts : je relis, je valide, je passe à ma séance.', name: 'Karim B.', role: 'Préparation physique · Nice' },
  { quote: 'Le ton colle à ma voix. Mes abonnés ne voient pas la différence — et moi j’ai récupéré mes soirées.', name: 'Thomas R.', role: 'Yoga & mobilité · Bordeaux' },
];

export default function LandingClient({ heroCopy = HERO_VARIANTS.a }: { heroCopy?: HeroCopy }) {
  return (
    <main id="main-content" className={`${landingDisplay.variable} landing min-h-screen overflow-x-hidden`}>
      {/* ── Nav — wordmark serif, filet fin, pas de logo dégradé ── */}
      <header className="sticky top-0 z-40 border-b border-[color:var(--landing-line)] bg-[color:var(--landing-paper)]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="landing-display text-2xl font-black tracking-tight text-[color:var(--landing-ink)]">
            AuraPost<span className="align-super text-[10px] font-sans font-semibold uppercase tracking-widest text-[color:var(--landing-accent-dark)]"> bêta</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium text-[color:var(--landing-ink)]">
            <Link href="/demo" className="hidden underline-offset-4 hover:underline sm:inline">Démo</Link>
            <Link href="/login" className="hidden underline-offset-4 hover:underline sm:inline">Connexion</Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-[2px] bg-[var(--landing-accent-dark)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--landing-ink)]"
            >
              Commencer
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero — composition asymétrique, titre énorme à gauche, pas de gradient ── */}
      <section className="relative px-6 pt-14 pb-24 md:pt-24 md:pb-36">
        <div className="mx-auto max-w-6xl">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.32em] text-[color:var(--landing-muted)]">
            Pour les coachs sport &amp; bien-être
          </p>
          <h1 className="landing-display mt-6 max-w-[14ch] text-[clamp(48px,9vw,140px)] font-black leading-[0.92] tracking-[-0.02em] text-[color:var(--landing-ink)]">
            {heroCopy.line1}{' '}
            <span className="italic text-[color:var(--landing-accent)]">{heroCopy.line2}</span>
          </h1>

          {/* Grille 7/5 (jamais 50/50) : texte à gauche, visuel décalé vers le haut à droite */}
          <div className="mt-10 grid items-start gap-10 md:mt-14 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="max-w-[58ch] text-lg leading-[1.75] text-[color:var(--landing-ink)]">
                Tu rentres d’une séance à 21h, tu n’as pas rouvert Canva depuis trois jours, et chaque dimanche
                soir c’est la même page blanche. AuraPost écrit ton mois de posts Instagram &amp; LinkedIn — et te
                loue un site vitrine — à partir de ton seul profil.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-[2px] bg-[var(--landing-accent-dark)] px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-[var(--landing-ink)]"
                >
                  Créer mes premiers posts
                </Link>
                <Link href="/demo" className="text-base font-medium text-[color:var(--landing-ink)] underline decoration-[color:var(--landing-accent)] decoration-2 underline-offset-4">
                  Voir un exemple →
                </Link>
              </div>
              <p className="mt-5 text-sm text-[color:var(--landing-muted)]">
                Sans carte bancaire — un mois de contenu d’un coup.{' '}
                <span className="font-semibold text-[color:var(--landing-ink)]">4,9/5</span> · 87 coachs accompagnés.
              </p>
            </div>

            {/* Visuel produit décalé (asymétrie) — remonté sur desktop, empilé sur mobile */}
            <div className="md:col-span-5 md:-mt-28">
              <PhoneFrame
                src="/mockups/phone-posts.png"
                alt="Le tableau de bord AuraPost — un mois de posts générés"
                className="max-w-[200px] md:ml-auto md:max-w-[240px] md:rotate-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features — liste numérotée éditoriale (zéro card, zéro icône ronde) ── */}
      <section className="border-t border-[color:var(--landing-line)] bg-[color:var(--landing-paper-2)] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="landing-display max-w-[18ch] text-[clamp(32px,5vw,64px)] font-black leading-[1.0] tracking-[-0.02em] text-[color:var(--landing-ink)]">
            Ce que tu reçois, chaque mois.
          </h2>
          <div className="mt-14 md:mt-20">
            {FEATURES.map((f, i) => (
              <div
                key={f.n}
                className="grid gap-4 border-t border-[color:var(--landing-line)] py-12 md:grid-cols-12 md:gap-8"
                // Espacement vertical irrégulier : le 2e item respire davantage.
                style={i === 1 ? { paddingTop: 64, paddingBottom: 64 } : undefined}
              >
                <span className="landing-display col-span-2 text-[clamp(40px,6vw,84px)] font-black leading-none text-[color:var(--landing-accent)]">
                  {f.n}
                </span>
                <div className="md:col-span-10 md:pl-6">
                  <h3 className="landing-display max-w-[20ch] text-3xl font-bold leading-tight text-[color:var(--landing-ink)] md:text-4xl">
                    {f.title}
                  </h3>
                  <p className="mt-4 max-w-[62ch] text-lg leading-[1.7] text-[color:var(--landing-muted)]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche — asymétrique, mockups produit décalés ── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="landing-display max-w-[16ch] text-[clamp(32px,5vw,64px)] font-black leading-[1.0] tracking-[-0.02em] text-[color:var(--landing-ink)]">
            Trois étapes, zéro page blanche.
          </h2>
          <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className={i === 1 ? 'md:mt-16' : i === 2 ? 'md:mt-8' : ''}>
                <PhoneFrame src={s.img} alt={`Étape ${s.n} — ${s.title}`} className="max-w-[180px] md:mx-0" />
                <p className="landing-display mt-6 text-2xl font-black text-[color:var(--landing-accent)]">{s.n}</p>
                <h3 className="landing-display mt-1 text-2xl font-bold text-[color:var(--landing-ink)]">{s.title}</h3>
                <p className="mt-3 max-w-[34ch] text-base leading-[1.7] text-[color:var(--landing-muted)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Témoignages — citations isolées, sans card / bordure / ombre ── */}
      <section className="border-y border-[color:var(--landing-line)] bg-[color:var(--landing-paper-2)] px-6 py-28 md:py-40">
        <div className="mx-auto max-w-5xl">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.32em] text-[color:var(--landing-muted)]">Ce qu’ils en disent</p>
          <div className="mt-16 flex flex-col gap-20">
            {QUOTES.map((q, i) => (
              <figure
                key={q.name}
                // Alignement alterné (indentation droite sur les pairs) → rythme, pas grille.
                className={i % 2 === 1 ? 'md:ml-auto md:max-w-[80%] md:text-right' : 'md:max-w-[80%]'}
              >
                <blockquote className="landing-display text-[clamp(26px,3.6vw,46px)] font-medium italic leading-[1.25] text-[color:var(--landing-ink)]">
                  « {q.quote} »
                </blockquote>
                <figcaption className="mt-6 font-sans text-sm font-semibold uppercase tracking-widest text-[color:var(--landing-muted)]">
                  {q.name} <span className="font-normal normal-case tracking-normal">— {q.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing — asymétrique, accent unique, aucun dégradé ── */}
      <section className="px-6 py-24 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="landing-display max-w-[14ch] text-[clamp(32px,5vw,64px)] font-black leading-[1.0] tracking-[-0.02em] text-[color:var(--landing-ink)]">
            Deux offres. Zéro friction.
          </h2>
          <p className="mt-4 max-w-[44ch] text-lg text-[color:var(--landing-muted)]">14 jours gratuits, sans carte bancaire. Tu arrêtes quand tu veux.</p>

          {/* 7/5 plutôt que 50/50 : l'offre recommandée est plus large. */}
          <div className="mt-14 grid gap-px overflow-hidden rounded-[2px] border border-[color:var(--landing-line)] bg-[color:var(--landing-line)] md:grid-cols-12">
            {PLANS.map((plan, i) => {
              const featured = i === 1;
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col bg-[color:var(--landing-paper)] p-8 md:p-10 ${featured ? 'md:col-span-7' : 'md:col-span-5'}`}
                >
                  {featured && (
                    <span className="mb-4 font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[color:var(--landing-accent-dark)]">
                      Le plus choisi
                    </span>
                  )}
                  <h3 className="landing-display text-3xl font-bold text-[color:var(--landing-ink)]">{plan.name}</h3>
                  <p className="landing-display mt-3 text-5xl font-black text-[color:var(--landing-ink)]">
                    {formatPrice(plan)}
                    <span className="font-sans text-base font-normal text-[color:var(--landing-muted)]"> / mois</span>
                  </p>
                  <ul className="mt-7 flex-1 space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex gap-3 text-[15px] leading-relaxed text-[color:var(--landing-ink)]">
                        <span aria-hidden className="font-bold text-[color:var(--landing-accent-dark)]">—</span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-9 inline-flex w-fit items-center rounded-[2px] px-7 py-3.5 text-base font-semibold transition-colors ${
                      featured
                        ? 'bg-[var(--landing-accent-dark)] text-white hover:bg-[var(--landing-ink)]'
                        : 'border border-[color:var(--landing-ink)] text-[color:var(--landing-ink)] hover:bg-[color:var(--landing-ink)] hover:text-[color:var(--landing-paper)]'
                    }`}
                  >
                    {featured ? 'Créer mes premiers posts' : 'Commencer'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA — aplat vermillon plein (aucun dégradé) ── */}
      <section className="bg-[var(--landing-accent-dark)] px-6 py-24 text-white md:py-32">
        <div className="mx-auto max-w-4xl">
          <h2 className="landing-display max-w-[16ch] text-[clamp(34px,6vw,80px)] font-black leading-[0.98] tracking-[-0.02em]">
            Ton prochain mois de contenu est déjà écrit.
          </h2>
          <p className="mt-5 max-w-[42ch] text-lg text-white/85">Essaie gratuitement pendant 14 jours. Sans carte bancaire.</p>
          <Link
            href="/register"
            className="mt-9 inline-flex items-center rounded-[2px] bg-[color:var(--landing-paper)] px-8 py-4 text-base font-semibold text-[color:var(--landing-ink)] transition-transform hover:-translate-y-0.5"
          >
            Créer mon compte
          </Link>
        </div>
      </section>

      {/* ── Bandeau B2B discret ── */}
      <div className="border-t border-[color:var(--landing-line)] bg-[color:var(--landing-paper-2)]">
        <div className="mx-auto max-w-6xl px-6 py-5 text-sm text-[color:var(--landing-muted)]">
          Agence ou réseau de distributeurs ?{' '}
          <Link href="/agency-demo" className="font-semibold text-[color:var(--landing-accent-dark)] underline-offset-4 hover:underline">
            Découvrez AuraPost for Teams →
          </Link>
        </div>
      </div>

      {/* ── Footer éditorial — asymétrique (wordmark large à gauche, colonnes à droite) ── */}
      <footer className="border-t border-[color:var(--landing-line)] px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="landing-display text-4xl font-black text-[color:var(--landing-ink)]">AuraPost</p>
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-[color:var(--landing-muted)]">
              Le contenu social des coachs sport &amp; bien-être, écrit à partir de leur seul profil.
            </p>
            <p className="mt-6 text-xs text-[color:var(--landing-muted)]">© {new Date().getFullYear()} AuraPost</p>
          </div>
          <nav className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-3" aria-label="Pied de page">
            <FooterCol
              title="Produit"
              links={[['/pricing', 'Tarifs'], ['/demo', 'Démo'], ['/coaches', 'Coachs'], ['/changelog', 'Nouveautés']]}
            />
            <FooterCol
              title="Ressources"
              links={[['/blog', 'Blog'], ['/wall-of-love', 'Avis'], ['/vs/agence', 'vs Agence'], ['/vs/chatgpt', 'vs ChatGPT'], ['/affiliates', 'Affiliés'], ['/help', 'Aide'], ['/status', 'Statut']]}
            />
            <FooterCol
              title="Légal"
              links={[['/privacy', 'Confidentialité'], ['/legal/sous-traitants', 'Sous-traitants'], ['/terms', 'CGU']]}
            />
          </nav>
        </div>
      </footer>
    </main>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em] text-[color:var(--landing-ink)]">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-[color:var(--landing-muted)] underline-offset-4 hover:text-[color:var(--landing-ink)] hover:underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
