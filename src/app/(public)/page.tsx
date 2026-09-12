import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  LockKeyhole,
  Scissors,
  ShieldCheck,
  Store,
  Verified,
  Zap,
} from "lucide-react";
import styles from "./landing.module.css";

const workerSteps = [
  [
    "Create your profile",
    "Showcase your specialties, rates, experience, and portfolio.",
  ],
  [
    "Submit it for review",
    "Beauty Connect's approval ensures credentials are authentic and builds maximum trust with you and salons.",
  ],
  ["Wait for opportunities", "Wait for salons to send requests to you."],
  [
    "Respond to salon requests",
    "Accept, consider, or decline direct offers in one tap.",
  ],
];

const salonSteps = [
  [
    "Create your salon profile",
    "Create your profile and showcase what your salon offers.",
  ],
  [
    "Browse trusted workers",
    "Filter workers by their specialties, pay-rates, experience, and much more...",
  ],
  [
    "Send a request",
    "Offer a seat, shift, or permanent position instantly with transparency.",
  ],
  [
    "Connect when interest is mutual",
    "Unlock direct contact details after the worker agrees to what you are offering.",
  ],
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={`${styles.orb} ${styles.orbOne}`} aria-hidden="true" />
      <div className={`${styles.orb} ${styles.orbTwo}`} aria-hidden="true" />
      <div className={`${styles.orb} ${styles.orbThree}`} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            Beauty Connect
          </Link>

          <nav className={styles.nav} aria-label="Main navigation">
            <Link href="#how-it-works">How It Works</Link>
            <Link href="#roles">For Salons</Link>
            <Link href="#roles">For Workers</Link>
            <Link href="#trust">Verification</Link>
          </nav>

          <div className={styles.headerActions}>
            <Link href="/login" className={styles.loginLink}>
              Log In
            </Link>
            <Link href="/signup" className={styles.primarySmall}>
              Get Started <ArrowRight size={16} strokeWidth={2.4} />
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>
            <span className={styles.pulse} aria-hidden="true" />
            <span>The 2026 Beauty Marketplace</span>
            <span className={styles.dot}>•</span>
            <span className={styles.eyebrowMuted}>
              Verified Salons &amp; Stylists
            </span>
          </div>

          <Image
            src="/logo/logo.png"
            alt="Beauty Connect logo"
            width={104}
            height={104}
            priority
            className={styles.heroLogo}
          />

          <h1 className={styles.heroTitle}>
            Where <span className={styles.greenText}>Salons</span> Find Workers,
            <br className={styles.desktopBreak} /> and{" "}
            <span className={styles.gradientText}>Workers</span> Find Salons.
          </h1>

          <p className={styles.heroCopy}>
            Instant matchmaking, verified profiles &amp; seamless direct and
            mutual connections with zero friction.
          </p>

          <div className={styles.heroActions}>
            <Link href="/signup" className={styles.primaryButton}>
              Get Started Free <ArrowRight size={18} strokeWidth={2.4} />
            </Link>
            <Link href="/login" className={styles.secondaryButton}>
              <span className={styles.iconGreen}>
                <ArrowRight size={20} strokeWidth={2.2} />
              </span>
              Log In to Account
            </Link>
          </div>

          <div className={styles.previewWrap}>
            <div className={styles.previewGlow} aria-hidden="true" />
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <div>
                  <div className={styles.previewKicker}>
                    <Verified size={20} strokeWidth={2.2} />
                    Two-Way Marketplace
                  </div>
                  <h2>Connect in Minutes</h2>
                </div>
                <div className={styles.previewTags}>
                  <span className={styles.verifiedTag}>
                    100% Verified Workers
                  </span>
                  <span className={styles.matchTag}>Direct Matching</span>
                </div>
              </div>

              <div className={styles.previewGrid}>
                <div className={styles.previewPanel}>
                  <div className={styles.profileRow}>
                    <div
                      className={`${styles.avatarIcon} ${styles.avatarGreen}`}
                    >
                      <Store size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className={styles.profileKicker}>For Salons</div>
                      <div className={styles.profileName}>Eldoret Parlour</div>
                    </div>
                    <span className={styles.statusGreen}>Hiring</span>
                  </div>
                  <p>Discover instant verified workers ready to be hired.</p>
                  <div className={styles.panelFooter}>
                    4 Verified Specialists Booked
                  </div>
                </div>

                <div className={`${styles.previewPanel} ${styles.workerPanel}`}>
                  <div className={styles.profileRow}>
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWvbIuelTYagtvY_wuIhHZ3NzWoxWwBTu2p6ooyNSOseBHdIhW30fIzIk2ko7pR_slVdl1xh38BE2uLpukgXBi9pGVeGAU8PGYlJvRy1dNY1_ora4rja08fWd81ctnQ2Xn-f78-GWy4Iq8WQjArXfBIeuY0suOTCsweDup-yTY8-YibqH2dYMcTV6lrNx-s7eCTt-JhrFKcLJGb7UR467QiRrbAhc1aXkDjeDGq1SftC6r_qu7VrLtDA"
                      alt="Jade Cherop"
                      className={styles.workerImage}
                    />
                    <div>
                      <div className={styles.profileKickerPurple}>
                        For Workers
                      </div>
                      <div className={styles.profileName}>Jade Cherop</div>
                    </div>
                    <span className={styles.statusPurple}>
                      Available for hire
                    </span>
                  </div>
                  <p>Direct salon offers come straight to your dashboard.</p>
                  <div className={styles.panelFooter}>
                    42 Salons Viewed Your Profile
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.pathways}>
        <div className={styles.contentWidth}>
          <div className={styles.sectionIntro}>
            <span className={styles.sectionKicker}>
              Clear &amp; simple Process
            </span>
            <h2>How Beauty Connect Works</h2>
            <p>
              Step by step guidance for both salon owners seeking vetted workers
              and beauty specialists finding opportunities.
            </p>
          </div>

          <div id="roles" className={styles.pathwayGrid}>
            <Pathway
              kind="worker"
              icon={<Scissors size={24} strokeWidth={2} />}
              kicker="Worker Track"
              title="For Beauty Specialists"
              audience="Stylists • Barbers • Estheticians"
              steps={workerSteps}
              action="Join as a Specialist"
            />
            <Pathway
              kind="salon"
              icon={<Store size={24} strokeWidth={2} />}
              kicker="Salon Track"
              title="For Salon Owners"
              audience="Spas • Parlours • Boutiques"
              steps={salonSteps}
              action="Register Your Salon"
            />
          </div>
        </div>
      </section>

      <section id="trust" className={styles.trustSection}>
        <div className={styles.contentWidth}>
          <div className={styles.trustIntro}>
            <h2>Why Trust Us</h2>
          </div>
          <div className={styles.trustGrid}>
            <Feature
              tone="green"
              icon={<ShieldCheck size={26} strokeWidth={2} />}
              title="Vetted Professionals"
              copy="Every specialist's profile is carefully reviewed to verify their experience, authenticity and professional standards."
            />
            <Feature
              tone="purple"
              icon={<LockKeyhole size={26} strokeWidth={2} />}
              title="Mutual Interest Connection"
              copy="No spam or unsolicited reach. Direct contact information is only shared when both the salon and the worker show interest."
            />
            <Feature
              tone="green"
              icon={<Zap size={26} strokeWidth={2} />}
              title="Instant Agreements"
              copy="Salons send offers, workers review and respond in seconds directly from mobile."
            />
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <div
            className={`${styles.ctaGlow} ${styles.ctaGlowLeft}`}
            aria-hidden="true"
          />
          <div
            className={`${styles.ctaGlow} ${styles.ctaGlowRight}`}
            aria-hidden="true"
          />
          <Handshake className={styles.ctaIcon} size={36} strokeWidth={1.8} />
          <h2>Ready to elevate your beauty career or studio?</h2>
          <p>
            Join hundreds of hired professionals &amp; salons that hire
            professionals seamlessly on Beauty Connect.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/signup" className={styles.primaryButton}>
              Get Started Now
            </Link>
            <Link href="/login" className={styles.secondaryButton}>
              Log In to Account
            </Link>
          </div>
          <div className={styles.proofRow}>
            <span>
              <CheckCircle2 size={16} /> Free registration
            </span>
            <span>
              <CheckCircle2 size={16} /> Verified workers
            </span>
            <span>
              <CheckCircle2 size={16} /> Zero hidden fees
            </span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link href="/" className={styles.footerBrand}>
            <span className={styles.footerMark} aria-hidden="true" />
            Beauty Connect
          </Link>
          <nav className={styles.footerLinks} aria-label="Footer navigation">
            <Link href="/terms">Terms &amp; Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="#trust">Contact Support</Link>
            <Link href="#trust">Trust &amp; Safety</Link>
          </nav>
          <span>© 2026 Beauty Connect. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}

function Pathway({
  kind,
  icon,
  kicker,
  title,
  audience,
  steps,
  action,
}: {
  kind: "worker" | "salon";
  icon: React.ReactNode;
  kicker: string;
  title: string;
  audience: string;
  steps: string[][];
  action: string;
}) {
  return (
    <div
      className={`${styles.pathwayCard} ${kind === "worker" ? styles.workerCard : styles.salonCard}`}
    >
      <div className={styles.pathwayGlow} aria-hidden="true" />
      <div>
        <div className={styles.pathwayHeader}>
          <div className={styles.pathwayHeading}>
            <div className={styles.pathwayIcon}>{icon}</div>
            <div>
              <span>{kicker}</span>
              <h3>{title}</h3>
            </div>
          </div>
          <span className={styles.audience}>{audience}</span>
        </div>
        <div className={styles.steps}>
          {steps.map(([step, description], index) => (
            <div className={styles.step} key={step}>
              <div className={styles.stepNumber}>{index + 1}</div>
              <div>
                <h4>{step}</h4>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Link href="/signup" className={styles.pathwayAction}>
        {action} <ArrowRight size={17} strokeWidth={2.2} />
      </Link>
    </div>
  );
}

function Feature({
  tone,
  icon,
  title,
  copy,
}: {
  tone: "green" | "purple";
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className={styles.feature}>
      <div
        className={`${styles.featureIcon} ${tone === "green" ? styles.featureGreen : styles.featurePurple}`}
      >
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}
