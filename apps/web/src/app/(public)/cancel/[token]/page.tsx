import { CancelPage } from '@/features/booking/CancelPage';

export const metadata = { title: 'ביטול תור' };

interface Props {
  params: { token: string };
}

export default function CancelRoute({ params }: Props) {
  return <CancelPage token={params.token} />;
}
