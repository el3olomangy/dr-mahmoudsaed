"use client";

import { useEffect, useRef, useState } from "react";
import {
  detectVideoType,
  getYouTubeVideoId,
} from "@/lib/utils/video";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  Settings,
} from "lucide-react";

interface VideoPlayerProps {
  url: string;
  watermark?: string;
  lectureId?: string;
  initialPosition?: number;
  onProgress?: (position: number, duration: number) => void;
}

// ====== YouTube Player ======
function YouTubePlayer({
  videoId,
  watermark,
  initialPosition,
  onProgress,
}: {
  videoId: string;
  watermark?: string;
  initialPosition?: number;
  onProgress?: (p: number, d: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const isDragging = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState({ x: 50, y: 50 });
  const [ytProgress, setYtProgress] = useState(0);
  const [ytCurrent, setYtCurrent] = useState(0);
  const [ytDuration, setYtDuration] = useState(0);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const formatYTTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({ x: Math.random() * 60 + 20, y: Math.random() * 60 + 20 });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadYT = () => {
      if (!containerRef.current) return;
      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, controls: 0, disablekb: 1, iv_load_policy: 3 },
        events: {
          onStateChange: (e: any) => {
            setIsPlaying(e.data === 1);
            if (e.data === 1 && initialPosition && initialPosition > 5) {
              const current = playerRef.current?.getCurrentTime() || 0;
              if (current < 5) playerRef.current?.seekTo(initialPosition, true);
            }
          },
          onReady: () => {
            let tick = 0;
            intervalRef.current = setInterval(() => {
              if (isDragging.current) return;
              const p = playerRef.current?.getCurrentTime() || 0;
              const d = playerRef.current?.getDuration() || 0;
              if (d > 0) {
                setYtCurrent(p);
                setYtDuration(d);
                setYtProgress((p / d) * 100);
              }
              tick++;
              if (tick >= 10 && p > 0 && onProgress) { onProgress(p, d); tick = 0; }
            }, 1000);
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      loadYT();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = loadYT;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current?.destroy) playerRef.current.destroy();
    };
  }, [videoId]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const seek = (seconds: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo((playerRef.current.getCurrentTime() || 0) + seconds, true);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    isMuted ? playerRef.current.unMute() : playerRef.current.mute();
    setIsMuted(!isMuted);
  };

  const changeSpeed = (s: number) => {
    if (!playerRef.current) return;
    playerRef.current.setPlaybackRate(s);
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const duration = playerRef.current?.getDuration() || 0;

    const applyRatio = (clientX: number) => {
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setYtProgress(ratio * 100);
      setYtCurrent(ratio * duration);
      playerRef.current?.seekTo(ratio * duration, true);
    };

    applyRatio(e.clientX);

    const onMove = (ev: MouseEvent) => { if (isDragging.current) applyRatio(ev.clientX); };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={wrapperRef}
      className="player-wrapper relative aspect-video bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { setShowControls(false); setShowSpeedMenu(false); }}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      <div
        className="absolute inset-0 z-10"
        onContextMenu={(e) => e.preventDefault()}
        onClick={togglePlay}
        style={{ cursor: "pointer" }}
      />

      {watermark && (
        <div
          className="absolute text-white/40 text-sm font-bold pointer-events-none select-none transition-all duration-1000 z-20"
          style={{ left: `${watermarkPos.x}%`, top: `${watermarkPos.y}%`, transform: "translate(-50%, -50%)", textShadow: "1px 1px 3px rgba(0,0,0,0.9)" }}
        >
          {watermark}
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}
      >
        {/* Progress Bar قابل للسحب */}
        <div className="px-3 pt-2 pb-1">
          <div
            className="relative h-2 bg-white/20 cursor-pointer rounded-full"
            onMouseDown={handleProgressMouseDown}
          >
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full"
              style={{ width: `${ytProgress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"
              style={{ left: `calc(${ytProgress}% - 6px)` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 pb-3">
          <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button onClick={() => seek(-10)} className="text-white hover:text-white/80 transition-colors" title="10 ثانية للخلف">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => seek(10)} className="text-white hover:text-white/80 transition-colors" title="10 ثانية للأمام">
            <RotateCw className="w-5 h-5" />
          </button>
          <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <span className="text-white/60 text-xs font-mono">
            {formatYTTime(ytCurrent)} / {formatYTTime(ytDuration)}
          </span>
          <div className="flex-1" />
          <div className="relative">
            <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="text-white hover:text-white/80 text-sm font-bold flex items-center gap-1">
              <Settings className="w-4 h-4" />{speed}x
            </button>
            {showSpeedMenu && (
              <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: "8px", zIndex: 50 }} className="bg-black/90 rounded-lg overflow-hidden min-w-20">
                {speeds.map((s) => (
                  <button key={s} onClick={() => changeSpeed(s)} className={`block w-full px-4 py-2 text-sm text-right transition-colors ${speed === s ? "bg-primary text-white" : "text-white hover:bg-white/10"}`}>
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== HTML5 Player ======
function HTML5Player({
  url,
  watermark,
  initialPosition,
  onProgress,
}: {
  url: string;
  watermark?: string;
  initialPosition?: number;
  onProgress?: (p: number, d: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<any>(null);
  const isDragging = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState({ x: 50, y: 50 });

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({ x: Math.random() * 60 + 20, y: Math.random() * 60 + 20 });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
  };

  const seek = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changeSpeed = (s: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    e.preventDefault();
    isDragging.current = true;
    const rect = e.currentTarget.getBoundingClientRect();

    const applyRatio = (clientX: number) => {
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      if (videoRef.current) videoRef.current.currentTime = ratio * duration;
    };

    applyRatio(e.clientX);

    const onMove = (ev: MouseEvent) => { if (isDragging.current) applyRatio(ev.clientX); };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const isDrive = url.includes("drive.google.com");

  if (isDrive) {
    const driveUrl = url.replace("/view", "/preview").replace("/edit", "/preview");
    return (
      <div className="player-wrapper relative aspect-video bg-black">
        <iframe src={driveUrl} className="absolute inset-0 w-full h-full" allow="autoplay" onContextMenu={(e) => e.preventDefault()} />
        {watermark && (
          <div className="absolute text-white/40 text-sm font-bold pointer-events-none select-none transition-all duration-1000 z-20"
            style={{ left: `${watermarkPos.x}%`, top: `${watermarkPos.y}%`, transform: "translate(-50%, -50%)", textShadow: "1px 1px 3px rgba(0,0,0,0.9)" }}>
            {watermark}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="player-wrapper relative aspect-video bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { setShowControls(false); setShowSpeedMenu(false); }}
    >
      <video
        ref={videoRef}
        src={url}
        className="absolute inset-0 w-full h-full"
        onPlay={() => {
          setIsPlaying(true);
          if (onProgress && videoRef.current) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = setInterval(() => {
              if (videoRef.current) onProgress(videoRef.current.currentTime, videoRef.current.duration || 0);
            }, 10000);
          }
        }}
        onPause={() => { setIsPlaying(false); if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); }}
        onEnded={() => { setIsPlaying(false); if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); }}
        onTimeUpdate={() => {
          if (!videoRef.current || isDragging.current) return;
          setCurrentTime(videoRef.current.currentTime);
          setProgress((videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100);
        }}
        onLoadedMetadata={() => {
          const d = videoRef.current?.duration || 0;
          setDuration(d);
          if (initialPosition && initialPosition > 5 && videoRef.current) {
            videoRef.current.currentTime = initialPosition;
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
      />

      {watermark && (
        <div className="absolute text-white/40 text-sm font-bold pointer-events-none select-none transition-all duration-1000 z-20"
          style={{ left: `${watermarkPos.x}%`, top: `${watermarkPos.y}%`, transform: "translate(-50%, -50%)", textShadow: "1px 1px 3px rgba(0,0,0,0.9)" }}>
          {watermark}
        </div>
      )}

      <div className="absolute inset-0 z-10" onClick={togglePlay} onContextMenu={(e) => e.preventDefault()} style={{ cursor: "pointer" }} />

      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}
      >
        {/* Progress Bar قابل للسحب */}
        <div className="px-3 pt-2 pb-1">
          <div
            className="relative h-2 bg-white/20 cursor-pointer rounded-full"
            onMouseDown={handleProgressMouseDown}
          >
            <div className="absolute top-0 left-0 h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" style={{ left: `calc(${progress}% - 6px)` }} />
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 pb-3">
          <button onClick={togglePlay} className="text-white hover:text-white/80">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button onClick={() => seek(-10)} className="text-white hover:text-white/80" title="10 ثانية للخلف">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => seek(10)} className="text-white hover:text-white/80" title="10 ثانية للأمام">
            <RotateCw className="w-5 h-5" />
          </button>
          <button onClick={toggleMute} className="text-white hover:text-white/80">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <span className="text-white/60 text-xs font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="flex-1" />
          <div className="relative">
            <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="text-white hover:text-white/80 text-sm font-bold flex items-center gap-1">
              <Settings className="w-4 h-4" />{speed}x
            </button>
            {showSpeedMenu && (
              <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: "8px", zIndex: 50 }} className="bg-black/90 rounded-lg overflow-hidden min-w-20">
                {speeds.map((s) => (
                  <button key={s} onClick={() => changeSpeed(s)} className={`block w-full px-4 py-2 text-sm text-right transition-colors ${speed === s ? "bg-primary text-white" : "text-white hover:bg-white/10"}`}>
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={toggleFullscreen} className="text-white hover:text-white/80">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== Main VideoPlayer ======
export default function VideoPlayer({ url, watermark, lectureId, initialPosition, onProgress }: VideoPlayerProps) {
  const videoType = detectVideoType(url);

  if (!url) {
    return (
      <div className="aspect-video bg-black flex items-center justify-center text-white/60">
        <p>الفيديو مش متاح</p>
      </div>
    );
  }

  if (videoType === "youtube") {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    return <YouTubePlayer videoId={videoId} watermark={watermark} initialPosition={initialPosition} onProgress={onProgress} />;
  }

  return <HTML5Player url={url} watermark={watermark} initialPosition={initialPosition} onProgress={onProgress} />;
}