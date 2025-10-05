class IPTVPlayer {
    constructor() {
        this.player = null;
        this.playlist = JSON.parse(localStorage.getItem('playlist')) || [];
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.groups = new Map(); // groupName -> channels
        this.currentChannel = null;
        this.currentInput = '';
        this.initPlayer();
        this.bindEvents();
        this.loadPlaylist();
        this.renderGroups();
        this.renderFavorites();
    }

    initPlayer() {
        const video = document.getElementById('player');
        this.player = videojs(video, {
            fluid: true,
            responsive: true,
            playbackRates: [0.5, 1, 1.25, 1.5, 2],
            html5: {
                hls: {
                    overrideNative: true,
                    enableLowInitialPlaylist: true
                }
            }
        });

        // HLS.js fallback
        if (Hls.isSupported()) {
            this.hls = new Hls();
            this.hls.attachMedia(video);
        }

        // Default to English captions if available
        this.player.ready(() => {
            this.player.addRemoteTextTrack({
                src: '', // Dynamic
                kind: 'captions',
                srclang: 'en',
                label: 'English',
                default: true
            }, false).mode = 'showing'; // Auto-show English
        });
    }

    bindEvents() {
        // Drag & Drop for files
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files).filter(f => f.name.match(/\.(mp4|m3u|m3u8)$/i));
            files.forEach(this.addFile.bind(this));
            dropZone.classList.add('hidden');
        });
        document.addEventListener('dragover', () => dropZone.classList.remove('hidden'));
        document.addEventListener('dragleave', () => dropZone.classList.add('hidden'));
        fileInput.addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(this.addFile.bind(this));
        });

        // Keypad Popup
        document.getElementById('keypadBtn').addEventListener('click', () => {
            document.getElementById('keypadPopup').classList.remove('hidden');
        });
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', (e) => {
                const val = e.target.dataset.val;
                if (val) this.currentInput += val;
                else if (e.target.classList.contains('clear')) this.currentInput = '';
                else if (e.target.classList.contains('enter')) {
                    this.switchToChannel(parseInt(this.currentInput) - 1);
                    this.currentInput = '';
                    document.getElementById('keypadPopup').classList.add('hidden');
                }
                document.getElementById('channelInput').textContent = `Channel: ${this.currentInput || '--'}`;
            });
        });

        // Controls
        document.getElementById('playPause').addEventListener('click', () => this.player.paused() ? this.player.play() : this.player.pause());
        document.getElementById('prev').addEventListener('click', () => this.switchToChannel(this.getCurrentIndex() - 1));
        document.getElementById('next').addEventListener('click', () => this.switchToChannel(this.getCurrentIndex() + 1));
        document.getElementById('volume').addEventListener('input', (e) => this.player.volume(e.target.value / 100));
        document.getElementById('seek').addEventListener('input', (e) => this.player.currentTime((e.target.value / 100) * this.player.duration()));
        document.getElementById('ccToggle').addEventListener('click', () => {
            const tracks = this.player.textTracks();
            for (let track of tracks) {
                track.mode = track.mode === 'showing' ? 'hidden' : 'showing';
            }
        });
        document.getElementById('clearPlaylist').addEventListener('click', () => {
            this.playlist = [];
            localStorage.removeItem('playlist');
            this.renderPlaylist();
        });
        document.getElementById('favoritesToggle').addEventListener('click', () => this.toggleFavorite());

        // Keyboard
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ': this.player.paused() ? this.player.play() : this.player.pause(); e.preventDefault(); break;
                case 'ArrowLeft': this.switchToChannel(this.getCurrentIndex() - 1); break;
                case 'ArrowRight': this.switchToChannel(this.getCurrentIndex() + 1); break;
                case 'ArrowUp': document.getElementById('volume').value = Math.min(100, parseInt(document.getElementById('volume').value) + 10); this.player.volume(document.getElementById('volume').value / 100); break;
                case 'ArrowDown': document.getElementById('volume').value = Math.max(0, parseInt(document.getElementById('volume').value) - 10); this.player.volume(document.getElementById('volume').value / 100); break;
                case '+': e.shiftKey ? this.player.playbackRate(this.player.playbackRate() + 0.25) : null; break;
                case '-': this.player.playbackRate(this.player.playbackRate() - 0.25); break;
            }
        });

        // Sidebar toggle on mobile
        document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
    }

    addFile(file) {
        const url = URL.createObjectURL(file);
        const item = { name: file.name, url, group: 'General' };
        if (file.name.endsWith('.m3u') || file.name.endsWith('.m3u8')) {
            this.parseM3U(url, item);
        }
        this.playlist.push(item);
        localStorage.setItem('playlist', JSON.stringify(this.playlist));
        this.renderPlaylist();
        this.renderGroups();
    }

    parseM3U(url, item) {
        fetch(url).then(res => res.text()).then(data => {
            const lines = data.split('\n');
            let currentGroup = 'General';
            lines.forEach(line => {
                if (line.startsWith('#GROUP-NAME:')) {
                    currentGroup = line.split(':')[1].trim();
                } else if (line.startsWith('http')) {
                    this.playlist.push({ name: line.trim(), url: line.trim(), group: currentGroup });
                    if (!this.groups.has(currentGroup)) this.groups.set(currentGroup, []);
                    this.groups.get(currentGroup).push({ name: line.trim(), url: line.trim() });
                }
            });
            localStorage.setItem('playlist', JSON.stringify(this.playlist));
            this.renderGroups();
        });
    }

    renderPlaylist() {
        const ul = document.getElementById('playlist');
        ul.innerHTML = '';
        this.playlist.forEach((item, index) => {
            const li = document.createElement('li');
            li.textContent = item.name;
            li.dataset.index = index;
            li.addEventListener('click', () => this.switchToChannel(index));
            ul.appendChild(li);
        });
        // Drag-drop reordering
        new Sortable(ul, {
            animation: 150,
            onEnd: (evt) => {
                const newPlaylist = [...this.playlist];
                newPlaylist.splice(evt.newIndex, 0, newPlaylist.splice(evt.oldIndex, 1)[0]);
                this.playlist = newPlaylist;
                localStorage.setItem('playlist', JSON.stringify(this.playlist));
            }
        });
    }

    renderGroups() {
        const container = document.getElementById('groups');
        container.innerHTML = '';
        this.groups.forEach((channels, group) => {
            const details = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = group;
            details.appendChild(summary);
            const ul = document.createElement('ul');
            channels.forEach((ch, idx) => {
                const li = document.createElement('li');
                li.textContent = ch.name;
                li.addEventListener('click', () => this.playChannel(ch.url, ch.name));
                ul.appendChild(li);
            });
            details.appendChild(ul);
            container.appendChild(details);
        });
    }

    renderFavorites() {
        const ul = document.getElementById('favorites');
        ul.innerHTML = '';
        this.favorites.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${item.name} <span class="remove" data-index="${index}">×</span>`;
            li.addEventListener('click', () => this.switchToChannel(this.playlist.findIndex(p => p.url === item.url)));
            li.querySelector('.remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.favorites.splice(index, 1);
                localStorage.setItem('favorites', JSON.stringify(this.favorites));
                this.renderFavorites();
            });
            ul.appendChild(li);
        });
    }

    switchToChannel(index) {
        if (index < 0 || index >= this.playlist.length) return;
        const item = this.playlist[index];
        this.playChannel(item.url, item.name);
        this.currentChannel = index;
        document.querySelectorAll('#playlist li, #favorites li').forEach(li => li.classList.remove('active'));
        document.querySelector(`#playlist li[data-index="${index}"]`)?.classList.add('active');
        document.getElementById('channelTitle').textContent = item.name;
        document.getElementById('favoritesToggle').textContent = this.isFavorite(item) ? '❤️ Remove' : '❤️ Add';
        this.updateSeek();
    }

    playChannel(url, name) {
        this.player.src({ src: url, type: url.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' });
        this.player.play();
        // Check for captions (assume VTT endpoint; customize as needed)
        fetch(`${url.replace(/\/[^\/]*$/, '')}/captions.vtt`).then(res => res.ok ? res.text() : null).then(vtt => {
            if (vtt) {
                const track = this.player.addRemoteTextTrack({
                    src: URL.createObjectURL(new Blob([vtt], {type: 'text/vtt'})),
                    kind: 'captions',
                    srclang: 'en',
                    label: 'English',
                    default: true
                });
                track.mode = 'showing';
            }
        });
        // Update seek bar
        this.player.on('loadedmetadata', () => this.updateSeek());
        this.player.on('timeupdate', () => this.updateSeek());
    }

    updateSeek() {
        if (this.player.duration()) {
            const percent = (this.player.currentTime() / this.player.duration()) * 100;
            document.getElementById('seek').value = percent;
        }
    }

    getCurrentIndex() {
        return this.playlist.findIndex(p => p.url === this.currentChannel?.url) || 0;
    }

    toggleFavorite() {
        if (!this.currentChannel) return;
        const item = this.playlist[this.currentChannel];
        const idx = this.favorites.findIndex(f => f.url === item.url);
        if (idx > -1) {
            this.favorites.splice(idx, 1);
        } else {
            this.favorites.push(item);
        }
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.renderFavorites();
        document.getElementById('favoritesToggle').textContent = this.isFavorite(item) ? '❤️ Remove' : '❤️ Add';
    }

    isFavorite(item) {
        return this.favorites.some(f => f.url === item.url);
    }

    loadPlaylist() {
        this.renderPlaylist();
        if (this.playlist.length) this.switchToChannel(0);
    }
}

// Init on load
document.addEventListener('DOMContentLoaded', () => new IPTVPlayer());
