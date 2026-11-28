import { useEffect, useState, type ReactNode } from "react";
import { Search, User, ShoppingCart, Truck, Award, ArrowUp } from "lucide-react";
import logoWordmark from "@/assets/logo-wordmark.png";

// The store's current logos, served from rosaleigh.co.uk (header: dark; footer: gold).
export const STORE_LOGO = "https://rosaleigh.co.uk/cdn/shop/files/Artboard_1_4x_85e41ec8-bd8c-4f63-b533-b3f8bb20711b.png";
export const STORE_FOOTER_LOGO =
  "https://rosaleigh.co.uk/cdn/shop/files/Artboard_1_copy_2_4x_52456e98-fed0-4fc1-aa9a-91c675ba993a.png";
const TRUSTPILOT = "https://uk.trustpilot.com/review/rosaleigh.co.uk";

/* ---------------------------------------------------------------------------
   Rosaleigh theme tokens — copied from the Shopify theme settings
--------------------------------------------------------------------------- */
const T = {
  bg: "#FFFFFF",
  heading: "#231F20",
  text: "#4A4546",
  link: "#9A5A22",
  line: "#E6E1DE",
  secondaryBg: "#F7F1EE",
  btnHover: "#F0C020",
  btnHoverText: "#231F20",
  footerBg: "#231F20",
  footerHeading: "#FFFFFF",
  footerText: "#D9D3D0",
  footerLink: "#F0C020",
  footerLine: "#3A3435",
} as const;

const BODY_FONT = "Figtree, sans-serif";
const HEADING_FONT = "'Instrument Serif', serif";
const BASE_SIZE = "15.4px"; // body base size 110%
const PAGE_WIDTH = 1300;

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap";

function useThemeFonts() {
  useEffect(() => {
    if (document.getElementById("rl-theme-fonts")) return;
    const link = document.createElement("link");
    link.id = "rl-theme-fonts";
    link.rel = "stylesheet";
    link.href = FONTS_HREF;
    document.head.appendChild(link);
  }, []);
}

/* ---------------------------------------------------------------------------
   LINKS
   Confirmed by you: home, shop, our story, routine finder, contact.
   The rest (marked "unconfirmed") are guesses — check them on the live store.
--------------------------------------------------------------------------- */
const SITE = "https://rosaleigh.co.uk";

const URLS = {
  home: `${SITE}/`,
  shop: `${SITE}/collections/all`,
  story: `${SITE}/pages/ourstory`,
  routineFinder: "https://routinefinderofrosaleigh.vercel.app/",
  contact: `${SITE}/pages/contact`,
  // unconfirmed
  account: `${SITE}/account`,
  cart: `${SITE}/cart`,
  search: `${SITE}/search`,
  skinCare: `${SITE}/collections/skin-care`,
  beauty: `${SITE}/collections/beauty`,
  trio: `${SITE}/collections/bundles`,
  ingredients: `${SITE}/pages/ingredients`,
  faq: `${SITE}/pages/faq`,
  shipping: `${SITE}/policies/shipping-policy`,
  refunds: `${SITE}/policies/refund-policy`,
  privacy: `${SITE}/policies/privacy-policy`,
  terms: `${SITE}/policies/terms-of-service`,
  cookies: `${SITE}/pages/cookie-policy`,
  legal: `${SITE}/policies/legal-notice`,
} as const;

/* ---------------------------------------------------------------------------
   HEADER
--------------------------------------------------------------------------- */
const ANNOUNCEMENTS: { icon: ReactNode; text: string }[] = [
  { icon: <Truck className="h-5 w-5" />, text: "Free UK shipping over £70" },
  { icon: <Award className="h-5 w-5" />, text: "10% off your first order" },
];

const NAV_LINKS = [
  { label: "Home", href: URLS.home, pill: false },
  { label: "Shop", href: URLS.shop, pill: false },
  { label: "Our Story", href: URLS.story, pill: false },
  { label: "Routine Finder", href: URLS.routineFinder, pill: true },
  { label: "Contact Us", href: URLS.contact, pill: false },
];

/* Nav text link hover: label rolls up, brown copy rolls in, underline draws in */
function NavTextLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="group relative inline-block shrink-0 overflow-hidden whitespace-nowrap font-medium"
      style={{ color: T.heading, fontFamily: BODY_FONT, fontSize: BASE_SIZE }}
    >
      <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-full">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 block translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0"
        style={{ color: T.link }}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
        style={{ background: T.link }}
      />
    </a>
  );
}

export function Header() {
  useThemeFonts();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const current = ANNOUNCEMENTS[index] ?? ANNOUNCEMENTS[0];

  return (
    <>
      {/* Announcement bar */}
      <div
        className="flex items-center justify-center gap-3 px-5"
        aria-live="polite"
        style={{
          background: T.footerBg,
          color: "#FFFFFF",
          fontFamily: BODY_FONT,
          fontSize: BASE_SIZE,
          minHeight: 48,
        }}
      >
        {current?.icon}
        <span key={index}>{current?.text}</span>
      </div>

      {/* Main header */}
      <header
        style={{
          background: T.bg,
          color: T.heading,
          fontFamily: BODY_FONT,
          fontSize: BASE_SIZE,
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <div className="mx-auto px-5 pt-[18px] md:px-7" style={{ maxWidth: PAGE_WIDTH }}>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <a href={URLS.home} className="shrink-0" aria-label="Rosaleigh home">
              <img
                src={`${STORE_LOGO}?width=400`}
                alt="Rosaleigh"
                width={160}
                height={45}
                style={{ height: 45, width: "auto" }}
                onError={(e) => {
                  const img = e.currentTarget;
                  img.onerror = null;
                  img.src = logoWordmark;
                  img.style.filter = "brightness(0)";
                }}
              />
            </a>

            {/* Search */}
            <form
              action={URLS.search}
              method="get"
              className="order-3 flex w-full items-center gap-3 md:order-none md:w-auto md:flex-1"
              style={{
                background: T.secondaryBg,
                borderRadius: 999,
                height: 56,
                padding: "0 24px",
              }}
            >
              <Search className="h-5 w-5 shrink-0" style={{ color: T.text }} />
              <input
                type="search"
                name="q"
                placeholder="Search skin care and beauty"
                aria-label="Search"
                className="w-full bg-transparent focus:outline-none"
                style={{ color: T.heading, fontFamily: BODY_FONT, fontSize: BASE_SIZE }}
              />
            </form>

            {/* Icons */}
            <div className="ml-auto flex items-center gap-6 md:ml-0">
              <a
                href={URLS.account}
                aria-label="Account"
                className="transition-opacity hover:opacity-70"
                style={{ color: T.heading }}
              >
                <User className="h-6 w-6" />
              </a>
              <a
                href={URLS.cart}
                aria-label="Cart"
                className="transition-opacity hover:opacity-70"
                style={{ color: T.heading }}
              >
                <ShoppingCart className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Nav */}
          <nav
            className="-mx-5 flex items-center gap-6 overflow-x-auto px-5 [scrollbar-width:none] md:-mx-0 md:gap-8 md:px-0 [&::-webkit-scrollbar]:hidden"
            style={{ paddingTop: 16, paddingBottom: 14 }}
            aria-label="Main"
          >
            {NAV_LINKS.map((link) =>
              link.pill ? (
                <a
                  key={link.label}
                  href={link.href}
                  aria-current="page"
                  className="shrink-0 whitespace-nowrap font-medium transition-opacity hover:opacity-90"
                  style={{
                    background: T.btnHover,
                    color: T.btnHoverText,
                    borderRadius: 999,
                    padding: "12px 26px",
                    fontFamily: BODY_FONT,
                    fontSize: BASE_SIZE,
                  }}
                >
                  {link.label}
                </a>
              ) : (
                <NavTextLink key={link.label} label={link.label} href={link.href} />
              ),
            )}
          </nav>
        </div>
      </header>
    </>
  );
}

/* ---------------------------------------------------------------------------
   FOOTER
--------------------------------------------------------------------------- */
export const DISCLAIMER =
  "This routine is generated automatically from your answers (and, if you used the skin scan, readings from your photo) for general skincare guidance only. It is not a medical or dermatological diagnosis. Individual results vary. If you have a diagnosed skin condition, please consult a dermatologist before starting a new routine.";

const GOOD_TO_KNOW = [
  "Food supplements are not medicines and should not replace a varied diet, so do not exceed the recommended daily dose, keep them out of reach of children and consult a healthcare professional if you are pregnant, breastfeeding or taking medication.",
  "Patch test skincare before first use. Images are AI-generated for illustration.",
];

const SHOP_LINKS = [
  { label: "Home", href: URLS.home },
  { label: "Shop", href: URLS.shop },
  { label: "Our Story", href: URLS.story },
  { label: "Routine Finder", href: URLS.routineFinder },
  { label: "Contact Us", href: URLS.contact },
];

const HELP_LINKS = [
  { label: "Contact us", href: URLS.contact },
  { label: "FAQ", href: URLS.faq },
  { label: "Shipping", href: URLS.shipping },
  { label: "Returns & refunds", href: URLS.refunds },
];

const ABOUT_LINKS = [
  { label: "Our story", href: URLS.story },
  { label: "Ingredients", href: URLS.ingredients },
  { label: "Routine Finder", href: URLS.routineFinder },
];

const BOTTOM_LINKS = [
  { label: "Privacy", href: URLS.privacy },
  { label: "Terms", href: URLS.terms },
  { label: "Cookies", href: URLS.cookies },
  { label: "Legal notice", href: URLS.legal },
];

/** Brand icons from Simple Icons (CC0), 24×24 viewBox. Set each profile URL in `href`. */
const SOCIALS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61593593936014",
    path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  },
  {
    label: "Pinterest",
    href: "https://pin.it/3zDGu3Ofw",
    path: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/rosaleigh_uk",
    path: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@rosaleigh_uk",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
];

function PayBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        background: "#FFFFFF",
        borderRadius: 4,
        width: 46,
        height: 30,
        fontFamily: BODY_FONT,
      }}
    >
      {children}
    </span>
  );
}

function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
      <PayBadge>
        <span style={{ color: "#1A1F71", fontWeight: 800, fontStyle: "italic", fontSize: 12 }}>
          VISA
        </span>
      </PayBadge>
      <PayBadge>
        <svg width="28" height="18" viewBox="0 0 28 18" aria-label="Mastercard">
          <circle cx="10" cy="9" r="8" fill="#EB001B" />
          <circle cx="18" cy="9" r="8" fill="#F79E1B" fillOpacity="0.9" />
        </svg>
      </PayBadge>
      <PayBadge>
        <span
          style={{
            color: "#FFFFFF",
            background: "#2E77BC",
            fontWeight: 800,
            fontSize: 9,
            padding: "4px 5px",
            borderRadius: 2,
          }}
        >
          AMEX
        </span>
      </PayBadge>
      <PayBadge>
        <span style={{ color: "#003087", fontWeight: 800, fontStyle: "italic", fontSize: 11 }}>
          PayPal
        </span>
      </PayBadge>
      <PayBadge>
        <span style={{ color: "#0079BE", fontWeight: 700, fontSize: 9 }}>Diners</span>
      </PayBadge>
      <PayBadge>
        <span style={{ color: "#E55C20", fontWeight: 800, fontSize: 7 }}>DISCOVER</span>
      </PayBadge>
    </div>
  );
}

export function Footer() {
  useThemeFonts();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const colHeading = {
    color: T.footerLink,
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
  };

  const linkClass = "transition-colors hover:text-[#F0C020]";
  const linkStyle = { color: T.footerText, fontFamily: BODY_FONT, fontSize: BASE_SIZE };

  return (
    <footer
      style={{
        background: T.footerBg,
        color: T.footerText,
        fontFamily: BODY_FONT,
        fontSize: BASE_SIZE,
      }}
    >
      <div className="mx-auto" style={{ maxWidth: PAGE_WIDTH, padding: "0 28px" }}>
        {/* Subscribe band */}
        <div
          className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-16"
          style={{ padding: "72px 0 56px", borderBottom: `1px solid ${T.footerLine}` }}
        >
          <div>
            <h2
              style={{
                color: T.footerHeading,
                fontFamily: HEADING_FONT,
                fontWeight: 400,
                fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                lineHeight: 1.05,
                letterSpacing: 0,
                margin: 0,
              }}
            >
              Get <em style={{ fontStyle: "italic", color: T.footerLink }}>10% off</em> your first
              order
            </h2>
            <p style={{ marginTop: 16, maxWidth: 520, color: T.footerText, lineHeight: 1.6 }}>
              Routine tips, new launches and members-only offers. Unsubscribe anytime.
            </p>
          </div>

          <div>
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                className="w-full flex-1 bg-transparent focus:outline-none"
                style={{
                  border: `1px solid ${T.footerText}`,
                  borderRadius: 999,
                  height: 64,
                  padding: "0 28px",
                  color: T.footerHeading,
                  fontFamily: BODY_FONT,
                  fontSize: BASE_SIZE,
                }}
              />
              <button
                type="submit"
                className="transition-opacity hover:opacity-90"
                style={{
                  background: T.btnHover,
                  color: T.btnHoverText,
                  borderRadius: 999,
                  height: 64,
                  padding: "0 36px",
                  fontFamily: BODY_FONT,
                  fontSize: BASE_SIZE,
                  fontWeight: 600,
                }}
              >
                Subscribe
              </button>
            </form>
            <p style={{ marginTop: 16, fontSize: 13.5, color: T.footerText, lineHeight: 1.6 }}>
              By subscribing you agree to receive marketing emails from Rosaleigh. See our{" "}
              <a
                href={URLS.privacy}
                className="underline hover:text-[#F0C020]"
                style={{ color: T.footerHeading }}
              >
                Privacy policy
              </a>
              .
            </p>
          </div>
        </div>

        {/* Main grid */}
        <div
          className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]"
          style={{ padding: "56px 0 0" }}
        >
          <div className="col-span-2 md:col-span-1">
            <a href={URLS.home} aria-label="Rosaleigh home">
              <img
                src={`${STORE_FOOTER_LOGO}?width=440`}
                alt="Rosaleigh"
                width={220}
                height={62}
                style={{ height: 62, width: "auto" }}
                onError={(e) => {
                  const img = e.currentTarget;
                  img.onerror = null;
                  img.src = logoWordmark;
                }}
              />
            </a>
            <p style={{ marginTop: 16, maxWidth: 420, color: T.footerText, lineHeight: 1.6 }}>
              We stand by every drop. UK-based skincare you can believe in.
            </p>
            <div className="flex items-center gap-3" style={{ marginTop: 24 }}>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Rosaleigh on ${s.label}`}
                  title={s.label}
                  className="flex items-center justify-center transition-colors hover:border-[#F0C020] hover:text-[#F0C020]"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    border: `1px solid ${T.footerLine}`,
                    color: T.footerHeading,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-[18px] w-[18px]"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 style={colHeading}>Shop</h3>
            <ul style={{ marginTop: 24, display: "grid", gap: 20 }}>
              {SHOP_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className={linkClass} style={linkStyle}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={colHeading}>Help</h3>
            <ul style={{ marginTop: 24, display: "grid", gap: 20 }}>
              {HELP_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className={linkClass} style={linkStyle}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={colHeading}>About</h3>
            <ul style={{ marginTop: 24, display: "grid", gap: 20 }}>
              {ABOUT_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className={linkClass} style={linkStyle}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Good to know */}
          <div
            className="col-span-2 md:col-span-4"
            style={{
              border: `1px solid ${T.footerLine}`,
              borderRadius: 28,
              padding: "28px 32px",
            }}
          >
            <p style={{ ...colHeading, margin: 0 }}>Good to know</p>
            {GOOD_TO_KNOW.map((t, i) => (
              <p key={i} style={{ marginTop: i === 0 ? 12 : 6, color: T.footerText, lineHeight: 1.7, fontSize: 14.5 }}>
                {t}
              </p>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center"
          style={{ marginTop: 40, padding: "28px 0", borderTop: `1px solid ${T.footerLine}` }}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2" style={{ fontSize: 14.5 }}>
            <span>© 2026 Rosaleigh</span>
            {BOTTOM_LINKS.map((l) => (
              <span key={l.label} className="flex items-center gap-3">
                <span aria-hidden="true">·</span>
                <a href={l.href} className={linkClass} style={{ color: T.footerText }}>
                  {l.label}
                </a>
              </span>
            ))}
          </div>
          <a
            href={TRUSTPILOT}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 transition-colors hover:border-[#F0C020]"
            style={{
              border: `1px solid ${T.footerLine}`,
              borderRadius: 999,
              padding: "10px 20px",
              color: T.footerText,
              fontSize: 14.5,
            }}
          >
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center"
              style={{ background: "#00B67A", borderRadius: 3 }}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#FFFFFF">
                <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.8 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z" />
              </svg>
            </span>
            See our reviews on <strong style={{ color: T.footerHeading }}>Trustpilot</strong>
            <span aria-hidden="true">→</span>
          </a>
          <PaymentBadges />
        </div>
      </div>

      {/* Back to top */}
      {showTop && (
        <button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed z-40 flex items-center justify-center transition-opacity hover:opacity-90"
          style={{
            right: 28,
            bottom: 28,
            width: 60,
            height: 60,
            borderRadius: 999,
            background: T.btnHover,
            color: T.btnHoverText,
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          }}
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </footer>
  );
}
