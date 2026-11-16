import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChatCircle,
  Drop,
  Package,
  Sparkle,
} from "@phosphor-icons/react";
import HeroStage from "../components/HeroStage";
import Reveal from "../components/Reveal";
import SectionHead from "../components/SectionHead";
import ProductCard from "../components/ProductCard";
import TaglineReveal from "../components/TaglineReveal";
import Accordion from "../components/Accordion";
import ResinArt from "../components/ResinArt";
import JewelleryArt from "../components/JewelleryArt";
import { useCatalog } from "../context/CatalogContext";
import CatalogStatus from "../components/CatalogStatus";
import { care, faqs, jewellery, process, trust } from "../data/content";
import { usePageMeta } from "../hooks/usePageMeta";

const trustIcons = {
  drop: Drop,
  sparkle: Sparkle,
  box: Package,
  chat: ChatCircle,
};

function FaqSchema() {
  useEffect(() => {
    const data = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
    return () => script.remove();
  }, []);
  return null;
}

export default function Home() {
  const { featuredProducts, products, ready } = useCatalog();
  usePageMeta({
    title: null,
    description:
      "Hand poured resin objects for the table, the shelf, and the people you keep close. A small batch studio in India. Order on WhatsApp.",
    path: "/",
  });

  return (
    <>
      <FaqSchema />

      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <Reveal>
              <p className="eyebrow hero__eyebrow">
                <span className="eyebrow__dot" aria-hidden="true" />
                Resin objects, poured by hand
              </p>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="heading-1 hero-title">
                <span className="hero-title__line">Pieces that</span>
                <span className="hero-title__line">hold light.</span>
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="body-2 hero__sub">
                Hand poured resin objects for the table, the shelf, and the people you keep
                close. Made one small batch at a time, in India.
              </p>
            </Reveal>

            <Reveal delay={180} className="hero__actions">
              <Link className="btn btn--primary" to="/shop">
                Shop the collection
                <ArrowRight size={16} weight="regular" aria-hidden="true" />
              </Link>
              <p className="caption-2 hero__proof">
                No two pours alike. Each piece is finished by hand.
              </p>
            </Reveal>
          </div>

          <Reveal className="hero__stage" delay={220}>
            <HeroStage />
          </Reveal>
        </div>
      </section>

      <section className="trust" aria-label="How the studio works">
        <div className="container trust__grid">
          {trust.map((item) => {
            const Icon = trustIcons[item.icon] || Drop;
            return (
              <div className="trust__item" key={item.title}>
                <Icon size={20} weight="light" aria-hidden="true" />
                <div>
                  <p className="title-3">{item.title}</p>
                  <p className="caption-2 trust__note">{item.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section featured">
        <div className="container">
          <Reveal>
            <SectionHead
              eyebrow="The collection"
              title="Made to be kept."
              action={
                <Link className="link-arrow" to="/shop">
                  {ready ? `View all ${products.length} pieces` : "View the collection"}
                  <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
                </Link>
              }
            />
          </Reveal>

          <CatalogStatus empty={products.length === 0} />
          <div className="product-grid">
            {featuredProducts.map((product, index) => (
              <Reveal key={product.id} delay={(index % 3) * 80}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="jewellery-band" aria-labelledby="jewellery-band-title">
        <div className="container jewellery-band__grid">
          <Reveal>
            <p className="eyebrow">{jewellery.eyebrow}</p>
            <h2 className="heading-2 jewellery-band__title" id="jewellery-band-title">
              {jewellery.title}
            </h2>
            <p className="body-3 jewellery-band__intro">{jewellery.intro}</p>
            <div className="jewellery-band__actions">
              <Link className="btn jewellery-band__btn" to="/shop?category=Jewellery">
                View the jewellery
                <ArrowRight size={16} weight="regular" aria-hidden="true" />
              </Link>
              <Link className="link-arrow" to="/shop">
                Browse resin pieces
                <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <Reveal className="jewellery-band__art" delay={100}>
            <JewelleryArt shape="hoops" palette="gold" />
            <span className="jewellery-band__caption">
              Hallmarked gold and silver
            </span>
          </Reveal>
        </div>
      </section>

      <section className="tagline-band">
        <div className="container">
          <TaglineReveal
            label="Our promise"
            text="We make objects slowly, in small pours, so the thing you keep is worth the wait."
          />
          <Reveal delay={100} className="tagline-band__foot">
            <p className="body-5 tagline-band__note">
              Sand, clay, moss, smoke. A palette that settles into a room.
            </p>
            <Link className="link-arrow" to="/about">
              Inside the studio
              <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section process">
        <div className="container process__grid">
          <div className="process__intro">
            <Reveal>
              <p className="eyebrow">How it works</p>
              <h2 className="heading-2 process__title">Slow is the point.</h2>
              <p className="body-3 process__copy">
                Every piece passes through the same pair of hands. That is why the wait is part
                of the object, and why the details are agreed before anything is poured.
              </p>
              <Link className="link-arrow" to="/contact">
                Ask about a custom piece
                <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>

          <ol className="process__steps">
            {process.map((step, index) => (
              <Reveal key={step.index} delay={index * 80} as="li" className="process-step">
                <span className="caption-3 process-step__index">{step.index}</span>
                <div className="process-step__body">
                  <h3 className="heading-4">{step.title}</h3>
                  <p className="body-3">{step.copy}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="dark-band" id="care">
        <div className="container dark-band__grid">
          <Reveal className="dark-band__intro">
            <p className="eyebrow">Material notes</p>
            <h2 className="heading-2 dark-band__title">
              Resin, looked after well, outlasts the trend.
            </h2>
            <p className="body-3 dark-band__copy">
              Resin is warm to the touch and lighter than glass. Each pour carries its own
              pattern, so small shifts in colour and tiny bubbles are part of the piece, not a
              flaw.
            </p>
            <Link className="link-arrow link-arrow--light" to="/about#care">
              Read the care guide
              <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
            </Link>
          </Reveal>

          <div className="care-list">
            {care.map((note, index) => (
              <Reveal key={note.title} delay={index * 70} className="care-row">
                <span className="caption-4 care-row__index">0{index + 1}</span>
                <div>
                  <h3 className="title-1 care-row__title">{note.title}</h3>
                  <p className="body-3 care-row__copy">{note.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section faq">
        <div className="container faq__grid">
          <div className="faq__intro">
            <Reveal>
              <p className="eyebrow">Before you order</p>
              <h2 className="heading-2 faq__title">The questions we hear most.</h2>
              <p className="body-3 faq__copy">
                Still wondering about a colour, a size, or a date? Write to us and we will answer
                plainly.
              </p>
              <Link className="link-arrow" to="/contact">
                Write to the studio
                <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>

          <Reveal className="faq__list" delay={80}>
            <Accordion items={faqs} name="home-faq" />
          </Reveal>
        </div>
      </section>

      <section className="final-cta">
        <div className="container">
          <Reveal className="final-cta__panel">
            <div className="final-cta__copy">
              <p className="eyebrow">The collection</p>
              <h2 className="heading-1 final-cta__title">
                A small thing,
                <br />
                made to be kept.
              </h2>
              <p className="body-2 final-cta__sub">
                A few pieces are in the studio now. The rest are poured to order, one small
                batch at a time.
              </p>
              <Link className="btn btn--primary" to="/shop">
                Shop the collection
                <ArrowRight size={16} weight="regular" aria-hidden="true" />
              </Link>
            </div>
            <div className="final-cta__art" aria-hidden="true">
              <ResinArt shape="vase" palette="honey" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
