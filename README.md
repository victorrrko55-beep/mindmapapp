# Building Mind Map

A small Next.js mind map app for creating, dragging, renaming, and organizing ideas visually.

## Features

- Create root ideas and child branches
- Drag nodes to custom positions
- Rename nodes from the sidebar or by double-clicking
- Autosave in the browser with `localStorage`
- Import and export the map as JSON
- Mobile-friendly web app metadata and installable manifest

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port `3000` is busy, Next.js will choose another port and show it in the terminal.

## Verify

```bash
npm run typecheck
npm run build
```

## Use On Your Phone Outside Home

To use this app outside your home network, deploy it to a public hosting service.

### Recommended: Vercel

1. Push this folder to a GitHub repository.
2. Go to [Vercel](https://vercel.com).
3. Import the GitHub repository.
4. Keep the default settings for a Next.js app.
5. Click deploy.
6. Open the generated public URL on your phone.

Once deployed, you can add it to your phone home screen like an app.

## Important Data Note

Right now the app stores maps in each device's own browser storage. That means:

- Your laptop and phone will not automatically share the same maps
- Refreshing the page on the same device keeps your data
- Switching devices requires exporting JSON from one device and importing it on the other

If you want shared sync across devices, the next step is adding a backend database and user accounts.
