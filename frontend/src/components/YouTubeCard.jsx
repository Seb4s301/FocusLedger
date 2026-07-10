import { useState, useEffect, useRef, useCallback } from 'react';
import {
  validateYouTubeUrl,
  extractVideoId,
  isPlaylistUrl,
  extractPlaylistId,
} from '../features/focus/youtubeService.js';

async function fetchVideoTitle(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    const data = await res.json();
    return data.title || `Video (${videoId})`;
  } catch {
    return `Video (${videoId})`;
  }
}

function YouTubeCard() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loaded, setLoaded] = useState(false);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  const currentVideoId = currentIndex >= 0 ? queue[currentIndex]?.videoId : null;

  function destroyPlayer() {
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  }

  function loadYouTubePlayer(vid, autoplay = false) {
    destroyPlayer();
    if (!containerRef.current) return;

    const playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player-inner';
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(playerDiv);

    function createPlayer() {
      try {
        playerRef.current = new window.YT.Player('yt-player-inner', {
          videoId: vid,
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: () => setLoaded(true),
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                playNext();
              }
            },
          },
        });
      } catch (err) {
        setError('Error al cargar el reproductor.');
        console.error(err);
      }
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        createPlayer();
      };
    }
  }

  function loadPlaylistEmbed(playlistId) {
    destroyPlayer();
    if (!containerRef.current) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.borderRadius = '8px';
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);
  }

  useEffect(() => {
    if (!currentVideoId) {
      setLoaded(false);
      destroyPlayer();
      return;
    }
    loadYouTubePlayer(currentVideoId, true);
  }, [currentIndex]);

  async function handleAddToQueue() {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!validateYouTubeUrl(trimmed)) {
      setError('URL de YouTube no válida');
      return;
    }

    if (isPlaylistUrl(trimmed)) {
      const plId = extractPlaylistId(trimmed);
      if (plId) {
        setQueue(prev => [...prev, { id: plId, videoId: null, title: `Playlist (${plId})`, isPlaylist: true, url: trimmed }]);
        setUrl('');
        setError('');
      }
      return;
    }

    const vid = extractVideoId(trimmed);
    if (!vid) return;

    const title = await fetchVideoTitle(vid);
    setQueue(prev => [...prev, { id: vid, videoId: vid, title, isPlaylist: false, url: trimmed }]);
    setUrl('');
    setError('');

    if (currentIndex === -1) {
      setCurrentIndex(0);
    }
  }

  function playVideo(index) {
    if (index < 0 || index >= queue.length) return;
    setCurrentIndex(index);
  }

  function playNext() {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function removeFromQueue(index) {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (currentIndex === index) {
      setCurrentIndex(-1);
      setLoaded(false);
      destroyPlayer();
    } else if (currentIndex > index) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleAddToQueue();
    }
  }

  const handlePlay = useCallback(() => {
    if (playerRef.current?.playVideo) playerRef.current.playVideo();
  }, []);

  const handlePause = useCallback(() => {
    if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo();
  }, []);

  return (
    <div id="youtube-card" style={{
      border: '1px solid var(--border-color)',
      borderRadius: 12,
      background: 'var(--bg-surface)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <label htmlFor="youtube-url-input" style={{
          display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6,
        }}>
          🎵 YouTube — cola de reproducción
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="youtube-url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pega una URL de YouTube"
            style={{
              flex: 1,
              padding: '9px 12px',
              border: `1px solid ${error ? 'var(--color-accent)' : 'var(--border-color)'}`,
              borderRadius: 8,
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
              background: 'var(--bg-primary)',
              color: 'var(--text-main)',
            }}
          />
          <button
            onClick={handleAddToQueue}
            style={{
              padding: '9px 16px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Agregar
          </button>
        </div>
        {error && (
          <p style={{ color: 'var(--color-accent)', fontSize: 12, margin: '6px 0 0' }}>{error}</p>
        )}
      </div>

      {/* Player */}
      {currentVideoId && (
        <div style={{
          position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', background: '#000',
        }}>
          <div ref={containerRef} style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          }} />
        </div>
      )}

      {/* Controles */}
      {loaded && currentVideoId && (
        <div style={{
          padding: '10px 16px', display: 'flex', gap: 8,
          borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)',
        }}>
          <button onClick={handlePlay} style={{
            padding: '6px 16px', background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}>▶ Play</button>
          <button onClick={handlePause} style={{
            padding: '6px 16px', background: 'var(--bg-secondary)', color: 'var(--text-main)',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}>⏸ Pausar</button>
          {queue.length > 1 && currentIndex < queue.length - 1 && (
            <button onClick={playNext} style={{
              padding: '6px 16px', background: 'var(--bg-secondary)', color: 'var(--text-main)',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}>⏭ Siguiente</button>
          )}
        </div>
      )}

      {/* Cola de reproducción */}
      {queue.length > 0 && (
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {queue.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => !item.isPlaylist && playVideo(index)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                borderBottom: index < queue.length - 1 ? '1px solid var(--border-color)' : 'none',
                background: index === currentIndex ? 'var(--bg-secondary)' : 'transparent',
                cursor: item.isPlaylist ? 'default' : 'pointer',
                transition: 'background 0.1s',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 20 }}>
                {index + 1}
              </span>
              <span style={{
                flex: 1, fontSize: 13, color: 'var(--text-main)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontWeight: index === currentIndex ? 600 : 400,
              }}>
                {item.isPlaylist ? '📋 ' : '🎬 '}{item.title}
              </span>
              {item.isPlaylist && (
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 4, padding: '2px 6px' }}>
                  Playlist
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeFromQueue(index); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 16, color: 'var(--text-secondary)', padding: '2px 4px',
                  lineHeight: 1, opacity: 0.6,
                }}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {queue.length === 0 && (
        <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          Agrega videos a la cola para reproducirlos durante tu sesión de focus.
        </div>
      )}
    </div>
  );
}

export default YouTubeCard;
