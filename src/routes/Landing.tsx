import { Link } from "react-router-dom";
import { theme } from "../styles/theme";

function Landing() {
  return (
    <main className="landing">
      <header className="landing__hero">
        <div className="landing__badge">TECweek Preview</div>
        <h1 style={{ fontFamily: theme.typography.fontHeading }}>
          Enter the Portal
        </h1>
        <p>
          Step through a mixed reality doorway into the TECweek experience.
          Preview immersive activations, panels, and stories that will transform the city.
        </p>
        <Link to="/portal" className="cta">
          Explore Portal
        </Link>
      </header>
      <section className="landing__content">
        <article>
          <h2>What to Expect</h2>
          <ul>
            <li>Portal AR proof-of-concept for Android and iOS.</li>
            <li>Immersive TECweek room with dynamic interior panel.</li>
            <li>Enter and exit controls for quick exploration.</li>
          </ul>
        </article>
        <article>
          <h2>Try It Outside</h2>
          <ul>
            <li>Enable your camera or WebXR to anchor the portal.</li>
            <li>Move closer or tap enter to cross the threshold.</li>
            <li>Look around with device orientation or touch drag.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}

export default Landing;
