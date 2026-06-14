import { redirect } from 'next/navigation';

// L'ancien éditeur d'aperçu est remplacé par l'éditeur complet
// /dashboard/website/editor (mêmes données, modèle SiteContent unifié).
export default function LegacyPreviewRedirect() {
  redirect('/dashboard/website/editor');
}
