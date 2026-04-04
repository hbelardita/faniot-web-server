import DashboardClient from '@/components/DashboardClient';

export const metadata = {
  title: 'Faniot Cloud | Monitor Ambiental',
  description: 'Dashboard en tiempo real para el monitoreo de temperatura, humedad y semillas.',
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 p-6 md:p-12 relative overflow-hidden">
      {/* Decorative Background Mesh - Frontend Design Skill */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-50 blur-[120px] rounded-full opacity-60" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-blue-50 blur-[120px] rounded-full opacity-60" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] bg-amber-50 blur-[120px] rounded-full opacity-40" />
      </div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        {/* Header - Server Rendered */}
        <header className="flex flex-col gap-4 border-b border-slate-200/60 pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded-lg w-fit text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20">
            Faniot IoT
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-slate-950">
              Cloud<span className="text-emerald-500">Monitor</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
              Visualización inteligente de datos ambientales para el Almacén de Semillas.
            </p>
          </div>
        </header>

        {/* Client Hydrated Dashboard */}
        <DashboardClient />
      </div>
    </main>
  );
}
