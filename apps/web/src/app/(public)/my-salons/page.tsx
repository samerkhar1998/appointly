import { MySalonsView } from '@/features/discovery/MySalonsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'העסקים שלי',
  description: 'כל בתי העסק שלך במקום אחד',
};

export default function MySalonsPage() {
  return <MySalonsView />;
}
