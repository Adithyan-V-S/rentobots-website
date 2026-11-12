# Rentobots website

The complete Rentobots website: 14 pages, dark design, mobile-friendly.
Plain HTML, CSS and a tiny script — **no packages, no build step, no install.**

## Pages

| Page | File | Interactive |
| --- | --- | --- |
| Home | `index.html` | FAQ |
| Robot models | `robot-models.html` | — |
| Applications | `applications.html` | Sector explorer |
| Services | `services.html` | — |
| Programs | `programs.html` | FAQ |
| Campus Experience | `programs-campus-experience.html` | — |
| Humanoid Robotics Immersion | `programs-humanoid-immersion.html` | — |
| Humanoid Developer Workshop | `programs-developer-workshop.html` | — |
| Semester Development Program | `programs-semester.html` | — |
| Robotics Lab Partner | `programs-lab-partner.html` | — |
| Case studies | `case-studies.html` | Category filter, expandable stories |
| Partner with us | `partner.html` | Application form → WhatsApp |
| Hire a robot | `hire.html` | Booking builder → WhatsApp |
| Deep Robotics Supply Chain Tour (ad landing page) | `china-tour.html` | Enquiry form → WhatsApp |
| Not found | `404.html` | — |

Every form sends a pre-filled message to WhatsApp **+91 70122 30818**. No server or database is needed.

## Folder structure

```
index.html … china-tour.html   the pages (fully pre-rendered HTML, good for Google)
404.html                       page-not-found
assets/css/styles.css          shared styles + mobile layout (below 760 px)
assets/js/rb.js                small (≈3 KB gzipped) runtime that powers the interactive sections
assets/img/                    robot photos and favicon
sitemap.xml, robots.txt        for search engines
vercel.json / netlify.toml     hosting settings (clean URLs, image caching)
```

## Put it online

**Vercel** (you already use it): drag this folder into vercel.com/new, or run `npx vercel` inside it.
`vercel.json` turns on clean URLs, so `/hire` serves `hire.html`.

**Netlify**: drag the folder onto app.netlify.com/drop.

**Any web host / cPanel**: upload everything to `public_html`. Links work as `.html` files.

Then point `www.rentobots.com` at the host. The pages already use it for their canonical and share links.

To preview on your computer: open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## Editing

- **Text and images:** edit the HTML directly. Most styling sits on each element, so changes stay local.
- **Interactive pages** (`hire`, `case-studies`, `applications`, `partner`, `china-tour`): the visible HTML is a pre-rendered copy.
  The live version comes from the `<template id="rb-view">` block and the `Component` script at the bottom of the same file.
  Edit **both**, or edit only the template — the page re-renders from it on load.
- **Colours, buttons, mobile rules:** `assets/css/styles.css`.
  After editing `styles.css` or `rb.js`, bump the `?v=` number in every page's link to it (e.g. `?v=2` → `?v=3`) so visitors' browsers fetch the new file instead of a cached copy.
- **WhatsApp number:** search all files for `917012230818`.

## Before launch — fill in or confirm

- [ ] China Tour: next departure dates (`[Dates]`), partner logos (`[Partner logo]` tiles), and what the ₹2,50,000 includes
- [ ] Partner page: revenue share (`[As per agreement]`) — have the investment wording checked legally
- [ ] Robot models: D1 model, description, capabilities and "Great for"
- [ ] Case studies: client names, venues and results in `[brackets]`; photos for stories 3–6
- [ ] Programs: next operator batch (`[City · Dates]`); programs site link (`https://programs.rentobots.com` is a placeholder)
- [ ] Home FAQ: booking notice period (`[X weeks]`)
- [ ] Programs: photo of the robotic arm & gripper
- [ ] Add a social share image (1200×630) at `assets/img/` and update the `og:image` tags
