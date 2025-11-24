// global-mini-player.js - Rebuilt from scratch

class GlobalMiniPlayer {
  constructor() {
    this.player = null;
    this.miniPlayerEl = null;
    this.currentEpisode = null;
    this.episodes = [
      { src: 'assets/audio/mdmtrailer.mp3', title: 'Mission-Driven Momentum Trailer' },
      { src: 'assets/audio/mdmepisode1.mp3', title: 'Episode 1: The Power of Strategic Planning' }
    ];
    
    const onPodcastPage = window.location.pathname.includes('podcast.html');
    
    if (!onPodcastPage) {
      const state = this.loadState();
      if (state) {
        this.createMiniPlayer();
        this.restoreState(state);
      }
    }
  }

  createMiniPlayer() {
    const mp = document.createElement('div');
    mp.id = 'global-mini-player';
    mp.style.cssText = 'position:fixed;top:70px;left:0;right:0;background:rgba(18,57,69,0.98);backdrop-filter:blur(30px);border-bottom:3px solid #F5C16C;padding:1rem 2rem;z-index:998;box-shadow:0 8px 24px rgba(0,0,0,0.6)';
    
    mp.innerHTML = `
      <audio id="global-player"></audio>
      <button onclick="window.globalMiniPlayer.close()" style="position:absolute;top:12px;right:12px;width:32px;height:32px;background:#F5C16C;color:#123945;border:none;border-radius:50%;cursor:pointer;font-weight:bold;font-size:1.2rem">✕</button>
      <div style="display:flex;align-items:center;gap:2rem;max-width:1400px;margin:0 auto">
        <div style="flex:1;min-width:0">
          <div id="mini-title" style="font-size:1.1rem;font-weight:bold;color:#F5C16C;margin-bottom:0.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Loading...</div>
          <div style="display:flex;align-items:center;gap:0.75rem">
            <span id="mini-time-current" style="font-family:monospace;font-size:0.8rem;color:#EAD8A7;min-width:45px;text-align:center">0:00</span>
            <div id="mini-progress" onclick="window.globalMiniPlayer.seekClick(event)" style="flex:1;height:8px;background:rgba(234,216,167,0.2);border-radius:4px;cursor:pointer;min-width:100px">
              <div id="mini-fill" style="height:100%;background:linear-gradient(90deg,#F5C16C,#A8C686);border-radius:4px;width:0%"></div>
            </div>
            <span id="mini-time-duration" style="font-family:monospace;font-size:0.8rem;color:#EAD8A7;min-width:45px;text-align:center">0:00</span>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button onclick="window.globalMiniPlayer.prev()" style="background:#123945;color:#EAD8A7;border:2px solid #F5C16C;border-radius:0.5rem;padding:0.6rem 0.85rem;cursor:pointer;font-size:0.9rem;min-height:44px;min-width:44px">◀</button>
          <button onclick="window.globalMiniPlayer.skip(-15)" style="background:#123945;color:#EAD8A7;border:2px solid #F5C16C;border-radius:0.5rem;padding:0.6rem 0.85rem;cursor:pointer;font-size:0.9rem;min-height:44px;min-width:44px">⏪</button>
          <button id="mini-play-btn" onclick="window.globalMiniPlayer.togglePlay()" style="background:#123945;color:#EAD8A7;border:2px solid #F5C16C;border-radius:0.5rem;padding:0.6rem 1.2rem;cursor:pointer;font-size:0.9rem;min-height:44px;min-width:44px">▶</button>
          <button onclick="window.globalMiniPlayer.skip(30)" style="background:#123945;color:#EAD8A7;border:2px solid #F5C16C;border-radius:0.5rem;padding:0.6rem 0.85rem;cursor:pointer;font-size:0.9rem;min-height:44px;min-width:44px">⏩</button>
          <button onclick="window.globalMiniPlayer.next()" style="background:#123945;color:#EAD8A7;border:2px solid #F5C16C;border-radius:0.5rem;padding:0.6rem 0.85rem;cursor:pointer;font-size:0.9rem;min-height:44px;min-width:44px">▶</button>
          <button id="mini-speed" onclick="window.globalMiniPlayer.changeSpeed()" style="background:#123945;color:#EAD8A7;border:2px solid #F5C16C;border-radius:0.5rem;padding:0.6rem 0.85rem;cursor:pointer;font-size:0.9rem;min-height:44px">1×</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(mp);
    this.miniPlayerEl = mp;
    this.player = document.getElementById('global-player');
    
    this.player.addEventListener('timeupdate', () => this.updateTime());
    this.player.addEventListener('play', () => this.onPlay());
    this.player.addEventListener('pause', () => this.onPause());
    this.player.addEventListener('ended', () => this.onEnded());
    window.addEventListener('beforeunload', () => this.saveState());
  }

  restoreState(state) {
    const ep = this.episodes.find(e => e.src === state.episodeSrc);
    if (!ep) return;
    
    this.currentEpisode = ep;
    document.getElementById('mini-title').textContent = ep.title;
    
    this.player.src = ep.src;
    this.player.addEventListener('loadedmetadata', () => {
      this.player.currentTime = state.position || 0;
      this.player.playbackRate = state.speed || 1;
      document.getElementById('mini-time-duration').textContent = this.formatTime(this.player.duration);
      document.getElementById('mini-speed').textContent = state.speed + '×';
      if (state.isPlaying) {
        this.player.play().catch(e => console.log('Auto-play prevented'));
      }
    }, { once: true });
    this.player.load();
  }

  togglePlay() {
    if (this.player.paused) {
      this.player.play();
    } else {
      this.player.pause();
    }
  }

  skip(sec) {
    if (this.player.duration) {
      this.player.currentTime = Math.max(0, Math.min(this.player.currentTime + sec, this.player.duration));
    }
  }

  prev() {
    console.log('prev() called');
    const idx = this.episodes.findIndex(e => e.src === this.currentEpisode?.src);
    console.log('Current index:', idx, 'Current episode:', this.currentEpisode?.title);
    
    if (idx > 0) {
      this.currentEpisode = this.episodes[idx - 1];
      console.log('Switching to:', this.currentEpisode.title);
      
      // Attach listener BEFORE changing src
      this.player.addEventListener('loadedmetadata', () => {
        console.log('Metadata loaded, duration:', this.player.duration);
        document.getElementById('mini-time-duration').textContent = this.formatTime(this.player.duration);
      }, { once: true });
      
      this.player.src = this.currentEpisode.src;
      document.getElementById('mini-title').textContent = this.currentEpisode.title;
      this.player.load();
      this.player.play();
    } else {
      console.log('Cannot go back - already at first episode (idx:', idx, ')');
    }
  }

  next() {
    console.log('next() called');
    const idx = this.episodes.findIndex(e => e.src === this.currentEpisode?.src);
    console.log('Current index:', idx, 'Current episode:', this.currentEpisode?.title);
    
    if (idx < this.episodes.length - 1) {
      this.currentEpisode = this.episodes[idx + 1];
      console.log('Switching to:', this.currentEpisode.title);
      
      // Attach listener BEFORE changing src
      this.player.addEventListener('loadedmetadata', () => {
        console.log('Metadata loaded, duration:', this.player.duration);
        document.getElementById('mini-time-duration').textContent = this.formatTime(this.player.duration);
      }, { once: true });
      
      this.player.src = this.currentEpisode.src;
      document.getElementById('mini-title').textContent = this.currentEpisode.title;
      this.player.load();
      this.player.play();
    } else {
      console.log('Cannot go forward - already at last episode (idx:', idx, ')');
    }
  }

  changeSpeed() {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const current = this.player.playbackRate;
    const idx = speeds.indexOf(current);
    const newSpeed = speeds[(idx + 1) % speeds.length];
    this.player.playbackRate = newSpeed;
    document.getElementById('mini-speed').textContent = newSpeed + '×';
    this.saveState();
  }

  seekClick(e) {
    if (!this.player.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this.player.currentTime = percent * this.player.duration;
  }

  updateTime() {
    if (!this.player.duration) return;
    const percent = (this.player.currentTime / this.player.duration) * 100;
    document.getElementById('mini-fill').style.width = percent + '%';
    document.getElementById('mini-time-current').textContent = this.formatTime(this.player.currentTime);
    this.saveState();
  }

  onPlay() {
    document.getElementById('mini-play-btn').textContent = '⏸';
    this.saveState();
  }

  onPause() {
    document.getElementById('mini-play-btn').textContent = '▶';
    this.saveState();
  }

  onEnded() {
    const idx = this.episodes.findIndex(e => e.src === this.currentEpisode?.src);
    if (idx < this.episodes.length - 1) {
      setTimeout(() => this.next(), 1000);
    }
  }

  close() {
    this.player.pause();
    this.miniPlayerEl.remove();
    localStorage.removeItem('mdm-mini-player-state');
  }

  saveState() {
    if (!this.currentEpisode || !this.player) return;
    localStorage.setItem('mdm-mini-player-state', JSON.stringify({
      isActive: true,
      episodeSrc: this.currentEpisode.src,
      episodeTitle: this.currentEpisode.title,
      position: this.player.currentTime || 0,
      isPlaying: !this.player.paused,
      speed: this.player.playbackRate || 1,
      timestamp: Date.now()
    }));
  }

  loadState() {
    const str = localStorage.getItem('mdm-mini-player-state');
    if (!str) return null;
    try {
      const state = JSON.parse(str);
      const age = Date.now() - state.timestamp;
      if (age > 7200000) {
        localStorage.removeItem('mdm-mini-player-state');
        return null;
      }
      return state;
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
}

document.addEventListener('DOMContentLoaded', () => {
  window.globalMiniPlayer = new GlobalMiniPlayer();
});