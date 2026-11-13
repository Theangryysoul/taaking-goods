import { useId } from "react";

// ---------------------------------------------------------------------------
// Generated jewellery artwork, kept separate from the resin artwork on
// purpose. Gold and silver pieces should read as metal, not as poured resin.
// Replace with photographs by adding `image` to the product in catalog.js.
// ---------------------------------------------------------------------------

const palettes = {
  gold: {
    bg: "#EEE7D8",
    halo: "#E7DCC3",
    paper: "#F8F3E8",
    light: "#F8E3A2",
    mid: "#D8B15A",
    deep: "#96702A",
    ink: "#6C4F1B",
    sheen: "#FFF8DE",
  },
  silver: {
    bg: "#E8EAE6",
    halo: "#DEE1DC",
    paper: "#F5F6F3",
    light: "#F8FAF9",
    mid: "#C2C8C6",
    deep: "#7C8582",
    ink: "#59615E",
    sheen: "#FFFFFF",
  },
};

const shadow = "rgba(25, 24, 17, 0.16)";

function Ring({ p, id }) {
  return (
    <g>
      <ellipse cx="400" cy="796" rx="220" ry="34" fill={shadow} filter={`url(#${id}-soft)`} />

      <path
        d="M 400 340 C 505 340 590 448 590 586 C 590 728 505 824 400 824 C 295 824 210 728 210 586 C 210 448 295 340 400 340 Z
           M 400 470 C 340 470 300 522 300 588 C 300 660 344 704 400 704 C 456 704 500 660 500 588 C 500 522 460 470 400 470 Z"
        fill={`url(#${id}-main)`}
        fillRule="evenodd"
      />

      <path
        d="M 282 514 C 312 462 350 436 400 432"
        fill="none"
        stroke={p.sheen}
        strokeOpacity="0.7"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M 294 664 C 322 708 356 728 396 734"
        fill="none"
        stroke={p.ink}
        strokeOpacity="0.24"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <ellipse cx="400" cy="350" rx="102" ry="88" fill={p.deep} fillOpacity="0.6" />
      <ellipse cx="400" cy="340" rx="96" ry="82" fill={`url(#${id}-face)`} />
      <ellipse
        cx="400"
        cy="340"
        rx="78"
        ry="64"
        fill="none"
        stroke={p.ink}
        strokeOpacity="0.28"
        strokeWidth="2"
      />
      <path
        d="M 340 312 C 360 288 390 278 420 282"
        fill="none"
        stroke={p.sheen}
        strokeOpacity="0.72"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 400 258 L 400 292 M 366 268 L 380 296 M 434 268 L 420 296"
        stroke={p.deep}
        strokeOpacity="0.34"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}

function Chain({ p, id }) {
  return (
    <g>
      <ellipse cx="400" cy="790" rx="190" ry="30" fill={shadow} filter={`url(#${id}-soft)`} />

      <path
        d="M 238 236 C 296 444 352 540 400 572 C 448 540 504 444 562 236"
        fill="none"
        stroke={p.deep}
        strokeOpacity="0.42"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path
        d="M 238 228 C 296 436 352 532 400 564 C 448 532 504 436 562 228"
        fill="none"
        stroke={`url(#${id}-main)`}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M 238 228 C 296 436 352 532 400 564 C 448 532 504 436 562 228"
        fill="none"
        stroke={p.sheen}
        strokeOpacity="0.78"
        strokeWidth="4"
        strokeDasharray="1 10"
        strokeLinecap="round"
      />
      <path
        d="M 238 228 C 296 436 352 532 400 564 C 448 532 504 436 562 228"
        fill="none"
        stroke={p.ink}
        strokeOpacity="0.22"
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />

      <circle cx="238" cy="228" r="16" fill="none" stroke={p.deep} strokeWidth="6" />
      <circle cx="562" cy="228" r="16" fill="none" stroke={p.deep} strokeWidth="6" />
      <circle cx="238" cy="228" r="16" fill="none" stroke={p.sheen} strokeOpacity="0.5" strokeWidth="2" />
      <circle cx="562" cy="228" r="16" fill="none" stroke={p.sheen} strokeOpacity="0.5" strokeWidth="2" />

      <circle cx="400" cy="586" r="16" fill="none" stroke={p.deep} strokeWidth="5" />
      <rect x="366" y="606" width="68" height="112" rx="24" fill={p.deep} fillOpacity="0.55" />
      <rect x="372" y="600" width="56" height="112" rx="22" fill={`url(#${id}-face)`} />
      <path
        d="M 388 628 C 396 620 408 620 416 628"
        fill="none"
        stroke={p.sheen}
        strokeOpacity="0.7"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 396 684 L 410 684"
        stroke={p.ink}
        strokeOpacity="0.32"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}

function Hoops({ p, id }) {
  return (
    <g>
      <ellipse cx="400" cy="804" rx="230" ry="32" fill={shadow} filter={`url(#${id}-soft)`} />

      <g opacity="0.78">
        <circle cx="330" cy="472" r="146" fill="none" stroke={p.deep} strokeWidth="34" />
        <circle cx="330" cy="472" r="146" fill="none" stroke={`url(#${id}-main)`} strokeWidth="26" />
        <circle cx="330" cy="472" r="146" fill="none" stroke={p.sheen} strokeOpacity="0.6" strokeWidth="4" />
      </g>

      <circle cx="486" cy="556" r="172" fill="none" stroke={p.deep} strokeWidth="38" />
      <circle cx="486" cy="556" r="172" fill="none" stroke={`url(#${id}-main)`} strokeWidth="30" />
      <circle cx="486" cy="556" r="172" fill="none" stroke={p.ink} strokeOpacity="0.18" strokeWidth="2" />
      <path
        d="M 348 454 A 172 172 0 0 1 486 384"
        fill="none"
        stroke={p.sheen}
        strokeOpacity="0.72"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 486 384 L 486 360"
        stroke={p.deep}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="486" cy="352" r="14" fill="none" stroke={p.deep} strokeWidth="6" />
      <circle cx="486" cy="352" r="14" fill="none" stroke={p.sheen} strokeOpacity="0.5" strokeWidth="2" />

      <path
        d="M 196 646 C 240 710 306 750 372 764"
        fill="none"
        stroke={p.deep}
        strokeOpacity="0.16"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </g>
  );
}

function Bracelet({ p, id }) {
  return (
    <g>
      <ellipse cx="400" cy="790" rx="238" ry="34" fill={shadow} filter={`url(#${id}-soft)`} />

      <g transform="rotate(-8 400 532)">
        <ellipse cx="400" cy="532" rx="212" ry="148" fill="none" stroke={p.deep} strokeWidth="24" />
        <ellipse cx="400" cy="532" rx="212" ry="148" fill="none" stroke={`url(#${id}-main)`} strokeWidth="16" />
        <ellipse
          cx="400"
          cy="532"
          rx="212"
          ry="148"
          fill="none"
          stroke={p.sheen}
          strokeOpacity="0.8"
          strokeWidth="3"
          strokeDasharray="2 12"
          strokeLinecap="round"
        />
        <ellipse
          cx="400"
          cy="532"
          rx="212"
          ry="148"
          fill="none"
          stroke={p.ink}
          strokeOpacity="0.2"
          strokeWidth="3"
          strokeDasharray="8 8"
        />

        <rect x="574" y="500" width="52" height="64" rx="16" fill={p.deep} />
        <rect x="580" y="506" width="40" height="52" rx="12" fill={`url(#${id}-face)`} />
        <path
          d="M 592 520 L 608 520"
          stroke={p.ink}
          strokeOpacity="0.4"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M 216 490 C 252 430 320 396 392 394"
          fill="none"
          stroke={p.sheen}
          strokeOpacity="0.7"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>

      <circle cx="400" cy="724" r="11" fill={p.sheen} fillOpacity="0.6" />
    </g>
  );
}

function Studs({ p, id }) {
  return (
    <g>
      <ellipse cx="400" cy="794" rx="200" ry="30" fill={shadow} filter={`url(#${id}-soft)`} />

      <g opacity="0.78">
        <path
          d="M 300 424 L 352 390 L 410 414 L 424 476 L 380 526 L 318 506 Z"
          fill={p.deep}
          fillOpacity="0.7"
        />
        <path
          d="M 306 420 L 352 392 L 404 414 L 416 470 L 378 516 L 322 498 Z"
          fill={`url(#${id}-face)`}
        />
      </g>

      <path
        d="M 438 574 L 496 536 L 562 564 L 578 634 L 530 690 L 462 668 Z"
        fill={p.deep}
        fillOpacity="0.7"
      />
      <path
        d="M 444 570 L 496 538 L 554 564 L 568 628 L 526 678 L 468 658 Z"
        fill={`url(#${id}-main)`}
      />

      <path
        d="M 496 538 L 554 564 L 568 628"
        fill="none"
        stroke={p.sheen}
        strokeOpacity="0.72"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 496 538 L 500 600 L 526 678 M 500 600 L 568 628"
        fill="none"
        stroke={p.ink}
        strokeOpacity="0.22"
        strokeWidth="2"
      />
      <path
        d="M 352 392 L 358 448 L 378 516 M 358 448 L 416 470"
        fill="none"
        stroke={p.sheen}
        strokeOpacity="0.55"
        strokeWidth="3"
      />

      <circle cx="480" cy="624" r="8" fill={p.sheen} fillOpacity="0.65" />
    </g>
  );
}

const shapes = {
  ring: Ring,
  chain: Chain,
  hoops: Hoops,
  bracelet: Bracelet,
  studs: Studs,
};

export default function JewelleryArt({
  shape = "ring",
  palette = "gold",
  className = "",
  label,
  withBackground = true,
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = `metal${uid}`;
  const p = palettes[palette] || palettes.gold;
  const Shape = shapes[shape] || Ring;

  return (
    <svg
      viewBox="0 0 800 1000"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : "true"}
    >
      <defs>
        <linearGradient id={`${id}-main`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={p.light} />
          <stop offset="0.4" stopColor={p.mid} />
          <stop offset="0.68" stopColor={p.light} stopOpacity="0.94" />
          <stop offset="1" stopColor={p.deep} />
        </linearGradient>
        <linearGradient id={`${id}-face`} x1="0.24" y1="0" x2="0.76" y2="1">
          <stop offset="0" stopColor={p.sheen} />
          <stop offset="0.44" stopColor={p.light} />
          <stop offset="1" stopColor={p.mid} />
        </linearGradient>
        <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      {withBackground && (
        <>
          <rect width="800" height="1000" fill={p.bg} />
          <circle cx="400" cy="440" r="300" fill={p.halo} opacity="0.6" />
        </>
      )}

      <Shape p={p} id={id} />
    </svg>
  );
}
