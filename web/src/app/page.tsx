import DashboardClient from '@/components/DashboardClient';

export const metadata = {
  title: 'Faniot Cloud | Monitor Ambiental',
  description: 'Dashboard en tiempo real para el monitoreo de temperatura, humedad y semillas.',
};

export default function Page() {
  return <DashboardClient />;
}
