'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Globe, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setSitePublished } from './actions';

export default function PublishToggle({ published }: { published: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await setSitePublished(!published);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error || 'Action impossible');
      return;
    }
    toast.success(!published ? 'Site publié 🌐' : 'Site dépublié');
    router.refresh();
  }

  return (
    <Button onClick={toggle} disabled={loading} variant={published ? 'ghost' : 'gradient'} size="sm">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : published ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
      {published ? 'Dépublier' : 'Publier mon site'}
    </Button>
  );
}
