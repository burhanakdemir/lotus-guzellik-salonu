"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { galleryMediaUrl } from "@/lib/gallery";

export type GalleryItemRow = {
  id: string;
  title: string;
  description: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export function GalleryAdmin({ initialItems }: { initialItems: GalleryItemRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [replaceFile, setReplaceFile] = useState<File | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/gallery");
    if (res.ok) setItems(await res.json());
    router.refresh();
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Resim veya video seçin.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("description", description);
      const res = await fetch("/api/admin/gallery", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Yüklenemedi.");
        return;
      }
      setTitle("");
      setDescription("");
      setFile(null);
      await refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setUploading(false);
    }
  }

  function startEdit(item: GalleryItemRow) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setReplaceFile(null);
    setError("");
  }

  async function saveEdit(id: string) {
    setError("");
    try {
      let res: Response;
      if (replaceFile) {
        const fd = new FormData();
        fd.append("file", replaceFile);
        fd.append("title", editTitle);
        fd.append("description", editDescription);
        res = await fetch(`/api/admin/gallery/${id}`, {
          method: "PATCH",
          body: fd,
        });
      } else {
        res = await fetch(`/api/admin/gallery/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi.");
        return;
      }
      setEditingId(null);
      await refresh();
    } catch {
      setError("Bağlantı hatası.");
    }
  }

  async function toggleActive(item: GalleryItemRow) {
    await fetch(`/api/admin/gallery/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    await refresh();
  }

  async function moveSort(item: GalleryItemRow, direction: "up" | "down") {
    const sorted = [...items].sort((a, b) => b.sortOrder - a.sortOrder);
    const idx = sorted.findIndex((i) => i.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      fetch(`/api/admin/gallery/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: other.sortOrder }),
      }),
      fetch(`/api/admin/gallery/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: item.sortOrder }),
      }),
    ]);
    await refresh();
  }

  async function deleteItem(item: GalleryItemRow) {
    if (!confirm(`"${item.title}" silinsin mi?`)) return;
    const res = await fetch(`/api/admin/gallery/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Silinemedi.");
      return;
    }
    if (editingId === item.id) setEditingId(null);
    await refresh();
  }

  const sorted = [...items].sort((a, b) => b.sortOrder - a.sortOrder);

  return (
    <div className="gallery-admin space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleUpload} className="card space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Yeni içerik ekle</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Başlık *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={2}
              placeholder="Örn. Gelin saçı uygulaması"
            />
          </div>
          <div>
            <label className="label">Kısa açıklama</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opsiyonel"
            />
          </div>
        </div>
        <div>
          <label className="label">Resim veya video *</label>
          <input
            className="input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
          <p className="mt-1 text-[11px] text-gray-500">
            JPG, PNG, WEBP, GIF, MP4, WEBM, MOV — en fazla 80 MB
          </p>
        </div>
        <button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? "Yükleniyor…" : "Galeriye Ekle"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Galeri içerikleri ({sorted.length})
        </h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz içerik yok.</p>
        ) : (
          sorted.map((item) => {
            const src = galleryMediaUrl(item.mediaUrl);
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={`card flex flex-col gap-3 sm:flex-row ${!item.isActive ? "opacity-60" : ""}`}
              >
                <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-28 sm:w-40">
                  {item.mediaType === "VIDEO" ? (
                    <video
                      src={src}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <Image
                      src={src}
                      alt={item.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                  <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    {item.mediaType === "VIDEO" ? "Video" : "Resim"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        className="input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <textarea
                        className="input"
                        rows={2}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Açıklama"
                      />
                      <div>
                        <label className="label">Dosyayı değiştir (opsiyonel)</label>
                        <input
                          className="input"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                          onChange={(e) =>
                            setReplaceFile(e.target.files?.[0] ?? null)
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => saveEdit(item.id)}
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setEditingId(null)}
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      {item.description && (
                        <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                      )}
                      <p className="mt-1 text-[11px] text-gray-400">
                        Sıra: {item.sortOrder} ·{" "}
                        {item.isActive ? "Sitede görünür" : "Gizli"}
                      </p>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex flex-wrap gap-1 sm:flex-col sm:justify-center">
                    <button
                      type="button"
                      className="btn-secondary !px-2 !py-1 !text-[11px]"
                      onClick={() => startEdit(item)}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="btn-secondary !px-2 !py-1 !text-[11px]"
                      onClick={() => toggleActive(item)}
                    >
                      {item.isActive ? "Gizle" : "Göster"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary !px-2 !py-1 !text-[11px]"
                      onClick={() => moveSort(item, "up")}
                      title="Yukarı"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn-secondary !px-2 !py-1 !text-[11px]"
                      onClick={() => moveSort(item, "down")}
                      title="Aşağı"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded !px-2 !py-1 !text-[11px] text-red-600 hover:bg-red-50"
                      onClick={() => deleteItem(item)}
                    >
                      Sil
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
