// podcast-player.js - Rebuilt from scratch

class PodcastPlayer {
  constructor() {
    this.player = document.getElementById('player');
    this.episodes = [];
    this.currentIndex = -1;
    this.speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    this.speedIndex = 2;
    this.visualizerBars = [];
    this.hasPlayed = false; // Track if episode has been played
    this.sleepTimer = null; // Track sleep timer
    
    // Check for clear parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clear') === '1') {
      console.log('Clearing player state via URL parameter');
      localStorage.removeItem('mdm-mini-player-state');
      // Remove the parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    this.loadEpisodes();
    this.setupControls();
    this.createVisualizer();
    this.restoreIfNeeded();
  }

  loadEpisodes() {
    document.querySelectorAll('#episode-list li[data-src]').forEach((el, i) => {
      this.episodes.push({
        element: el,
        src: el.dataset.src,
        title: el.dataset.title,
        index: i
      });
      
      el.addEventListener('click', () => {
        this.loadEpisode(i);
        this.player.play();
      });
    });
  }

  setupControls() {
    document.getElementById('play-pause-btn')?.addEventListener('click', () => this.togglePlay());
    document.getElementById('prev-btn')?.addEventListener('click', () => this.prev());
    document.getElementById('next-btn')?.addEventListener('click', () => this.next());
    document.getElementById('skip-back-btn')?.addEventListener('click', () => this.skip(-15));
    document.getElementById('skip-forward-btn')?.addEventListener('click', () => this.skip(30));
    document.getElementById('speed-btn')?.addEventListener('click', () => this.cycleSpeed());
    document.getElementById('volume-slider')?.addEventListener('input', e => this.setVolume(e.target.value));
    document.getElementById('progress-bar')?.addEventListener('click', e => this.seekClick(e));
    
    // New button handlers
    document.getElementById('sleep-timer-btn')?.addEventListener('click', () => this.openSleepTimer());
    document.getElementById('volume-btn')?.addEventListener('click', () => this.toggleVolumeControl());
    document.getElementById('shortcuts-btn')?.addEventListener('click', () => this.showShortcuts());
    
    this.player.addEventListener('timeupdate', () => this.updateTime());
    this.player.addEventListener('play', () => this.onPlay());
    this.player.addEventListener('pause', () => this.onPause());
    this.player.addEventListener('ended', () => this.onEnded());
    this.player.addEventListener('loadedmetadata', () => this.onLoaded());
    
    window.addEventListener('beforeunload', () => this.saveState());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    const vol = localStorage.getItem('mdm-volume') || 80;
    this.setVolume(vol);
    if (document.getElementById('volume-slider')) {
      document.getElementById('volume-slider').value = vol;
    }
  }

  createVisualizer() {
    const vis = document.getElementById('visualizer');
    if (!vis) return;
    vis.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const bar = document.createElement('div');
      bar.style.cssText = 'width:2.5%;height:20%;background:linear-gradient(to top,#F5C16C,#A8C686);border-radius:2px;transition:height 0.1s';
      vis.appendChild(bar);
      this.visualizerBars.push(bar);
    }
  }

  animateVisualizer() {
    if (!this.player || this.player.paused) {
      this.visualizerBars.forEach(b => b.style.height = '20%');
      return;
    }
    this.visualizerBars.forEach((b, i) => {
      setTimeout(() => {
        b.style.height = (20 + Math.random() * 60) + '%';
      }, i * 20);
    });
    setTimeout(() => this.animateVisualizer(), 150);
  }

  restoreIfNeeded() {
    const state = this.loadState();
    if (!state) {
      console.log('No state to restore');
      return;
    }
    
    console.log('Restoring state:', state.episodeTitle, 'at', state.position);
    
    const idx = this.episodes.findIndex(e => e.src === state.episodeSrc);
    if (idx < 0) return;
    
    this.loadEpisode(idx, false);
    this.hasPlayed = true; // Mark as played since we're restoring a saved state
    
    this.player.addEventListener('loadedmetadata', () => {
      this.player.currentTime = state.position || 0;
      this.player.playbackRate = state.speed || 1;
      document.getElementById('speed-btn').textContent = state.speed + '×';
      this.speedIndex = this.speeds.indexOf(state.speed);
      
      const percent = (state.position / this.player.duration) * 100;
      document.getElementById('progress-fill').style.width = percent + '%';
      document.getElementById('current-time').textContent = this.formatTime(state.position);
      
      if (state.isPlaying) {
        this.player.play().then(() => {
          console.log('Resumed at', state.position);
          this.animateVisualizer();
        }).catch(e => console.log('Auto-play prevented'));
      }
    }, { once: true });
  }

  loadEpisode(idx, scroll = true) {
    if (idx < 0 || idx >= this.episodes.length) return;
    
    const ep = this.episodes[idx];
    this.currentIndex = idx;
    this.hasPlayed = false; // Reset when loading new episode
    
    this.episodes.forEach(e => e.element.classList.remove('active'));
    ep.element.classList.add('active');
    
    document.querySelector('.player-current').textContent = ep.title;
    
    this.player.src = ep.src;
    this.player.load();
    
    this.updateButtons();
    
    if (scroll) {
      ep.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  togglePlay() {
    if (!this.player.src) {
      if (this.episodes.length > 0) {
        this.loadEpisode(0);
      }
      return;
    }
    
    if (this.player.paused) {
      this.player.play();
    } else {
      this.player.pause();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.loadEpisode(this.currentIndex - 1);
      this.player.play();
    }
  }

  next() {
    if (this.currentIndex < this.episodes.length - 1) {
      this.loadEpisode(this.currentIndex + 1);
      this.player.play();
    }
  }

  skip(sec) {
    if (this.player.duration) {
      this.player.currentTime = Math.max(0, Math.min(this.player.currentTime + sec, this.player.duration));
    }
  }

  cycleSpeed() {
    this.speedIndex = (this.speedIndex + 1) % this.speeds.length;
    const speed = this.speeds[this.speedIndex];
    this.player.playbackRate = speed;
    document.getElementById('speed-btn').textContent = speed + '×';
    localStorage.setItem('mdm-playback-speed', speed);
    this.saveState();
  }

  seekClick(e) {
    if (!this.player.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this.player.currentTime = percent * this.player.duration;
  }

  setVolume(val) {
    const vol = Math.max(0, Math.min(100, val));
    this.player.volume = vol / 100;
    const display = document.getElementById('volume-display');
    if (display) display.textContent = vol + '%';
    localStorage.setItem('mdm-volume', vol);
  }

  updateTime() {
    if (!this.player.duration) return;
    const percent = (this.player.currentTime / this.player.duration) * 100;
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('current-time').textContent = this.formatTime(this.player.currentTime);
    this.saveState();
  }

  updateButtons() {
    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    if (prev) prev.disabled = this.currentIndex <= 0;
    if (next) next.disabled = this.currentIndex >= this.episodes.length - 1;
  }

  onPlay() {
    document.getElementById('play-pause-btn').innerHTML = '⏸ Pause';
    this.hasPlayed = true; // Mark that episode has been played
    this.animateVisualizer();
    this.saveState();
  }

  onPause() {
    document.getElementById('play-pause-btn').innerHTML = '▶ Play';
    this.saveState();
  }

  onEnded() {
    if (this.currentIndex < this.episodes.length - 1) {
      setTimeout(() => this.next(), 1000);
    }
  }

  onLoaded() {
    const dur = document.getElementById('duration');
    if (dur) dur.textContent = this.formatTime(this.player.duration);
    const saved = localStorage.getItem('mdm-playback-speed');
    if (saved) {
      const speed = parseFloat(saved);
      this.player.playbackRate = speed;
      document.getElementById('speed-btn').textContent = speed + '×';
      this.speedIndex = this.speeds.indexOf(speed);
    }
  }

  saveState() {
    if (this.currentIndex < 0 || !this.hasPlayed) return; // Only save if episode has been played
    const ep = this.episodes[this.currentIndex];
    if (!ep) return;
    
    localStorage.setItem('mdm-mini-player-state', JSON.stringify({
      isActive: true,
      episodeSrc: ep.src,
      episodeTitle: ep.title,
      position: this.player.currentTime || 0,
      isPlaying: !this.player.paused,
      speed: this.player.playbackRate || 1,
      timestamp: Date.now()
    }));
    
    console.log('Saved:', ep.title, 'at', this.player.currentTime.toFixed(1));
  }

  loadState() {
    const str = localStorage.getItem('mdm-mini-player-state');
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }

  formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  toggleVolumeControl() {
    const volumeControl = document.querySelector('.volume-control');
    if (volumeControl) {
      const isVisible = volumeControl.style.display !== 'none';
      volumeControl.style.display = isVisible ? 'none' : 'flex';
    }
  }

  openSleepTimer() {
    this.showModal(`
      <h3 style="color: var(--color-accent); margin-bottom: var(--space-4);">Sleep Timer</h3>
      <p style="margin-bottom: var(--space-6);">Set a timer to automatically pause playback</p>
      <div style="display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center; margin-bottom: var(--space-6);">
        <button class="timer-preset" data-minutes="15">15 min</button>
        <button class="timer-preset" data-minutes="30">30 min</button>
        <button class="timer-preset" data-minutes="45">45 min</button>
        <button class="timer-preset" data-minutes="60">60 min</button>
      </div>
      <div style="display: flex; gap: var(--space-3); align-items: center; justify-content: center; margin-bottom: var(--space-6);">
        <input type="number" id="custom-timer" placeholder="Custom minutes" min="1" max="240" 
          style="width: 150px; padding: 0.75rem; border: 2px solid var(--color-accent); border-radius: var(--radius); 
          background: var(--color-bg); color: var(--color-text); font-size: 1rem;">
        <button class="modal-button" onclick="window.podcastPlayer.setCustomTimer()">Set</button>
      </div>
      ${this.sleepTimer ? '<button class="modal-button" style="background: var(--color-neutral);" onclick="window.podcastPlayer.cancelSleepTimer()">Cancel Timer</button>' : ''}
    `, 'timer');
    
    // Add event listeners to preset buttons
    document.querySelectorAll('.timer-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        this.setSleepTimer(minutes);
      });
    });
  }

  setSleepTimer(mins) {
    // Clear existing timer
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }
    
    // Set new timer
    this.sleepTimer = setTimeout(() => {
      this.player.pause();
      document.getElementById('sleep-timer-btn').textContent = '⏲️ Sleep Timer';
      this.showNotification(`Sleep timer ended - playback paused`);
      this.sleepTimer = null;
    }, mins * 60 * 1000);
    
    document.getElementById('sleep-timer-btn').textContent = `⏲️ ${mins}m`;
    this.closeModal();
    this.showNotification(`Sleep timer set for ${mins} minute${mins !== 1 ? 's' : ''}`);
  }

  setCustomTimer() {
    const input = document.getElementById('custom-timer');
    const mins = parseInt(input.value);
    if (isNaN(mins) || mins < 1) {
      this.showNotification('Please enter a valid number of minutes');
      return;
    }
    this.setSleepTimer(mins);
  }

  cancelSleepTimer() {
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
      document.getElementById('sleep-timer-btn').textContent = '⏲️ Sleep Timer';
      this.closeModal();
      this.showNotification('Sleep timer cancelled');
    }
  }

  showShortcuts() {
    this.showModal(`
      <h3 style="color: var(--color-accent); margin-bottom: var(--space-6); text-align: center;">⌨️ Keyboard Shortcuts</h3>
      <div style="display: grid; gap: var(--space-3); max-width: 500px; margin: 0 auto;">
        <div class="shortcut-row"><kbd>Space</kbd><span>Play / Pause</span></div>
        <div class="shortcut-row"><kbd>←</kbd><span>Skip back 15 seconds</span></div>
        <div class="shortcut-row"><kbd>→</kbd><span>Skip forward 30 seconds</span></div>
        <div class="shortcut-row"><kbd>↑</kbd><span>Volume up</span></div>
        <div class="shortcut-row"><kbd>↓</kbd><span>Volume down</span></div>
        <div class="shortcut-row"><kbd>M</kbd><span>Mute / Unmute</span></div>
        <div class="shortcut-row"><kbd>,</kbd><span>Previous episode</span></div>
        <div class="shortcut-row"><kbd>.</kbd><span>Next episode</span></div>
        <div class="shortcut-row"><kbd>S</kbd><span>Change playback speed</span></div>
      </div>
    `, 'shortcuts');
  }

  handleKeyboard(e) {
    // Don't trigger if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // Close modal with Escape
    if (e.key === 'Escape') {
      this.closeModal();
      return;
    }
    
    switch(e.key) {
      case ' ':
        e.preventDefault();
        this.togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.skip(-15);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.skip(30);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const currentVol = parseInt(document.getElementById('volume-slider').value);
        this.setVolume(Math.min(100, currentVol + 5));
        document.getElementById('volume-slider').value = Math.min(100, currentVol + 5);
        break;
      case 'ArrowDown':
        e.preventDefault();
        const vol = parseInt(document.getElementById('volume-slider').value);
        this.setVolume(Math.max(0, vol - 5));
        document.getElementById('volume-slider').value = Math.max(0, vol - 5);
        break;
      case 'm':
      case 'M':
        this.player.muted = !this.player.muted;
        break;
      case ',':
        this.prev();
        break;
      case '.':
        this.next();
        break;
      case 's':
      case 'S':
        this.cycleSpeed();
        break;
    }
  }

  showModal(content, type) {
    // Remove existing modal if any
    this.closeModal();
    
    const modal = document.createElement('div');
    modal.id = 'podcast-modal';
    modal.className = 'podcast-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="window.podcastPlayer.closeModal()"></div>
      <div class="modal-content ${type}">
        <button class="modal-close" onclick="window.podcastPlayer.closeModal()">✕</button>
        ${content}
      </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
  }

  closeModal() {
    const modal = document.getElementById('podcast-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'podcast-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('active'), 10);
    setTimeout(() => {
      notification.classList.remove('active');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('player')) {
    window.podcastPlayer = new PodcastPlayer();
  }
});