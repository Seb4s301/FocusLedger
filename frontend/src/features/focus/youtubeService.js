/**
 * youtubeService.js
 *
 * Validación de URLs de YouTube, extracción de video_id y carga del IFrame player.
 *
 * Requisitos: 7.1, 7.2, 7.3, 7.4
 */

/**
 * Regex para validar URLs de YouTube aceptadas:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/playlist?list=PLAYLIST_ID
 */
const YT_VIDEO_REGEX = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([\w-]{11})/;
const YT_SHORT_REGEX = /^(?:https?:\/\/)?youtu\.be\/([\w-]{11})/;
const YT_PLAYLIST_REGEX = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?.*list=([\w-]+)/;

/**
 * Valida si una URL es un formato de YouTube aceptado.
 * @param {string} url
 * @returns {boolean}
 */
export function validateYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return YT_VIDEO_REGEX.test(url) || YT_SHORT_REGEX.test(url) || YT_PLAYLIST_REGEX.test(url);
}

/**
 * Extrae el video_id de una URL de YouTube.
 * @param {string} url
 * @returns {string|null} - Video ID o null si no se pudo extraer
 */
export function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  let match = url.match(YT_VIDEO_REGEX);
  if (match) return match[1];

  match = url.match(YT_SHORT_REGEX);
  if (match) return match[1];

  return null;
}

/**
 * Extrae el playlist ID de una URL de YouTube.
 * @param {string} url
 * @returns {string|null}
 */
export function extractPlaylistId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(YT_PLAYLIST_REGEX);
  return match ? match[1] : null;
}

/**
 * Determina si la URL es un playlist.
 * @param {string} url
 * @returns {boolean}
 */
export function isPlaylistUrl(url) {
  return YT_PLAYLIST_REGEX.test(url || '');
}

/**
 * Carga el YouTube IFrame API y crea un player en el contenedor indicado.
 * Si la API ya está cargada, crea el player directamente.
 *
 * @param {string} containerId - ID del elemento DOM contenedor
 * @param {string} videoId - YouTube video ID
 * @param {object} [options] - Opciones adicionales del player
 * @returns {Promise<object>} - YouTube Player instance
 */
export function loadPlayer(containerId, videoId, options = {}) {
  return new Promise((resolve, reject) => {
    function createPlayer() {
      try {
        const player = new window.YT.Player(containerId, {
          videoId,
          height: options.height || '100%',
          width: options.width || '100%',
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
            ...(options.playerVars || {}),
          },
          events: {
            onReady: () => resolve(player),
            onError: (event) => reject(new Error(`YouTube error: ${event.data}`)),
            ...(options.events || {}),
          },
        });
      } catch (err) {
        reject(err);
      }
    }

    // Si la API ya está cargada
    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    // Cargar la API de YouTube IFrame
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    // Esperar a que la API esté lista
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      createPlayer();
    };
  });
}
