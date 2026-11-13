import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import ResinArt from "../components/ResinArt";
import { usePageMeta } from "../hooks/usePageMeta";

export default function NotFound() {
  const location = useLocation();

  usePageMeta({
    title: "Page not found",
    description: "The page you were looking for is not here. Browse the studio collection instead.",
    path: location.pathname,
    noindex: true,
  });

  return (
    <section className="not-found">
      <div className="container not-found__inner">
        <p className="eyebrow">404</p>
        <h1 className="heading-2 not-found__title">This page has cured elsewhere.</h1>
        <p className="body-2 not-found__copy">
          The link may have moved, or the page may belong to an older pour. The collection is a
          good place to start again.
        </p>
        <div className="not-found__actions">
          <Link className="btn btn--primary" to="/shop">
            Shop the collection
            <ArrowRight size={16} weight="regular" aria-hidden="true" />
          </Link>
          <Link className="link-arrow" to="/">
            Back home
          </Link>
        </div>
        <div className="not-found__art" aria-hidden="true">
          <ResinArt shape="loop" palette="sage" withBackground={false} />
        </div>
      </div>
    </section>
  );
}
