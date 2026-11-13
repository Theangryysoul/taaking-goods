import { useId } from "react";

const palettes = {
  amber: {
    bg: "#E7DDCB",
    halo: "#DED2BC",
    paper: "#F3EADA",
    light: "#F3D7A5",
    mid: "#D79C52",
    deep: "#9A5A27",
    ink: "#7E4A20",
  },
  sage: {
    bg: "#E2E2D5",
    halo: "#D8D9C8",
    paper: "#F0EFE4",
    light: "#CBD2BA",
    mid: "#93A284",
    deep: "#59654D",
    ink: "#4C5741",
  },
  clay: {
    bg: "#EADFD4",
    halo: "#E0D2C4",
    paper: "#F5EBE2",
    light: "#E9C6AB",
    mid: "#C18763",
    deep: "#8E4F33",
    ink: "#7B422B",
  },
  smoke: {
    bg: "#E5E3DD",
    halo: "#DBD8D0",
    paper: "#F2F0EA",
    light: "#D8D4CC",
    mid: "#A7A197",
    deep: "#6C675E",
    ink: "#5C5750",
  },
  mist: {
    bg: "#E2E7E2",
    halo: "#D7DED8",
    paper: "#EFF3EF",
    light: "#D5E3DC",
    mid: "#9FB9AE",
    deep: "#5F786E",
    ink: "#526A60",
  },
  honey: {
    bg: "#EEE5D2",
    halo: "#E5D9C1",
    paper: "#F7EFDD",
    light: "#F6DCA4",
    mid: "#E0B25C",
    deep: "#B07A2B",
    ink: "#94651F",
  },
};

const shadow = "rgba(25, 24, 17, 0.16)";

function Bubbles({ tone, points }) {
  return points.map(([x, y, r], index) => (
    <circle
      key={`${x}-${y}-${index}`}
      cx={x}
      cy={y}
      r={r}
      fill="rgba(255, 255, 255, 0.34)"
    />
  ));
}

function Coaster({ p, id }) {
  const discs = [
    { x: 322, y: 408, r: 138, fill: `url(#${id}-main)`, angle: -18 },
    { x: 492, y: 430, r: 138, fill: p.mid, angle: 12 },
    { x: 342, y: 626, r: 138, fill: p.light, angle: 8 },
    { x: 512, y: 640, r: 138, fill: `url(#${id}-main)`, angle: -12 },
  ];

  return (
    <g>
      <ellipse cx="410" cy="782" rx="286" ry="44" fill={shadow} filter={`url(#${id}-soft)`} />
      {discs.map((disc, index) => (
        <g key={index} transform={`rotate(${disc.angle} ${disc.x} ${disc.y})`}>
          <circle cx={disc.x} cy={disc.y} r={disc.r} fill={disc.fill} fillOpacity="0.92" />
          <circle
            cx={disc.x}
            cy={disc.y}
            r={disc.r - 3}
            fill="none"
            stroke={p.ink}
            strokeOpacity="0.22"
            strokeWidth="2"
          />
          <path
            d={`M ${disc.x - disc.r * 0.62} ${disc.y - disc.r * 0.28} A ${disc.r} ${disc.r} 0 0 1 ${disc.x - disc.r * 0.08} ${disc.y - disc.r * 0.86}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Bubbles
            points={[
              [disc.x + 34, disc.y + 18, 7],
              [disc.x + 58, disc.y + 44, 4],
              [disc.x - 30, disc.y + 52, 5],
            ]}
          />
        </g>
      ))}
    </g>
  );
}

function Tray({ p, id }) {
  return (
    <g>
      <ellipse cx="410" cy="760" rx="296" ry="44" fill={shadow} filter={`url(#${id}-soft)`} />
      <path
        d="M 170 340 C 170 296 214 276 296 280 L 522 288 C 612 290 646 328 642 402 L 628 628 C 624 702 572 728 480 724 L 282 716 C 200 714 174 674 176 602 Z"
        fill={p.deep}
        fillOpacity="0.55"
      />
      <path
        d="M 204 354 C 206 322 236 308 300 312 L 514 320 C 588 322 614 348 610 406 L 598 614 C 594 674 552 696 480 692 L 300 684 C 232 682 208 650 210 592 Z"
        fill={`url(#${id}-main)`}
        fillOpacity="0.94"
      />
      <path
        d="M 204 354 C 206 322 236 308 300 312 L 514 320 C 588 322 614 348 610 406"
        fill="none"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 212 590 C 220 660 250 678 310 682 L 470 690"
        fill="none"
        stroke={p.ink}
        strokeOpacity="0.18"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Bubbles
        points={[
          [362, 392, 9],
          [402, 366, 5],
          [452, 408, 6],
          [388, 448, 4],
        ]}
      />
    </g>
  );
}

function Keychain({ p, id }) {
  return (
    <g>
      <ellipse cx="400" cy="756" rx="190" ry="34" fill={shadow} filter={`url(#${id}-soft)`} />
      <circle cx="400" cy="238" r="46" fill="none" stroke={p.deep} strokeWidth="12" />
      <circle cx="400" cy="238" r="46" fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="3" />
      <rect x="386" y="276" width="28" height="52" rx="14" fill={p.deep} />
      <path
        d="M 400 312 C 462 312 506 366 506 436 C 506 508 454 570 400 618 C 346 570 294 508 294 436 C 294 366 338 312 400 312 Z"
        fill={`url(#${id}-main)`}
        fillOpacity="0.93"
      />
      <path
        d="M 400 312 C 462 312 506 366 506 436 C 506 508 454 570 400 618 Z"
        fill={p.deep}
        fillOpacity="0.28"
      />
      <circle cx="400" cy="350" r="11" fill={p.bg} />
      <path
        d="M 344 380 C 326 414 322 456 338 494"
        fill="none"
        stroke="rgba(255, 255, 255, 0.55)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Bubbles
        points={[
          [428, 430, 7],
          [452, 470, 4],
          [410, 500, 5],
        ]}
      />
    </g>
  );
}

function Bookmark({ p, id }) {
  return (
    <g>
      <ellipse cx="400" cy="820" rx="170" ry="30" fill={shadow} filter={`url(#${id}-soft)`} />
      <path d="M 400 166 C 400 200 396 226 400 268" stroke={p.ink} strokeWidth="4" fill="none" />
      <path
        d="M 400 154 C 386 176 374 188 366 212 M 400 154 C 414 176 426 188 434 212 M 400 154 L 400 216"
        stroke={p.ink}
        strokeOpacity="0.55"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="322" y="252" width="156" height="548" rx="26" fill={`url(#${id}-main)`} fillOpacity="0.93" />
      <clipPath id={`${id}-clip`}>
        <rect x="322" y="252" width="156" height="548" rx="26" />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`}>
        <path
          d="M 300 352 C 356 330 446 372 506 344 M 300 470 C 362 446 438 490 506 462 M 300 590 C 352 568 436 610 506 580"
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="16"
        />
      </g>
      <rect
        x="322"
        y="252"
        width="156"
        height="548"
        rx="26"
        fill="none"
        stroke={p.ink}
        strokeOpacity="0.22"
        strokeWidth="2"
      />
      <circle cx="400" cy="300" r="12" fill={p.bg} />
      <path
        d="M 342 296 C 332 360 332 440 344 512"
        fill="none"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Bubbles
        points={[
          [438, 382, 5],
          [454, 428, 3],
          [420, 678, 4],
        ]}
      />
    </g>
  );
}

function Vase({ p, id }) {
  return (
    <g>
      <ellipse cx="404" cy="780" rx="220" ry="36" fill={shadow} filter={`url(#${id}-soft)`} />
      <path
        d="M 400 248 C 402 202 396 168 400 126"
        fill="none"
        stroke="#6B7359"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 400 166 C 430 152 454 164 462 188 C 440 200 414 192 400 166 Z"
        fill="#8D9A7C"
      />
      <path
        d="M 366 248 C 362 300 354 330 326 392 C 286 476 278 572 312 652 C 342 724 458 730 496 658 C 528 586 514 486 472 398 C 446 342 438 302 434 248 Z"
        fill={`url(#${id}-main)`}
        fillOpacity="0.9"
      />
      <ellipse cx="400" cy="248" rx="34" ry="10" fill={p.light} stroke={p.deep} strokeOpacity="0.4" />
      <path
        d="M 340 376 C 314 462 318 556 344 624 M 466 392 C 496 470 496 556 470 630"
        fill="none"
        stroke="rgba(255, 255, 255, 0.38)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 352 660 C 392 686 436 684 472 658"
        fill="none"
        stroke={p.ink}
        strokeOpacity="0.25"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Bubbles
        points={[
          [380, 470, 7],
          [422, 520, 5],
          [398, 578, 4],
        ]}
      />
    </g>
  );
}

function Dish({ p, id }) {
  return (
    <g>
      <ellipse cx="400" cy="716" rx="294" ry="42" fill={shadow} filter={`url(#${id}-soft)`} />
      <ellipse cx="400" cy="552" rx="282" ry="198" fill={p.deep} fillOpacity="0.5" />
      <ellipse cx="400" cy="542" rx="250" ry="170" fill={`url(#${id}-main)`} fillOpacity="0.94" />
      <ellipse
        cx="400"
        cy="542"
        rx="250"
        ry="170"
        fill="none"
        stroke="rgba(255, 255, 255, 0.48)"
        strokeWidth="3"
      />
      <path
        d="M 186 506 C 222 424 310 382 400 382 C 490 382 578 424 614 506"
        fill="none"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="342" cy="574" r="42" fill="none" stroke={p.ink} strokeOpacity="0.28" strokeWidth="6" />
      <circle cx="452" cy="588" r="16" fill={p.light} fillOpacity="0.7" />
      <Bubbles
        points={[
          [482, 492, 6],
          [314, 494, 4],
          [400, 620, 5],
        ]}
      />
    </g>
  );
}

function Frame({ p, id }) {
  return (
    <g>
      <ellipse cx="400" cy="780" rx="218" ry="34" fill={shadow} filter={`url(#${id}-soft)`} />
      <rect x="198" y="278" width="404" height="464" rx="28" fill={`url(#${id}-main)`} fillOpacity="0.92" />
      <rect
        x="198"
        y="278"
        width="404"
        height="464"
        rx="28"
        fill="none"
        stroke={p.ink}
        strokeOpacity="0.24"
        strokeWidth="2"
      />
      <rect x="274" y="352" width="252" height="312" rx="10" fill={p.paper} />
      <g clipPath={`url(#${id}-photo)`}>
        <circle cx="434" cy="464" r="52" fill={p.mid} fillOpacity="0.65" />
        <path d="M 274 590 C 326 548 372 558 408 590 C 444 622 482 600 526 566 L 526 664 L 274 664 Z" fill={p.deep} fillOpacity="0.35" />
      </g>
      <clipPath id={`${id}-photo`}>
        <rect x="274" y="352" width="252" height="312" rx="10" />
      </clipPath>
      <path
        d="M 228 330 C 250 306 300 294 356 294"
        fill="none"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 590 690 L 626 734"
        stroke={p.ink}
        strokeOpacity="0.3"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <Bubbles
        points={[
          [230, 660, 6],
          [578, 322, 5],
          [566, 700, 4],
        ]}
      />
    </g>
  );
}

function Pendant({ p, id }) {
  return (
    <g>
      <ellipse cx="400" cy="760" rx="170" ry="30" fill={shadow} filter={`url(#${id}-soft)`} />
      <path
        d="M 226 104 C 286 292 352 390 400 428 C 448 390 514 292 574 104"
        fill="none"
        stroke={p.ink}
        strokeOpacity="0.6"
        strokeWidth="4"
      />
      <circle cx="400" cy="436" r="18" fill="none" stroke={p.ink} strokeOpacity="0.6" strokeWidth="5" />
      <ellipse cx="400" cy="558" rx="112" ry="136" fill={`url(#${id}-main)`} fillOpacity="0.93" />
      <ellipse
        cx="400"
        cy="558"
        rx="112"
        ry="136"
        fill="none"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth="3"
      />
      <path
        d="M 344 492 C 330 534 332 586 350 622"
        fill="none"
        stroke="rgba(255, 255, 255, 0.55)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Bubbles
        points={[
          [432, 522, 6],
          [452, 564, 4],
          [418, 604, 3],
        ]}
      />
    </g>
  );
}

function Loop({ p, id }) {
  return (
    <g transform="translate(400 505)">
      <g opacity="0.9">
        <ellipse
          rx="238"
          ry="104"
          fill="none"
          stroke={`url(#${id}-main)`}
          strokeWidth="74"
          transform="rotate(-28)"
        />
        <ellipse
          rx="238"
          ry="104"
          fill="none"
          stroke={p.mid}
          strokeOpacity="0.72"
          strokeWidth="70"
          transform="rotate(52)"
        />
        <ellipse
          rx="238"
          ry="104"
          fill="none"
          stroke={p.light}
          strokeOpacity="0.72"
          strokeWidth="58"
          transform="rotate(-92)"
        />
      </g>
      <ellipse
        rx="238"
        ry="104"
        fill="none"
        stroke="rgba(255, 255, 255, 0.34)"
        strokeWidth="3"
        transform="rotate(-28)"
      />
      <circle cx="92" cy="-128" r="10" fill="rgba(255, 255, 255, 0.55)" />
      <circle cx="-154" cy="96" r="7" fill="rgba(255, 255, 255, 0.5)" />
    </g>
  );
}

const shapes = {
  coaster: Coaster,
  tray: Tray,
  keychain: Keychain,
  bookmark: Bookmark,
  vase: Vase,
  dish: Dish,
  frame: Frame,
  pendant: Pendant,
  loop: Loop,
};

export default function ResinArt({
  shape = "coaster",
  palette = "amber",
  className = "",
  label,
  withBackground = true,
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = `resin${uid}`;
  const p = palettes[palette] || palettes.amber;
  const Shape = shapes[shape] || Coaster;

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
        <linearGradient id={`${id}-main`} x1="0.12" y1="0" x2="0.88" y2="1">
          <stop offset="0" stopColor={p.light} />
          <stop offset="0.46" stopColor={p.mid} />
          <stop offset="1" stopColor={p.deep} />
        </linearGradient>
        <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      {withBackground && (
        <>
          <rect width="800" height="1000" fill={p.bg} />
          <circle cx="400" cy="430" r="290" fill={p.halo} opacity="0.55" />
        </>
      )}
      <Shape p={p} id={id} />
    </svg>
  );
}
