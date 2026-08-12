# Hacker House Goa 2026 — Builder ID Generator

A complete from-scratch Builder ID website built around the supplied **1055 × 1491** master template.

## What it does

- Uses `public/master-template.png` as the actual card background.
- Places an uploaded photo inside the template's existing circular photo area.
- Dynamically renders NAME, BUILDER ID and TEAM NAME over the existing placeholders.
- Generates permanent server-side IDs in the format `HHGOA26-XXXXXX`.
- Stores builders in SQLite with a database-level unique index on `builder_id`.
- Preserves an existing Builder ID when the user regenerates their card.
- Generates a Code 128 barcode from the actual Builder ID.
- Composites the finished card server-side with Sharp.
- Exports a PNG at exactly **1055 × 1491 pixels**.
- Provides a responsive preview and download/share controls.
- Uses an HttpOnly session cookie to recognize returning users on the same browser.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

For development with automatic server restarts:

```bash
npm run dev
```

## Project structure

```text
hacker-house-goa-builder-id/
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── master-template.png
├── src/
│   ├── server.js
│   ├── db.js
│   ├── id.js
│   └── card.js
├── storage/
│   ├── uploads/
│   └── generated/
├── db/
├── package.json
├── .env.example
└── README.md
```

## Important implementation details

### Permanent Builder ID

The ID is generated on the server with cryptographic randomness. It is never derived from the name and is not generated in browser JavaScript. The database enforces uniqueness and the generator checks for collisions before saving.

### Returning users

A long-lived HttpOnly `builder_session` cookie identifies the same browser. When a record already has a Builder ID, updating the name/team/photo does not generate another ID.

For multi-device identity, add authentication later (email/OTP, OAuth, etc.). The Builder ID/database logic does not need to change.

### Template integrity

The card renderer loads the supplied PNG directly. It does not recreate the artwork in HTML/CSS/SVG. SVG is used only for the three dynamic text values, while the master image remains the complete visual foundation.

### Photo area

The current coordinates are calibrated to the supplied 1055 × 1491 template. The photo is rotated according to EXIF, cropped with `cover`, masked to a circle, and composited underneath the original decorative frame.

If the template is replaced later, recalibrate the photo coordinates in `src/card.js`.

## Production notes

For production, use HTTPS so the session cookie is marked `Secure`, put the app behind a reverse proxy, and back up `db/builder-id.sqlite` plus uploaded photos. For a multi-instance deployment, replace SQLite with a managed database such as PostgreSQL/Supabase while retaining the same server-side Builder ID generation rules.
