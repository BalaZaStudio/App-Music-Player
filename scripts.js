let audioContext;
let analyser;
let source;
let audioElement = new Audio();
let isPlaying = false;
let canvas = document.getElementById('visualizer');
let ctx = canvas.getContext('2d');
let currentViz = 'bars';
let particles = [];

// Clase Partícula para el visualizador de partículas
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 10 + 5; // Partículas más grandes
        this.speedX = Math.random() * 4 - 2; // Aumentar velocidad en X
        this.speedY = Math.random() * 4 - 2; // Aumentar velocidad en Y
        this.maxSize = this.size; // Tamaño máximo para efecto visual
    }

    update(intensity) {
        this.x += this.speedX * intensity;
        this.y += this.speedY * intensity;
        if (this.size > 0.5) this.size -= 0.05; // Reducir más lentamente
    }

    draw() {
        ctx.fillStyle = `hsl(${this.x % 360}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// Al cargar el documento, asegúrate de que los controles sean visibles
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.controls').style.display = 'flex'; // Asegúrate de que los controles sean visibles
});


function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 512;
}

// Diferentes tipos de visualizaciones
const visualizers = {
    bars: function (dataArray, bufferLength) {
        ctx.fillStyle = 'rgb(13, 13, 13)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] * 2;

            let hue = (i / bufferLength) * 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    },

    circles: function (dataArray, bufferLength) {
        ctx.fillStyle = 'rgba(13, 13, 13, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let centerX = canvas.width / 2;
        let centerY = canvas.height / 2;

        for (let i = 0; i < bufferLength; i++) {
            let radius = dataArray[i] * 1.5;
            let hue = (i / bufferLength) * 360;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },

    wave: function (dataArray, bufferLength) {
        ctx.fillStyle = 'rgb(13, 13, 13)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);

        for (let i = 0; i < bufferLength; i++) {
            let x = (i / bufferLength) * canvas.width;
            let y = (dataArray[i] / 128.0) * canvas.height / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.strokeStyle = `hsl(${Date.now() % 360}, 100%, 50%)`;
        ctx.lineWidth = 3;
        ctx.stroke();
    },

    particles: function (dataArray, bufferLength) {
        ctx.fillStyle = 'rgba(13, 13, 13, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let average = dataArray.reduce((a, b) => a + b) / bufferLength;
        let intensity = average / 128.0;

        if (intensity > 0.5) {
            particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update(intensity);
            particles[i].draw();

            if (particles[i].size <= 0.2) {
                particles.splice(i, 1);
            }
        }
    },

    spectrum: function (dataArray, bufferLength) {
        ctx.fillStyle = 'rgb(13, 13, 13)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let centerX = canvas.width / 2;
        let centerY = canvas.height / 2;
        let radius = Math.min(centerX, centerY) - 50;

        for (let i = 0; i < bufferLength; i++) {
            let angle = (i / bufferLength) * Math.PI * 2;
            let height = dataArray[i] * 0.7;

            let x1 = centerX + Math.cos(angle) * radius;
            let y1 = centerY + Math.sin(angle) * radius;
            let x2 = centerX + Math.cos(angle) * (radius + height);
            let y2 = centerY + Math.sin(angle) * (radius + height);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `hsl(${(i / bufferLength) * 360}, 100%, 50%)`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
};

function draw() {
    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    visualizers[currentViz](dataArray, bufferLength);

    // Actualizar el brillo del logo según la intensidad del audio
    let average = dataArray.reduce((a, b) => a + b) / bufferLength;
    let intensity = average / 128.0;
    document.querySelector('.logo').style.textShadow = `0 0 ${20 + intensity * 30}px var(--accent)`;

    requestAnimationFrame(draw);
}

// Event Listeners
document.getElementById('play').addEventListener('click', () => {
    if (!audioContext) {
        initAudio();
        draw();
    }

    if (isPlaying) {
        audioElement.pause();
        document.getElementById('play').innerHTML = '►';
    } else {
        audioElement.play();
        document.getElementById('play').innerHTML = '❚❚';
    }

    isPlaying = !isPlaying;
});

// Selector de visualización
document.querySelectorAll('.viz-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.viz-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentViz = btn.dataset.viz;
    });
});

// Control de volumen y otros controles previos...
document.getElementById('volume').addEventListener('input', (e) => {
    audioElement.volume = e.target.value / 100;
});

document.getElementById('file-input-btn').addEventListener('click', () => {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';

    input.onchange = (e) => {
        let file = e.target.files[0];
        let url = URL.createObjectURL(file);
        audioElement.src = url;
        document.getElementById('song-title').textContent = file.name;
        document.getElementById('artist').textContent = 'Local File';

        if (!isPlaying) {
            document.getElementById('play').click();
        }
    };

    input.click();
});

audioElement.addEventListener('timeupdate', () => {
    let progress = (audioElement.currentTime / audioElement.duration) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
});

document.querySelector('.progress-bar').addEventListener('click', (e) => {
    let percent = e.offsetX / e.target.offsetWidth;
    audioElement.currentTime = percent * audioElement.duration;
});



document.getElementById('fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        // Solicitar pantalla completa
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error al intentar ingresar al modo de pantalla completa: ${err.message}`);
        });
    } else {
        // Salir de la pantalla completa
        document.exitFullscreen();
    }
});

// Event listener para manejar los cambios de pantalla completa
document.addEventListener('fullscreenchange', () => {
    const fullscreenBtn = document.getElementById('fullscreen');
    if (document.fullscreenElement) {
        fullscreenBtn.innerHTML = '🗗'; // Icono para salir del modo de pantalla completa
    } else {
        fullscreenBtn.innerHTML = '🗖'; // Icono para entrar al modo de pantalla completa
    }
});




// Evento de doble clic en el canvas de la visualización
canvas.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) {
        // Solicitar pantalla completa
        canvas.requestFullscreen().catch(err => {
            console.error(`Error al intentar ingresar al modo de pantalla completa: ${err.message}`);
        });
        document.querySelector('.controls').style.display = 'none'; // Ocultar controles al entrar en pantalla completa
    } else {
        // Salir de la pantalla completa
        document.exitFullscreen();
    }
});

// Evento listener para manejar los cambios de pantalla completa
document.addEventListener('fullscreenchange', () => {
    const fullscreenBtn = document.getElementById('fullscreen');
    if (document.fullscreenElement) {
        fullscreenBtn.innerHTML = '🗗'; // Icono para salir del modo de pantalla completa
    } else {
        fullscreenBtn.innerHTML = '🗖'; // Icono para entrar al modo de pantalla completa
        document.querySelector('.controls').style.display = 'flex'; // Mostrar controles al salir de pantalla completa
    }
});

// Nueva visualización: Letras de ZaBaDeV
visualizers.letters = function (dataArray, bufferLength) {
    ctx.fillStyle = 'rgb(13, 13, 13)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let average = dataArray.reduce((a, b) => a + b) / bufferLength;
    let intensity = average / 128.0;

    let fontSize = 50 + intensity * 150; // Ajustar el tamaño de la fuente con la intensidad
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let text = "ZaBaDeV";
    let hue = (Date.now() % 360); // Cambiar color con el tiempo

    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
};

// Actualizar el tiempo actual y la duración de la canción
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

audioElement.addEventListener('loadedmetadata', () => {
    // Mostrar la duración total de la canción cuando está cargada
    document.getElementById('duration-time').textContent = formatTime(audioElement.duration);
});

audioElement.addEventListener('timeupdate', () => {
    // Actualizar barra de progreso en tiempo real
    const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
    document.getElementById('progress').style.width = `${progressPercent}%`;

    // Actualizar el tiempo actual
    document.getElementById('current-time').textContent = formatTime(audioElement.currentTime);
});

// Permitir a los usuarios hacer clic en la barra de progreso para saltar a una parte de la canción
document.getElementById('progress-bar').addEventListener('click', (e) => {
    const progressBar = e.currentTarget;
    const clickX = e.offsetX;
    const duration = audioElement.duration;
    const newTime = (clickX / progressBar.offsetWidth) * duration;

    audioElement.currentTime = newTime;
});


// Funcion Volumen Scroll Mouse

let volumeIndicator = document.createElement('div');
volumeIndicator.classList.add('volume-indicator');
document.body.appendChild(volumeIndicator);

// Estilo para el indicador de volumen
const style = document.createElement('style');
style.innerHTML = `
.volume-indicator {
    position: fixed; /* Cambiar a fixed para centrar en la pantalla */
    top: 50%; /* Centramos verticalmente */
    left: 50%; /* Centramos horizontalmente */
    transform: translate(-50%, -50%); /* Ajustar posición para que esté centrado */
    background: rgba(255, 255, 255, 0.8);
    border-radius: 5px;
    padding: 5px 10px;
    display: none; /* Oculto por defecto */
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none; /* No permitir interacción con el indicador */
    opacity: 0.9;
    font-size: 16px;
}
`;
document.head.appendChild(style);

function updateVolumeIndicator(volume) {
    volumeIndicator.textContent = `Volumen: ${Math.round(volume * 100)}%`;
    volumeIndicator.style.display = 'block'; // Mostrar el indicador
    volumeIndicator.style.opacity = '1'; // Asegurarse de que sea visible
    volumeIndicator.style.transform = 'translate(-50%, -50%) scale(1.2)'; // Escalar un poco al mostrar

    setTimeout(() => {
        volumeIndicator.style.transform = 'translate(-50%, -50%) scale(1)'; // Volver al tamaño normal
    }, 300); // Tiempo para que el indicador esté visible

    setTimeout(() => {
        volumeIndicator.style.opacity = '0'; // Desvanecer el indicador después de un tiempo
    }, 2000); // Desaparece después de 2 segundos
}

// Event listener para la rueda del ratón
canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); // Prevenir el desplazamiento de la página
    let newVolume = audioElement.volume + (e.deltaY > 0 ? -0.05 : 0.05); // Cambiar volumen según el desplazamiento de la rueda
    newVolume = Math.max(0, Math.min(1, newVolume)); // Limitar el volumen entre 0 y 1
    audioElement.volume = newVolume;
    updateVolumeIndicator(newVolume); // Actualizar el indicador de volumen
});
