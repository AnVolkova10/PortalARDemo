import { useEffect, useRef } from "react";

type Props = {
  video?: HTMLVideoElement | null;
  active: boolean;
};

function CameraBackground({ video, active }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!video) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.transform = "scaleX(-1)"; // mirror camera for intuitive movement
    video.playsInline = true;
    if (!container.contains(video)) {
      container.appendChild(video);
    }

    return () => {
      if (container.contains(video)) {
        container.removeChild(video);
      }
    };
  }, [video]);

  return (
    <div
      ref={containerRef}
      className="camera-background"
      aria-hidden={!active}
      style={{ opacity: active ? 1 : 0 }}
    />
  );
}

export default CameraBackground;
