import { useState, useEffect, useRef, useCallback } from 'react';
import {
  validateYouTubeUrl,
  extractVideoId,
  isPlaylistUrl,
  extractPlaylistId,
} from '../features/focus/youtubeService.js';

/**
 * YouTubeCard.jsx
 *
 * Componente para reproducir videos de YouTube durante sesiones de focus.
 * - Input con validación en tiempo real de URL
 * - Carga YouTube IFrame player cuando la URL es válida
 * - Controles de reproducción (play, pause)
 *
 * Requisitos: 7.1, 7.2, 7.3, 7.4
 */

function YouTubeCard() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  // Validación en tiempo real
  useEffect(() => {
    if (url.trim() === '') {
      setError('');
      setVideoId(null);
      setLoaded(false);
      destroyPlayer();
      return;
    }

    if (!validateYouTubeUrl(url)) {
      setError('URL de YouTube no válida. Formatos aceptados: youtube.com/watch?v=..., youtu.be/..., youtube.com/playlist?list=...');
      setVideoId(null);
      setLoaded(false);
      destroyPlayer();
      return;
    }

    setError('');

    if (isPlaylistUrl(url)) {
      const plId = extractPlaylistId(url);
      if (plId) {
        setVideoId(null);
        setLoaded(true);
        // Para playlists, usar un iframe directo
        loadPlaylistEmbed(plId);
      }
    } else {
      const vid = extractVideoId(url);
      if (vid && vid !== videoId) {
        setVideoId(vid);
      }
    }
  }, [url]);

  // Cargar player cuando cambia el videoId
  useEffect(() => {
    if (!videoId) return;
    loadYouTubePlayer(videoId);
  }, [videoId]);

  function destroyPlayer() {
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    }
    // Limpiar contenedor
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
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

  function loadYouTubePlayer(vid) {
    destroyPlayer();
    if (!containerRef.current) return;

    // Crear un div hijo para el player
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
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: () => setLoaded(true),
          },
        });
      } catch (err) {
        setError('Error al cargar el reproductor de YouTube.');
        console.error(err);
      }
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // Cargar la API
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

  const handlePlay = useCallback(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo();
    }
  }, []);

  return (
    <div
      id="youtube-card"
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <label
          htmlFor="youtube-url-input"
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-main)',
            marginBottom: 6,
          }}
        >
          🎵 YouTube — música o audio de fondo
        </label>
        <input
          id="youtube-url-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Pega una URL de YouTube (video o playlist)"
          style={{
            width: '100%',
            padding: '9px 12px',
            border: `1px solid ${error ? 'var(--color-accent)' : 'var(--border-color)'}`,
            borderRadius: 8,
            fontSize: 14,
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.15s',
            background: 'var(--bg-primary)',
            color: 'var(--text-main)',
          }}
        />
        {error && (
          <p style={{ color: 'var(--color-accent)', fontSize: 12, margin: '6px 0 0' }}>{error}</p>
        )}
      </div>

      {/* Player */}
      {(videoId || (url && !error && isPlaylistUrl(url))) && (
        <div
          style={{
            position: 'relative',
            paddingBottom: '56.25%', /* 16:9 */
            height: 0,
            overflow: 'hidden',
            background: '#000',
          }}
        >
          <div
            ref={containerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      )}

      {/* Controles */}
      {loaded && videoId && (
        <div
          style={{
            padding: '10px 16px',
            display: 'flex',
            gap: 8,
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            id="yt-play-btn"
            onClick={handlePlay}
            style={{
              padding: '6px 16px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            ▶ Play
          </button>
          <button
            id="yt-pause-btn"
            onClick={handlePause}
            style={{
              padding: '6px 16px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            ⏸ Pausar
          </button>
        </div>
      )}
    </div>
  );
}

export default YouTubeCard;
