"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { detectVideoType, getYouTubeVideoId, getGoogleDriveEmbedUrl } from "@/lib/utils/video"
import {
  Play, Pause, Volume2, VolumeX,
  Maximize, RotateCcw, RotateCw, Settings,
} from "lucide-react"

interface VideoPlayerProps {
  url: string
  watermark?: string
  lectureId?: string
  initialPosition?: number
  onProgress?: (position: number, duration: number) => void
}

// ====== YouTube Player ======
function YouTubePlayer({ videoId, watermark, initialPosition, onProgress }: { videoId: string; watermark?: string; initialPosition?: number; onProgress?: (p: number, d: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showControls, setShowControls] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [watermarkPos, setWatermarkPos] = useState({ x: 50, y: 50 })

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

  // تحريك الـ Watermark كل 5 ثواني
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({
        x: Math.random() * 60 + 20,
        y: Math.random() * 60 + 20,
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // تحميل YouTube IFrame API
  useEffect(() => {
    const loadYT = () => {
      if (!containerRef.current) return
      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: 0,          // نخفي الـ controls الأصلية
          disablekb: 1,         // نمنع الـ keyboard shortcuts
          iv_load_policy: 3,    // نخفي الـ annotations
        },
        events: {
          onStateChange: (e: any) => {
            setIsPlaying(e.data === 1)
            // لما الفيديو يبدأ، ابدأ من آخر نقطة
            if (e.data === 1 && initialPosition && initialPosition > 5) {
              const current = playerRef.current?.getCurrentTime() || 0
              if (current < 5) {
                playerRef.current?.seekTo(initialPosition, true)
              }
            }
          },
          onReady: () => {
            // تتبع التقدم كل 10 ثواني
            if (onProgress) {
              setInterval(() => {
                const p = playerRef.current?.getCurrentTime() || 0
                const d = playerRef.current?.getDuration() || 0
                if (p > 0) onProgress(p, d)
              }, 10000)
            }
          },
        },
      })
    }

    if ((window as any).YT && (window as any).YT.Player) {
      loadYT()
    } else {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(tag)
      ;(window as any).onYouTubeIframeAPIReady = loadYT
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy()
    }
  }, [videoId])

  const togglePlay = () => {
    if (!playerRef.current) return
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo()
  }

  const seek = (seconds: number) => {
    if (!playerRef.current) return
    const current = playerRef.current.getCurrentTime() || 0
    playerRef.current.seekTo(current + seconds, true)
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    isMuted ? playerRef.current.unMute() : playerRef.current.mute()
    setIsMuted(!isMuted)
  }

  const changeSpeed = (s: number) => {
    if (!playerRef.current) return
    playerRef.current.setPlaybackRate(s)
    setSpeed(s)
    setShowSpeedMenu(false)
  }

  const toggleFullscreen = () => {
    const el = wrapperRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  return (
    <div
      ref={wrapperRef}
      className="player-wrapper relative aspect-video bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { setShowControls(false); setShowSpeedMenu(false) }}
    >
      {/* YouTube iframe */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Invisible overlay لمنع الـ right-click والتفاعل المباشر */}
      <div
        className="absolute inset-0 z-10"
        onContextMenu={e => e.preventDefault()}
        onClick={togglePlay}
        style={{ cursor: "pointer" }}
      />

      {/* Watermark */}
      {watermark && (
        <div
          className="absolute text-white/40 text-sm font-bold pointer-events-none select-none transition-all duration-1000 z-20"
          style={{
            left: `${watermarkPos.x}%`,
            top: `${watermarkPos.y}%`,
            transform: "translate(-50%, -50%)",
            textShadow: "1px 1px 3px rgba(0,0,0,0.9)",
          }}
        >
          {watermark}
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}
      >
        <div className="flex items-center gap-3 p-3">

          {/* تشغيل/إيقاف */}
          <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors" title={isPlaying ? "إيقاف" : "تشغيل"}>
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>

          {/* تأخير 10 ثانية */}
          <button onClick={() => seek(-10)} className="text-white hover:text-white/80 transition-colors" title="10 ثانية للخلف">
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* تقديم 10 ثانية */}
          <button onClick={() => seek(10)} className="text-white hover:text-white/80 transition-colors" title="10 ثانية للأمام">
            <RotateCw className="w-5 h-5" />
          </button>

          {/* صوت */}
          <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors" title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}>
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <div className="flex-1" />

          {/* سرعة التشغيل */}
          <div className="relative" style={{position:"relative"}}>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="text-white hover:text-white/80 text-sm font-bold flex items-center gap-1"
              title="سرعة التشغيل"
            >
              <Settings className="w-4 h-4" />
              {speed}x
            </button>
            {showSpeedMenu && (
              <div style={{position:"absolute", bottom:"100%", left:0, marginBottom:"8px", zIndex:50}} className="bg-black/90 rounded-lg overflow-hidden min-w-20">
                {speeds.map(s => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`block w-full px-4 py-2 text-sm text-right transition-colors ${speed === s ? "bg-primary text-white" : "text-white hover:bg-white/10"}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors" title="ملء الشاشة">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ====== HTML5 Player (Drive + روابط مباشرة) ======
function HTML5Player({ url, watermark, initialPosition, onProgress }: { url: string; watermark?: string; initialPosition?: number; onProgress?: (p: number, d: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [watermarkPos, setWatermarkPos] = useState({ x: 50, y: 50 })

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({ x: Math.random() * 60 + 20, y: Math.random() * 60 + 20 })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0")
    const sec = Math.floor(s % 60).toString().padStart(2, "0")
    return `${m}:${sec}`
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    isPlaying ? videoRef.current.pause() : videoRef.current.play()
  }

  const seek = (seconds: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const changeSpeed = (s: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = s
    setSpeed(s)
    setShowSpeedMenu(false)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = ratio * duration
  }

  const toggleFullscreen = () => {
    const el = wrapperRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  // لو Drive — نستخدم iframe عشان ما بيسمحش بـ direct embed في video tag
  const isDrive = url.includes("drive.google.com")

  if (isDrive) {
    const driveUrl = url.replace("/view", "/preview").replace("/edit", "/preview")
    return (
      <div
        className="player-wrapper relative aspect-video bg-black group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <iframe
          src={driveUrl}
          className="absolute inset-0 w-full h-full"
          allow="autoplay"
          onContextMenu={e => e.preventDefault()}
        />
        {watermark && (
          <div
            className="absolute text-white/40 text-sm font-bold pointer-events-none select-none transition-all duration-1000 z-20"
            style={{
              left: `${watermarkPos.x}%`, top: `${watermarkPos.y}%`,
              transform: "translate(-50%, -50%)",
              textShadow: "1px 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {watermark}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={wrapperRef}
      className="player-wrapper relative aspect-video bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { setShowControls(false); setShowSpeedMenu(false) }}
    >
      <video
        ref={videoRef}
        src={url}
        className="absolute inset-0 w-full h-full"
        onPlay={() => {
          setIsPlaying(true)
          // تتبع التقدم كل 10 ثواني
          if (onProgress && videoRef.current) {
            const interval = setInterval(() => {
              if (videoRef.current) {
                onProgress(videoRef.current.currentTime, videoRef.current.duration || 0)
              }
            }, 10000)
            // clearInterval عند الـ pause أو end — مش ممكن هنا بس نتعامل معاه بالـ component unmount
          }
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (!videoRef.current) return
          setCurrentTime(videoRef.current.currentTime)
          setProgress(videoRef.current.currentTime / (videoRef.current.duration || 1) * 100)
        }}
        onLoadedMetadata={() => {
          const d = videoRef.current?.duration || 0
          setDuration(d)
          // ابدأ من آخر نقطة
          if (initialPosition && initialPosition > 5 && videoRef.current) {
            videoRef.current.currentTime = initialPosition
          }
        }}
        onContextMenu={e => e.preventDefault()}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
      />

      {/* Watermark */}
      {watermark && (
        <div
          className="absolute text-white/40 text-sm font-bold pointer-events-none select-none transition-all duration-1000 z-20"
          style={{
            left: `${watermarkPos.x}%`, top: `${watermarkPos.y}%`,
            transform: "translate(-50%, -50%)",
            textShadow: "1px 1px 3px rgba(0,0,0,0.9)",
          }}
        >
          {watermark}
        </div>
      )}

      {/* Click overlay */}
      <div
        className="absolute inset-0 z-10"
        onClick={togglePlay}
        onContextMenu={e => e.preventDefault()}
        style={{ cursor: "pointer" }}
      />

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}
      >
        {/* Progress bar */}
        <div
          className="h-1 bg-white/20 cursor-pointer mx-3 mb-1 rounded-full overflow-hidden"
          onClick={handleProgressClick}
        >
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
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
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="text-white hover:text-white/80 text-sm font-bold flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              {speed}x
            </button>
            {showSpeedMenu && (
              <div style={{position:"absolute", bottom:"100%", left:0, marginBottom:"8px", zIndex:50}} className="bg-black/90 rounded-lg overflow-hidden min-w-20">
                {speeds.map(s => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`block w-full px-4 py-2 text-sm text-right transition-colors ${speed === s ? "bg-primary text-white" : "text-white hover:bg-white/10"}`}
                  >
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
  )
}

// ====== Main VideoPlayer ======
export default function VideoPlayer({ url, watermark, lectureId, initialPosition, onProgress }: VideoPlayerProps) {
  const videoType = detectVideoType(url)

  if (!url) {
    return (
      <div className="aspect-video bg-black flex items-center justify-center text-white/60">
        <p>الفيديو مش متاح</p>
      </div>
    )
  }

  if (videoType === "youtube") {
    const videoId = getYouTubeVideoId(url)
    if (!videoId) return null
    return <YouTubePlayer videoId={videoId} watermark={watermark} initialPosition={initialPosition} onProgress={onProgress} />
  }

  return <HTML5Player url={url} watermark={watermark} initialPosition={initialPosition} onProgress={onProgress} />
}