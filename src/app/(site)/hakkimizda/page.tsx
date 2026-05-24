import Link from "next/link";
import { getSalonSettingsSafe } from "@/lib/db-safe";

export default async function HakkimizdaPage() {
  const settings = await getSalonSettingsSafe();

  const workDays = [
    { label: "Pazartesi", open: settings?.mondayOpen, close: settings?.mondayClose },
    { label: "Salı", open: settings?.tuesdayOpen, close: settings?.tuesdayClose },
    { label: "Çarşamba", open: settings?.wednesdayOpen, close: settings?.wednesdayClose },
    { label: "Perşembe", open: settings?.thursdayOpen, close: settings?.thursdayClose },
    { label: "Cuma", open: settings?.fridayOpen, close: settings?.fridayClose },
    { label: "Cumartesi", open: settings?.saturdayOpen, close: settings?.saturdayClose },
    { label: "Pazar", open: settings?.sundayOpen, close: settings?.sundayClose },
  ];

  return (
    <div>
      <section className="bg-gradient-to-b from-champagne to-cream px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-dark">
            Hikayemiz
          </p>
          <h1 className="section-title mt-4">Hakkımızda</h1>
          <div className="gold-line" />
          <p className="font-display mt-4 text-2xl text-rose-800">
            {settings?.salonName}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="card max-w-3xl whitespace-pre-line text-lg leading-relaxed text-gray-700">
          {settings?.aboutContent}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="card lg:col-span-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gold-dark">
              Adres
            </h2>
            <p className="mt-4 font-display text-xl text-rose-900">{settings?.address}</p>
            <p className="mt-2 text-gray-500">{settings?.city}</p>
          </div>
          <div className="card lg:col-span-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gold-dark">
              Telefon
            </h2>
            <a
              href={`tel:${settings?.phone?.replace(/\s/g, "")}`}
              className="mt-4 block font-display text-3xl text-rose-800 transition hover:text-rose-600"
            >
              {settings?.phone}
            </a>
            <Link href="/randevu" className="btn-primary mt-6 inline-flex">
              Randevu Al
            </Link>
          </div>
          <div className="card lg:col-span-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gold-dark">
              Çalışma Saatleri
            </h2>
            <ul className="mt-4 space-y-2">
              {workDays.map((d) => (
                <li key={d.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{d.label}</span>
                  <span className="font-medium text-rose-900">
                    {d.open && d.close ? `${d.open} – ${d.close}` : "Kapalı"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl shadow-2xl shadow-rose-900/10 ring-1 ring-rose-100">
          <iframe
            title="Lotus Güzellik Salonu Konum"
            src="https://www.google.com/maps?q=Fevziçakmak+Mahallesi+Akşemsettin+Caddesi+No:12/A+Kepez+Antalya&output=embed"
            className="h-96 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
