import { ReviewsAdmin } from "@/components/admin/ReviewsAdmin";
import { prisma } from "@/lib/prisma";

export default async function AdminYorumlarPage() {
  const reviews = await prisma.customerReview.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
    },
  });

  const initialReviews = reviews.map((r) => ({
    id: r.id,
    content: r.content,
    imageUrls: r.imageUrls,
    status: r.status,
    guestName: r.guestName,
    guestPhone: r.guestPhone,
    guestEmail: r.guestEmail,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
  }));

  return (
    <div>
      <h1>Yorumlar</h1>
      <p className="mb-3 text-sm text-gray-500">
        Müşteri yorumlarını onaylayın, düzenleyin veya silin. Yalnızca onaylanan yorumlar sitede
        görünür.
      </p>
      <ReviewsAdmin initialReviews={initialReviews} />
    </div>
  );
}
