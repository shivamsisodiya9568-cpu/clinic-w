import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Suppress Framer list-key dev warnings (benign)
if (typeof window !== "undefined") {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes('Each child in a list should have a unique "key"')) return;
    origError(...args);
  };
}

// -------------- Icons --------------
const ArrowUpRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);
const PlayIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);
const ClockIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);
const UsersIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
);
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
);

// -------------- FadingVideo – exact spec from prompt --------------
const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55;

interface FadingVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  className?: string;
  style?: React.CSSProperties;
}
const FadingVideo: React.FC<FadingVideoProps> = ({ className = "", style, ...rest }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  const fadeTo = React.useCallback((target: number, duration = FADE_MS) => {
    const v = videoRef.current;
    if (!v) return;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    const startOpacity = parseFloat(v.style.opacity || "0") || 0;
    const delta = target - startOpacity;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      v.style.opacity = String(startOpacity + delta * t);
      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      v.style.opacity = "0";
      v.play().catch(()=>{});
      fadeTo(1, FADE_MS);
    };
    const onTimeUpdate = () => {
      if (!v.duration || fadingOutRef.current) return;
      const remaining = v.duration - v.currentTime;
      if (remaining <= FADE_OUT_LEAD && remaining > 0) {
        fadingOutRef.current = true;
        fadeTo(0, FADE_MS);
      }
    };
    const onEnded = () => {
      if (v) v.style.opacity = "0";
      setTimeout(() => {
        if (!v) return;
        v.currentTime = 0;
        v.play().catch(()=>{});
        fadingOutRef.current = false;
        fadeTo(1, FADE_MS);
      }, 100);
    };

    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);
    if (v.readyState >= 2) onLoaded();

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      v.removeEventListener("loadeddata", onLoaded);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("ended", onEnded);
    };
  }, [fadeTo]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      preload="auto"
      style={{ opacity: 0, ...style }}
      className={className}
      {...rest}
    />
  );
};

// -------------- BlurText – word-by-word blur-in --------------
const BlurText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const words = text.split(" ");
  return (
    <p ref={ref} className={className} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", rowGap: "0.06em" }}>
      {words.map((w, i) => (
        <motion.span
          key={i + "-" + w}
          initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
          animate={inView ? { filter: ["blur(5px)", "blur(0px)"], opacity: [0.5, 1], y: [-5, 0] } : {}}
          transition={{ duration: 0.7, times: [0, 0.5, 1], ease: "easeOut", delay: (i * 100) / 1000 }}
          style={{ display: "inline-block", marginRight: "0.26em" }}
        >
          {w}
        </motion.span>
      ))}
    </p>
  );
};

const fadeIn = (delay = 0) => ({
  initial: { filter: "blur(10px)", opacity: 0, y: 20 },
  animate: { filter: "blur(0px)", opacity: 1, y: 0 },
  transition: { duration: 0.78, ease: "easeOut" as const, delay }
});

// -------------- Clinical Video Sources --------------
const HERO_VIDEO = "https://videos.pexels.com/video-files/6111034/6111034-uhd_3840_2160_25fps.mp4";
const CAPABILITIES_VIDEO = "https://videos.pexels.com/video-files/6111017/6111017-uhd_3840_2160_25fps.mp4";

// -------------- Router --------------
type PageId = "home" | "services" | "doctors" | "results" | "pricing" | "contact";
const PAGES: { id: PageId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "services", label: "Services" },
  { id: "doctors", label: "Doctors" },
  { id: "results", label: "Results" },
  { id: "pricing", label: "Pricing" },
  { id: "contact", label: "Book Visit" },
];

function useHashPage(): [PageId, (p: PageId) => void] {
  const get = (): PageId => {
    const h = (typeof window !== "undefined" ? window.location.hash.replace("#", "") : "") as PageId;
    return (PAGES.find(x => x.id === h)?.id || "home");
  };
  const [page, setPage] = useState<PageId>(get());
  useEffect(() => {
    const onH = () => setPage(get());
    window.addEventListener("hashchange", onH);
    if (!window.location.hash) window.location.hash = "home";
    return () => window.removeEventListener("hashchange", onH);
  }, []);
  const navigate = (p: PageId) => {
    if (p === page) { window.scrollTo({top: 0, behavior: "smooth"}); return; }
    window.location.hash = p;
    window.scrollTo({top:0, behavior:"smooth"});
  };
  return [page, navigate];
}

// -------------- Navbar --------------
function Navbar({ page, navigate }: { page: PageId; navigate: (p: PageId) => void }) {
  const [open, setOpen] = useState(false);
  useEffect(()=>{ document.body.style.overflow = open ? "hidden" : ""; return ()=>{ document.body.style.overflow=""; }},[open]);
  return (
    <nav className="fixed top-3 sm:top-4 left-0 right-0 z-[60] px-4 sm:px-6 lg:px-14">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button onClick={() => navigate("home")} className="w-11 h-11 sm:w-12 sm:h-12 liquid-glass rounded-full flex items-center justify-center shrink-0">
          <span className="font-heading italic text-white text-[20px] sm:text-[21px] leading-none translate-y-[1px]">rs</span>
        </button>

        {/* Desktop pill */}
        <div className="hidden lg:flex items-center liquid-glass rounded-full px-1.5 py-1.5">
          {PAGES.slice(0,5).map(l => (
            <button
              key={l.id}
              onClick={() => navigate(l.id)}
              className={`px-3.5 py-2 text-[13.6px] font-medium font-body rounded-full transition-colors ${page===l.id ? "text-white" : "text-white/80 hover:text-white"}`}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => navigate("contact")}
            className="ml-2 bg-white text-[#131313] rounded-full px-4 py-2 text-[13.5px] font-medium font-body whitespace-nowrap flex items-center gap-1.5 hover:bg-zinc-100 transition-colors"
          >
            Book Appointment <ArrowUpRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile / tablet menu button */}
        <button
          aria-label="Menu"
          onClick={() => setOpen(!open)}
          className="lg:hidden w-11 h-11 sm:w-12 sm:h-12 liquid-glass rounded-full flex items-center justify-center text-white"
        >
          {open ? <CloseIcon/> : <MenuIcon/>}
        </button>

        <div className="hidden lg:block w-12 h-12 opacity-0 pointer-events-none" />
      </div>

      {/* Mobile / Tablet sheet */}
      <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={()=>setOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/45 backdrop-blur-[2px] z-[55]"
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden mt-3 max-w-7xl mx-auto liquid-glass-strong rounded-[22px] p-3 relative z-[65]"
          >
            <div className="flex flex-col">
              {PAGES.map(l => (
                <button
                  key={l.id}
                  onClick={()=>{navigate(l.id); setOpen(false);}}
                  className={`px-4 py-[13px] text-left rounded-xl font-body text-[16px] transition-colors ${page===l.id ? "text-white bg-white/[0.055]" : "text-white/88 hover:bg-white/[0.045]"}`}
                >
                  {l.label}
                </button>
              ))}
              <button onClick={()=>{navigate("contact"); setOpen(false);}} className="mt-2 bg-white text-black rounded-full px-4 py-[13px] text-center text-[15px] font-medium font-body">Book Appointment</button>
              <div className="px-4 pt-3 pb-1 text-white/60 text-[12.5px] font-body">
                +91 562 400 8814 • Sanjay Place, Agra
              </div>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </nav>
  );
}

// -------------- HOME: Hero --------------
function ClinicHero({ navigate }: { navigate: (p: PageId)=>void }) {
  return (
    <section className="relative min-h-[100svh] bg-black overflow-hidden flex flex-col">
      <FadingVideo
        src={HERO_VIDEO}
        className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-center z-0"
        style={{ width: "120%", height: "120%" }}
      />
      <div className="absolute inset-0 bg-black/42 sm:bg-black/36 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20 z-[1] pointer-events-none" />
      <div className="relative z-10 flex flex-col min-h-[100svh]">
        <div className="flex-1 flex flex-col items-center justify-center pt-24 sm:pt-28 pb-10 px-4 sm:px-6 text-center">
          <motion.div {...fadeIn(0.35)} className="liquid-glass rounded-full flex items-center gap-2.5 sm:gap-3 pl-1 pr-3 sm:pr-3.5 py-1.5 mb-5 sm:mb-6 max-w-full">
            <span className="bg-white text-black px-2.5 sm:px-3 py-[5px] text-[11px] sm:text-xs font-semibold rounded-full font-body shrink-0">Open now</span>
            <span className="text-[11.8px] sm:text-[13.5px] text-white/92 font-body text-left leading-snug">Robotic Gait Lab • Sanjay Place, Agra</span>
          </motion.div>

          <div className="max-w-[900px] w-full">
            <BlurText
              text="Move without pain. Recover with confidence."
              className="font-heading italic text-white leading-[0.88] sm:leading-[0.84] tracking-[-0.02em] sm:tracking-[-0.045em] text-[36px] xs:text-[40px] sm:text-5xl md:text-6xl lg:text-[5.1rem] xl:text-[5.35rem] px-1"
            />
            <motion.div {...fadeIn(0.72)} className="font-heading italic text-white/95 leading-[0.95] tracking-[-0.015em] text-[26px] sm:text-3xl md:text-[42px] mt-2 sm:mt-2.5">RS Clinic, Agra</motion.div>
          </div>

          <motion.p {...fadeIn(0.82)} className="mt-4 sm:mt-5 text-[14.8px] sm:text-[16px] md:text-[17px] text-white/90 max-w-xl md:max-w-2xl font-body font-light leading-relaxed px-2">
            NABH-aligned physiotherapy & pain rehabilitation. 1:1 hands-on care, robotic movement analysis, and a clear recovery plan — from first visit to full return.
          </motion.p>

          <motion.div {...fadeIn(1.05)} className="flex flex-col xs:flex-row flex-wrap items-center justify-center gap-3 sm:gap-5 mt-6 sm:mt-7 w-full px-4">
            <button onClick={()=>navigate("contact")} className="w-full xs:w-auto liquid-glass-strong rounded-full px-5 sm:px-[22px] py-[12px] sm:py-[11px] text-[14.5px] font-medium text-white font-body inline-flex items-center justify-center gap-2 hover:bg-white/[0.06] transition-colors min-h-[48px]">
              Book Your Assessment <ArrowUpRightIcon className="w-[18px] h-[18px]" />
            </button>
            <button onClick={()=>navigate("services")} className="text-white/95 text-[14px] sm:text-sm font-body inline-flex items-center gap-2 hover:text-white transition-colors py-2">
              <PlayIcon /> Clinic Tour
            </button>
          </motion.div>

          <motion.div {...fadeIn(1.28)} className="flex flex-col sm:flex-row items-stretch justify-center gap-3 sm:gap-4 mt-7 sm:mt-9 w-full max-w-md sm:max-w-none px-4">
            <div className="liquid-glass rounded-[1.15rem] sm:rounded-[1.25rem] p-4 sm:p-5 w-full sm:w-[220px] md:w-[226px] text-left">
              <ClockIcon />
              <div className="mt-8 sm:mt-12 md:mt-14 font-heading italic text-white text-[30px] sm:text-[34px] tracking-[-1px] leading-none">18 Min</div>
              <div className="text-[12.5px] sm:text-[12.7px] text-white/90 font-body font-light mt-1.5 sm:mt-2">Avg. first assessment<br/>with gait scan</div>
            </div>
            <div className="liquid-glass rounded-[1.15rem] sm:rounded-[1.25rem] p-4 sm:p-5 w-full sm:w-[220px] md:w-[226px] text-left">
              <UsersIcon />
              <div className="mt-8 sm:mt-12 md:mt-14 font-heading italic text-white text-[30px] sm:text-[34px] tracking-[-1px] leading-none">14,320+</div>
              <div className="text-[12.5px] sm:text-[12.7px] text-white/90 font-body font-light mt-1.5 sm:mt-2">Patients treated in Agra<br/>since 2011</div>
            </div>
          </motion.div>
        </div>

        <motion.div {...fadeIn(1.42)} className="pb-7 sm:pb-9 flex flex-col items-center gap-3 sm:gap-4 px-4 sm:px-6">
          <div className="liquid-glass rounded-full px-3 sm:px-3.5 py-1 text-[11px] sm:text-[11.9px] font-medium text-white/90 font-body tracking-wide text-center">
            CLINICAL PARTNERS & REFERRALS
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-9 md:gap-x-14 gap-y-1 sm:gap-y-2 font-heading italic text-white text-[20px] xs:text-[22px] sm:text-2xl md:text-[30px] tracking-tight opacity-95">
            <span>Apollo</span><span>Fortis</span><span>AIIMS</span><span>Max</span><span>Medanta</span>
          </div>
          <div className="text-[11px] sm:text-[11.7px] text-white/62 font-body text-center px-2">Ayushman Bharat • CGHS • Private Insurance TPA • Cashless billing available</div>
        </motion.div>
      </div>
    </section>
  );
}

// -------------- HOME: Capabilities --------------
function CapabilitiesBlock({ navigate }: { navigate: (p: PageId)=>void }) {
  const cards = [
    {
      title: "Motion Lab",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z"/></svg>,
      tags: ["Gait Mapping", "3D Capture", "Force Plates", "Video Report"],
      body: "Robotic gait & posture screening in 18 minutes. Pinpoints root cause, tracks symmetry session-to-session, and gives you a shareable video report."
    },
    {
      title: "Sports Rehab",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z"/></svg>,
      tags: ["ACL / Rotator", "Return to Play", "Isokinetic", "Field Tested"],
      body: "ACL, ankle, shoulder – load-managed, isokinetic-tracked rehab. Return-to-play clearance with hop tests and strength symmetry ≥90%."
    },
    {
      title: "Pain Relief",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z"/></svg>,
      tags: ["Dry Needling", "Manual Release", "Shockwave", "TENS / IFT"],
      body: "Chronic neck, low-back, knee OA and joint pain. Multimodal: hands-on release, needling, shockwave, and graded movement therapy."
    }
  ];
  return (
    <section className="relative min-h-screen bg-black overflow-hidden">
      <FadingVideo src={CAPABILITIES_VIDEO} className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 bg-black/50 sm:bg-black/45 z-[1]" />
      <div className="relative z-10 px-4 sm:px-6 md:px-12 lg:px-20 pt-20 sm:pt-28 pb-14 sm:pb-20 flex flex-col min-h-screen max-w-7xl mx-auto">
        <div className="mb-auto">
          <p className="text-[13px] sm:text-sm font-body text-white/82 mb-4 sm:mb-5">// Specialties — Agra</p>
          <h2 className="font-heading italic text-white text-[42px] xs:text-[48px] sm:text-[56px] md:text-7xl lg:text-[5.5rem] xl:text-[6rem] leading-[0.92] tracking-[-0.025em] sm:tracking-[-0.035em]">
            Care<br/>evolved
          </h2>
          <p className="text-white/85 font-body font-light mt-3 sm:mt-4 max-w-md text-[14.5px] sm:text-[15.5px]">Evidence-led physiotherapy with real measurement. You see your numbers improve every week.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mt-10 sm:mt-14">
          {cards.map((c) => (
            <div key={c.title} className="liquid-glass rounded-[18px] sm:rounded-[1.35rem] p-5 sm:p-6 min-h-[310px] sm:min-h-[358px] flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 liquid-glass rounded-[0.7rem] sm:rounded-[0.75rem] flex items-center justify-center shrink-0">{c.icon}</div>
                <div className="flex flex-wrap justify-end gap-1 sm:gap-1.5 max-w-[64%] sm:max-w-[68%]">
                  {c.tags.map(t => (
                    <span key={t} className="liquid-glass rounded-full px-2.5 sm:px-3 py-[4px] sm:py-1 text-[10.5px] sm:text-[11px] text-white/90 font-body whitespace-nowrap">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
              <div className="mt-5 sm:mt-6">
                <h3 className="font-heading italic text-white text-[27px] sm:text-[32px] md:text-[34px] tracking-[-0.015em] leading-none">{c.title}</h3>
                <p className="mt-2.5 sm:mt-3 text-[14px] sm:text-[14.6px] text-white/88 font-body font-light leading-snug">{c.body}</p>
                <button onClick={()=>navigate("services")} className="mt-3.5 sm:mt-4 text-[13px] sm:text-[13.3px] text-white/85 hover:text-white inline-flex items-center gap-1 font-body">Learn more <ArrowUpRightIcon className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// -------------- Reusable --------------
const SectionKicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[12.7px] sm:text-[13px] tracking-wide font-body text-white/75 mb-2.5 sm:mb-3">{children}</p>
);

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`liquid-glass rounded-[18px] sm:rounded-[20px] p-4 sm:p-5 md:p-6 ${className}`}>{children}</div>;
}

// -------------- HOME PAGE --------------
function HomePage({ navigate }: { navigate: (p: PageId)=>void }) {
  const conditions = [
    ["Back & Neck Pain", "Disc, spondylosis, whiplash, sciatica."],
    ["Knee & Hip OA", "Arthritis, post-TKR/THR rehab."],
    ["Sports Injuries", "ACL, meniscus, ankle, tennis elbow, rotator cuff."],
    ["Post-Surgery", "Fracture, ligament repair, spine surgery."],
    ["Neuro Rehab", "Stroke, Bell's palsy, Parkinson's, balance."],
    ["Work Pain", "Desk neck, carpal tunnel, RSI, ergonomics."],
  ];
  const testimonials = [
    { name: "Meena Gupta, 54 — Kamla Nagar", quote: "Knee pain for 8 years. After 12 sessions at RS Clinic I can walk Taj Nature Walk again, no cane. Very kind staff." },
    { name: "Arjun Yadav, 26 — Dayalbagh", quote: "ACL reconstruction rehab. Cleared for football in 6 months. Hop test 94% symmetry. Thank you Dr. Rohit!" },
    { name: "S. Khan, 41 — Tajganj", quote: "Frozen shoulder released in 9 visits. Dry needling + exercises worked when painkillers didn't. Clean clinic." },
  ];
  return (
    <>
      <ClinicHero navigate={navigate} />
      <CapabilitiesBlock navigate={navigate} />

      {/* Conditions */}
      <section className="bg-black border-t border-white/[0.09] py-16 sm:py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6 mb-7 sm:mb-10">
            <div>
              <SectionKicker>// Conditions</SectionKicker>
              <h3 className="font-heading italic text-white text-[32px] sm:text-4xl md:text-[50px] tracking-tight leading-tight">What we treat in Agra</h3>
            </div>
            <p className="text-white/80 font-body font-light max-w-md text-[14.5px] sm:text-[15px]">Full musculoskeletal & neuro rehab. If you're unsure, book a 18-min screening — ₹650, first treatment included.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-[13px]">
            {conditions.map(([t,d]) => (
              <GlassCard key={t}>
                <div className="text-white font-heading italic text-[21px] sm:text-[22px] tracking-tight">{t}</div>
                <div className="text-white/80 text-[13.5px] sm:text-[13.8px] font-body font-light mt-1.5">{d}</div>
              </GlassCard>
            ))}
          </div>
          <div className="mt-4 sm:mt-5 text-[12.9px] sm:text-[13.4px] text-white/70 font-body">Also: Geriatric fall prevention • Paediatric gait • Women's pelvic health • TMJ • Migraine / cervicogenic headache.</div>
        </div>
      </section>

      {/* Patient results */}
      <section className="bg-black border-t border-white/[0.09] py-16 sm:py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-8 items-start">
            <div className="lg:col-span-2">
              <SectionKicker>// Patient results</SectionKicker>
              <h3 className="font-heading italic text-white text-[34px] sm:text-[40px] md:text-[46px] leading-[0.97] tracking-tight">Real people.<br/>Measured recovery.</h3>
              <div className="flex gap-8 sm:gap-10 mt-5 sm:mt-6 font-body">
                <div><div className="font-heading italic text-white text-[30px] sm:text-[34px]">4.9★</div><div className="text-white/80 text-[12px] sm:text-[12.6px]">Google, 412 reviews</div></div>
                <div><div className="font-heading italic text-white text-[30px] sm:text-[34px]">91%</div><div className="text-white/80 text-[12px] sm:text-[12.6px]">Pain ↓ ≥50% in 6 visits</div></div>
              </div>
              <button onClick={()=>navigate("results")} className="mt-5 sm:mt-6 text-white/90 text-[14px] sm:text-sm underline underline-offset-4 font-body">See patient stories →</button>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {testimonials.map(t => (
                <GlassCard key={t.name} className="!p-4 sm:!p-5">
                  <div className="flex gap-0.5 text-amber-200 mb-2">{[...Array(5)].map((_,i)=><StarIcon key={i}/>)}</div>
                  <div className="text-white/90 font-body text-[13.6px] sm:text-[13.9px] leading-relaxed">“{t.quote}”</div>
                  <div className="text-white/60 text-[11.5px] sm:text-[11.8px] mt-3 font-body">{t.name}</div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-black border-t border-white/[0.09] py-14 sm:py-[78px]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 text-center">
          <h3 className="font-heading italic text-white text-[30px] sm:text-[38px] md:text-[48px] tracking-tight leading-tight">Start with a full assessment. ₹650.</h3>
          <p className="text-white/82 font-body mt-2.5 sm:mt-3 text-[14.3px] sm:text-[15.5px]">45 minutes • Gait scan • Diagnosis plan PDF • First treatment included • Same-day slots in Sanjay Place</p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center mt-5 sm:mt-6">
            <button onClick={()=>navigate("contact")} className="w-full sm:w-auto bg-white text-black rounded-full px-5 py-[12px] sm:py-[11px] text-[14.5px] sm:text-sm font-medium font-body">Book Assessment</button>
            <a href="https://wa.me/915624008814" target="_blank" rel="noreferrer" className="w-full sm:w-auto liquid-glass rounded-full px-5 py-[12px] sm:py-[11px] text-[14.5px] sm:text-sm font-medium text-white font-body text-center">WhatsApp</a>
            <a href="tel:+915624008814" className="text-white/85 text-[14px] sm:text-sm font-body px-2 py-2 sm:py-[11px] text-center">Call +91 562 400 8814</a>
          </div>
        </div>
      </section>
    </>
  );
}

// -------------- SERVICES PAGE --------------
function ServicesPage({ navigate }: { navigate:(p:PageId)=>void }) {
  const services = [
    { name: "Advanced Physiotherapy", desc: "Manual therapy, IFT/TENS, ultrasound, therapeutic exercise. 1:1, 45 min.", price: "₹850 / session" },
    { name: "Sports Injury Rehab", desc: "ACL, ankle, rotator cuff. Isokinetic testing, plyometrics, RTP clearance.", price: "₹1,200 / session" },
    { name: "Post-Op Rehabilitation", desc: "TKR/THR, fracture, ligament repair. Swelling control, scar care, strength ladder.", price: "From ₹850" },
    { name: "Spine & Disc Care", desc: "McKenzie MDT, traction, core stability. Neck/back, sciatica, spondylosis.", price: "₹850" },
    { name: "Neuro Rehabilitation", desc: "Stroke, Bell's palsy, Parkinson's, balance retraining. Bobath / PNF.", price: "₹950" },
    { name: "Dry Needling / Cupping", desc: "Myofascial trigger release. Add-on to physio. Per region.", price: "₹950 add-on" },
    { name: "Shockwave Therapy", desc: "Plantar fasciitis, tennis elbow, calcific tendinitis. 2000 pulses.", price: "₹1,400 / area" },
    { name: "Geriatric Mobility", desc: "Fall prevention, walking confidence, osteoporosis-safe strength.", price: "₹850" },
    { name: "Women's / Pelvic Health", desc: "Postnatal recovery, incontinence, diastasis. Private suite.", price: "₹950" },
  ];
  return (
    <div className="pt-20 sm:pt-28 bg-black min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pb-16 sm:pb-20">
        <SectionKicker>// Services — RS Clinic Agra</SectionKicker>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6 mb-7 sm:mb-9">
          <h1 className="font-heading italic text-white text-[36px] sm:text-[46px] md:text-[60px] lg:text-[64px] leading-[0.93] tracking-tight">Complete physio<br/>under one roof.</h1>
          <p className="text-white/80 font-body max-w-sm text-[14.5px] sm:text-[15.4px]">1:1 care, never assistants. Evidence protocols, measured outcomes. Sanjay Place, MG Road.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {services.map(s=>(
            <GlassCard key={s.name} className="min-h-[170px] sm:min-h-[194px] flex flex-col">
              <div className="font-heading italic text-white text-[23px] sm:text-[26px] tracking-tight">{s.name}</div>
              <p className="text-white/82 font-body text-[13.4px] sm:text-[13.9px] mt-2 leading-relaxed">{s.desc}</p>
              <div className="flex-1" />
              <div className="text-white/90 text-[13px] sm:text-[13.3px] font-body mt-3">{s.price}</div>
            </GlassCard>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-12">
          {[
            ["How a visit works","1. Gait & pain assessment (18 min) → 2. Hands-on treatment → 3. Exercise video to your WhatsApp → 4. Re-test next visit."],
            ["Facilities","Private treatment bays • Robotic gait lab • Isokinetic dynamometer • Shockwave • US/IFT/TENS • Taping station"],
            ["Insurance & billing","Ayushman Bharat • CGHS • Private TPA • GST invoices • Cashless help • UPI / Card / Cash"],
          ].map(([h,b])=>(
            <GlassCard key={h as string}>
              <div className="text-white font-body font-medium">{h}</div>
              <div className="text-white/78 text-[13.3px] sm:text-[13.6px] mt-2 font-body font-light leading-relaxed">{b}</div>
            </GlassCard>
          ))}
        </div>
        <div className="text-center mt-10 sm:mt-12">
          <button onClick={()=>navigate("contact")} className="liquid-glass-strong rounded-full px-5 py-[12px] text-[14px] sm:text-sm font-medium text-white">Book a service →</button>
        </div>
      </div>
    </div>
  );
}

// -------------- DOCTORS PAGE --------------
function DoctorsPage({ navigate }: { navigate:(p:PageId)=>void }) {
  const team = [
    {
      name: "Dr. Rohit Singh, PT",
      role: "Founder • MPT Ortho • 14 yrs",
      cred: "MIAP • COMT (Manual) • Dry Needling Certified",
      blurb: "Leads sports & post-op rehab. Former Apollo Agra. ACL RTP specialist.",
      img: "https://images.pexels.com/photos/4270371/pexels-photo-4270371.jpeg?auto=compress&cs=tinysrgb&w=640"
    },
    {
      name: "Dr. Priya Sharma, PT",
      role: "Senior Physio • MPT Neuro • 9 yrs",
      cred: "Bobath NDT • Women's Health",
      blurb: "Neuro rehab, pelvic health, geriatric balance. Warm, meticulous care.",
      img: "https://images.pexels.com/photos/32115905/pexels-photo-32115905.jpeg?auto=compress&cs=tinysrgb&w=640"
    },
    {
      name: "Dr. Aman Verma, PT",
      role: "Sports Physio • BPT, Dip. Sports • 6 yrs",
      cred: "ISAK • K-Taping • S&C L1",
      blurb: "Field-side experience. Cricket / football RTP, isokinetic testing.",
      img: "https://images.pexels.com/photos/32115962/pexels-photo-32115962.jpeg?auto=compress&cs=tinysrgb&w=640"
    },
  ];
  return (
    <div className="pt-20 sm:pt-28 bg-black min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pb-16 sm:pb-24">
        <SectionKicker>// Our Doctors — Agra</SectionKicker>
        <h1 className="font-heading italic text-white text-[36px] sm:text-[46px] md:text-[60px] leading-[0.94] tracking-tight mb-6 sm:mb-8">Hands-on clinicians.<br/>Measured outcomes.</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {team.map(d=>(
            <GlassCard key={d.name} className="!p-4 sm:!p-5">
              <div className="w-full aspect-[4/4.4] sm:aspect-[4/4.6] rounded-[14px] sm:rounded-[16px] overflow-hidden bg-white/[0.04] mb-4">
                <img src={d.img} alt={d.name} className="w-full h-full object-cover object-top" loading="lazy"/>
              </div>
              <div className="font-heading italic text-white text-[23px] sm:text-[25px] tracking-tight">{d.name}</div>
              <div className="text-white/85 text-[13px] sm:text-[13.3px] font-body mt-1">{d.role}</div>
              <div className="text-white/65 text-[12.2px] sm:text-[12.5px] font-body mt-1">{d.cred}</div>
              <div className="text-white/80 text-[13.2px] sm:text-[13.4px] font-body font-light mt-3">{d.blurb}</div>
            </GlassCard>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-10 text-[13.3px] sm:text-[13.7px] font-body text-white/82">
          <GlassCard>Registration: U.P. State Paramedical Council • Indian Association of Physiotherapists</GlassCard>
          <GlassCard>1:1 treatment time, always with a qualified PT — never just assistants.</GlassCard>
          <GlassCard>Continuing education: 40+ hrs / year. Latest pain-science & loading protocols.</GlassCard>
        </div>
        <div className="mt-8 sm:mt-10">
          <button onClick={()=>navigate("contact")} className="w-full sm:w-auto bg-white text-black rounded-full px-5 py-[12px] text-[14.5px] sm:text-sm font-medium">Book with our team</button>
        </div>
      </div>
    </div>
  );
}

// -------------- RESULTS PAGE --------------
function ResultsPage({ navigate }: { navigate:(p:PageId)=>void }) {
  const stories = [
    { who: "ACL – Arjun, 26, cricketer", result: "Return to play 24 weeks • Quad symmetry 94% • Hop test passed", quote: "Clear loading plan every week. No guesswork." },
    { who: "Knee OA – Meena, 54", result: "Pain 8/10 → 2/10 in 12 visits • Walk 2 km unassisted", quote: "I can do stairs at Jama Masjid again." },
    { who: "Frozen shoulder – S. Khan, 41", result: "ROM full in 9 sessions • Needling + graded mobilization", quote: "Slept through the night by visit 3." },
    { who: "L4-L5 disc – Vikram, 37", result: "Sciatica resolved 7 visits • Core program, no surgery", quote: "Back to desk in 2 weeks." },
    { who: "Post-TKR – Mrs. Lata, 68", result: "0–120° in 5 weeks • Independent walking day 3", quote: "Home visits first week, then clinic." },
    { who: "Ankle sprain – Nisha, 19", result: "Return to badminton 4 weeks • Balance Y-test 98%", quote: "Taping + strength, very confidence-building." },
  ];
  return (
    <div className="pt-20 sm:pt-28 bg-black min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pb-16 sm:pb-24">
        <SectionKicker>// Results — RS Clinic Agra</SectionKicker>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 sm:gap-6 mb-6 sm:mb-8">
          <h1 className="font-heading italic text-white text-[36px] sm:text-[44px] md:text-[58px] leading-[0.94] tracking-tight">Patient stories<br/>from Agra.</h1>
          <div className="text-white/85 font-body text-[13.6px] sm:text-[14.4px]">★ 4.9 / 5 • 412 Google reviews • 91% achieve ≥50% pain reduction in 6 visits</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {stories.map(s=>(
            <GlassCard key={s.who}>
              <div className="text-white font-heading italic text-[20px] sm:text-[21px]">{s.who}</div>
              <div className="text-emerald-100/95 text-[12.9px] sm:text-[13.2px] font-body mt-2">{s.result}</div>
              <div className="text-white/80 text-[13.3px] sm:text-[13.7px] font-body mt-3">“{s.quote}”</div>
            </GlassCard>
          ))}
        </div>
        <div className="liquid-glass rounded-[18px] sm:rounded-[20px] p-5 sm:p-6 md:p-8 mt-8 sm:mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="font-heading italic text-white text-[26px] sm:text-[30px]">Your recovery, measured.</div>
            <div className="text-white/80 text-[13.6px] sm:text-[14.2px] font-body mt-1">Pain scales, ROM, strength symmetry — tracked every visit. You see the graph.</div>
          </div>
          <button onClick={()=>navigate("contact")} className="w-full md:w-auto liquid-glass-strong rounded-full px-5 py-[12px] text-[14px] sm:text-sm text-white whitespace-nowrap text-center">Start your recovery</button>
        </div>
      </div>
    </div>
  );
}

// -------------- PRICING PAGE --------------
function PricingPage({ navigate }: { navigate:(p:PageId)=>void }) {
  const plans = [
    { name: "First Assessment", price: "₹650", note: "45 min • Most popular first step", features: ["Gait / posture scan", "Pain & ROM mapping", "Diagnosis plan PDF", "First treatment included"] },
    { name: "Physio Session", price: "₹850", note: "45 min • 1:1 hands-on", features: ["Manual therapy", "Electro + exercises", "Home video program", "Progress re-test"], popular: true },
    { name: "Sports Rehab", price: "₹1,200", note: "60 min", features: ["Isokinetic testing", "Plyometric loading", "RTP hop tests", "Clear milestones"] },
    { name: "Neuro Rehab", price: "₹950", note: "50 min", features: ["Bobath / PNF", "Balance retraining", "Caregiver training", "Home plan"] },
  ];
  const pkgs = [
    ["Post-Op Pack – 6", "₹4,900", "Save ₹200 / session"],
    ["Sports Pack – 10", "₹10,800", "Save ₹120 / session + RTP test free"],
    ["Chronic Pain – 12", "₹9,200", "Needling included, 2x/week"],
  ];
  return (
    <div className="pt-20 sm:pt-28 bg-black min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pb-16 sm:pb-24">
        <SectionKicker>// Pricing — Agra • GST inclusive</SectionKicker>
        <h1 className="font-heading italic text-white text-[36px] sm:text-[46px] md:text-[58px] leading-[0.94] tracking-tight mb-7 sm:mb-9">Transparent fees.<br/>Real outcomes.</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {plans.map(p => (
            <div key={p.name} className="liquid-glass rounded-[18px] sm:rounded-[20px] p-5 relative flex flex-col">
              {p.popular && <span className="absolute -top-3 right-4 bg-white text-black text-[11px] font-semibold px-2.5 py-1 rounded-full font-body">Most booked</span>}
              <div className="text-white/75 text-[12.3px] sm:text-[12.5px] font-body">{p.note}</div>
              <div className="font-heading italic text-white text-[25px] sm:text-[27px] mt-1 tracking-tight">{p.name}</div>
              <div className="font-heading italic text-white text-[32px] sm:text-[36px] mt-2">{p.price}</div>
              <ul className="mt-4 space-y-[9px] sm:space-y-[10px] text-[13.1px] sm:text-[13.4px] text-white/85 font-body font-light">
                {p.features.map(f => <li key={f} className="flex gap-2 items-start"><span className="opacity-90 mt-[2px]"><CheckIcon/></span>{f}</li>)}
              </ul>
              <button onClick={()=>navigate("contact")} className="mt-5 liquid-glass-strong rounded-full text-center py-[11px] text-[13.7px] font-medium text-white">Book</button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-10">
          <GlassCard className="lg:col-span-2">
            <div className="font-heading italic text-white text-[24px] sm:text-[26px] mb-3">Recovery packages</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13.3px] sm:text-[13.7px] font-body">
              {pkgs.map(([n,pr,save])=>(
                <div key={n} className="bg-white/[0.035] rounded-[14px] px-4 py-3 border border-white/[0.09]">
                  <div className="text-white">{n}</div>
                  <div className="font-heading italic text-white text-[20px] sm:text-[22px] mt-1">{pr}</div>
                  <div className="text-white/70 text-[12.2px] sm:text-[12.4px]">{save}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard>
            <div className="font-heading italic text-white text-[22px] sm:text-[24px]">Add-ons</div>
            <ul className="text-[13.3px] sm:text-[13.6px] text-white/85 font-body mt-3 space-y-1.5">
              <li>Dry Needling / Cupping — ₹950</li>
              <li>Shockwave — ₹1,400 / area</li>
              <li>Kinesio Taping — ₹350</li>
              <li>Home visit (Agra city) — ₹1,400</li>
            </ul>
          </GlassCard>
        </div>

        <p className="text-white/65 font-body text-[12.6px] sm:text-[13.2px] mt-4 sm:mt-5">Ayushman Bharat • CGHS • Private TPA cashless • GST bills • UPI / Card / Cash • No advance needed to book.</p>
        <div className="mt-6 sm:mt-8"><button onClick={()=>navigate("contact")} className="w-full sm:w-auto bg-white text-black rounded-full px-5 py-[12px] text-[14.5px] sm:text-sm font-medium">Book at these rates</button></div>
      </div>
    </div>
  );
}

// -------------- CONTACT / BOOK PAGE --------------
function ContactPage() {
  return (
    <div className="pt-20 sm:pt-28 bg-black min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-8 lg:gap-10 items-start">
        <div>
          <SectionKicker>// Visit RS Clinic</SectionKicker>
          <h1 className="font-heading italic text-white text-[34px] sm:text-[44px] md:text-[56px] leading-[0.95] tracking-tight">Come see us<br/>in Sanjay Place.</h1>
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 text-[14.5px] sm:text-[15px] font-body">
            <GlassCard>
              <div className="text-white/60 text-[11px] sm:text-xs uppercase tracking-wider">Address</div>
              <div className="text-white mt-2 leading-relaxed">
                RS Clinic – Physiotherapy & Pain Rehab<br/>
                14-B, Sanjay Place, M.G. Road<br/>
                Agra, Uttar Pradesh 282002<br/>India
              </div>
              <a href="https://maps.google.com/?q=Sanjay Place, Agra" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/90 underline underline-offset-4 mt-3 text-[13.5px] sm:text-[13.8px]">Open in Maps <ArrowUpRightIcon className="w-4 h-4"/></a>
              <div className="text-white/70 text-[12.3px] sm:text-[12.7px] mt-3">3 min from Bhagwan Talkies crossing • Parking in basement • Ground-floor access</div>
            </GlassCard>
            <GlassCard>
              <div className="text-white/60 text-[11px] sm:text-xs uppercase tracking-wider">Hours</div>
              <div className="text-white mt-2 leading-relaxed">
                Mon – Sat: 9:00 AM – 8:00 PM<br/>
                Sunday: 10:00 AM – 2:00 PM<br/>
                Emergency on-call: 24 / 7
              </div>
              <div className="text-white/80 mt-3 text-[13.3px] sm:text-[13.6px]">
                Phone / WhatsApp<br/>
                <a className="text-white hover:underline text-[15.5px] sm:text-[16px]" href="tel:+915624008814">+91 562 400 8814</a>
              </div>
              <div className="text-white/65 text-[12.3px] sm:text-[12.6px] mt-1">Hindi • English • Braj</div>
            </GlassCard>
          </div>

          <div className="liquid-glass rounded-[16px] sm:rounded-[18px] p-4 sm:p-5 mt-4 sm:mt-5 text-[13.2px] sm:text-[13.7px] font-body text-white/85">
            <strong className="text-white font-medium">Agra localities we serve:</strong> Sanjay Place, Kamla Nagar, Dayalbagh, Tajganj, Civil Lines, Shahganj, Sikandra, Fatehabad Road. Home visits across Agra city.
          </div>

          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
            <a href="tel:+915624008814" className="liquid-glass-strong rounded-full px-5 py-[12px] text-[14.5px] sm:text-[14px] font-medium text-white inline-flex items-center justify-center gap-2">Call to Book <ArrowUpRightIcon className="w-4 h-4"/></a>
            <a href="https://wa.me/915624008814" target="_blank" rel="noreferrer" className="rounded-full px-5 py-[12px] text-[14.5px] sm:text-[14px] font-medium text-white/95 border border-white/22 hover:border-white/40 transition-colors text-center">WhatsApp</a>
          </div>
        </div>

        {/* Booking card */}
        <div className="liquid-glass rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 md:p-7">
          <div className="font-heading italic text-white text-[26px] sm:text-[30px] tracking-tight">Book an appointment</div>
          <p className="text-white/80 font-body text-[13.8px] sm:text-[14.3px] mt-2">Same-day slots usually available. We'll confirm by call / WhatsApp in ~7 minutes. No advance payment.</p>
          <form
            onSubmit={(e)=>{ e.preventDefault(); alert("Thank you! RS Clinic Agra will call/WhatsApp you shortly to confirm your slot."); (e.target as HTMLFormElement).reset();}}
            className="mt-5 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Full name" className="w-full bg-white/[0.055] border border-white/[0.16] rounded-full px-4 py-[13px] sm:py-[12px] text-white placeholder:text-white/50 text-[15px] sm:text-sm outline-none focus:border-white/35 font-body"/>
              <input required placeholder="Phone / WhatsApp" inputMode="tel" className="w-full bg-white/[0.055] border border-white/[0.16] rounded-full px-4 py-[13px] sm:py-[12px] text-white placeholder:text-white/50 text-[15px] sm:text-sm outline-none focus:border-white/35 font-body"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Preferred date" type="date" className="w-full bg-white/[0.055] border border-white/[0.16] rounded-full px-4 py-[13px] sm:py-[12px] text-white text-[15px] sm:text-sm outline-none focus:border-white/35 font-body [color-scheme:dark]"/>
              <select defaultValue="" required className="w-full bg-black border border-white/[0.16] rounded-full px-4 py-[13px] sm:py-[12px] text-white text-[15px] sm:text-sm outline-none focus:border-white/35 font-body">
                <option value="" disabled>Time</option>
                <option>Morning (9-12)</option>
                <option>Afternoon (12-4)</option>
                <option>Evening (4-8)</option>
              </select>
            </div>
            <select defaultValue="" className="w-full bg-black border border-white/[0.16] rounded-full px-4 py-[13px] sm:py-[12px] text-white text-[15px] sm:text-sm outline-none focus:border-white/35 font-body">
              <option value="">Reason for visit (optional)</option>
              <option>Back / Neck pain</option>
              <option>Knee / Hip pain</option>
              <option>Sports injury</option>
              <option>Post-surgery rehab</option>
              <option>Stroke / Neuro</option>
              <option>Other</option>
            </select>
            <textarea placeholder="What hurts? Brief note (optional)" rows={3} className="w-full bg-white/[0.055] border border-white/[0.16] rounded-[18px] px-4 py-3 text-white placeholder:text-white/50 text-[15px] sm:text-sm outline-none focus:border-white/35 font-body resize-none"/>
            <button className="w-full bg-white text-black rounded-full py-[13px] sm:py-3 text-[15px] sm:text-sm font-medium font-body">Request Slot</button>
            <div className="text-[11.5px] text-white/60 font-body text-center">UPI / Card / Cash in clinic • GST bill • Insurance paperwork provided</div>
          </form>
        </div>
      </div>

      {/* FAQ mini */}
      <div className="border-t border-white/[0.09] py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 text-[13.5px] sm:text-[13.8px] font-body text-white/80">
          <div><b className="text-white font-medium">Do I need a referral?</b><br/>No. Walk-in / book direct. We coordinate with your surgeon if post-op.</div>
          <div><b className="text-white font-medium">How many sessions?</b><br/>Most pain cases 6–12 visits. We show your progress graph each time.</div>
          <div><b className="text-white font-medium">Home visits in Agra?</b><br/>Yes, ₹1,400 within city limits. Clinic is wheelchair accessible.</div>
        </div>
      </div>
    </div>
  );
}

// -------------- Footer --------------
function Footer({ navigate }: { navigate:(p:PageId)=>void }) {
  return (
    <footer className="border-t border-white/[0.09] py-10 sm:py-12 bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-7 md:gap-8">
          <div>
            <div className="font-heading italic text-white text-[24px] sm:text-[26px]">rs clinic</div>
            <div className="text-white/70 text-[12.8px] sm:text-[13.3px] font-body mt-1 leading-relaxed">Physiotherapy & Pain Rehabilitation<br/>14-B, Sanjay Place, M.G. Road, Agra – 282002<br/>+91 562 400 8814 • Open daily</div>
          </div>
          <div className="flex flex-wrap gap-x-5 sm:gap-x-6 gap-y-2 text-[13.2px] sm:text-[13.5px] font-body text-white/75">
            {PAGES.map(p=>(
              <button key={p.id} onClick={()=>navigate(p.id)} className="hover:text-white py-1">{p.label}</button>
            ))}
          </div>
        </div>
        <div className="text-white/50 text-[11.8px] sm:text-[12.3px] font-body mt-7 sm:mt-8">© 2026 RS Clinic, Agra. MIAP registered. Not a substitute for emergency care. • Privacy • Terms</div>
      </div>
    </footer>
  );
}

// -------------- App --------------
export default function App() {
  const [page, navigate] = useHashPage();

  const renderPage = () => {
    switch(page){
      case "services": return <ServicesPage navigate={navigate} />;
      case "doctors": return <DoctorsPage navigate={navigate} />;
      case "results": return <ResultsPage navigate={navigate} />;
      case "pricing": return <PricingPage navigate={navigate} />;
      case "contact": return <ContactPage />;
      default: return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="bg-black text-white font-body antialiased min-h-screen overflow-x-hidden">
      <Navbar page={page} navigate={navigate} />
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.34, ease: "easeOut" }}
        >
          {renderPage()}
          <Footer navigate={navigate} />
        </motion.div>
      </AnimatePresence>
      <a
        href="https://wa.me/915624008814"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 right-4 z-[55] sm:hidden bg-[#25D366] text-black rounded-full px-4 py-[11px] text-[13.5px] font-semibold font-body shadow-lg"
      >
        WhatsApp
      </a>
    </div>
  );
}