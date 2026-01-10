import { motion, type Variants } from "framer-motion";
import { useState, useEffect } from "react";
import Button from "./ui/Button";
import {
  TimerIcon,
  ChartIcon,
  TargetIcon,
  DevicesIcon,
  HistoryIcon,
  LockIcon,
} from "./Icons";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

// Section wrapper for consistent centering
const Section = ({
  children,
  dark = false,
  noPadding = false,
  id,
}: {
  children: React.ReactNode;
  dark?: boolean;
  noPadding?: boolean;
  id?: string;
}) => (
  <section
    id={id}
    style={{
      width: "100%",
      backgroundColor: dark ? "#101012" : "#0B0B0C",
    }}
  >
    <div
      style={{
        maxWidth: "1200px",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: "24px",
        paddingRight: "24px",
        paddingTop: noPadding ? 0 : "120px",
        paddingBottom: noPadding ? 0 : "120px",
      }}
    >
      {children}
    </div>
  </section>
);

export default function LandingPage({
  onGetStarted,
  onSignIn,
}: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    {
      icon: <TimerIcon />,
      title: "Precision Timer",
      desc: "Track fasts down to the second. Start, pause, resume. Full control.",
    },
    {
      icon: <ChartIcon />,
      title: "Progress Metrics",
      desc: "Visualize streaks, durations, and patterns. Data that drives consistency.",
    },
    {
      icon: <TargetIcon />,
      title: "Protocol Library",
      desc: "16:8, 20:4, OMAD, extended fasts. Choose your interval. Own your schedule.",
    },
    {
      icon: <DevicesIcon />,
      title: "Cross-Platform Sync",
      desc: "Access your data anywhere. Desktop, tablet, mobile. Always in sync.",
    },
    {
      icon: <HistoryIcon />,
      title: "Complete History",
      desc: "Every fast logged. Review, analyze, and export your entire journey.",
    },
    {
      icon: <LockIcon />,
      title: "Private by Default",
      desc: "Your data stays yours. Encrypted. Never sold. No third parties.",
    },
  ];

  const metrics = [
    { value: "50K+", label: "Active Users" },
    { value: "2M+", label: "Fasts Completed" },
    { value: "99.9%", label: "Uptime" },
  ];

  const steps = [
    {
      num: "01",
      title: "Create your account",
      desc: "30 seconds. No credit card. Start immediately.",
    },
    {
      num: "02",
      title: "Set your protocol",
      desc: "Choose an interval or create your own. We adapt to you.",
    },
    {
      num: "03",
      title: "Track and improve",
      desc: "Every fast builds your baseline. Consistency compounds.",
    },
  ];

  const plans = [
    {
      name: "Basic",
      price: "£0",
      period: "forever",
      features: [
        "Core timer",
        "7-day history",
        "Basic analytics",
        "3 protocols",
      ],
      cta: "Start Free",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "£7",
      period: "month",
      features: [
        "Unlimited history",
        "All protocols",
        "Advanced analytics",
        "Data export",
        "Custom fasts",
        "Priority support",
      ],
      cta: "Go Pro",
      highlighted: true,
    },
    {
      name: "Infinite Pro",
      price: "£99",
      period: "one-time",
      features: [
        "Everything in Pro",
        "Lifetime access",
        "All future updates",
        "Early feature access",
        "Founder badge",
      ],
      cta: "Get Lifetime",
      highlighted: false,
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        overflowX: "hidden",
        backgroundColor: "#0B0B0C",
        color: "#F5F5F5",
      }}
    >
      {/* ==================== FIXED NAVIGATION ==================== */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: "20px 24px",
          backgroundColor:
            scrolled || mobileMenuOpen
              ? "rgba(11, 11, 12, 0.98)"
              : "transparent",
          backdropFilter: scrolled || mobileMenuOpen ? "blur(20px)" : "none",
          borderBottom: scrolled
            ? "1px solid #1F1F24"
            : "1px solid transparent",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Interflow
          </div>

          {/* Desktop Nav Links */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "40px",
            }}
            className="desktop-nav"
          >
            <div style={{ display: "flex", gap: "32px" }}>
              {[
                { label: "Features", id: "features" },
                { label: "How it Works", id: "how-it-works" },
                { label: "Pricing", id: "pricing" },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9A9A9E",
                    fontSize: "14px",
                    fontWeight: 400,
                    letterSpacing: "0.02em",
                    cursor: "pointer",
                    transition: "color 0.3s ease",
                    padding: 0,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#F5F5F5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#9A9A9E")
                  }
                >
                  {link.label}
                </button>
              ))}
            </div>

            <button
              onClick={onSignIn}
              style={{
                padding: "12px 28px",
                backgroundColor: "#F5F5F5",
                border: "none",
                color: "#0B0B0C",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0B0B0C";
                e.currentTarget.style.color = "#F5F5F5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#F5F5F5";
                e.currentTarget.style.color = "#0B0B0C";
              }}
            >
              Sign In
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "#F5F5F5",
              cursor: "pointer",
              padding: "8px",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            <span
              style={{
                display: "block",
                width: "24px",
                height: "2px",
                backgroundColor: "#F5F5F5",
                transition: "all 0.3s ease",
                transform: mobileMenuOpen
                  ? "rotate(45deg) translateY(7px)"
                  : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: "24px",
                height: "2px",
                backgroundColor: "#F5F5F5",
                transition: "all 0.3s ease",
                opacity: mobileMenuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block",
                width: "24px",
                height: "2px",
                backgroundColor: "#F5F5F5",
                transition: "all 0.3s ease",
                transform: mobileMenuOpen
                  ? "rotate(-45deg) translateY(-7px)"
                  : "none",
              }}
            />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className="mobile-menu"
          style={{
            display: "none",
            flexDirection: "column",
            gap: "0",
            paddingTop: mobileMenuOpen ? "24px" : "0",
            maxHeight: mobileMenuOpen ? "400px" : "0",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
        >
          {[
            { label: "Features", id: "features" },
            { label: "How it Works", id: "how-it-works" },
            { label: "Pricing", id: "pricing" },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: "1px solid #1F1F24",
                color: "#F5F5F5",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                padding: "16px 0",
                textAlign: "left",
                width: "100%",
              }}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onSignIn();
            }}
            style={{
              marginTop: "16px",
              padding: "16px 28px",
              backgroundColor: "#F5F5F5",
              border: "none",
              color: "#0B0B0C",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Mobile styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .mobile-menu {
            display: flex !important;
          }
        }
      `}</style>

      {/* ==================== HERO SECTION ==================== */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "140px 24px 120px 24px",
          position: "relative",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "1000px",
            height: "600px",
            background:
              "radial-gradient(ellipse at center top, rgba(255,255,255,0.03) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          style={{
            textAlign: "center",
            maxWidth: "900px",
            width: "100%",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} style={{ marginBottom: "32px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "8px 16px",
                border: "1px solid #1F1F24",
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#9A9A9E",
              }}
            >
              Science-Backed Fasting
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            style={{
              fontSize: "clamp(48px, 10vw, 80px)",
              fontWeight: 600,
              lineHeight: 1.05,
              marginBottom: "32px",
              letterSpacing: "-0.03em",
            }}
          >
            Control your intervals.
            <br />
            <span style={{ color: "#6B6B6B" }}>Master your flow.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            style={{
              fontSize: "20px",
              color: "#9A9A9E",
              maxWidth: "560px",
              margin: "0 auto 48px auto",
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          >
            Interflow is a precision fasting tracker built for those who take
            their health seriously. No fluff. Just data, discipline, and
            results.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeInUp} style={{ marginBottom: "80px" }}>
            <Button variant="primary" size="lg" onClick={onGetStarted}>
              Start Your Fast
            </Button>
          </motion.div>

          {/* Metrics */}
          <motion.div
            variants={fadeInUp}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "64px",
              flexWrap: "wrap",
            }}
          >
            {metrics.map((metric, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    marginBottom: "8px",
                  }}
                >
                  {metric.value}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6B6B6B",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {metric.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <Section id="features" dark>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            style={{ textAlign: "center", marginBottom: "80px" }}
          >
            <h2
              style={{
                fontSize: "clamp(36px, 5vw, 52px)",
                fontWeight: 600,
                marginBottom: "24px",
                letterSpacing: "-0.02em",
              }}
            >
              Built for performance
            </h2>
            <p
              style={{
                color: "#6B6B6B",
                fontSize: "18px",
                maxWidth: "480px",
                margin: "0 auto",
                fontWeight: 300,
              }}
            >
              Every feature designed to support consistency and measurable
              progress.
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "2px",
              backgroundColor: "#1F1F24",
              maxWidth: "1100px",
              margin: "0 auto",
            }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                style={{
                  backgroundColor: "#101012",
                  padding: "48px 40px",
                  transition: "background-color 0.3s ease",
                }}
                whileHover={{ backgroundColor: "#141416" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    color: "#F5F5F5",
                    marginBottom: "28px",
                    opacity: 0.9,
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    marginBottom: "14px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: "#6B6B6B",
                    lineHeight: 1.7,
                    fontSize: "15px",
                    fontWeight: 300,
                  }}
                >
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* ==================== HOW IT WORKS ==================== */}
      <Section id="how-it-works">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            style={{ textAlign: "center", marginBottom: "80px" }}
          >
            <h2
              style={{
                fontSize: "clamp(36px, 5vw, 52px)",
                fontWeight: 600,
                marginBottom: "24px",
                letterSpacing: "-0.02em",
              }}
            >
              Start in under a minute
            </h2>
            <p
              style={{
                color: "#6B6B6B",
                fontSize: "18px",
                maxWidth: "420px",
                margin: "0 auto",
                fontWeight: 300,
              }}
            >
              No complexity. No setup wizards. Just you and your timer.
            </p>
          </motion.div>

          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "32px",
                  padding: "40px 0",
                  borderBottom:
                    i < steps.length - 1 ? "1px solid #1F1F24" : "none",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "72px",
                    height: "72px",
                    border: "1px solid #1F1F24",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: 300,
                    color: "#6B6B6B",
                    transition: "all 0.3s ease",
                  }}
                >
                  {step.num}
                </div>
                <div style={{ paddingTop: "12px" }}>
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      marginBottom: "12px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      color: "#6B6B6B",
                      fontSize: "17px",
                      lineHeight: 1.7,
                      fontWeight: 300,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* ==================== PRICING ==================== */}
      <Section id="pricing" dark>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            style={{ textAlign: "center", marginBottom: "80px" }}
          >
            <h2
              style={{
                fontSize: "clamp(36px, 5vw, 52px)",
                fontWeight: 600,
                marginBottom: "24px",
                letterSpacing: "-0.02em",
              }}
            >
              Transparent pricing
            </h2>
            <p
              style={{
                color: "#6B6B6B",
                fontSize: "18px",
                fontWeight: 300,
              }}
            >
              Start free. Upgrade when it makes sense.
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                style={{
                  backgroundColor: "#0B0B0C",
                  border: `1px solid ${
                    plan.highlighted ? "#F5F5F5" : "#1F1F24"
                  }`,
                  padding: "48px 40px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6B6B6B",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: "20px",
                    fontWeight: 500,
                  }}
                >
                  {plan.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    marginBottom: "36px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "56px",
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ color: "#6B6B6B", fontSize: "15px" }}>
                    /{plan.period}
                  </span>
                </div>
                <ul style={{ listStyle: "none", marginBottom: "40px" }}>
                  {plan.features.map((feature, j) => (
                    <li
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        marginBottom: "16px",
                        color: "#9A9A9E",
                        fontSize: "15px",
                      }}
                    >
                      <span style={{ color: "#F5F5F5", fontSize: "14px" }}>
                        →
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? "primary" : "secondary"}
                  fullWidth
                  onClick={onGetStarted}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* ==================== FINAL CTA ==================== */}
      <Section>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          style={{
            textAlign: "center",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              fontWeight: 600,
              marginBottom: "24px",
              letterSpacing: "-0.02em",
            }}
          >
            Your next fast starts now.
          </h2>
          <p
            style={{
              fontSize: "18px",
              color: "#6B6B6B",
              marginBottom: "48px",
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          >
            Join thousands who've made fasting a sustainable practice. No
            gimmicks. Just results.
          </p>
          <Button variant="primary" size="lg" onClick={onGetStarted}>
            Start Your Fast
          </Button>
          <p style={{ marginTop: "24px", color: "#6B6B6B", fontSize: "14px" }}>
            Free forever plan available. No credit card required.
          </p>
        </motion.div>
      </Section>

      {/* ==================== FOOTER ==================== */}
      <footer style={{ borderTop: "1px solid #1F1F24" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "48px 24px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Interflow
          </div>
          <div style={{ color: "#6B6B6B", fontSize: "14px" }}>
            © 2026 Interflow. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            {["Privacy", "Terms", "Contact"].map((link) => (
              <button
                key={link}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6B6B6B",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "color 0.3s ease",
                  padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F5")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6B6B")}
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
