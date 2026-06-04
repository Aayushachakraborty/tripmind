import type { FormEvent } from "react";
import type { strings } from "../i18n/strings";

export type SceneType = "mountains" | "beaches" | "cities" | "deserts";

const scenes: SceneType[] = ["mountains", "beaches", "cities", "deserts"];

type Labels = typeof strings.EN;

type Props = {
  activeScene: SceneType;
  labels: Labels;
  onSceneChange: (scene: SceneType) => void;
  onSearch: (destination: string) => void;
};

function sceneCopy(scene: SceneType, labels: Labels) {
  return {
    mountains: { headline: labels.mountainsHeadline, tagline: labels.mountainsTagline },
    beaches: { headline: labels.beachesHeadline, tagline: labels.beachesTagline },
    cities: { headline: labels.citiesHeadline, tagline: labels.citiesTagline },
    deserts: { headline: labels.desertsHeadline, tagline: labels.desertsTagline }
  }[scene];
}

export function DestinationHero({ activeScene, labels, onSceneChange, onSearch }: Props) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const destination = String(data.get("hero-search") ?? "").trim();
    if (destination) onSearch(destination);
  }

  return (
    <header className={`destination-hero ${activeScene}`}>
      {scenes.map((scene) => (
        <div className={activeScene === scene ? `scene ${scene} active` : `scene ${scene}`} key={scene} aria-hidden={activeScene !== scene}>
          <div className="stars" />
          <div className="aurora" />
          <div className="moon" />
          <div className="sun" />
          <div className="peaks"><span /><span /><span /></div>
          <div className="snowcaps"><span /><span /><span /></div>
          <div className="ocean"><span /><span /><span /></div>
          <div className="palm"><span /><span /></div>
          <div className="city-grid">{Array.from({ length: 28 }).map((_, index) => <span key={index} />)}</div>
          <div className="dunes"><span /><span /><span /></div>
          <div className="camel" />
        </div>
      ))}
      <div className="hero-shade" />
      <div className="hero-content">
        <p>SAFAR</p>
        <h1>{sceneCopy(activeScene, labels).headline}</h1>
        <span>{sceneCopy(activeScene, labels).tagline}</span>
      </div>
      <div className="category-switch" aria-label="Destination categories">
        {scenes.map((scene) => (
          <button type="button" key={scene} className={activeScene === scene ? `category-chip ${scene} active` : `category-chip ${scene}`} onClick={() => onSceneChange(scene)}>
            {scene}
          </button>
        ))}
      </div>
      <form className="hero-search" onSubmit={submit}>
        <label htmlFor="hero-search" className="sr-only">Search destination</label>
        <input id="hero-search" name="hero-search" placeholder={labels.searchPlaceholder} />
        <button type="submit">Search</button>
      </form>
    </header>
  );
}
