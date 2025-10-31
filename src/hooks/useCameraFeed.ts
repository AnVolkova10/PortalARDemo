import { useCallback, useEffect, useRef, useState } from "react";

type CameraStatus = "idle" | "pending" | "ready" | "error";

export function useCameraFeed() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const ensureVideoElement = useCallback(() => {
    if (!videoRef.current) {
      const video = document.createElement("video");
      video.setAttribute("playsinline", "true");
      video.muted = true;
      videoRef.current = video;
    }
    return videoRef.current;
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
    setStatus("idle");
  }, []);

  const request = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported in this browser.");
      setStatus("error");
      return;
    }

    setStatus("pending");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      const videoElement = ensureVideoElement();
      streamRef.current = stream;
      videoElement.srcObject = stream;
      await videoElement.play();

      setStatus("ready");
    } catch (err) {
      console.error("Camera access failed", err);
      stop();
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not access camera.");
    }
  }, [ensureVideoElement, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    status,
    error,
    video: videoRef.current,
    stream: streamRef.current,
    request,
    stop
  };
}
