import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { usePageMeta } from "../hooks/usePageMeta";
import { site } from "../config";

export default function LegalPage({ data }) {
  usePageMeta({
    title: data.title,
    description: data.intro,
    path: data.path,
  });

  return (
    <section className="legal-page">
      <div className="container">
        <div className="legal-head">
          <p className="eyebrow">Studio policy</p>
          <h1 className="heading-2 legal-title">{data.title}</h1>
          <p className="body-2 legal-intro">{data.intro}</p>
        </div>

        <div className="legal-grid">
          <aside className="legal-aside">
            <div>
              <p className="caption-3">Last updated</p>
              <p className="caption-2">{data.updated}</p>
            </div>
            <div>
              <p className="caption-3">Questions</p>
              <a href={`mailto:${site.email}`} className="caption-2 legal-aside__link">
                {site.email}
              </a>
            </div>
            <Link className="link-arrow" to="/contact">
              Ask the studio
              <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
            </Link>
          </aside>

          <div className="legal-content">
            {data.sections.map((section) => (
              <section className="legal-section" key={section.heading}>
                <h2 className="heading-4">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p className="body-3" key={paragraph.slice(0, 30)}>
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
