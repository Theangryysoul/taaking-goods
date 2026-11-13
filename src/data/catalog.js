// ---------------------------------------------------------------------------
// SAMPLE CATALOGUE
//
// These pieces are placeholders, written to show the layout. Replace the
// names, descriptions, and details with your real pieces. Set `price` to a
// number in rupees when you are ready; until then every price shows as
// "Price on enquiry". To use your own photographs, add `image: "/images/file.jpg"`
// (put the file in `public/images`) and the generated visual steps aside.
// ---------------------------------------------------------------------------

export const categories = ["All", "Tableware", "Decor", "Gifting", "Jewellery"];

export const products = [
  {
    id: "sandbar-coasters",
    slug: "sandbar-coaster-set",
    name: "Sandbar coaster set",
    category: "Tableware",
    price: null,
    art: { shape: "coaster", palette: "amber" },
    image: null,
    summary: "Four cast coasters in warm sand, each one a shade apart.",
    description:
      "Poured as a single set so the tones sit together. The surface is sanded flat and sealed to a soft satin finish, with a quiet base that keeps tables free of scratches.",
    details: [
      "Set of four",
      "Approx 9 cm × 9 cm",
      "Satin sealed finish",
      "Wipe with a soft dry cloth",
    ],
    featured: true,
  },
  {
    id: "ember-tray",
    slug: "ember-catchall-tray",
    name: "Ember catchall tray",
    category: "Decor",
    price: null,
    art: { shape: "tray", palette: "clay" },
    image: null,
    summary: "A shallow tray for keys, rings, and the small things that wander.",
    description:
      "A low tray with a soft, uneven rim, cast in a warm clay tone. It suits an entryway, a bedside table, or the corner of a desk where pockets empty out.",
    details: [
      "Approx 22 cm × 14 cm",
      "Hand sanded rim",
      "Felt pads underneath",
      "Wipe with a soft dry cloth",
    ],
    featured: true,
  },
  {
    id: "moss-keychain",
    slug: "moss-petal-keychain",
    name: "Moss petal keychain",
    category: "Gifting",
    price: null,
    art: { shape: "keychain", palette: "sage" },
    image: null,
    summary: "A single resin petal on a light metal ring, small enough for a pocket.",
    description:
      "A small petal cast in moss green, with a little translucency at the edge. Easy to add to a gift, a set of keys, or a bag that needs one quiet detail.",
    details: [
      "Approx 6 cm long",
      "Light metal ring",
      "Hand sanded edges",
      "Wipe with a soft dry cloth",
    ],
    featured: true,
  },
  {
    id: "tide-bookmark",
    slug: "tide-bookmark",
    name: "Tide bookmark",
    category: "Gifting",
    price: null,
    art: { shape: "bookmark", palette: "mist" },
    image: null,
    summary: "A slim pour with a cotton tassel, for the book you keep returning to.",
    description:
      "A thin bookmark with a sea glass tone and a soft cotton tassel. It sits flat between pages and looks good left on a bedside stack.",
    details: [
      "Approx 15 cm long",
      "Cotton tassel",
      "Rounded corners",
      "Wipe with a soft dry cloth",
    ],
    featured: false,
  },
  {
    id: "amber-vase",
    slug: "amber-bud-vase",
    name: "Amber bud vase",
    category: "Decor",
    price: null,
    art: { shape: "vase", palette: "honey" },
    image: null,
    summary: "A small vase for one stem, or for standing on its own.",
    description:
      "A hand poured bud vase with a narrow neck and a warm amber body. Made for a single stem, a dried sprig, or an empty shelf that needs a little light.",
    details: [
      "Approx 16 cm tall",
      "Watertight chamber",
      "Hand finished rim",
      "Wipe with a soft damp cloth",
    ],
    featured: true,
  },
  {
    id: "clay-dish",
    slug: "clay-jewellery-dish",
    name: "Clay jewellery dish",
    category: "Tableware",
    price: null,
    art: { shape: "dish", palette: "clay" },
    image: null,
    summary: "A soft oval dish for the pieces you take off at the end of the day.",
    description:
      "An oval dish with a shallow well, cast in a muted clay tone. It gives rings, earrings, and a watch a place to land without taking over the dresser.",
    details: [
      "Approx 14 cm × 10 cm",
      "Shallow well",
      "Hand sanded edges",
      "Wipe with a soft dry cloth",
    ],
    featured: true,
  },
  {
    id: "fog-frame",
    slug: "fog-photo-frame",
    name: "Fog photo frame",
    category: "Decor",
    price: null,
    art: { shape: "frame", palette: "smoke" },
    image: null,
    summary: "A translucent frame that lets a little light through.",
    description:
      "A small frame cast in a soft smoke tone, with a frosted edge that catches window light. Made for a favourite print or a postcard from a good trip.",
    details: [
      "Fits a 10 cm × 15 cm print",
      "Translucent resin body",
      "Kick stand at the back",
      "Wipe with a soft dry cloth",
    ],
    featured: false,
  },
  {
    id: "ochre-pendant",
    slug: "ochre-pendant",
    name: "Ochre pendant",
    category: "Jewellery",
    price: null,
    art: { shape: "pendant", palette: "amber" },
    image: null,
    summary: "A warm oval on a fine chain, light enough to forget you have it on.",
    description:
      "A small amber oval, polished to a soft glow and hung on a fine chain. Each pour carries a slightly different depth, so no two sit exactly the same.",
    details: [
      "Approx 3 cm pendant",
      "Fine metal chain",
      "Hand polished",
      "Store away from direct sun",
    ],
    featured: true,
  },
];

export const featuredProducts = products.filter((product) => product.featured);

export const getProduct = (slug) => products.find((product) => product.slug === slug);

export const getProductById = (id) => products.find((product) => product.id === id);

export const getRelated = (product, limit = 3) =>
  products
    .filter((item) => item.id !== product.id)
    .sort((a, b) => {
      const sameA = a.category === product.category ? 0 : 1;
      const sameB = b.category === product.category ? 0 : 1;
      return sameA - sameB;
    })
    .slice(0, limit);
