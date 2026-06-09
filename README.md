# RS Clinic — Agra — Cinematic Liquid-Glass Landing

A cinematic, space-travel-inspired landing page, re-skinned for **RS Clinic — Physiotherapy & Pain Rehabilitation, Sanjay Place, Agra**.

Built with React + Vite + Tailwind CSS v4 + Framer Motion. Single-file production build.

Live sections:
1. **Hero** — Full-viewport, looping video background with custom JS rAF crossfade. Framer Motion blur-in entrance. Liquid-glass navbar, badge, CTAs, stats.
2. **Specialties / Capabilities** — 3 liquid-glass cards (Motion Lab, Sports Rehab, Pain Science), second looping video background.
3. **Treatments** — 6 common conditions we treat in Agra.
4. **Pricing — Agra** — Transparent INR pricing.
   - Initial Assessment — ₹650
   - Physio Session (45m) — ₹850
   - Sports Rehab — ₹1,200
   - Post-Op Pack (6 sessions) — ₹4,900
   - Home Visit — ₹1,400 · Dry Needling — ₹950
5. **Visit RS Clinic** — Address, hours, booking form.
   - 14-B, Sanjay Place, M.G. Road, Agra, UP 282002
   - Mon–Sat 9AM–8PM · Sun 10AM–2PM · Emergency on-call 24/7
   - +91 562 400 8814

---

## Design system (from prompt)

- Background: #000
- Fonts: 
  - Heading: Instrument Serif, italic
  - Body: Barlow 300/400/500/600
- Default border-radius: 9999px (pill)
- Liquid Glass:
  ```css
  .liquid-glass { background: rgba(255,255,255,0.01); backdrop-filter: blur(4px); box-shadow: inset 0 1px 1px rgba(255,255,255,0.1); }
  .liquid-glass-strong { backdrop-filter: blur(50px); }
  ```
  with the 180deg edge sheen mask.
- All text white. No green / no gradients.
- Framer Motion entrances: `filter: blur(10px), opacity:0, y:20 → blur(0), opacity:1, y:0`

### BlurText
Word-by-word blur-in. IntersectionObserver @ 10%. Each word: `blur(10px), y:50 → blur(5px), y:-5 → blur(0), y:0`, 0.7s, stagger 0.1s.

### FadingVideo
No `loop` attribute. Custom JS crossfade:
- FADE_MS = 500
- FADE_OUT_LEAD = 0.55s
- `fadeTo()` uses requestAnimationFrame, resumes from current `video.style.opacity`
- loadeddata → fade in
- timeupdate → fade out at end
- ended → reset, play, fade in
- Fully cancels rAF on unmount

Video sources (cinematic, per the original prompt):
- Hero: https://d8j0ntlcm91z4.cloudfront.net/...080021_d598092b.mp4
- Specialties: https://d8j0ntlcm91z4.cloudfront.net/...094631_d30ab262.mp4

Want clinical footage instead? Swap `src` to these Pexels MP4s:
- https://videos.pexels.com/video-files/6111034/6111034-uhd_3840_2160_25fps.mp4
- https://videos.pexels.com/video-files/6111017/6111017-uhd_3840_2160_25fps.mp4

They're already sized for 120% top-aligned hero and full-bleed capabilities.

---

## Dev

```bash
npm install
npm run dev
npm run build
```

Build output: `dist/index.html` — 365 KB, fully self-contained (vite-plugin-singlefile inlines JS/CSS). Open directly in a browser.

Project files:
- `src/App.tsx` — All React components, FadingVideo, BlurText, icons
- `src/index.css` — Tailwind v4 + liquid-glass utilities + theme tokens
- `index.html` — Vite entry, loads Google Fonts

---

## Clinic copy

RS Clinic – Physiotherapy & Pain Rehabilitation
Dr. Rohit Singh, PT — MPT Ortho, 14 yrs
Sanjay Place, M.G. Road, Agra

For real deployment: connect the booking form to your backend / WhatsApp API. Right now it shows a confirmation alert.

Made with the Cinematic Space-Travel Landing Page prompt — liquid-glass, Framer Motion, JS video crossfade.
