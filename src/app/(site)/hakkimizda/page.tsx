import Link from "next/link";
import { MobilePageTitle } from "@/components/mobile/MobilePageTitle";
import { WhatsAppPhoneLink } from "@/components/WhatsAppPhoneLink";
import { getSalonSettingsSafe } from "@/lib/db-safe";
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsEmbedUrl,
  formatSalonMapAddress,
} from "@/lib/salon-maps";

export default async function HakkimizdaPage() {
  const settings = await getSalonSettingsSafe();
  const mapAddress = formatSalonMapAddress(settings?.address, settings?.city);
  const mapsEmbedUrl = buildGoogleMapsEmbedUrl(mapAddress);
  const mapsDirectionsUrl = buildGoogleMapsDirectionsUrl(mapAddress);

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
      <MobilePageTitle title="Hakkımızda" />

      <section className="site-desktop-only bg-gradient-to-b from-champagne to-cream px-4 py-20">
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

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-16 lg:px-8">
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
            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-4 inline-flex text-sm"
            >
              Yol tarifi al
            </a>
          </div>
          <div className="card lg:col-span-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gold-dark">
              Telefon
            </h2>
            {settings?.phone && (
              <WhatsAppPhoneLink
                phone={settings.phone}
                className="mt-4 font-display text-3xl text-rose-800 transition hover:text-rose-600"
                iconClassName="h-8 w-8 shrink-0 text-[#25D366]"
              />
            )}
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

        <div className="mt-12 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Konum: {mapAddress}
            </p>
            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex shrink-0"
            >
              Yol tarifi al
            </a>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-2xl shadow-rose-900/10 ring-1 ring-rose-100">
            <iframe
              title="Lotus Güzellik Salonu Konum"
              src={mapsEmbedUrl}
              className="h-96 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <p className="text-center text-xs text-gray-500">
            Haritadaki yol tarifi açılmazsa üstteki{" "}
            <strong>Yol tarifi al</strong> düğmesini kullanın.
          </p>
        </div>
      </div>
    </div>
  );
}
