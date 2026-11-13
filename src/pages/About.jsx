import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import ResinArt from "../components/ResinArt";
import Reveal from "../components/Reveal";
import { about, care } from "../data/content";
import { usePageMeta } from "../hooks/usePageMeta";

const shelf = [
  { shape: "vase", palette: "honey", caption: "Pour study 01", name: "Bud vase" },
  { shape: "tray", palette: "clay", caption: "Pour study 02", name: "Catchall tray" },
  { shape: "coaster", palette: "amber", caption: "Pour study 03", name: "Coaster set" },
];

export default function About() {
  usePageMeta({
    title: "The studio",
    description:
      "Taaking Goods is a small resin studio in India, pouring objects for the table and the shelf in sand, clay, moss, and smoke.",
    path: "/about",
  });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">The studio</p>
          <div className="page-hero__grid">
            <h1 className="heading-1 page-title">
              {about.heading[0]}
              <br />
              {about.heading[1]}
            </h1>
            <p className="body-2 page-hero__intro">{about.intro}</p>
          </div>
        </div>
      </section>

      <section className="studio-shelf-section">
        <div className="container">
          <div className="studio-shelf">
            {shelf.map((piece, index) => (
              <Reveal key={piece.caption} delay={index * 80} className="studio-shelf__item">
                <div className="studio-shelf__art">
                  <ResinArt shape={piece.shape} palette={piece.palette} />
                </div>
                <div className="studio-shelf__meta">
                  <span className="caption-4">{piece.caption}</span>
                  <span className="caption-2">{piece.name}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section story">
        <div className="container story__grid">
          <Reveal className="story__intro">
            <p className="eyebrow">The short version</p>
            <h2 className="heading-3 story__title">Colour, held in place.</h2>
          </Reveal>
          <div className="story__body">
            {about.paragraphs.map((paragraph, index) => (
              <Reveal key={paragraph.slice(0, 24)} delay={index * 50}>
                <p className={index === 0 ? "body-1 story__lead" : "body-3 story__copy"}>
                  {paragraph}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section values">
        <div className="container">
          <Reveal>
            <p className="eyebrow">What we keep coming back to</p>
            <h2 className="heading-2 values__title">Three rules in the studio.</h2>
          </Reveal>
          <div className="values__grid">
            {about.values.map((value, index) => (
              <Reveal key={value.title} delay={index * 80} className="value">
                <span className="caption-3 value__index">{value.index}</span>
                <h3 className="heading-4 value__title">{value.title}</h3>
                <p className="body-3 value__copy">{value.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section care-guide" id="care">
        <div className="container care-guide__grid">
          <Reveal className="care-guide__intro">
            <p className="eyebrow">Care guide</p>
            <h2 className="heading-2 care-guide__title">A little care goes a long way.</h2>
            <p className="body-3">
              Resin is forgiving, but it is not glass. Three small habits will keep the surface
              clear and the colour true.
            </p>
            <Link className="link-arrow" to="/shop">
              Choose a piece
              <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
            </Link>
          </Reveal>

          <div className="care-guide__list">
            {care.map((note, index) => (
              <Reveal key={note.title} delay={index * 70} className="care-guide__row">
                <span className="caption-4 care-guide__index">0{index + 1}</span>
                <div>
                  <h3 className="title-1">{note.title}</h3>
                  <p className="body-3">{note.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <Reveal className="studio-cta">
            <div>
              <p className="eyebrow">Come see</p>
              <h2 className="heading-2 studio-cta__title">The shelf changes with each pour.</h2>
              <p className="body-2 studio-cta__copy">
                Browse what is in the studio now, or write to us about a colour you have in mind.
              </p>
            </div>
            <div className="studio-cta__actions">
              <Link className="btn btn--primary" to="/shop">
                Shop the collection
                <ArrowRight size={16} weight="regular" aria-hidden="true" />
              </Link>
              <Link className="link-arrow" to="/contact">
                Talk to the studio
                <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
