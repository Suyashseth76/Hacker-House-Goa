/**
 * Hacker House Goa 2026 — On-Spot Selfie Camera Handler
 * Provides webcam / mobile camera selfie capture functionality for photo file inputs.
 */

(function () {
  let mediaStream = null;
  let activeInput = null;
  let activePreviewContainer = null;
  let currentFacingMode = 'user'; // 'user' for front, 'environment' for back
  let availableCameras = [];

  // Modal HTML structure injected into document if not present
  function ensureModalExists() {
    if (document.getElementById('selfie-modal')) return;

    const modalHTML = `
      <div id="selfie-modal" class="selfie-modal-overlay hidden" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="selfie-modal-title">
        <div class="selfie-modal-card">
          <div class="selfie-modal-header">
            <div>
              <span class="selfie-kicker">GOA BUILDER SELFIE</span>
              <h3 id="selfie-modal-title">CLICK YOUR SELFIE</h3>
            </div>
            <button type="button" class="selfie-close-btn" id="selfie-close" aria-label="Close Camera">✕</button>
          </div>

          <div class="selfie-viewfinder-wrap">
            <video id="selfie-video" autoplay playsinline muted></video>
            <img id="selfie-preview-img" class="selfie-preview-img hidden" alt="Captured Selfie Preview" />
            <canvas id="selfie-canvas" style="display: none;"></canvas>
            
            <div id="selfie-viewfinder-overlay" class="selfie-viewfinder-overlay">
              <div class="selfie-guide-ring"></div>
              <span class="selfie-guide-text">Center your face in the circle</span>
            </div>

            <div id="selfie-error-msg" class="selfie-error-msg hidden" role="alert"></div>
          </div>

          <div class="selfie-modal-controls">
            <!-- Initial Live Controls -->
            <div id="selfie-live-actions" class="selfie-action-group">
              <button type="button" id="selfie-flip-btn" class="selfie-secondary-btn hidden" title="Flip Camera">
                <span>🔄 FLIP</span>
              </button>
              <button type="button" id="selfie-snap-btn" class="selfie-primary-btn">
                <span class="camera-icon">📸</span>
                <span>TAKE SNAP</span>
              </button>
              <button type="button" id="selfie-cancel-btn" class="selfie-secondary-btn">
                <span>CANCEL</span>
              </button>
            </div>

            <!-- Review / Confirmation Controls -->
            <div id="selfie-review-actions" class="selfie-action-group hidden">
              <button type="button" id="selfie-retake-btn" class="selfie-secondary-btn">
                <span>🔄 RETAKE</span>
              </button>
              <button type="button" id="selfie-use-btn" class="selfie-primary-btn">
                <span>✓ USE THIS PHOTO</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    bindModalEvents();
  }

  function bindModalEvents() {
    document.getElementById('selfie-close').addEventListener('click', closeSelfieModal);
    document.getElementById('selfie-cancel-btn').addEventListener('click', closeSelfieModal);
    document.getElementById('selfie-snap-btn').addEventListener('click', captureFrame);
    document.getElementById('selfie-retake-btn').addEventListener('click', resetToLiveStream);
    document.getElementById('selfie-use-btn').addEventListener('click', confirmAndUseSelfie);
    document.getElementById('selfie-flip-btn').addEventListener('click', toggleCameraFacingMode);

    // Close on overlay background click
    document.getElementById('selfie-modal').addEventListener('click', (e) => {
      if (e.target.id === 'selfie-modal') closeSelfieModal();
    });
  }

  async function checkMultipleCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      availableCameras = devices.filter((d) => d.kind === 'videoinput');
      const flipBtn = document.getElementById('selfie-flip-btn');
      if (availableCameras.length > 1) {
        flipBtn.classList.remove('hidden');
      } else {
        flipBtn.classList.add('hidden');
      }
    } catch {
      // Ignore device enumeration errors
    }
  }

  async function startCamera() {
    const errorEl = document.getElementById('selfie-error-msg');
    const video = document.getElementById('selfie-video');
    errorEl.classList.add('hidden');
    errorEl.textContent = '';

    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this device/browser.');
      }

      const constraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = mediaStream;
      await video.play();

      await checkMultipleCameras();
    } catch (err) {
      console.error('Selfie camera error:', err);
      let message = 'Could not open camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera found on your device.';
      } else if (err.message) {
        message = err.message;
      }
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  function stopCameraStream() {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
    const video = document.getElementById('selfie-video');
    if (video) video.srcObject = null;
  }

  function toggleCameraFacingMode() {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    startCamera();
  }

  function captureFrame() {
    const video = document.getElementById('selfie-video');
    const canvas = document.getElementById('selfie-canvas');
    const previewImg = document.getElementById('selfie-preview-img');
    const guideOverlay = document.getElementById('selfie-viewfinder-overlay');

    if (!video.videoWidth || !video.videoHeight) return;

    // Crop video frame to square
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    // Handle horizontal mirroring for front camera ('user')
    if (currentFacingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    // Show captured image preview
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    previewImg.src = dataUrl;

    video.classList.add('hidden');
    previewImg.classList.remove('hidden');
    guideOverlay.classList.add('hidden');

    document.getElementById('selfie-live-actions').classList.add('hidden');
    document.getElementById('selfie-review-actions').classList.remove('hidden');
  }

  function resetToLiveStream() {
    const video = document.getElementById('selfie-video');
    const previewImg = document.getElementById('selfie-preview-img');
    const guideOverlay = document.getElementById('selfie-viewfinder-overlay');

    previewImg.classList.add('hidden');
    video.classList.remove('hidden');
    guideOverlay.classList.remove('hidden');

    document.getElementById('selfie-live-actions').classList.remove('hidden');
    document.getElementById('selfie-review-actions').classList.add('hidden');
  }

  function confirmAndUseSelfie() {
    const canvas = document.getElementById('selfie-canvas');
    if (!activeInput) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Use DataTransfer API to assign file object to HTML file input
      try {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        activeInput.files = dataTransfer.files;

        // Dispatch change event so existing listeners handle the new photo file
        activeInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Render UI feedback badge next to photo field if preview container exists
        if (activePreviewContainer) {
          renderSelfieBadge(activePreviewContainer, canvas.toDataURL('image/jpeg', 0.8));
        }
      } catch (err) {
        console.error('Error assigning selfie file:', err);
      }

      closeSelfieModal();
    }, 'image/jpeg', 0.92);
  }

  function renderSelfieBadge(container, thumbUrl) {
    let badge = container.querySelector('.selfie-thumb-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'selfie-thumb-badge';
      container.appendChild(badge);
    }
    badge.innerHTML = `
      <img src="${thumbUrl}" alt="Selfie thumbnail" />
      <span>Selfie Attached ✓</span>
    `;
  }

  function openSelfieModal(targetInput, previewContainer = null) {
    ensureModalExists();
    activeInput = targetInput;
    activePreviewContainer = previewContainer;

    const modal = document.getElementById('selfie-modal');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    resetToLiveStream();
    startCamera();
  }

  function closeSelfieModal() {
    stopCameraStream();
    const modal = document.getElementById('selfie-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
    activeInput = null;
    activePreviewContainer = null;
  }

  // Global helper API
  window.SelfieCamera = {
    open: openSelfieModal,
    close: closeSelfieModal,
    setupButton: function (btnElement, inputElement, previewContainer = null) {
      if (!btnElement || !inputElement) return;
      btnElement.addEventListener('click', (e) => {
        e.preventDefault();
        openSelfieModal(inputElement, previewContainer || inputElement.closest('.field') || inputElement.parentElement);
      });
    }
  };
})();
