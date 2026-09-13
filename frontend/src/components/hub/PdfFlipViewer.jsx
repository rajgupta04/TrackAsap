import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  BookOpen,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
  Layers,
  ScrollText,
  Lightbulb,
  Sun,
  Moon,
  Sparkles,
  Hand,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

// Paper flip sound generator using Web Audio API
const playPaperFlipSound = (isMuted) => {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const duration = 0.18;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.6);
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + duration);
    filter.Q.value = 2.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseSource.start();
    noiseSource.stop(ctx.currentTime + duration);
  } catch (e) {}
};

// Satisfying lamp switch click sound
const playLampClickSound = (isMuted) => {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
};

// Lighting mood presets (including AMOLED Dark mode)
const LIGHT_PRESETS = [
  {
    id: 'daylight',
    label: 'Daylight',
    icon: Sun,
    brightness: 100,
    warmth: 0,
    contrast: 100,
    isDark: false,
    desc: 'Crisp White',
  },
  {
    id: 'warm',
    label: 'Warm Study',
    icon: BookOpen,
    brightness: 88,
    warmth: 28,
    contrast: 98,
    isDark: false,
    desc: 'Eye Comfort',
  },
  {
    id: 'night',
    label: 'Night Shift',
    icon: Moon,
    brightness: 68,
    warmth: 44,
    contrast: 95,
    isDark: false,
    desc: 'Low Glare',
  },
  {
    id: 'dark',
    label: 'AMOLED Dark',
    icon: Moon,
    brightness: 92,
    warmth: 0,
    contrast: 98,
    isDark: true,
    desc: 'Inverted Dark',
  },
  {
    id: 'candle',
    label: 'Candlelight',
    icon: Sparkles,
    brightness: 48,
    warmth: 60,
    contrast: 92,
    isDark: false,
    desc: 'Soft Amber',
  },
];

/**
 * Native Canvas Page Renderer
 * Renders vector PDF pages directly onto an HTML5 <canvas> without image conversion,
 * compression, or downsampling. Ensures 100% crystal-clear vector text at any DPI/zoom.
 */
const PdfPageCanvas = ({
  pdfDoc,
  pageNumber,
  zoomLevel = 1,
  className = '',
  style = {},
  canvasCacheRef,
}) => {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    if (!pdfDoc || !pageNumber || pageNumber < 1) return;

    let isMounted = true;
    setIsRendering(true);

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Cancel previous render on this canvas
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {}
        }

        // Native device pixel ratio (Retina = 2+, Standard = 1-1.5)
        const dpr = window.devicePixelRatio || 1;
        // High-DPI scale (min 2.6x base scale, scales up with zoom if zoomed in)
        const effectiveZoom = Math.max(1, Math.min(2.5, zoomLevel));
        const renderScale = Math.max(2.6, dpr * 1.8 * effectiveZoom);

        const viewport = page.getViewport({ scale: renderScale });

        // Physical canvas buffer dimensions
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d', {
          alpha: false,
          desynchronized: true,
        });

        // Crisp solid white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Render vector paths with print intent for sharp font curves
        const task = page.render({
          canvasContext: ctx,
          viewport: viewport,
          intent: 'print',
        });

        renderTaskRef.current = task;
        await task.promise;

        if (isMounted) {
          setIsRendering(false);
          // Save canvas snapshot into cache for 3D flip animation
          if (canvasCacheRef?.current) {
            canvasCacheRef.current.set(pageNumber, canvas);
          }
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException' && isMounted) {
          console.error(`Page ${pageNumber} render error:`, err);
          setIsRendering(false);
        }
      }
    };

    render();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [pdfDoc, pageNumber, zoomLevel > 1.25 ? Math.round(zoomLevel * 2) / 2 : 1]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={style}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain block"
        style={{
          imageRendering: '-webkit-optimize-contrast',
          transform: 'translateZ(0)',
        }}
      />
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#fbfbf9]/80 backdrop-blur-[1px] pointer-events-none transition-opacity z-10">
          <Loader2 className="w-7 h-7 animate-spin text-dark-400" />
        </div>
      )}
    </div>
  );
};

/**
 * Scroll Page Component for Continuous Vertical PDF Viewer
 * Uses IntersectionObserver lazy loading so multi-page documents render smoothly without lag.
 */
const PdfScrollPage = ({
  pdfDoc,
  pageNumber,
  totalPages,
  zoomLevel,
  pageAspectRatio,
  computedPageFilter,
  canvasCacheRef,
  onVisible,
  onDoubleClick,
}) => {
  const pageContainerRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const el = pageContainerRef.current;
    if (!el) return;

    // Lazy load canvas when page is within 800px margin of viewport
    const renderObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
        }
      },
      { rootMargin: '800px 0px 800px 0px' }
    );
    renderObserver.observe(el);

    // Active page observer for updating currentPage in header & scrubber
    const activeObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          onVisible(pageNumber);
        }
      },
      { threshold: [0.25, 0.5] }
    );
    activeObserver.observe(el);

    return () => {
      renderObserver.disconnect();
      activeObserver.disconnect();
    };
  }, [pageNumber, onVisible]);

  return (
    <div
      id={`pdf-scroll-page-${pageNumber}`}
      ref={pageContainerRef}
      className="relative flex flex-col items-center w-full select-none"
    >
      {/* Page Header Mini-Bar */}
      <div className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-mono text-dark-400">
        <span className="flex items-center gap-1.5 font-semibold text-dark-300">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green/70" />
          Page {pageNumber}
        </span>
        <span className="text-[11px] text-dark-500 font-mono">
          {pageNumber} / {totalPages}
        </span>
      </div>

      {/* Page Canvas Container Card */}
      <div
        onDoubleClick={onDoubleClick}
        className="relative w-full bg-white rounded-xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] transition-all group"
        style={{
          aspectRatio: `${pageAspectRatio}`,
          filter: computedPageFilter,
          transition: 'filter 200ms ease-out',
        }}
      >
        {shouldRender ? (
          <PdfPageCanvas
            pdfDoc={pdfDoc}
            pageNumber={pageNumber}
            zoomLevel={zoomLevel}
            canvasCacheRef={canvasCacheRef}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#fbfbf9] text-dark-400">
            <Loader2 className="w-8 h-8 animate-spin text-dark-300 mb-2" />
            <span className="text-xs font-mono text-dark-500">Page {pageNumber}</span>
          </div>
        )}

        {/* Page badge on hover */}
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] font-mono text-white/90 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          {pageNumber} / {totalPages}
        </div>
      </div>
    </div>
  );
};

const PdfFlipViewer = ({
  fileUrl,
  fileName = 'Document Preview',
  onClose,
  onDownload,
}) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageAspectRatio, setPageAspectRatio] = useState(0.707); // Width / Height (A4 default)
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState(null);

  // In-memory canvas cache for instant flip textures
  const canvasCacheRef = useRef(new Map());

  // Flipping state: null | { direction: 'next' | 'prev', fromPage: number, toPage: number }
  const [flipState, setFlipState] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // Viewer mode: 'spread' | 'single' | 'scroll'
  const [viewMode, setViewMode] = useState('spread');
  const isSpreadMode = viewMode === 'spread';
  const isScrollMode = viewMode === 'scroll';
  const scrollContainerRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isMouseDownPan, setIsMouseDownPan] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState('1');

  // Ambient Lamp & Page Brightness Controls
  const [brightness, setBrightness] = useState(100);
  const [warmth, setWarmth] = useState(0);
  const [contrast, setContrast] = useState(100);
  const [showLampMenu, setShowLampMenu] = useState(false);
  const [activePreset, setActivePreset] = useState('daylight');

  // Gesture refs for Pinch-to-Zoom & Touch Pan
  const pinchStartDistRef = useRef(0);
  const pinchStartZoomRef = useRef(1);
  const isPinchingRef = useRef(false);
  const touchStartPanRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const isTouchPanningRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const mouseStartPanRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const containerRef = useRef(null);
  const viewerModalRef = useRef(null);
  const lampMenuRef = useRef(null);

  // Responsive mode check
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 840) {
        setViewMode((current) => (current === 'spread' ? 'single' : current));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to active page when entering scroll mode
  useEffect(() => {
    if (viewMode === 'scroll') {
      const timer = setTimeout(() => {
        const el = document.getElementById(`pdf-scroll-page-${currentPage}`);
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // Observer callback to sync currentPage as user scrolls through pages
  const handleScrollPageVisible = useCallback((pageNum) => {
    if (isProgrammaticScrollRef.current) return;
    setCurrentPage(pageNum);
  }, []);

  // Sync jump input
  useEffect(() => {
    setJumpPageInput(String(currentPage));
  }, [currentPage]);

  // Reset pan whenever zoom is back to 1
  useEffect(() => {
    if (zoomLevel <= 1.02) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Click outside lamp menu to dismiss
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (lampMenuRef.current && !lampMenuRef.current.contains(e.target)) {
        setShowLampMenu(false);
      }
    };
    if (showLampMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLampMenu]);

  // Trackpad pinch-to-zoom support (wheel with Ctrl / Meta)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.006;
        setZoomLevel((z) => Math.min(3.5, Math.max(0.7, Math.round((z + delta) * 100) / 100)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Load PDF Document
  useEffect(() => {
    if (!fileUrl) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadProgress(15);
    setLoadError(null);
    canvasCacheRef.current.clear();

    const loadPdf = async () => {
      try {
        let pdfSource;
        try {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buffer = await res.arrayBuffer();
          pdfSource = { data: new Uint8Array(buffer) };
        } catch (fetchErr) {
          pdfSource = { url: fileUrl, withCredentials: false };
        }

        if (!isMounted) return;
        setLoadProgress(50);

        const loadingTask = pdfjsLib.getDocument(pdfSource);
        loadingTask.onProgress = (progress) => {
          if (progress.total > 0 && isMounted) {
            setLoadProgress(50 + Math.round((progress.loaded / progress.total) * 45));
          }
        };

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);

        // Detect exact PDF page dimensions from page 1
        try {
          const firstPage = await doc.getPage(1);
          const unscaledViewport = firstPage.getViewport({ scale: 1.0 });
          if (unscaledViewport.width && unscaledViewport.height) {
            const ratio = unscaledViewport.width / unscaledViewport.height;
            setPageAspectRatio(ratio);
            if (ratio > 1.2 && window.innerWidth < 1200) {
              setViewMode((current) => (current === 'spread' ? 'single' : current));
            }
          }
        } catch (e) {}

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        if (isMounted) {
          setLoadError(err.message || 'Unable to open PDF preview');
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [fileUrl]);

  // Direct page navigation (smooth scroll in scroll mode, flip in spread/single)
  const jumpToPage = useCallback(
    (target) => {
      const p = Math.max(1, Math.min(totalPages, parseInt(target, 10) || 1));
      if (viewMode === 'scroll') {
        setCurrentPage(p);
        isProgrammaticScrollRef.current = true;
        const el = document.getElementById(`pdf-scroll-page-${p}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 500);
        return;
      }
      if (isFlipping) return;
      const normalized = isSpreadMode && p % 2 === 0 ? p - 1 : p;
      if (normalized !== currentPage) {
        playPaperFlipSound(isMuted);
        setCurrentPage(normalized);
      }
    },
    [totalPages, viewMode, isFlipping, isSpreadMode, currentPage, isMuted]
  );

  // Turn forward with realistic 3D leaf physics or scroll down to next page
  const flipNext = useCallback(() => {
    if (viewMode === 'scroll') {
      if (currentPage < totalPages) {
        jumpToPage(currentPage + 1);
      }
      return;
    }
    if (isFlipping || totalPages === 0) return;

    const step = isSpreadMode ? 2 : 1;
    const target = currentPage + step;
    if (target > totalPages && (!isSpreadMode || currentPage >= totalPages)) {
      return;
    }

    playPaperFlipSound(isMuted);
    setIsFlipping(true);
    setFlipState({
      direction: 'next',
      fromPage: currentPage,
      toPage: Math.min(totalPages, target),
    });

    setTimeout(() => {
      setCurrentPage((prev) => Math.min(totalPages, prev + step));
      setFlipState(null);
      setIsFlipping(false);
    }, 600);
  }, [viewMode, currentPage, totalPages, jumpToPage, isFlipping, isSpreadMode, isMuted]);

  // Turn backward with realistic 3D leaf physics or scroll up to prev page
  const flipPrev = useCallback(() => {
    if (viewMode === 'scroll') {
      if (currentPage > 1) {
        jumpToPage(currentPage - 1);
      }
      return;
    }
    if (isFlipping || totalPages === 0) return;

    const step = isSpreadMode ? 2 : 1;
    const target = currentPage - step;
    if (target < 1 && currentPage <= 1) {
      return;
    }

    playPaperFlipSound(isMuted);
    setIsFlipping(true);
    setFlipState({
      direction: 'prev',
      fromPage: currentPage,
      toPage: Math.max(1, target),
    });

    setTimeout(() => {
      setCurrentPage((prev) => Math.max(1, prev - step));
      setFlipState(null);
      setIsFlipping(false);
    }, 600);
  }, [viewMode, currentPage, jumpToPage, isFlipping, isSpreadMode, isMuted]);

  // Preset selection
  const applyPreset = (preset) => {
    playLampClickSound(isMuted);
    setActivePreset(preset.id);
    setBrightness(preset.brightness);
    setWarmth(preset.warmth);
    setContrast(preset.contrast);
    if (preset.isDark) {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  };

  // Quick bulb toggle
  const handleBulbClick = () => {
    playLampClickSound(isMuted);
    setShowLampMenu((prev) => !prev);
  };

  // Touch Gesture Handling (Multi-touch Pinch-to-Zoom + Touch Pan + Page Swipes)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Two fingers: Start Pinch-to-Zoom
      isPinchingRef.current = true;
      isTouchPanningRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartZoomRef.current = zoomLevel;
    } else if (e.touches.length === 1) {
      isPinchingRef.current = false;
      if (zoomLevel > 1.05) {
        // Zoomed in: One finger pans the viewport
        isTouchPanningRef.current = true;
        touchStartPanRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          panX: pan.x,
          panY: pan.y,
        };
      } else {
        // Normal zoom: One finger swipes to flip
        isTouchPanningRef.current = false;
        touchStartXRef.current = e.touches[0].clientX;
        touchStartYRef.current = e.touches[0].clientY;
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && isPinchingRef.current) {
      // Actively Pinching
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (pinchStartDistRef.current > 0) {
        const factor = currentDist / pinchStartDistRef.current;
        const newZoom = Math.min(
          3.5,
          Math.max(0.7, Math.round(pinchStartZoomRef.current * factor * 100) / 100)
        );
        setZoomLevel(newZoom);
      }
    } else if (e.touches.length === 1 && isTouchPanningRef.current && zoomLevel > 1.05) {
      // Actively Panning when zoomed
      e.preventDefault();
      const dx = e.touches[0].clientX - touchStartPanRef.current.x;
      const dy = e.touches[0].clientY - touchStartPanRef.current.y;
      setPan({
        x: touchStartPanRef.current.panX + dx,
        y: touchStartPanRef.current.panY + dy,
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      isPinchingRef.current = false;
    }
    if (e.touches.length === 0) {
      if (isTouchPanningRef.current) {
        isTouchPanningRef.current = false;
      } else if (zoomLevel <= 1.05 && touchStartXRef.current) {
        const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
        const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
            flipNext();
          } else {
            flipPrev();
          }
        }
      }
      touchStartXRef.current = 0;
      touchStartYRef.current = 0;
    }
  };

  // Mouse Drag to Pan when Zoomed in
  const handleMouseDown = (e) => {
    if (zoomLevel > 1.05 && e.button === 0) {
      setIsMouseDownPan(true);
      mouseStartPanRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleMouseMove = (e) => {
    if (isMouseDownPan && zoomLevel > 1.05) {
      const dx = e.clientX - mouseStartPanRef.current.x;
      const dy = e.clientY - mouseStartPanRef.current.y;
      setPan({
        x: mouseStartPanRef.current.panX + dx,
        y: mouseStartPanRef.current.panY + dy,
      });
    }
  };

  const handleMouseUp = () => {
    setIsMouseDownPan(false);
  };

  // Double Click / Double Tap to toggle zoom
  const handleDoubleClick = () => {
    if (zoomLevel > 1.05) {
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoomLevel(1.8);
    }
  };

  // Reset zoom & pan helper
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        flipNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        flipPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (showLampMenu) {
          setShowLampMenu(false);
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        playLampClickSound(isMuted);
        setIsDarkMode((d) => !d);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleBulbClick();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((m) => !m);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoomLevel((z) => Math.min(3.5, z + 0.2));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoomLevel((z) => Math.max(0.7, z - 0.2));
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipNext, flipPrev, onClose, showLampMenu, isMuted]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerModalRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Current spread pages
  const leftPageNum = currentPage;
  const rightPageNum = isSpreadMode ? currentPage + 1 : null;

  // Pages underneath during active 3D flip
  const underRightPageNum = flipState?.direction === 'next'
    ? currentPage + 3
    : rightPageNum;

  const underLeftPageNum = flipState?.direction === 'prev'
    ? currentPage - 2
    : leftPageNum;

  // Leaf faces during flip
  const flipFrontPageNum = flipState?.direction === 'next'
    ? (isSpreadMode ? currentPage + 1 : currentPage)
    : (isSpreadMode ? currentPage : currentPage);

  const flipBackPageNum = flipState?.direction === 'next'
    ? (isSpreadMode ? currentPage + 2 : currentPage + 1)
    : (isSpreadMode ? currentPage - 1 : currentPage - 1);

  // Dynamic filter combining Dark Mode inversion, brightness, warmth and contrast
  const computedPageFilter = `${
    isDarkMode ? 'invert(1) hue-rotate(180deg) contrast(96%) brightness(92%) ' : ''
  }brightness(${brightness}%) sepia(${warmth}%) contrast(${contrast}%)`.trim();

  return (
    <AnimatePresence>
      <motion.div
        ref={viewerModalRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-dark-950/95 backdrop-blur-2xl text-white select-none overflow-hidden"
      >
        {/* Top Control Header */}
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-dark-900/80 backdrop-blur-md z-30 shrink-0 shadow-lg relative">
          {/* Left Document Info */}
          <div className="flex items-center gap-3 min-w-0 max-w-[28%] sm:max-w-xs md:max-w-sm">
            <div className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-neon-green shrink-0 shadow-[0_0_12px_rgba(57,255,20,0.2)]">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {fileName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <span>
                  {totalPages > 0
                    ? isSpreadMode
                      ? `Pages ${leftPageNum}${rightPageNum && rightPageNum <= totalPages ? `-${rightPageNum}` : ''} of ${totalPages}`
                      : `Page ${currentPage} of ${totalPages}`
                    : 'Opening PDF...'}
                </span>
                {isDarkMode && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded border border-purple-400/25 font-mono">
                    <Moon size={10} className="fill-purple-300" /> Dark Mode
                  </span>
                )}
                {zoomLevel > 1.05 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 font-mono">
                    <Hand size={10} /> Drag to Pan
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CENTER: Interactive Reading Light Bulb Lamp Fixture */}
          <div ref={lampMenuRef} className="relative flex flex-col items-center z-40">
            <div className="w-0.5 h-2 bg-gradient-to-b from-white/30 to-amber-400/50" />

            <button
              onClick={handleBulbClick}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 ${
                brightness > 55
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.45)]'
                  : 'bg-dark-800/80 text-dark-400 border-white/10 hover:text-white'
              }`}
              title="Reading Light: Control Page Brightness & Mood (L)"
            >
              {brightness > 55 && (
                <span
                  className="absolute inset-0 rounded-full blur-md pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `rgba(251, 191, 36, ${(brightness / 100) * 0.35})`,
                  }}
                />
              )}

              <Lightbulb
                size={17}
                className={`relative z-10 transition-all duration-300 ${
                  brightness > 55
                    ? 'fill-amber-400 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse'
                    : 'text-dark-400 group-hover:text-amber-300'
                }`}
              />

              <span className="relative z-10 text-xs font-bold font-mono tracking-tight text-amber-300">
                {brightness}%
              </span>

              <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-amber-400/80 group-hover:scale-125 transition-transform" />
            </button>

            {/* Dropdown Brightness & Ambient Mood Card */}
            <AnimatePresence>
              {showLampMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-12 -translate-x-1/2 left-1/2 w-72 p-4 rounded-2xl bg-dark-900/95 border border-amber-500/30 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white select-none z-50"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={16} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold tracking-wide uppercase text-dark-200">
                        Page Brightness
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                      {brightness}%
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] text-dark-400 mb-1.5 font-medium">
                      <span>Dim (30%)</span>
                      <span className="text-amber-300">Adjust Intensity</span>
                      <span>Bright (130%)</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="130"
                      step="1"
                      value={brightness}
                      onChange={(e) => {
                        setActivePreset('custom');
                        setBrightness(parseInt(e.target.value, 10));
                      }}
                      className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="mb-3">
                    <p className="text-[11px] font-semibold text-dark-400 mb-2 uppercase tracking-wider">
                      Lighting Mood
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {LIGHT_PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        const isSelected = activePreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => applyPreset(preset)}
                            className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-400/40 text-white shadow-sm'
                                : 'bg-dark-800/60 border-white/5 text-dark-400 hover:text-white hover:bg-dark-800'
                            }`}
                          >
                            <Icon
                              size={14}
                              className={isSelected ? 'text-amber-400' : 'text-dark-500'}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-none truncate">
                                {preset.label}
                              </p>
                              <p className="text-[10px] text-dark-400 leading-tight mt-0.5">
                                {preset.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <div className="flex justify-between text-[11px] text-dark-400 mb-1 font-medium">
                      <span>Cool White</span>
                      <span className="text-amber-300">Amber Warmth ({warmth}%)</span>
                      <span>Warm Sepia</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="70"
                      step="1"
                      value={warmth}
                      onChange={(e) => {
                        setActivePreset('custom');
                        setWarmth(parseInt(e.target.value, 10));
                      }}
                      className="w-full h-1.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Switcher (Spread | Single | Scroll) */}
            <div className="flex items-center bg-dark-800/80 rounded-lg p-1 border border-white/5">
              <button
                onClick={() => {
                  playLampClickSound(isMuted);
                  setViewMode('spread');
                }}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'spread'
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'text-dark-400 hover:text-white'
                }`}
                title="Book Spread (2 Pages 3D Flip)"
              >
                <BookOpen size={13} />
                <span>Spread</span>
              </button>
              <button
                onClick={() => {
                  playLampClickSound(isMuted);
                  setViewMode('single');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'single'
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'text-dark-400 hover:text-white'
                }`}
                title="Single Page View (3D Flip)"
              >
                <Layers size={13} />
                <span>Single</span>
              </button>
              <button
                onClick={() => {
                  playLampClickSound(isMuted);
                  setViewMode('scroll');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'scroll'
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'text-dark-400 hover:text-white'
                }`}
                title="Continuous Vertical Scroll (Normal PDF)"
              >
                <ScrollText size={13} />
                <span>Scroll</span>
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => {
                playLampClickSound(isMuted);
                setIsDarkMode((d) => !d);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isDarkMode
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                  : 'bg-dark-800/80 text-dark-400 border-white/5 hover:text-white hover:bg-dark-800'
              }`}
              title="Toggle Inverted Dark Mode (D)"
            >
              <Moon
                size={13}
                className={isDarkMode ? 'text-purple-400 fill-purple-400' : 'text-dark-400'}
              />
              <span className="hidden sm:inline">{isDarkMode ? 'Dark' : 'Light'}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setIsMuted((m) => !m)}
              className={`p-2 rounded-lg border transition-all ${
                !isMuted
                  ? 'bg-dark-800/80 text-neon-green border-neon-green/20 hover:bg-dark-800'
                  : 'bg-dark-800/40 text-dark-500 border-white/5 hover:text-white'
              }`}
              title={isMuted ? 'Unmute sound (M)' : 'Mute sound (M)'}
            >
              {!isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Zoom Controls with Pinch Feedback */}
            <div className="hidden sm:flex items-center bg-dark-800/80 rounded-lg border border-white/5 p-0.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
                className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
                title="Zoom Out (-)"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-[11px] font-mono px-2 text-dark-300 min-w-[44px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3.5, z + 0.2))}
                className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
                title="Zoom In (+)"
              >
                <ZoomIn size={15} />
              </button>
              {zoomLevel !== 1 && (
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 text-dark-400 hover:text-neon-green transition-all"
                  title="Reset Zoom & Pan (0)"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>

            {/* Download Original File */}
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neon-green/15 text-neon-green hover:bg-neon-green/25 border border-neon-green/30 transition-all shadow-sm"
                title="Download PDF document"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-dark-800/80 text-dark-400 hover:text-white border border-white/5 transition-all"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all ml-1"
              title="Close Preview (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Central Stage Area (Supports 3D perspective in Flip mode, and smooth vertical scroll in Scroll mode) */}
        <div
          ref={containerRef}
          onTouchStart={isScrollMode ? undefined : handleTouchStart}
          onTouchMove={isScrollMode ? undefined : handleTouchMove}
          onTouchEnd={isScrollMode ? undefined : handleTouchEnd}
          onMouseDown={isScrollMode ? undefined : handleMouseDown}
          onMouseMove={isScrollMode ? undefined : handleMouseMove}
          onMouseUp={isScrollMode ? undefined : handleMouseUp}
          onMouseLeave={isScrollMode ? undefined : handleMouseUp}
          className={`flex-1 relative flex items-center justify-center overflow-hidden ${
            isScrollMode ? 'p-0' : 'p-4 sm:p-8'
          }`}
          style={{
            perspective: isScrollMode ? undefined : '2400px',
            transformStyle: isScrollMode ? undefined : 'preserve-3d',
            touchAction: isScrollMode ? 'auto' : 'none',
          }}
        >
          {/* Ambient Reading Lamp Light Cone */}
          <div
            className="absolute inset-x-0 top-0 h-[85%] pointer-events-none transition-opacity duration-300 z-10"
            style={{
              background: isDarkMode
                ? `radial-gradient(ellipse 70% 60% at 50% -5%, rgba(168, 85, 247, ${
                    (brightness / 100) * 0.12
                  }) 0%, transparent 75%)`
                : `radial-gradient(ellipse 70% 60% at 50% -5%, rgba(255, 235, 175, ${
                    (brightness / 100) * 0.18
                  }) 0%, rgba(251, 191, 36, ${(brightness / 100) * 0.08}) 45%, transparent 75%)`,
              opacity: brightness > 20 ? 1 : 0,
            }}
          />

          {/* Loading View */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 text-center max-w-sm z-20">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-neon-green animate-spin" />
                <div className="absolute inset-0 rounded-full blur-md bg-neon-green/20 animate-pulse" />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-1">Loading Interactive PDF</p>
                <p className="text-xs text-dark-400">Rendering vector pages at native clarity...</p>
              </div>
              <div className="w-52 h-1.5 bg-dark-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-neon-green transition-all duration-300"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error View */}
          {loadError && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 text-center max-w-md p-6 rounded-2xl bg-dark-900 border border-red-500/30 shadow-2xl z-20">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Could not render preview</h3>
                <p className="text-xs text-dark-400 mb-4">{loadError}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neon-green text-dark-950 hover:bg-neon-green/90 transition-all font-mono"
                >
                  <ExternalLink size={14} />
                  Open in Browser
                </a>
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-white border border-white/10 transition-all"
                  >
                    <Download size={14} />
                    Download File
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Continuous Vertical Scroll View (Normal PDF View) */}
          {!isLoading && !loadError && totalPages > 0 && isScrollMode && (
            <div
              ref={scrollContainerRef}
              className="w-full h-full overflow-y-auto overflow-x-auto p-4 sm:p-8 flex flex-col items-center custom-scrollbar relative z-20"
              style={{
                scrollBehavior: 'smooth',
                touchAction: 'pan-y pinch-zoom',
              }}
            >
              <div
                className="flex flex-col items-center gap-8 pb-16 transition-[width,max-width] duration-150 ease-out"
                style={{
                  width: `${Math.min(96, Math.max(45, 72 * zoomLevel))}%`,
                  maxWidth: `${Math.round(880 * zoomLevel)}px`,
                  minWidth: '280px',
                }}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <PdfScrollPage
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    totalPages={totalPages}
                    zoomLevel={zoomLevel}
                    pageAspectRatio={pageAspectRatio}
                    computedPageFilter={computedPageFilter}
                    canvasCacheRef={canvasCacheRef}
                    onVisible={handleScrollPageVisible}
                    onDoubleClick={handleDoubleClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Floating Next/Prev Arrows in Scroll Mode */}
          {!isLoading && !loadError && totalPages > 0 && isScrollMode && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  flipPrev();
                }}
                disabled={currentPage <= 1}
                className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-dark-900/90 text-white border border-white/20 flex items-center justify-center shadow-2xl hover:bg-neon-green hover:text-dark-950 hover:border-neon-green transition-all z-30 ${
                  currentPage <= 1 ? 'opacity-0 pointer-events-none' : 'opacity-85 hover:opacity-100'
                }`}
                title="Previous Page"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  flipNext();
                }}
                disabled={currentPage >= totalPages}
                className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-dark-900/90 text-white border border-white/20 flex items-center justify-center shadow-2xl hover:bg-neon-green hover:text-dark-950 hover:border-neon-green transition-all z-30 ${
                  currentPage >= totalPages ? 'opacity-0 pointer-events-none' : 'opacity-85 hover:opacity-100'
                }`}
                title="Next Page"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Active 3D Book Stage (Spread / Single) */}
          {!isLoading && !loadError && totalPages > 0 && !isScrollMode && (
            <div
              onDoubleClick={handleDoubleClick}
              className={`relative z-20 transition-transform ${
                isMouseDownPan || isTouchPanningRef.current ? 'duration-0' : 'duration-150 ease-out'
              }`}
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                cursor: zoomLevel > 1.05 ? (isMouseDownPan ? 'grabbing' : 'grab') : 'default',
              }}
            >
              {/* Spread Mode (Dual Page Bound Book) */}
              {isSpreadMode ? (
                <div
                  className="relative flex items-center justify-center rounded-2xl bg-[#0e1117] border border-white/10 p-2 sm:p-3 select-none"
                  style={{
                    perspective: '2200px',
                    transformStyle: 'preserve-3d',
                    boxShadow: isDarkMode
                      ? '0 30px 90px rgba(0,0,0,0.95), 0 0 40px rgba(168,85,247,0.1), 0 0 0 1px rgba(255,255,255,0.05)'
                      : '0 30px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05), 6px 0 12px rgba(0,0,0,0.5)',
                    filter: computedPageFilter,
                    transition: 'filter 200ms ease-out',
                  }}
                >
                  {/* Left Page (Base) */}
                  <div
                    onClick={() => {
                      if (zoomLevel <= 1.05) flipPrev();
                    }}
                    className={`relative w-[340px] sm:w-[420px] md:w-[480px] lg:w-[540px] bg-white rounded-l-xl overflow-hidden border-r border-dark-300/40 group transition-all ${
                      currentPage <= 1 || zoomLevel > 1.05 ? '' : 'cursor-pointer'
                    }`}
                    style={{
                      aspectRatio: `${pageAspectRatio}`,
                      boxShadow:
                        '-4px 0 0 rgba(220, 220, 220, 0.25), -8px 0 0 rgba(180, 180, 180, 0.15), -12px 0 0 rgba(140, 140, 140, 0.08)',
                    }}
                  >
                    <PdfPageCanvas
                      pdfDoc={pdfDoc}
                      pageNumber={underLeftPageNum}
                      zoomLevel={zoomLevel}
                      canvasCacheRef={canvasCacheRef}
                    />

                    {/* Book spine crease shadow */}
                    <div
                      className="absolute inset-y-0 right-0 w-16 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to left, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.12) 35%, transparent 100%)',
                      }}
                    />

                    {/* Dynamic overlay shadow when leaf lands */}
                    {flipState?.direction === 'next' && (
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          animation: 'pageArrivalShadow 600ms ease-out forwards',
                        }}
                      />
                    )}

                    {/* Page number badge */}
                    <div className="absolute bottom-2 left-4 px-2 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] font-mono text-white/90 pointer-events-none">
                      {underLeftPageNum}
                    </div>

                    {/* Left corner turn hover hint */}
                    {currentPage > 1 && zoomLevel <= 1.05 && (
                      <div className="absolute top-0 left-0 w-14 h-14 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute top-0 left-0 w-10 h-10 bg-gradient-to-br from-dark-400/70 to-transparent transform -rotate-45 -translate-x-4 -translate-y-4 shadow-lg" />
                      </div>
                    )}
                  </div>

                  {/* Spine Crease */}
                  <div className="w-1.5 sm:w-2 h-full bg-gradient-to-r from-dark-950 via-[#07090e] to-dark-950 border-x border-black/70 shadow-inner z-20 shrink-0" />

                  {/* Right Page (Base) */}
                  <div
                    onClick={() => {
                      if (zoomLevel <= 1.05) flipNext();
                    }}
                    className={`relative w-[340px] sm:w-[420px] md:w-[480px] lg:w-[540px] bg-white rounded-r-xl overflow-hidden border-l border-dark-300/40 group transition-all ${
                      (rightPageNum && rightPageNum >= totalPages) || zoomLevel > 1.05 ? '' : 'cursor-pointer'
                    }`}
                    style={{
                      aspectRatio: `${pageAspectRatio}`,
                      boxShadow:
                        '4px 0 0 rgba(220, 220, 220, 0.25), 8px 0 0 rgba(180, 180, 180, 0.15), 12px 0 0 rgba(140, 140, 140, 0.08)',
                    }}
                  >
                    {underRightPageNum && underRightPageNum <= totalPages ? (
                      <PdfPageCanvas
                        pdfDoc={pdfDoc}
                        pageNumber={underRightPageNum}
                        zoomLevel={zoomLevel}
                        canvasCacheRef={canvasCacheRef}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#f7f7f4] text-dark-400 p-8 text-center border-dashed border-2 border-dark-200/60 m-2 rounded-xl">
                        <BookOpen className="w-12 h-12 text-dark-300 mb-3" />
                        <p className="text-sm font-bold text-dark-600">End of Document</p>
                        <p className="text-xs text-dark-400 mt-1">Total {totalPages} pages</p>
                      </div>
                    )}

                    {/* Book spine crease shadow */}
                    <div
                      className="absolute inset-y-0 left-0 w-16 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to right, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.12) 35%, transparent 100%)',
                      }}
                    />

                    {/* Dynamic overlay shadow when leaf lifts */}
                    {flipState?.direction === 'next' && (
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          animation: 'pageDepartureShadow 600ms ease-out forwards',
                        }}
                      />
                    )}

                    {/* Page number badge */}
                    {underRightPageNum && underRightPageNum <= totalPages && (
                      <div className="absolute bottom-2 right-4 px-2 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] font-mono text-white/90 pointer-events-none">
                        {underRightPageNum}
                      </div>
                    )}

                    {/* Right corner dog-ear fold hint */}
                    {rightPageNum && rightPageNum < totalPages && zoomLevel <= 1.05 && (
                      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-dark-300 to-transparent transform rotate-45 translate-x-5 -translate-y-5 shadow-xl border-l border-b border-dark-400/40" />
                        <span className="absolute top-1 right-1 text-[8px] font-bold text-dark-600 uppercase font-mono">
                          Flip
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 3D Turning Leaf (Flip Forward / Next) */}
                  {flipState?.direction === 'next' && (
                    <div
                      className="absolute top-2 sm:top-3 bottom-2 sm:bottom-3 right-2 sm:right-3 w-[340px] sm:w-[420px] md:w-[480px] lg:w-[540px] pointer-events-none z-30"
                      style={{
                        aspectRatio: `${pageAspectRatio}`,
                        transformOrigin: 'left center',
                        animation: 'flipForward 600ms cubic-bezier(0.38, 0.04, 0.2, 1) forwards',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Front face */}
                      <div
                        className="absolute inset-0 bg-white rounded-r-xl overflow-hidden shadow-2xl"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                      >
                        <PdfPageCanvas
                          pdfDoc={pdfDoc}
                          pageNumber={flipFrontPageNum}
                          zoomLevel={zoomLevel}
                          canvasCacheRef={canvasCacheRef}
                        />
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            animation: 'frontLeafCurvatureShadow 600ms ease-in-out forwards',
                          }}
                        />
                      </div>

                      {/* Back face */}
                      <div
                        className="absolute inset-0 bg-white rounded-l-xl overflow-hidden shadow-2xl"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <PdfPageCanvas
                          pdfDoc={pdfDoc}
                          pageNumber={flipBackPageNum}
                          zoomLevel={zoomLevel}
                          canvasCacheRef={canvasCacheRef}
                        />
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            animation: 'backLeafCurvatureShadow 600ms ease-in-out forwards',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 3D Turning Leaf (Flip Backward / Prev) */}
                  {flipState?.direction === 'prev' && (
                    <div
                      className="absolute top-2 sm:top-3 bottom-2 sm:bottom-3 left-2 sm:left-3 w-[340px] sm:w-[420px] md:w-[480px] lg:w-[540px] pointer-events-none z-30"
                      style={{
                        aspectRatio: `${pageAspectRatio}`,
                        transformOrigin: 'right center',
                        animation: 'flipBackward 600ms cubic-bezier(0.38, 0.04, 0.2, 1) forwards',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Front face */}
                      <div
                        className="absolute inset-0 bg-white rounded-l-xl overflow-hidden shadow-2xl"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                      >
                        <PdfPageCanvas
                          pdfDoc={pdfDoc}
                          pageNumber={flipFrontPageNum}
                          zoomLevel={zoomLevel}
                          canvasCacheRef={canvasCacheRef}
                        />
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            animation: 'frontLeafCurvatureShadow 600ms ease-in-out forwards',
                          }}
                        />
                      </div>

                      {/* Back face */}
                      <div
                        className="absolute inset-0 bg-white rounded-r-xl overflow-hidden shadow-2xl"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(-180deg)',
                        }}
                      >
                        <PdfPageCanvas
                          pdfDoc={pdfDoc}
                          pageNumber={flipBackPageNum}
                          zoomLevel={zoomLevel}
                          canvasCacheRef={canvasCacheRef}
                        />
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            animation: 'backLeafCurvatureShadow 600ms ease-in-out forwards',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Single Page Mode */
                <div
                  className={`relative w-[340px] sm:w-[460px] md:w-[560px] bg-white rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.85)] border border-white/10 select-none group ${
                    zoomLevel > 1.05 ? '' : 'cursor-pointer'
                  }`}
                  style={{
                    aspectRatio: `${pageAspectRatio}`,
                    perspective: '2000px',
                    transformStyle: 'preserve-3d',
                    boxShadow: isDarkMode
                      ? '0 30px 90px rgba(0,0,0,0.95), 0 0 40px rgba(168,85,247,0.1), 0 0 0 1px rgba(255,255,255,0.05)'
                      : '0 30px 70px rgba(0,0,0,0.85)',
                    filter: computedPageFilter,
                    transition: 'filter 200ms ease-out',
                  }}
                  onClick={(e) => {
                    if (zoomLevel > 1.05) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    if (clickX > rect.width / 2) {
                      flipNext();
                    } else {
                      flipPrev();
                    }
                  }}
                >
                  <PdfPageCanvas
                    pdfDoc={pdfDoc}
                    pageNumber={currentPage}
                    zoomLevel={zoomLevel}
                    canvasCacheRef={canvasCacheRef}
                  />

                  {/* Single Page 3D Flip Leaf */}
                  {flipState?.direction === 'next' && (
                    <div
                      className="absolute inset-0 pointer-events-none z-30"
                      style={{
                        transformOrigin: 'left center',
                        animation: 'flipForward 600ms cubic-bezier(0.38, 0.04, 0.2, 1) forwards',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <div
                        className="absolute inset-0 bg-white rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                      >
                        <PdfPageCanvas
                          pdfDoc={pdfDoc}
                          pageNumber={flipFrontPageNum}
                          zoomLevel={zoomLevel}
                          canvasCacheRef={canvasCacheRef}
                        />
                      </div>
                      <div
                        className="absolute inset-0 bg-white rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <PdfPageCanvas
                          pdfDoc={pdfDoc}
                          pageNumber={flipBackPageNum}
                          zoomLevel={zoomLevel}
                          canvasCacheRef={canvasCacheRef}
                        />
                      </div>
                    </div>
                  )}

                  {/* Page number badge */}
                  <div className="absolute bottom-3 right-4 px-2.5 py-1 rounded-md bg-black/65 backdrop-blur-sm text-[11px] font-mono text-white/90 pointer-events-none">
                    {currentPage} / {totalPages}
                  </div>
                </div>
              )}

              {/* Side Floating Next/Prev Arrow Buttons */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  flipPrev();
                }}
                disabled={currentPage <= 1 || isFlipping}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-7 w-12 h-12 rounded-full bg-dark-900/90 text-white border border-white/20 flex items-center justify-center shadow-2xl hover:bg-neon-green hover:text-dark-950 hover:border-neon-green transition-all z-40 ${
                  currentPage <= 1 ? 'opacity-0 pointer-events-none' : 'opacity-85 hover:opacity-100'
                }`}
                title="Previous Page (←)"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  flipNext();
                }}
                disabled={currentPage >= totalPages || isFlipping}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-7 w-12 h-12 rounded-full bg-dark-900/90 text-white border border-white/20 flex items-center justify-center shadow-2xl hover:bg-neon-green hover:text-dark-950 hover:border-neon-green transition-all z-40 ${
                  currentPage >= totalPages ? 'opacity-0 pointer-events-none' : 'opacity-85 hover:opacity-100'
                }`}
                title="Next Page (→)"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Navigation & Scrubber Bar */}
        <footer className="h-16 px-4 sm:px-6 flex items-center justify-between border-t border-white/10 bg-dark-900/80 backdrop-blur-md z-30 shrink-0 gap-4 shadow-2xl">
          {/* Quick Step Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => jumpToPage(1)}
              disabled={currentPage <= 1 || isFlipping}
              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={flipPrev}
              disabled={currentPage <= 1 || isFlipping}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <button
              onClick={flipNext}
              disabled={currentPage >= totalPages || isFlipping}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => jumpToPage(totalPages)}
              disabled={currentPage >= totalPages || isFlipping}
              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>

          {/* Scrubber Range Slider */}
          <div className="flex-1 max-w-md hidden sm:flex items-center gap-3">
            <span className="text-[11px] font-mono text-dark-400">1</span>
            <input
              type="range"
              min="1"
              max={Math.max(1, totalPages)}
              value={currentPage}
              onChange={(e) => jumpToPage(e.target.value)}
              className="flex-1 h-1.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-neon-green focus:outline-none"
            />
            <span className="text-[11px] font-mono text-dark-400">{totalPages}</span>
          </div>

          {/* Jump to Page input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-dark-400 hidden sm:inline">Jump:</span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                jumpToPage(jumpPageInput);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                className="w-14 px-2 py-1 text-xs text-center font-mono bg-dark-800 border border-white/10 rounded-md text-white focus:border-neon-green/50 focus:outline-none"
              />
              <span className="text-xs text-dark-400 font-mono">/ {totalPages}</span>
            </form>
          </div>
        </footer>

        {/* Global Keyframes for 3D Page Turn, Highlights, and Occlusion Shadows */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes flipForward {
            0% {
              transform: rotateY(0deg);
              box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            }
            45% {
              box-shadow: -25px 25px 50px rgba(0,0,0,0.55);
            }
            100% {
              transform: rotateY(-180deg);
              box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            }
          }

          @keyframes flipBackward {
            0% {
              transform: rotateY(0deg);
              box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            }
            45% {
              box-shadow: 25px 25px 50px rgba(0,0,0,0.55);
            }
            100% {
              transform: rotateY(180deg);
              box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            }
          }

          @keyframes frontLeafCurvatureShadow {
            0% {
              background: rgba(0, 0, 0, 0);
            }
            40% {
              background: linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.1) 100%);
            }
            100% {
              background: rgba(0, 0, 0, 0.6);
            }
          }

          @keyframes backLeafCurvatureShadow {
            0% {
              background: rgba(0, 0, 0, 0.6);
            }
            60% {
              background: linear-gradient(to left, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.1) 100%);
            }
            100% {
              background: rgba(0, 0, 0, 0);
            }
          }

          @keyframes pageDepartureShadow {
            0% {
              background: rgba(0, 0, 0, 0.35);
            }
            100% {
              background: rgba(0, 0, 0, 0);
            }
          }

          @keyframes pageArrivalShadow {
            0% {
              background: rgba(0, 0, 0, 0);
            }
            100% {
              background: rgba(0, 0, 0, 0.25);
            }
          }
        ` }} />
      </motion.div>
    </AnimatePresence>
  );
};

export default PdfFlipViewer;
