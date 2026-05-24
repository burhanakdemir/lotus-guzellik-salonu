"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { groupServicesByCategory } from "@/lib/group-services-by-category";
import { getServiceCategoryLabel } from "@/lib/service-categories";
import { formatPrice, normalizePhone } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  durationMinutes: number;
  price: number;
}

export interface BookingStaffOption {
  id: string;
  label: string;
  color: string | null;
}

interface UserInfo {
  name: string;
  phone: string;
}

/** null = usta tüm hizmetleri yapabilir */
export type StaffServiceMap = Record<string, string[] | null>;

interface RandevuFormProps {
  services: Service[];
  staffOptions?: BookingStaffOption[];
  staffServiceMap?: StaffServiceMap;
  user?: UserInfo | null;
  initialSlug?: string;
  showPrice?: boolean;
  showDuration?: boolean;
}

function staffCanDoService(
  staffId: string,
  serviceId: string,
  map: StaffServiceMap
): boolean {
  const allowed = map[staffId];
  if (allowed === null || allowed === undefined) return true;
  return allowed.includes(serviceId);
}

export function RandevuForm({
  services,
  staffOptions = [],
  staffServiceMap = {},
  user,
  initialSlug,
  showPrice = true,
  showDuration = true,
}: RandevuFormProps) {
  const searchParams = useSearchParams();
  const slugParam = searchParams.get("hizmet") || initialSlug;
  const hasStaffChoice = staffOptions.length > 0;
  const totalSteps = hasStaffChoice ? 5 : 4;

  const [step, setStep] = useState(1);
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [note, setNote] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    serviceName: string;
    staffLabel?: string;
    name: string;
  } | null>(null);

  const selectedStaff = staffOptions.find((s) => s.id === assignedStaffId);

  const availableServices = useMemo(() => {
    if (!hasStaffChoice || !assignedStaffId) return services;
    const allowed = staffServiceMap[assignedStaffId];
    if (allowed === null || allowed === undefined) return services;
    return services.filter((s) => allowed.includes(s.id));
  }, [services, hasStaffChoice, assignedStaffId, staffServiceMap]);

  const { grouped: servicesByCategory, sortedCategories: serviceCategories } =
    useMemo(
      () => groupServicesByCategory(availableServices),
      [availableServices]
    );

  const eligibleStaff = useMemo(() => {
    if (!hasStaffChoice || !serviceId) return staffOptions;
    return staffOptions.filter((s) =>
      staffCanDoService(s.id, serviceId, staffServiceMap)
    );
  }, [staffOptions, serviceId, hasStaffChoice, staffServiceMap]);

  useEffect(() => {
    if (slugParam && services.length) {
      const s = services.find((x) => x.slug === slugParam);
      if (s) setServiceId(s.id);
    }
  }, [slugParam, services]);

  useEffect(() => {
    if (!assignedStaffId || !serviceId) return;
    if (!staffCanDoService(assignedStaffId, serviceId, staffServiceMap)) {
      setServiceId("");
    }
  }, [assignedStaffId, serviceId, staffServiceMap]);

  const selectedService = services.find((s) => s.id === serviceId);

  const loadSlots = useCallback(async () => {
    if (!date || !serviceId) return;
    if (hasStaffChoice && !assignedStaffId) return;
    setLoadingSlots(true);
    setError("");
    setStartTime("");
    try {
      const params = new URLSearchParams({ date, serviceId });
      if (hasStaffChoice && assignedStaffId) {
        params.set("assignedStaffId", assignedStaffId);
      }
      const normalized = normalizePhone(phone);
      if (normalized.length === 10) params.set("phone", normalized);
      const res = await fetch(`/api/appointments/slots?${params}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setSlots([]);
      } else {
        setSlots(data.slots || []);
      }
    } catch {
      setError("Müsait saatler yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [date, serviceId, phone, assignedStaffId, hasStaffChoice]);

  const timeStep = hasStaffChoice ? 5 : 4;

  useEffect(() => {
    if (step >= timeStep - 1 && date && serviceId) loadSlots();
  }, [step, date, serviceId, phone, assignedStaffId, loadSlots, timeStep]);

  const minDate = new Date().toISOString().split("T")[0];

  async function handleSubmit() {
    if (submitting) return;
    setError("");

    const trimmedName = name.trim();
    const phoneNorm = normalizePhone(phone);
    if (trimmedName.length < 2) {
      setError("Lütfen ad soyad girin.");
      return;
    }
    if (phoneNorm.length !== 10) {
      setError("Geçerli bir telefon numarası girin (10 hane).");
      return;
    }
    if (!serviceId || !date || !startTime) {
      setError("Hizmet, tarih ve saat seçilmelidir.");
      return;
    }
    if (hasStaffChoice && !assignedStaffId) {
      setError("Lütfen bir usta seçin.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: phoneNorm,
          serviceId,
          date,
          startTime,
          note: note.trim() || undefined,
          ...(hasStaffChoice ? { assignedStaffId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { error?: string }).error || "Randevu oluşturulamadı."
        );
        return;
      }
      const apt = (
        data as {
          appointment?: {
            date: string;
            startTime: string;
            endTime: string;
            name: string;
            service?: { name: string };
            assignedStaff?: { label: string } | null;
          };
        }
      ).appointment;
      const serviceName =
        apt?.service?.name ?? selectedService?.name ?? "";
      if (!apt?.date || !serviceName) {
        setError("Randevu kaydedildi ancak yanıt okunamadı. Hesabınızı kontrol edin.");
        return;
      }
      setSuccess({
        date: apt.date,
        startTime: apt.startTime,
        endTime: apt.endTime,
        serviceName,
        staffLabel: apt.assignedStaff?.label ?? selectedStaff?.label,
        name: apt.name,
      });
    } catch {
      setError("Bağlantı hatası. İnternetinizi kontrol edip tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="card mx-auto max-w-lg text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-rose-800 text-3xl text-white shadow-lg">
          ✓
        </div>
        <h2 className="font-display text-3xl text-rose-900">Randevunuz Oluşturuldu!</h2>
        <p className="mt-4 text-gray-600">
          Sayın <strong>{success.name}</strong>, randevunuz alındı.
        </p>
        <ul className="mt-6 space-y-2 text-left text-sm">
          {success.staffLabel && (
            <li>
              <strong>Usta:</strong> {success.staffLabel}
            </li>
          )}
          <li>
            <strong>Hizmet:</strong> {success.serviceName}
          </li>
          <li>
            <strong>Tarih:</strong> {success.date}
          </li>
          <li>
            <strong>Saat:</strong> {success.startTime} – {success.endTime}
          </li>
        </ul>
        <p className="mt-6 text-xs text-gray-500">
          Onay için sizinle iletişime geçilecektir.
        </p>
      </div>
    );
  }

  const stepLabels = hasStaffChoice
    ? ["Usta", "Bilgiler", "Hizmet", "Tarih", "Saat"]
    : ["Bilgiler", "Hizmet", "Tarih", "Saat"];

  const contactStep = hasStaffChoice ? 2 : 1;
  const serviceStep = hasStaffChoice ? 3 : 2;
  const dateStep = hasStaffChoice ? 4 : 3;

  return (
    <div className="card mx-auto max-w-lg shadow-xl shadow-rose-900/10">
      <div className="mb-8">
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                step >= s ? "bg-gradient-to-r from-rose-700 to-gold" : "bg-rose-100"
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-xs font-medium uppercase tracking-wider text-gold-dark">
          Adım {step}/{totalSteps} · {stepLabels[step - 1]}
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {hasStaffChoice && step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-rose-900">Ustanızı Seçin</h2>
          <p className="text-sm text-gray-500">
            Randevunuz seçtiğiniz usta için oluşturulur.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {eligibleStaff.length === 0 ? (
              <p className="text-sm text-amber-700">
                Seçili hizmet için uygun usta bulunamadı. Önce hizmet seçimini
                kontrol edin veya salonla iletişime geçin.
              </p>
            ) : null}
            {eligibleStaff.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setAssignedStaffId(s.id)}
                className={`flex items-center gap-2 rounded-2xl border p-4 text-left transition-all duration-300 ${
                  assignedStaffId === s.id
                    ? "border-rose-600 bg-gradient-to-br from-rose-50 to-champagne shadow-md ring-2 ring-gold/30"
                    : "border-rose-100 hover:border-rose-300 hover:shadow-sm"
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color || "#d97b9a" }}
                  aria-hidden
                />
                <span className="font-medium text-rose-900">{s.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!assignedStaffId || eligibleStaff.length === 0}
            onClick={() => {
              if (!assignedStaffId) {
                setError("Lütfen bir usta seçin.");
                return;
              }
              setError("");
              setStep(2);
            }}
          >
            Devam
          </button>
        </div>
      )}

      {step === contactStep && (
        <div className="space-y-4">
          <h2 className="font-semibold text-rose-900">İletişim Bilgileri</h2>
          {selectedStaff && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              Usta: <strong>{selectedStaff.label}</strong>
            </p>
          )}
          {!user && (
            <p className="text-sm text-gray-500">
              Üye değilseniz telefon ve ad soyad ile devam edebilirsiniz.
            </p>
          )}
          <div>
            <label className="label">Ad Soyad</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input
              className="input"
              type="tel"
              placeholder="05XX XXX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className={`flex gap-3 ${hasStaffChoice ? "" : ""}`}>
            {hasStaffChoice && (
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setStep(1)}
              >
                Geri
              </button>
            )}
            <button
              type="button"
              className={`btn-primary ${hasStaffChoice ? "flex-1" : "w-full"}`}
              onClick={() => {
                if (!name || phone.length < 10) {
                  setError("Lütfen ad ve geçerli telefon girin.");
                  return;
                }
                setError("");
                setStep(serviceStep);
              }}
            >
              Devam
            </button>
          </div>
        </div>
      )}

      {step === serviceStep && (
        <div className="space-y-4">
          <h2 className="font-semibold text-rose-900">Hizmet Seçin</h2>
          {selectedStaff && (
            <p className="text-sm text-gray-600">
              Usta: <strong>{selectedStaff.label}</strong>
            </p>
          )}
          <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
            {availableServices.length === 0 ? (
              <p className="text-sm text-amber-700">
                Bu usta için tanımlı hizmet yok. Ayarlardan hizmet yetkisi
                ekleyin veya başka usta seçin.
              </p>
            ) : (
              serviceCategories.map((cat) => (
                <div key={cat}>
                  <h3 className="mb-2 border-b border-rose-100 pb-1 text-xs font-semibold uppercase tracking-wide text-lotus-700">
                    {getServiceCategoryLabel(cat)}
                  </h3>
                  <div className="space-y-2">
                    {servicesByCategory[cat].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setServiceId(s.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                          serviceId === s.id
                            ? "border-rose-600 bg-gradient-to-br from-rose-50 to-champagne shadow-md ring-2 ring-gold/30"
                            : "border-rose-100 hover:border-rose-300 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={
                            showPrice ? "flex justify-between gap-2" : ""
                          }
                        >
                          <span className="font-medium">{s.name}</span>
                          {showPrice && (
                            <span className="shrink-0 text-rose-700">
                              {formatPrice(s.price)}
                            </span>
                          )}
                        </div>
                        {showDuration && (
                          <span className="text-xs text-gray-500">
                            {s.durationMinutes} dakika
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setStep(contactStep)}
            >
              Geri
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!serviceId}
              onClick={() => serviceId && setStep(dateStep)}
            >
              Devam
            </button>
          </div>
        </div>
      )}

      {step === dateStep && (
        <div className="space-y-4">
          <h2 className="font-semibold text-rose-900">Tarih Seçin</h2>
          {selectedService && (
            <p className="text-sm text-gray-600">
              {selectedService.name}
              {showDuration && ` · ${selectedService.durationMinutes} dk`}
            </p>
          )}
          <input
            type="date"
            className="input"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setStep(serviceStep)}
            >
              Geri
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!date}
              onClick={() => {
                setStep(timeStep);
                loadSlots();
              }}
            >
              Devam
            </button>
          </div>
        </div>
      )}

      {step === timeStep && (
        <div className="space-y-4">
          <h2 className="font-semibold text-rose-900">Saat Seçin</h2>
          <p className="text-sm text-gray-600">
            {date}
            {selectedStaff && (
              <>
                {" "}
                · Usta: <strong>{selectedStaff.label}</strong>
              </>
            )}
          </p>
          {loadingSlots ? (
            <p className="text-center text-gray-500">Müsait saatler yükleniyor...</p>
          ) : slots.length === 0 ? (
            <p className="text-center text-gray-500">Müsait saat yok. Başka tarih seçin.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStartTime(t)}
                  className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                    startTime === t
                      ? "border-rose-700 bg-gradient-to-br from-rose-700 to-rose-900 text-white shadow-md"
                      : "border-rose-200 hover:border-gold hover:bg-champagne"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <div>
            <label className="label">Not (opsiyonel)</label>
            <textarea
              className="input"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setStep(dateStep)}
            >
              Geri
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!startTime || loadingSlots || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Kaydediliyor…" : "Randevuyu Onayla"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
