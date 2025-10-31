# TECweek Portal AR Demo

A Vite + React + TypeScript proof-of-concept that projects a TECweek-themed portal in AR. On Android devices with WebXR, the experience launches in immersive AR; on iOS and other browsers, a camera + parallax fallback keeps the interaction consistent. Users can approach or tap to enter the portal, explore an interior TECweek room, then exit back outside.

## A) Technologies & Why

- **Vite + React + TypeScript** &mdash; Fast hot-module dev loop with type safety and minimal tooling overhead. The file-based structure keeps React components, hooks, and Three.js helpers easy to navigate.
- **Three.js (direct API)** &mdash; Full control over rendering, WebXR hooks, and stencil operations for the portal mask without extra abstraction layers. Direct Three.js access keeps render order and buffers predictable.
- **No react-three-fiber/drei** &mdash; Avoids extra dependencies and abstractions so low-level portal masking, XR session management, and teardown remain explicit.

## B) The State of Web AR (POC)

- **Android / Chrome** — Uses `navigator.xr` to request an `immersive-ar` session. Optional hit-test anchoring positions the doorway ~2 meters ahead. Three.js renders directly into the WebXR layer.
- **iOS / Safari (and other non-WebXR browsers)** — Falls back to `getUserMedia` for camera video stacked behind the canvas. Device orientation (if granted) provides parallax; touch drag is the fallback for look-around. A tap anchors the portal at a fixed virtual distance.
- **Shared UX** — Both paths surface Enter/Exit controls and maintain consistent positioning cues so the experience feels similar even without SLAM.

## C) Portal Effect

- **Stencil Masking** — The portal ring renders with a hidden mask mesh that writes to the stencil buffer. Interior room geometry only draws where the stencil equals the portal reference value.
- **Outside vs. Inside** — Outside state shows the camera/XR background plus the glowing ring. Transitioning inside fades via timed state change and swaps to full interior rendering without the mask so the whole room remains visible.
- **State Machine** — A lightweight React hook tracks `outside → entering → inside`, allowing auto-enter when the portal fills the viewport or manual entry through the UI.

## D) Limitations

- No world occlusion or real-time lighting from the camera feed.
- Fallback camera path uses approximate parallax; true SLAM/anchoring isn’t implemented.
- Service worker is minimal (cache-first for core shell) and doesn’t handle updates beyond a simple version bump.
- WebXR session startup still requires a user gesture; browsers may prompt for permission differently.

## E) How to Run & Test

1. `npm install`
2. `npm run dev`
3. Use HTTPS for camera/XR access. Options:
   - `npm run dev -- --host --https` with a local cert, or
   - Use a tunneling tool (e.g., `npx localtunnel --port 5173`)
4. Visit `https://<host>/portal` on a real device. Grant camera (and orientation on iOS).
5. Anchor the portal (tap on iOS; move device on WebXR). Press **Enter Portal** or approach to transition. Use the **Exit** control to return outside.
6. Add to Home Screen on iOS for a more app-like feel.

## F) Next Steps

1. Integrate SLAM / anchor persistence (ARCore/ARKit) for stable world-locked placement.
2. Upgrade materials: PBR surfaces, emissive trims, and dynamic lighting driven by the camera feed.
3. Layer in spatial audio or subtle particle effects when entering/exiting.
4. Stream dynamic TECweek content (agenda, speakers, live updates) onto the interior info panel.

---

### Project Map

```
src/
  components/      UI + Three.js bridges (PortalCanvas, OverlayUI, etc.)
  hooks/           Camera, XR detection, orientation, portal state logic
  routes/          Landing and Portal views
  three/           Renderer, scenes, stencil effect helpers
  styles/          theme tokens and global styles
  sw.ts            Minimal offline cache (registered in main.tsx)
public/
  manifest.json    Optional PWA metadata (icons placeholder via vite.svg)
  vite.svg         Temporary icon until TECweek branding assets arrive
```
