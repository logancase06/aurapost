'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { toggleTenantStatusAction } from './actions';

export default function TenantToggle({ tenantId, status }: { tenantId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const disabled = status === 'disabled';

  function toggle() {
    startTransition(async () => {
      const res = await toggleTenantStatusAction(tenantId, disabled ? 'active' : 'disabled');
      if (res.ok) toast.success(disabled ? 'Tenant réactivé' : 'Tenant désactivé');
      else toast.error(res.error || 'Action impossible');
    });
  }

  return (
    <Button
      size="sm"
      variant={disabled ? 'secondary' : 'destructive'}
      onClick={toggle}
      disabled={pending}
    >
      {disabled ? 'Réactiver' : 'Désactiver'}
    </Button>
  );
}
