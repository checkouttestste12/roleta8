// ===== ROLETA PROFISSIONAL COM 4 SETORES COLORIDOS =====

// Estados da máquina de estados da roleta
const ESTADOS_ROLETA = {
    IDLE: 'idle',
    SPINNING: 'spinning',
    STOPPING: 'stopping',
    STOPPED: 'stopped'
};

// Estado do jogo com gerenciamento robusto
let gameState = {
    // Estado da roleta
    estadoRoleta: ESTADOS_ROLETA.IDLE,
    anguloAtual: 0,
    velocidadeAtual: 0,
    tempoGiro: 0,
    
    // Controles de animação
    animacaoId: null,
    
    // Locks para prevenir ações simultâneas
    bloqueado: false,
    podeParar: false
};

// Elementos DOM
const elements = {
    btnGirar: document.getElementById('btn-girar'),
    btnParar: document.getElementById('btn-parar'),
    roleta: document.getElementById('roleta'),
    statusText: document.getElementById('status-text'),
    velocidadeBar: document.getElementById('velocidade-bar'),
    resultado: document.getElementById('resultado'),
    toastContainer: document.getElementById('toast-container'),
    particlesBg: document.getElementById('particles-bg'),
    roletaContainer: document.getElementById('roleta-gratis-container'),
    girosPremiosInfo: document.getElementById('giros-premios-info')
};

// Configurações da roleta - 4 SETORES COLORIDOS
const roletaConfig = {
    setores: [
        { premio: 25, texto: 'R$ 25', angulo: 0, cor: '#00ff88' },
        { premio: 50, texto: 'R$ 50', angulo: 90, cor: '#4ecdc4' },
        { premio: 75, texto: 'R$ 75', angulo: 180, cor: '#9b59b6' },
        { premio: 100, texto: 'R$ 100', angulo: 270, cor: '#ffd700' }
    ]
};

// ===== SISTEMA DE FÍSICA MELHORADO PARA 4 SETORES =====

class FisicaMelhorada {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.angulo = 0;
        this.velocidade = 0;
        this.aceleracao = 0;
        this.tempo = 0;
        this.fase = 'idle';
        this.parandoForcado = false;
        
        // Configurações melhoradas para giro mais fluido
        this.tempoAceleracao = 1800; // 1.8s
        this.tempoDesaceleracao = 3500; // 3.5s
        this.velocidadeMaxima = 18 + Math.random() * 6; // 18-24 rpm
        this.velocidadeMinima = 2;
        
        // Parâmetros para suavização
        this.inercia = 0.98;
        this.ruido = 0;
        this.ultimaVelocidade = 0;
        
        this.anguloAlvo = 0;
    }

    iniciarGiro() {
        this.reset();
        this.fase = 'acelerando';
        this.velocidade = this.velocidadeMinima;
        return null;
    }

    pararGiro() {
        if (this.fase === 'acelerando' || this.fase === 'constante') {
            this.parandoForcado = true;
            this.fase = 'desacelerando';
            this.tempo = 0;
            
            // Cálculo para 4 setores (90 graus cada)
            const anguloAtual = this.angulo % 360;
            const setorAtual = Math.floor(anguloAtual / 90);
            
            // Determinar setor alvo
            const voltasExtras = Math.max(2, Math.min(6, this.velocidade / 3));
            const setoresExtras = Math.floor(Math.random() * 3) + 2; // 2-4 setores extras
            const proximoSetor = (setorAtual + setoresExtras) % 4;
            
            this.anguloAlvo = this.angulo + (voltasExtras * 360) + 
                             (proximoSetor * 90) - (anguloAtual % 360);
            
            return proximoSetor;
        }
        return null;
    }

    atualizar(deltaTime) {
        // Normalizar deltaTime para 60fps
        const dt = Math.min(deltaTime, 32) / 16.67;
        this.tempo += deltaTime;
        
        // Salvar velocidade anterior para suavização
        this.ultimaVelocidade = this.velocidade;
        
        switch (this.fase) {
            case 'acelerando':
                this.atualizarAceleracaoMelhorada(dt);
                break;
            case 'constante':
                this.atualizarConstanteMelhorada(dt);
                break;
            case 'desacelerando':
                this.atualizarDesaceleracaoMelhorada(dt);
                break;
        }

        // Aplicar suavização de velocidade
        this.velocidade = this.lerp(this.ultimaVelocidade, this.velocidade, 0.15);
        
        // Adicionar ruído sutil
        this.ruido = Math.sin(this.tempo * 0.003) * 0.3 + 
                     Math.cos(this.tempo * 0.007) * 0.2;
        
        // Atualizar ângulo
        const velocidadeFinal = this.velocidade + this.ruido;
        this.angulo += velocidadeFinal * dt * 0.6;

        return {
            angulo: this.angulo % 360,
            velocidade: Math.abs(velocidadeFinal),
            fase: this.fase,
            completo: this.fase === 'parado'
        };
    }

    atualizarAceleracaoMelhorada(dt) {
        if (this.tempo < this.tempoAceleracao) {
            const progresso = this.tempo / this.tempoAceleracao;
            const curva = 1 - Math.pow(1 - progresso, 4);
            const velocidadeAlvo = this.velocidadeMinima + 
                                 (this.velocidadeMaxima - this.velocidadeMinima) * curva;
            this.velocidade = velocidadeAlvo;
        } else {
            this.fase = 'constante';
            this.velocidade = this.velocidadeMaxima;
        }
    }

    atualizarConstanteMelhorada(dt) {
        const variacao1 = Math.sin(this.tempo * 0.002) * 0.4;
        const variacao2 = Math.cos(this.tempo * 0.005) * 0.2;
        const variacao3 = Math.sin(this.tempo * 0.001) * 0.6;
        
        this.velocidade = this.velocidadeMaxima + variacao1 + variacao2 + variacao3;
        this.velocidade = Math.max(this.velocidadeMaxima * 0.8, 
                                  Math.min(this.velocidadeMaxima * 1.2, this.velocidade));
    }

    atualizarDesaceleracaoMelhorada(dt) {
        if (this.tempo < this.tempoDesaceleracao) {
            const progresso = this.tempo / this.tempoDesaceleracao;
            const curva = progresso < 0.5 
                ? 4 * progresso * progresso * progresso
                : 1 - Math.pow(-2 * progresso + 2, 3) / 2;
            
            this.velocidade = this.velocidadeMaxima * (1 - curva);
            
            if (progresso > 0.5) {
                const fatorConvergencia = (progresso - 0.5) / 0.5;
                const convergencia = this.easeInOutQuart(fatorConvergencia);
                const diferenca = this.anguloAlvo - this.angulo;
                const ajuste = diferenca * convergencia * 0.008;
                this.angulo += ajuste;
            }
        } else {
            this.fase = 'parado';
            this.velocidade = 0;
            this.angulo = this.anguloAlvo;
        }
    }

    // Funções de easing
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }
}

// ===== SISTEMA DE ÁUDIO MELHORADO =====

class AudioSystemMelhorado {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.volume = 0.25;
        this.muted = false;
        this.init();
    }
    
    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = this.volume;
        } catch (e) {
            console.log('❌ Áudio não suportado:', e);
        }
    }
    
    play(type, velocidade = 1) {
        if (!this.context || this.muted) return;
        
        const agora = this.context.currentTime;
        
        switch (type) {
            case 'giroInicio':
                this.playGiroInicio(agora);
                break;
            case 'giroLoop':
                this.playGiroLoop(agora, velocidade);
                break;
            case 'parada':
                this.playParada(agora);
                break;
            case 'vitoria':
                this.playVitoria(agora);
                break;
        }
    }
    
    playGiroInicio(agora) {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.frequency.setValueAtTime(220, agora);
        oscillator.frequency.exponentialRampToValueAtTime(440, agora + 0.3);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.08, agora);
        gainNode.gain.exponentialRampToValueAtTime(0.001, agora + 0.6);
        
        oscillator.start(agora);
        oscillator.stop(agora + 0.6);
    }
    
    playGiroLoop(agora, velocidade) {
        if (Math.random() < 0.1) {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            const freq = 150 + (velocidade * 5);
            oscillator.frequency.value = freq;
            oscillator.type = 'triangle';
            
            const volume = Math.min(0.03, velocidade * 0.002);
            gainNode.gain.setValueAtTime(volume, agora);
            gainNode.gain.exponentialRampToValueAtTime(0.001, agora + 0.1);
            
            oscillator.start(agora);
            oscillator.stop(agora + 0.1);
        }
    }
    
    playParada(agora) {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.frequency.setValueAtTime(440, agora);
        oscillator.frequency.exponentialRampToValueAtTime(220, agora + 1.2);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.06, agora);
        gainNode.gain.exponentialRampToValueAtTime(0.001, agora + 1.2);
        
        oscillator.start(agora);
        oscillator.stop(agora + 1.2);
    }
    
    playVitoria(agora) {
        const notas = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        notas.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            const startTime = agora + i * 0.2;
            gain.gain.setValueAtTime(0.04, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }
}

// ===== SISTEMA DE EFEITOS VISUAIS MELHORADO =====

class EfeitosVisuaisMelhorados {
    constructor() {
        this.ultimaVelocidade = 0;
        this.transicaoSuave = 0.1;
    }
    
    aplicarEfeitosVelocidade(velocidade) {
        if (!elements.roleta) return;
        
        this.ultimaVelocidade = this.lerp(this.ultimaVelocidade, velocidade, this.transicaoSuave);
        const velocidadeNormalizada = Math.min(1, this.ultimaVelocidade / 25);
        
        const blur = velocidadeNormalizada * 1.2;
        const brilho = 1 + (velocidadeNormalizada * 0.15);
        const saturacao = 1 + (velocidadeNormalizada * 0.2);
        
        elements.roleta.style.filter = `blur(${blur}px) brightness(${brilho}) saturate(${saturacao})`;
        
        const sombra = velocidadeNormalizada * 20;
        elements.roleta.style.boxShadow = `0 0 ${sombra}px rgba(255, 215, 0, ${velocidadeNormalizada * 0.3})`;
    }
    
    criarParticulasGiro() {
        if (!elements.particlesBg) return;
        
        for (let i = 0; i < 1; i++) {
            const particula = document.createElement('div');
            const tamanho = Math.random() * 3 + 1.5;
            const cores = [
                'rgba(255, 215, 0, 0.4)',
                'rgba(255, 107, 107, 0.3)',
                'rgba(76, 205, 196, 0.3)',
                'rgba(138, 43, 226, 0.25)'
            ];
            
            particula.style.cssText = `
                position: absolute;
                width: ${tamanho}px;
                height: ${tamanho}px;
                background: ${cores[Math.floor(Math.random() * cores.length)]};
                border-radius: 50%;
                pointer-events: none;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: particleGiroSuave 1.5s ease-out forwards;
                will-change: transform, opacity;
            `;
            
            elements.particlesBg.appendChild(particula);
            
            setTimeout(() => {
                if (particula.parentNode) {
                    particula.parentNode.removeChild(particula);
                }
            }, 1500);
        }
    }
    
    criarConfetes() {
        if (!elements.particlesBg) return;
        
        for (let i = 0; i < 30; i++) {
            const confete = document.createElement('div');
            const cores = ['#ffd700', '#ff6b6b', '#4ecdc4', '#9b59b6', '#ff9f43'];
            
            confete.style.cssText = `
                position: absolute;
                width: ${Math.random() * 6 + 3}px;
                height: ${Math.random() * 6 + 3}px;
                background: ${cores[Math.floor(Math.random() * cores.length)]};
                left: ${Math.random() * 100}%;
                top: -10px;
                pointer-events: none;
                animation: confeteFallSuave ${1.5 + Math.random() * 2}s ease-out forwards;
                animation-delay: ${Math.random() * 1.5}s;
                will-change: transform;
            `;
            
            elements.particlesBg.appendChild(confete);
        }
        
        setTimeout(() => {
            const confetes = elements.particlesBg.querySelectorAll('div');
            confetes.forEach(confete => {
                if (confete.style.animation.includes('confeteFallSuave')) {
                    confete.remove();
                }
            });
        }, 4000);
    }
    
    limparEfeitos() {
        if (elements.roleta) {
            elements.roleta.style.filter = '';
            elements.roleta.style.boxShadow = '';
        }
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
}

// ===== INSTÂNCIAS DOS SISTEMAS =====
const fisica = new FisicaMelhorada();
const audioSystem = new AudioSystemMelhorado();
const efeitos = new EfeitosVisuaisMelhorados();

// ===== FUNÇÕES PRINCIPAIS =====

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎰 RoletaWin com 4 setores carregada!');
    
    // Verificar elementos essenciais
    if (!elements.btnGirar || !elements.btnParar || !elements.roleta) {
        console.error('❌ Elementos essenciais não encontrados');
        return;
    }
    
    // Inicializar sistemas
    inicializarEventListeners();
    criarParticulas();
    adicionarEstilosCSS();
    
    // Status inicial
    if (elements.statusText) {
        elements.statusText.textContent = 'Pronto para girar com 4 setores coloridos!';
    }
    
    mostrarToast('Sistema de 4 setores carregado com sucesso!', 'success');
});

// Adicionar estilos CSS dinâmicos
function adicionarEstilosCSS() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleGiroSuave {
            0% {
                transform: translateY(0) scale(1) rotate(0deg);
                opacity: 0.8;
            }
            20% {
                opacity: 1;
            }
            100% {
                transform: translateY(-50px) scale(1) rotate(360deg);
                opacity: 0;
            }
        }
        
        @keyframes confeteFallSuave {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
        
        @keyframes particleFloatSuave {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 0.3;
            }
            50% {
                opacity: 0.6;
            }
            100% {
                transform: translateY(-100vh) rotate(360deg);
                opacity: 0;
            }
        }
        
        @keyframes rippleMelhorado {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        #roleta {
            transition: filter 0.3s ease, box-shadow 0.3s ease;
            will-change: transform;
        }
        
        .toast {
            will-change: transform;
        }
    `;
    document.head.appendChild(style);
}

// Inicializar event listeners
function inicializarEventListeners() {
    if (!elements.btnGirar || !elements.btnParar) {
        console.error('❌ Elementos de botão não encontrados');
        return;
    }
    
    elements.btnGirar.addEventListener('click', (e) => {
        criarEfeitoRipple(e, elements.btnGirar);
        handleGirarClick();
    });
    
    elements.btnParar.addEventListener('click', (e) => {
        criarEfeitoRipple(e, elements.btnParar);
        handlePararClick();
    });
    
    // Eventos de teclado
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !gameState.bloqueado) {
            e.preventDefault();
            if (gameState.estadoRoleta === ESTADOS_ROLETA.IDLE) {
                handleGirarClick();
            } else if (gameState.estadoRoleta === ESTADOS_ROLETA.SPINNING) {
                handlePararClick();
            }
        }
    });
}

// Handle click no botão girar
function handleGirarClick() {
    if (gameState.bloqueado || gameState.estadoRoleta !== ESTADOS_ROLETA.IDLE) {
        return;
    }
    
    iniciarGiroMelhorado();
}

// Handle click no botão parar
function handlePararClick() {
    if (gameState.bloqueado || gameState.estadoRoleta !== ESTADOS_ROLETA.SPINNING) {
        return;
    }
    
    pararGiroMelhorado();
}

// ===== FUNÇÃO PRINCIPAL: INICIAR GIRO =====
function iniciarGiroMelhorado() {
    if (gameState.bloqueado) return;
    
    console.log('🎯 Iniciando giro com 4 setores');
    
    gameState.bloqueado = true;
    gameState.estadoRoleta = ESTADOS_ROLETA.SPINNING;
    gameState.tempoGiro = 0;
    gameState.podeParar = false;
    
    fisica.reset();
    fisica.angulo = gameState.anguloAtual;
    fisica.iniciarGiro();
    
    trocarBotoes(true);
    audioSystem.play('giroInicio');
    iniciarLoopAnimacaoMelhorado();
    
    mostrarToast('A roleta de 4 setores está girando! Clique em PARAR quando quiser.', 'info');
}

// ===== LOOP DE ANIMAÇÃO =====
function iniciarLoopAnimacaoMelhorado() {
    let ultimoTempo = performance.now();
    
    function loop(tempoAtual) {
        if (gameState.estadoRoleta === ESTADOS_ROLETA.STOPPED) {
            return;
        }
        
        const deltaTime = tempoAtual - ultimoTempo;
        ultimoTempo = tempoAtual;
        
        gameState.tempoGiro += deltaTime;
        
        const estadoFisica = fisica.atualizar(deltaTime);
        
        gameState.anguloAtual = estadoFisica.angulo;
        gameState.velocidadeAtual = estadoFisica.velocidade;
        
        if (elements.roleta) {
            elements.roleta.style.transform = `rotate(${gameState.anguloAtual}deg)`;
        }
        
        efeitos.aplicarEfeitosVelocidade(gameState.velocidadeAtual);
        atualizarIndicadores(estadoFisica);
        audioSystem.play('giroLoop', gameState.velocidadeAtual);
        
        if (gameState.velocidadeAtual > 10 && Math.random() < 0.15) {
            efeitos.criarParticulasGiro();
        }
        
        if (estadoFisica.fase === 'constante' && !gameState.podeParar) {
            gameState.podeParar = true;
            elements.btnParar.disabled = false;
        }
        
        if (estadoFisica.completo) {
            finalizarGiroMelhorado();
            return;
        }
        
        gameState.animacaoId = requestAnimationFrame(loop);
    }
    
    gameState.animacaoId = requestAnimationFrame(loop);
}

// ===== PARAR GIRO =====
function pararGiroMelhorado() {
    if (gameState.estadoRoleta !== ESTADOS_ROLETA.SPINNING || !gameState.podeParar) {
        return;
    }
    
    console.log('🛑 Parando giro de 4 setores');
    
    gameState.estadoRoleta = ESTADOS_ROLETA.STOPPING;
    
    const setorAlvo = fisica.pararGiro();
    gameState.setorAlvo = setorAlvo;
    
    elements.btnParar.disabled = true;
    
    mostrarToast('Parando suavemente na roleta de 4 setores...', 'warning');
}

// ===== FINALIZAR GIRO =====
function finalizarGiroMelhorado() {
    console.log('🏁 Finalizando giro de 4 setores');
    
    gameState.estadoRoleta = ESTADOS_ROLETA.STOPPED;
    gameState.bloqueado = false;
    
    if (gameState.animacaoId) {
        cancelAnimationFrame(gameState.animacaoId);
        gameState.animacaoId = null;
    }
    
    setTimeout(() => {
        efeitos.limparEfeitos();
    }, 500);
    
    if (elements.velocidadeBar) {
        elements.velocidadeBar.style.width = '0%';
    }
    
    audioSystem.play('parada');
    
    // Calcular resultado para 4 setores (90 graus cada)
    const anguloFinal = (360 - (gameState.anguloAtual % 360)) % 360;
    const setorIndex = Math.floor(anguloFinal / 90);
    const setorResultado = roletaConfig.setores[setorIndex];
    
    gameState.velocidadeAtual = 0;
    gameState.estadoRoleta = ESTADOS_ROLETA.IDLE;
    
    setTimeout(() => {
        if (setorResultado.premio > 0) {
            efeitos.criarConfetes();
            audioSystem.play('vitoria');
        }
        
        mostrarResultado(setorResultado);
        
        setTimeout(() => {
            trocarBotoes(false);
            elements.statusText.textContent = 'Pronto para girar novamente com 4 setores!';
        }, 3000);
    }, 800);
}

// ===== FUNÇÕES DE INTERFACE =====

// Trocar botões
function trocarBotoes(girando) {
    if (!elements.btnGirar || !elements.btnParar) return;
    
    if (girando) {
        elements.btnGirar.classList.add('hidden');
        elements.btnParar.classList.remove('hidden');
        elements.btnParar.disabled = true;
    } else {
        elements.btnParar.classList.add('hidden');
        elements.btnGirar.classList.remove('hidden');
    }
}

// Atualizar indicadores
function atualizarIndicadores(estadoFisica) {
    let statusText = '';
    const tempoMinutos = Math.floor(gameState.tempoGiro / 60000);
    const tempoSegundos = Math.floor((gameState.tempoGiro % 60000) / 1000);
    const tempoFormatado = `${tempoMinutos}:${tempoSegundos.toString().padStart(2, '0')}`;
    
    switch (estadoFisica.fase) {
        case 'acelerando':
            statusText = `Acelerando (4 setores)... ${estadoFisica.velocidade.toFixed(1)} rpm`;
            break;
        case 'constante':
            statusText = `Girando (4 setores)... ${estadoFisica.velocidade.toFixed(1)} rpm (${tempoFormatado})`;
            break;
        case 'desacelerando':
            statusText = `Parando (4 setores)... ${estadoFisica.velocidade.toFixed(1)} rpm`;
            break;
    }
    
    if (elements.statusText) {
        elements.statusText.textContent = statusText;
    }
    
    if (elements.velocidadeBar) {
        const porcentagem = (estadoFisica.velocidade / 25) * 100;
        elements.velocidadeBar.style.width = `${Math.min(100, porcentagem)}%`;
        
        const hue = Math.min(120, (estadoFisica.velocidade / 25) * 120);
        elements.velocidadeBar.style.backgroundColor = `hsl(${hue}, 70%, 50%)`;
    }
}

// Mostrar resultado
function mostrarResultado(setor) {
    const isWin = setor.premio > 0;
    
    elements.resultado.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 15px;">
                ${isWin ? '🎉' : '😔'}
            </div>
            <div style="font-size: 2rem; margin-bottom: 10px; color: ${setor.cor || '#ffd700'};">
                ${setor.texto}
            </div>
            <div style="font-size: 1.2rem; opacity: 0.9;">
                ${isWin ? 'Parabéns! Você ganhou na roleta de 4 setores!' : 'Tente novamente na roleta de 4 setores!'}
            </div>
        </div>
    `;
    
    elements.resultado.classList.add('show');
    
    setTimeout(() => {
        elements.resultado.classList.remove('show');
    }, 5000);
}

// ===== FUNÇÕES AUXILIARES =====

// Criar efeito ripple
function criarEfeitoRipple(event, button) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.25);
        transform: scale(0);
        animation: rippleMelhorado 0.5s ease-out;
        pointer-events: none;
        will-change: transform;
    `;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
}

// Toast notifications
function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mensagem;
    
    const estilos = {
        success: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
        error: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
        warning: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
        info: 'linear-gradient(135deg, #4ecdc4 0%, #26a69a 100%)'
    };
    
    toast.style.background = estilos[tipo] || estilos.info;
    toast.style.color = tipo === 'warning' ? '#0a0e27' : '#ffffff';
    toast.style.willChange = 'transform';
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Criar partículas de fundo
function criarParticulas() {
    if (!elements.particlesBg) return;
    
    for (let i = 0; i < 20; i++) {
        const particula = document.createElement('div');
        const tamanho = Math.random() * 4 + 1.5;
        const cores = [
            'rgba(255, 215, 0, 0.25)',
            'rgba(138, 43, 226, 0.15)',
            'rgba(255, 105, 180, 0.15)',
            'rgba(76, 205, 196, 0.15)'
        ];
        
        particula.style.cssText = `
            position: absolute;
            width: ${tamanho}px;
            height: ${tamanho}px;
            background: ${cores[Math.floor(Math.random() * cores.length)]};
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            pointer-events: none;
            filter: blur(0.5px);
            animation: particleFloatSuave ${25 + Math.random() * 20}s linear infinite;
            animation-delay: ${Math.random() * 10}s;
            will-change: transform;
        `;
        
        elements.particlesBg.appendChild(particula);
    }
}

console.log('🎰 RoletaWin com 4 Setores Coloridos carregada com sucesso!');

