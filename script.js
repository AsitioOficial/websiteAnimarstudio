function setupSyncedVideoAudio(videoId, audioId, statusId) {
    const video = document.getElementById(videoId);
    const audio = document.getElementById(audioId);
    const status = document.getElementById(statusId);
    if (!video || !audio || !status) return;

    const player = video.closest('.video-container');
    const playButton = player.querySelector('.player-play');
    const playIcon = playButton.querySelector('i');
    const timeline = player.querySelector('.player-timeline');
    const currentTimeDisplay = player.querySelector('.player-current-time');
    const durationDisplay = player.querySelector('.player-duration');
    const volumeControl = player.querySelector('.player-volume input');
    const volumeIcon = player.querySelector('.player-volume i');

    const formatTime = (time) => {
        if (!Number.isFinite(time)) return '0:00';
        const seconds = Math.floor(time);
        return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    };

    const showAudioError = (message) => {
        status.hidden = false;
        status.textContent = message;
    };

    const updateTimeline = () => {
        const duration = video.duration;
        const progress = Number.isFinite(duration) && duration > 0
            ? video.currentTime / duration
            : 0;
        timeline.value = String(Math.round(progress * 1000));
        timeline.style.setProperty('--range-progress', `${progress * 100}%`);
        currentTimeDisplay.textContent = formatTime(video.currentTime);
        durationDisplay.textContent = formatTime(duration);
    };

    const updatePlayButton = (isPlaying) => {
        playIcon.classList.toggle('fa-play', !isPlaying);
        playIcon.classList.toggle('fa-pause', isPlaying);
        playButton.setAttribute('aria-label', isPlaying ? 'Pausar video' : 'Reproducir video');
    };

    const syncAudioToVideo = () => {
        if (Number.isFinite(video.duration)) {
            const audioDuration = Number.isFinite(audio.duration) ? audio.duration : video.duration;
            const targetTime = Math.min(video.currentTime, audioDuration);
            if (Math.abs(targetTime - audio.currentTime) > 0.35) {
                audio.currentTime = targetTime;
            }
        }
    };

    const togglePlayback = async () => {
        if (video.paused) {
            syncAudioToVideo();
            try {
                await Promise.all([video.play(), audio.play()]);
                status.hidden = true;
            } catch (error) {
                video.pause();
                audio.pause();
                showAudioError(`No se pudo iniciar la reproducción: ${error.message}`);
            }
        } else {
            video.pause();
            audio.pause();
        }
    };

    video.muted = true;
    audio.volume = 1;
    updateTimeline();

    playButton.addEventListener('click', togglePlayback);
    video.addEventListener('click', togglePlayback);

    video.addEventListener('play', () => updatePlayButton(true));
    video.addEventListener('pause', () => {
        audio.pause();
        updatePlayButton(false);
    });
    video.addEventListener('ended', () => {
        audio.pause();
        updatePlayButton(false);
    });
    video.addEventListener('loadedmetadata', updateTimeline);
    video.addEventListener('durationchange', updateTimeline);
    video.addEventListener('seeked', updateTimeline);
    video.addEventListener('timeupdate', () => {
        syncAudioToVideo();
        updateTimeline();
    });

    timeline.addEventListener('input', () => {
        if (!Number.isFinite(video.duration)) return;
        const seekTime = (Number(timeline.value) / 1000) * video.duration;
        video.currentTime = seekTime;
        audio.currentTime = Math.min(seekTime, Number.isFinite(audio.duration) ? audio.duration : video.duration);
        currentTimeDisplay.textContent = formatTime(seekTime);
    });

    volumeControl.addEventListener('input', () => {
        audio.volume = Number(volumeControl.value);
        volumeIcon.classList.toggle('fa-volume-xmark', audio.volume === 0);
        volumeIcon.classList.toggle('fa-volume-low', audio.volume > 0 && audio.volume < 0.5);
        volumeIcon.classList.toggle('fa-volume-high', audio.volume >= 0.5);
    });

    audio.addEventListener('error', () => {
        showAudioError('No se pudo cargar el audio. Verifica que el archivo correspondiente esté junto a la página.');
    });

    audio.addEventListener('ended', () => {
        if (!video.paused) video.pause();
    });
}

setupSyncedVideoAudio('presentationVideo', 'presentationAudio', 'videoAudioStatus');
setupSyncedVideoAudio('finalVideo', 'finalAudio', 'finalAudioStatus');