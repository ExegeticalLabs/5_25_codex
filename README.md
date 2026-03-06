# MyoBound iOS Foundation (Next.js + Capacitor)

This workspace is now configured for:

- Next.js static export (`output: 'export'`)
- Capacitor iOS wrapper (`com.aaronknudson.myobound`)
- Native-safe adapters for:
  - Preferences-backed persistence
  - Haptics
  - Keep-awake
  - Share-sheet JSON backup export

## Run Web

```bash
npm install
npm run dev
```

## Build + Sync iOS

```bash
npm run cap:sync:ios
```

## Open in Xcode

```bash
npm run cap:open:ios
```

Then in Xcode:

1. Select `App` target
2. Set Signing Team (Automatic signing)
3. Choose an iPhone device/simulator
4. Run

## Current App Scope

The current `app/page.jsx` is a foundation shell focused on native integration and iOS pipeline verification.
The next step is migrating your full workout UI/logic into this shell.
