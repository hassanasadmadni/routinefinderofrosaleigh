# Rosaleigh Routine Finder

A personalised skin analysis and routine recommendation web app for
[Rosaleigh Cosmetics](https://www.rosaleigh.co.uk), a premium UK tallow-based skincare brand.

Customers choose a short skin quiz or a selfie check. The app then gives them a morning and evening
Rosaleigh routine, a phased 30-day plan, a downloadable PDF and a recommended product bundle.

## Features

- **Two entry paths**: a six-question skin quiz, or a photo upload / camera capture with
  on-device face validation (the photo never leaves the customer's browser)
- **Personalised results**: skin profile summary, AM/PM routine and product guidance
- **30-day plan**: introduction, building and established phases with quantities, timing and cautions
- **PDF export**: the customer's full routine as a branded PDF
- **Returning visitors**: the last result is remembered on the device
- **Brand header and footer** matching the Rosaleigh Shopify store

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, SSR)
- TypeScript
- Tailwind CSS v4
- Vite + Nitro (server build; deployment target is detected automatically)
- jsPDF (PDF generation)

## Getting started

Requires **Node.js 20 or newer**.

```sh
npm install
npm run dev        # http://localhost:8080
```

### Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the local development server    |
| `npm run build`     | Production build                      |
| `npm run preview`   | Preview the production build locally  |
| `npm run typecheck` | Type-check the project                |
| `npm run lint`      | Lint the code                         |
| `npm run format`    | Format the code with Prettier         |

## Project structure

```
src/
  routes/            Pages (file-based routing; index.tsx is the main app)
  components/rl/     Rosaleigh UI: Landing, Quiz, PhotoUpload, Results, header/footer
  components/ui/     Shared UI primitives
  data/              Editable content: products & bundles, quiz questions, routine guide
  lib/               Analysis logic, 30-day plan, PDF export, face validation
  assets/            Product and brand images
```

### Editing content

Most day-to-day changes need no code knowledge of the UI:

- **Products and bundles**: `src/data/catalogue.ts`
- **Quiz questions**: `src/data/quiz.ts`
- **How to use each product**: `src/data/routine-guide.ts`
- **Store links in header/footer**: `src/components/rl/Chrome.tsx`

## Deployment

The app is deployed on [Vercel](https://vercel.com). Every branch pushed to GitHub gets its own
preview URL; merging into `main` updates production. No extra configuration is needed.

## Disclaimer

The routine finder gives general skincare guidance only. It is not a medical or dermatological
diagnosis.

## Credits

Developed by Hassan Madni for Rosaleigh Cosmetics.

---

© Rosaleigh Cosmetics. All rights reserved.
