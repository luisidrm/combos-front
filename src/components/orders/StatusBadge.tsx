'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import type { OrderStatus } from '@/store/api/ordersApi';

// Status colours follow the brand guide: warning = waiting, neutral = in progress,
// info = on the way, success = delivered, danger = cancelled. The wording is the
// backend's own order states (pending_payment … refunded).
const TONE: Record<OrderStatus, 'warning' | 'neutral' | 'info' | 'success' | 'danger'> = {
  pending_payment: 'warning',
  paid: 'neutral',
  preparing: 'neutral',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'neutral',
};

export function StatusBadge({ status, size }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const t = useTranslations('account.status');
  return (
    <Badge tone={TONE[status]} size={size} dot>
      {t(status)}
    </Badge>
  );
}

export const ACTIVE_STATUSES: OrderStatus[] = ['pending_payment', 'paid', 'preparing', 'out_for_delivery'];
