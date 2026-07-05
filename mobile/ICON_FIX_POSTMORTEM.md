# TrackAsap Mobile — Icon/Font Fix Post-Mortem

> **Time spent:** ~8 hours across multiple sessions
> **APK builds:** 12+
> **Failed attempts:** 9
> **Root cause:** 2 lines of code

---

## The Problem

`@expo/vector-icons` icons (Ionicons) worked perfectly in **Expo Go** but showed as
**empty colored squares** in the native Android APK built with `gradlew assembleRelease`.
No Metro errors, no crash, just blank icons everywhere — navigation bar, dashboard,
discussion screen, everywhere.

---

## The 9 Failures

### ❌ Attempt 1 — Blame the import style
**Theory:** `{ Ionicons }` (named) vs `Ionicons` (default) import might be wrong.
**Result:** Same blank icons.
**Why it failed:** Import style was never the issue.

---

### ❌ Attempt 2 — Manual `build.gradle` linking via `fonts.gradle`
**Theory:** `react-native-vector-icons` fonts aren't linked natively.
**Action:** Added `apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"` to `build.gradle`.
**Result:** `Ionicons.ttf` copied to `android/app/src/main/assets/fonts/` — icons still blank.
**Why it failed:** The font file was in the right place but `@expo/vector-icons` uses
`expo-font`'s JS registry, NOT React Native's native font system. Having the file
physically present isn't enough — expo-font must also mark the font as loaded in its
own JS-side cache.

---

### ❌ Attempt 3 — Swap to `react-native-vector-icons` directly
**Theory:** Replace all `@expo/vector-icons` imports with `react-native-vector-icons/Ionicons`
which reads fonts natively without expo-font.
**Action:** Global find+replace across 18 files.
**Result:** Icons blank in native APK AND completely broken in Expo Go.
**Why it failed:**
1. `react-native-vector-icons` v10 has no re-render trigger after font loads — first paint is always blank.
2. `react-native-vector-icons` is a native-only module that **doesn't work in Expo Go's sandboxed environment**.

---

### ❌ Attempt 4 — `Font.loadAsync({ ...Ionicons.font })` in `useEffect`
**Theory:** Manually call expo-font's `loadAsync` after app mounts.
**Result:** Icons still blank.
**Why it failed:** `Font.loadAsync` fires AFTER the first render. The icon component
checks `Font.isLoaded()` at construction time and never re-checks. Also,
`Asset.downloadAsync()` was silently hanging.

---

### ❌ Attempt 5 — `useFonts` hook blocking with a spinner
**Theory:** Use the official `useFonts` hook to block render until font is ready.

```js
const [fontsLoaded] = useFonts({ ...Ionicons.font });
if (!fontsLoaded) return <Spinner />;
```

**Result:** App stuck on spinner indefinitely. Never got past it.
**Why it failed:** `useFonts` calls `Asset.fromModule(assetId).downloadAsync()`.
In a production APK with no Metro server and no network, `Asset.downloadAsync()`
**hangs forever** — neither resolves nor rejects. The font asset from `node_modules`
is not reliably resolvable offline.

---

### ❌ Attempt 6 — `useFonts` with `fontError` fallback
**Theory:** If font loading errors, proceed anyway.

```js
const [fontsLoaded, fontError] = useFonts({ ...Ionicons.font });
const appReady = fontsLoaded || fontError != null;
```

**Result:** Still stuck on spinner.
**Why it failed:** `downloadAsync()` doesn't error — it **hangs indefinitely**.
`fontError` never gets set because the promise just never settles.

---

### ❌ Attempt 7 — Copy font locally, load via `require('./assets/fonts/Ionicons.ttf')`
**Theory:** The hang is specific to assets from `node_modules`. A local project asset
should work differently.
**Result:** Still stuck on spinner.
**Why it failed:** Even with a local `require()`, `useFonts` still goes through
`Asset.fromModule()` → `asset.downloadAsync()` → same hang. The hang is in
`expo-asset`'s download mechanism itself in offline production builds, regardless
of where the file comes from.

---

### ❌ Attempt 8 — `expo-font` config plugin in `app.json`
**Theory:** The config plugin pre-bundles fonts natively before JS runs.

```json
"plugins": [["expo-font", { "fonts": ["...Ionicons.ttf"] }]]
```

**Result:** Font file physically in APK, but icons still blank.
**Why it failed:** The plugin copies `Ionicons.ttf` (capital I) and the native side
registers it as `'Ionicons'`. But `@expo/vector-icons` checks `Font.isLoaded('ionicons')`
(lowercase). **Case-sensitive mismatch** — expo-font's cache never finds `'ionicons'`.

---

### ❌ Attempt 9 — `react-native-vector-icons` with `ionicons.ttf` (lowercase)
**Theory:** Use the standalone package with the correctly-named font file.
**Result:** Icons blank in native APK. Also broken in Expo Go.
**Why it failed:**
1. No re-render trigger in `react-native-vector-icons` v10 after async font load.
2. Expo Go incompatibility remains.

---

## ✅ The Fix That Worked (Attempt 10)

### Root Cause

`@expo/vector-icons`'s `createIconSet.js` has this logic:

```js
// Runs synchronously at component construction
state = { fontIsLoaded: Font.isLoaded('ionicons') }

// Runs AFTER first render — HANGS in offline APK
async componentDidMount() {
  if (!this.state.fontIsLoaded) {
    await Font.loadAsync({ ionicons: asset }); // ← HANGS forever
    this.setState({ fontIsLoaded: true });
  }
}

render() {
  if (!this.state.fontIsLoaded) return <Text />; // ← BLANK BOX
  return <Icon />;
}
```

The hang is in `Font.loadAsync` → `Asset.downloadAsync()`.
Solution: **bypass it entirely** by pre-populating expo-font's JS cache before
any component ever renders.

---

### The Fix

**Part 1 — Pre-mark `'ionicons'` as loaded synchronously in expo-font's JS cache:**

```js
// App.js — at module level, before React renders anything
import { markLoaded } from 'expo-font/build/memory';
markLoaded('ionicons');
// Font.isLoaded('ionicons') → true immediately on first render
// No async, no network, no downloads
```

**Part 2 — Put the font where React Native's `ReactFontManager` finds it automatically:**

```
android/app/src/main/assets/fonts/ionicons.ttf   ← lowercase filename!
```

`ReactFontManager` automatically tries `assets/fonts/{fontFamily}.ttf` when a Text
component uses `fontFamily: 'ionicons'`. No native registration required.

**Why it works:**
1. `markLoaded('ionicons')` → `cache['ionicons'] = true` → `Font.isLoaded('ionicons')` → `true`
2. Icon component initializes with `fontIsLoaded: true` → renders on first paint
3. `fontFamily: 'ionicons'` → `ReactFontManager` → finds `assets/fonts/ionicons.ttf` → loads Typeface synchronously from APK → glyphs render correctly
4. **Zero async, zero network, zero downloads, zero spinners**

Works in **Expo Go** too — Expo Go pre-loads vector icon fonts already, `markLoaded` is harmless.

---

## Files Changed

| File | Change |
|------|--------|
| `App.js` | Added `markLoaded('ionicons')` — removed all `useFonts`/spinner logic |
| `android/app/src/main/assets/fonts/ionicons.ttf` | Font physically embedded in APK (lowercase) |
| `android/app/build.gradle` | `fonts.gradle` kept; `ionicons.ttf` copied manually alongside |
| All 18 screen/component files | Import unchanged: `{ Ionicons } from '@expo/vector-icons'` |

---

## Key Lessons

| Lesson | Detail |
|--------|--------|
| `Asset.downloadAsync()` hangs offline | In production APKs, expo-asset's download mechanism hangs forever without a Metro server. It doesn't error — it just never resolves. |
| The config plugin case-sensitivity bug | Plugin registers font as `Ionicons` (capital I). `@expo/vector-icons` checks for `ionicons` (lowercase). Always a mismatch. |
| `react-native-vector-icons` ≠ Expo Go | Native-only module. Sandboxed Expo Go runtime can't use it. |
| Two separate font systems | `expo-font` has its own JS registry. `ReactFontManager` is Android's native registry. A file in the APK doesn't mean expo-font knows it exists. |
| `markLoaded` is the escape hatch | Pre-populate expo-font's internal cache synchronously to skip the entire broken async download chain. |

---

## Build Commands

```powershell
# Build Release APK
$env:JAVA_HOME="C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"; $env:GRADLE_USER_HOME="S:\.gradle"; cd android; .\gradlew assembleRelease; cd ..

# Install + Launch on device
adb -s 9634059434000CY install -r android\app\build\outputs\apk\release\app-release.apk
adb -s 9634059434000CY shell am start -n com.trackasap.mobile/.MainActivity

# Run in Expo Go
npx expo start --clear
```

---

*Fixed: July 5, 2026 · ~8 hours · 12+ APK builds · 9 failures · 2 lines of actual fix*
