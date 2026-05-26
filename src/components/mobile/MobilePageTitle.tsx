import Link from "next/link";

type Props = {
  title: string;
  backHref?: string;
  backLabel?: string;
};

export function MobilePageTitle({
  title,
  backHref = "/",
  backLabel = "Geri",
}: Props) {
  return (
    <div className="site-mobile-only mobile-page-title">
      {backHref ? (
        <Link href={backHref} className="mobile-page-title__back">
          ← {backLabel}
        </Link>
      ) : (
        <span className="mobile-page-title__back mobile-page-title__back--placeholder" />
      )}
      <h1 className="mobile-page-title__heading">{title}</h1>
    </div>
  );
}
