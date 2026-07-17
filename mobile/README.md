# ChoiceGrid mobile (Expo Go)

Native shell that opens the **hosted ChoiceGrid web app** in a WebView. It is not a separate ops backend and does not rewrite the control-tower UI in React Native.

Demo state (`localStorage`) lives inside the WebView on this device. It does not sync with desktop browsers.

---

## Prerequisites

- [Expo Go](https://expo.dev/go) on iOS or Android
- A reachable ChoiceGrid URL:
  - **Production:** your Vercel deployment (see [`docs/DEPLOY.md`](../docs/DEPLOY.md))
  - **Local:** `npm run dev` on your computer, then use the machine **LAN IP** (for example `http://192.168.1.20:3000`). Phones cannot use `localhost` to reach your laptop.

---

## Setup

```bash
cd mobile
cp .env.example .env
# Edit EXPO_PUBLIC_WEB_URL to your Vercel URL or LAN IP
npm install
npx expo start
```

Scan the QR code with Expo Go.

In the app toolbar, tap **Server** to change the URL without rebuilding. The value is stored on device.

---

## Manual check

1. Load `/dashboard` through Expo Go.
2. Complete or spot-check the hero flow (inventory → plans → approve → packing/mission → simulate → impact).
3. Reload the WebView; demo progress should persist.
4. Use **Reset scenario** in the web UI; confirm return to `/dashboard`.

---

## Notes

- Optional LLM / Vapi keys stay on the Next.js server (Vercel env), never in the Expo app.
- App Store / Play Store release is out of scope; Expo Go only for this companion.
