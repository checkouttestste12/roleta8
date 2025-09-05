// ===== ROLETA PROFISSIONAL COM GIRO MELHORADO =====

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

// Configurações da roleta
const roletaConfig = {
    setores: [
        { premio: 0, texto: 'Vazio', angulo: 0 },
        { premio: 25, texto: 'R$ 25', angulo: 45 },
        { premio: 0, texto: 'Vazio', angulo: 90 },
        { premio: 50, texto: 'R$ 50', angulo: 135 },
        { premio: 0, texto: 'Vazio', angulo: 180 },
        { premio: 75, texto: 'R$ 75', angulo: 225 },
        { premio: 0, texto: 'Vazio', angulo: 270 },
        { premio: 100, texto: 'R$ 100', angulo: 315 }
    ]
};

// ===== SISTEMA DE FÍSICA MELHORADO PARA GIRO FLUIDO =====

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
        this.tempoAceleracao = 1800; // Reduzido para 1.8s - mais responsivo
        this.tempoDesaceleracao = 3500; // Reduzido para 3.5s - mais dinâmico
        this.velocidadeMaxima = 18 + Math.random() * 6; // 18-24 rpm - mais consistente
        this.velocidadeMinima = 2; // Velocidade inicial mínima
        
        // Parâmetros para suavização
        this.inercia = 0.98; // Fator de inércia para movimento mais natural
        this.ruido = 0; // Ruído para variação natural
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
            
            // Cálculo mais preciso do setor alvo
            const anguloAtual = this.angulo % 360;
            const setorAtual = Math.floor(anguloAtual / 45);
            
            // Determinar setor alvo com base na velocidade atual
            const voltasExtras = Math.max(2, Math.min(6, this.velocidade / 3));
            const setoresExtras = Math.floor(Math.random() * 3) + 2; // 2-4 setores extras
            const proximoSetor = (setorAtual + setoresExtras) % 8;
            
            this.anguloAlvo = this.angulo + (voltasExtras * 360) + 
                             (proximoSetor * 45) - (anguloAtual % 360);
            
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

        // Aplicar suavização de velocidade para evitar saltos
        this.velocidade = this.lerp(this.ultimaVelocidade, this.velocidade, 0.15);
        
        // Adicionar ruído sutil para movimento mais natural
        this.ruido = Math.sin(this.tempo * 0.003) * 0.3 + 
                     Math.cos(this.tempo * 0.007) * 0.2;
        
        // Atualizar ângulo com movimento suavizado
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
            
            // Curva de aceleração mais suave (ease-out-quart)
            const curva = 1 - Math.pow(1 - progresso, 4);
            
            // Aceleração gradual mais natural
            const velocidadeAlvo = this.velocidadeMinima + 
                                 (this.velocidadeMaxima - this.velocidadeMinima) * curva;
            
            this.velocidade = velocidadeAlvo;
        } else {
            this.fase = 'constante';
            this.velocidade = this.velocidadeMaxima;
        }
    }

    atualizarConstanteMelhorada(dt) {
        // Variação mais sutil e natural da velocidade
        const variacao1 = Math.sin(this.tempo * 0.002) * 0.4;
        const variacao2 = Math.cos(this.tempo * 0.005) * 0.2;
        const variacao3 = Math.sin(this.tempo * 0.001) * 0.6;
        
        this.velocidade = this.velocidadeMaxima + variacao1 + variacao2 + variacao3;
        
        // Manter velocidade dentro de limites razoáveis
        this.velocidade = Math.max(this.velocidadeMaxima * 0.8, 
                                  Math.min(this.velocidadeMaxima * 1.2, this.velocidade));
    }

    atualizarDesaceleracaoMelhorada(dt) {
        if (this.tempo < this.tempoDesaceleracao) {
            const progresso = this.tempo / this.tempoDesaceleracao;
            
            // Curva de desaceleração mais realista (ease-in-out-cubic)
            const curva = progresso < 0.5 
                ? 4 * progresso * progresso * progresso
                : 1 - Math.pow(-2 * progresso + 2, 3) / 2;
            
            // Desaceleração suave
            this.velocidade = this.velocidadeMaxima * (1 - curva);
            
            // Convergência para ângulo alvo mais precisa
            if (progresso > 0.5) {
                const fatorConvergencia = (progresso - 0.5) / 0.5;
                const convergencia = this.easeInOutQuart(fatorConvergencia);
                
                const diferenca = this.anguloAlvo - this.angulo;
                const ajuste = diferenca * convergencia * 0.008; // Reduzido para movimento mais suave
                
                this.angulo += ajuste;
            }
        } else {
            this.fase = 'parado';
            this.velocidade = 0;
            this.angulo = this.anguloAlvo;
        }
    }

    // Funções de easing melhoradas
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
        this.volume = 0.25; // Volume reduzido para ser menos intrusivo
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
        // Som sutil durante o giro baseado na velocidade
        if (Math.random() < 0.1) { // 10% de chance por frame
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
        // Sequência melódica mais elaborada para vitória
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
        
        // Suavizar mudanças de velocidade para efeitos visuais
        this.ultimaVelocidade = this.lerp(this.ultimaVelocidade, velocidade, this.transicaoSuave);
        
        const velocidadeNormalizada = Math.min(1, this.ultimaVelocidade / 25);
        
        // Motion blur mais sutil e realista
        const blur = velocidadeNormalizada * 1.2;
        
        // Brilho mais sutil
        const brilho = 1 + (velocidadeNormalizada * 0.15);
        
        // Saturação dinâmica
        const saturacao = 1 + (velocidadeNormalizada * 0.2);
        
        // Aplicar efeitos com transição suave
        elements.roleta.style.filter = `blur(${blur}px) brightness(${brilho}) saturate(${saturacao})`;
        
        // Adicionar sombra dinâmica
        const sombra = velocidadeNormalizada * 20;
        elements.roleta.style.boxShadow = `0 0 ${sombra}px rgba(255, 215, 0, ${velocidadeNormalizada * 0.3})`;
    }
    
    criarParticulasGiro() {
        if (!elements.particlesBg) return;
        
        // Reduzir frequência de partículas para melhor performance
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
        
        for (let i = 0; i < 30; i++) { // Reduzido de 50 para 30
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

// ===== INSTÂNCIAS DOS SISTEMAS MELHORADOS =====
const fisica = new FisicaMelhorada();
const audioSystem = new AudioSystemMelhorado();
const efeitos = new EfeitosVisuaisMelhorados();

// ===== FUNÇÕES PRINCIPAIS MELHORADAS =====

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎰 RoletaWin Giro Melhorado - Iniciando...');
    
    // Adicionar CSS para animações melhoradas
    adicionarCSSMelhorado();
    
    setTimeout(() => {
        inicializarEventListeners();
        criarParticulas();
        console.log('🚀 Sistema melhorado inicializado!');
    }, 100);
});

// Adicionar CSS melhorado
function adicionarCSSMelhorado() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleGiroSuave {
            0% {
                transform: translateY(0) scale(0) rotate(0deg);
                opacity: 0;
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
        
        /* Melhorar transições da roleta */
        #roleta {
            transition: filter 0.3s ease, box-shadow 0.3s ease;
            will-change: transform;
        }
        
        /* Otimizar performance */
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

// ===== FUNÇÃO PRINCIPAL: INICIAR GIRO MELHORADO =====
function iniciarGiroMelhorado() {
    if (gameState.bloqueado) return;
    
    console.log('🎯 Iniciando giro melhorado');
    
    // Bloquear ações e definir estado
    gameState.bloqueado = true;
    gameState.estadoRoleta = ESTADOS_ROLETA.SPINNING;
    gameState.tempoGiro = 0;
    gameState.podeParar = false;
    
    // Resetar física
    fisica.reset();
    fisica.angulo = gameState.anguloAtual;
    fisica.iniciarGiro();
    
    // Atualizar interface
    trocarBotoes(true);
    
    // Efeitos
    audioSystem.play('giroInicio');
    
    // Iniciar loop de animação melhorado
    iniciarLoopAnimacaoMelhorado();
    
    mostrarToast('A roleta está girando com movimento melhorado! Clique em PARAR quando quiser parar.', 'info');
}

// ===== LOOP DE ANIMAÇÃO MELHORADO =====
function iniciarLoopAnimacaoMelhorado() {
    let ultimoTempo = performance.now(); // Usar performance.now() para maior precisão
    
    function loop(tempoAtual) {
        if (gameState.estadoRoleta === ESTADOS_ROLETA.STOPPED) {
            return; // Parar loop
        }
        
        const deltaTime = tempoAtual - ultimoTempo;
        ultimoTempo = tempoAtual;
        
        // Atualizar tempo de giro
        gameState.tempoGiro += deltaTime;
        
        // Atualizar física
        const estadoFisica = fisica.atualizar(deltaTime);
        
        // Atualizar estado do jogo
        gameState.anguloAtual = estadoFisica.angulo;
        gameState.velocidadeAtual = estadoFisica.velocidade;
        
        // Aplicar rotação com transform otimizado
        if (elements.roleta) {
            elements.roleta.style.transform = `rotate(${gameState.anguloAtual}deg)`;
        }
        
        // Efeitos visuais baseados na velocidade
        efeitos.aplicarEfeitosVelocidade(gameState.velocidadeAtual);
        
        // Atualizar indicadores
        atualizarIndicadores(estadoFisica);
        
        // Som durante o giro
        audioSystem.play('giroLoop', gameState.velocidadeAtual);
        
        // Criar partículas durante o giro (menos frequente)
        if (gameState.velocidadeAtual > 10 && Math.random() < 0.15) {
            efeitos.criarParticulasGiro();
        }
        
        // Habilitar botão parar após aceleração
        if (estadoFisica.fase === 'constante' && !gameState.podeParar) {
            gameState.podeParar = true;
            elements.btnParar.disabled = false;
        }
        
        // Verificar se terminou
        if (estadoFisica.completo) {
            finalizarGiroMelhorado();
            return;
        }
        
        // Continuar loop
        gameState.animacaoId = requestAnimationFrame(loop);
    }
    
    gameState.animacaoId = requestAnimationFrame(loop);
}

// ===== PARAR GIRO MELHORADO =====
function pararGiroMelhorado() {
    if (gameState.estadoRoleta !== ESTADOS_ROLETA.SPINNING || !gameState.podeParar) {
        return;
    }
    
    console.log('🛑 Parando giro melhorado');
    
    gameState.estadoRoleta = ESTADOS_ROLETA.STOPPING;
    
    // Iniciar desaceleração
    const setorAlvo = fisica.pararGiro();
    gameState.setorAlvo = setorAlvo;
    
    // Atualizar interface
    elements.btnParar.disabled = true;
    
    mostrarToast('Comando de parada recebido! A roleta está desacelerando suavemente...', 'warning');
}

// ===== FINALIZAR GIRO MELHORADO =====
function finalizarGiroMelhorado() {
    console.log('🏁 Finalizando giro melhorado');
    
    // Atualizar estado
    gameState.estadoRoleta = ESTADOS_ROLETA.STOPPED;
    gameState.bloqueado = false;
    
    // Limpar animações
    if (gameState.animacaoId) {
        cancelAnimationFrame(gameState.animacaoId);
        gameState.animacaoId = null;
    }
    
    // Limpar efeitos visuais gradualmente
    setTimeout(() => {
        efeitos.limparEfeitos();
    }, 500);
    
    // Resetar indicadores
    if (elements.velocidadeBar) {
        elements.velocidadeBar.style.width = '0%';
    }
    
    // Som de parada
    audioSystem.play('parada');
    
    // Calcular resultado final
    const anguloFinal = (360 - (gameState.anguloAtual % 360)) % 360;
    const setorIndex = Math.floor(anguloFinal / 45);
    const setorResultado = roletaConfig.setores[setorIndex];
    
    gameState.velocidadeAtual = 0;
    
    // Resetar estado da roleta
    gameState.estadoRoleta = ESTADOS_ROLETA.IDLE;
    
    // Mostrar resultado com delay
    setTimeout(() => {
        if (setorResultado.premio > 0) {
            efeitos.criarConfetes();
            audioSystem.play('vitoria');
        }
        
        mostrarResultado(setorResultado);
        
        // Resetar para próximo giro
        setTimeout(() => {
            trocarBotoes(false);
            elements.statusText.textContent = 'Pronto para girar com movimento melhorado!';
        }, 3000);
    }, 800);
}

// ===== FUNÇÕES DE INTERFACE MELHORADAS =====

// Trocar botões
function trocarBotoes(girando) {
    if (!elements.btnGirar || !elements.btnParar) return;
    
    if (girando) {
        elements.btnGirar.classList.add('hidden');
        elements.btnParar.classList.remove('hidden');
        elements.btnParar.disabled = true; // Será habilitado após aceleração
    } else {
        elements.btnParar.classList.add('hidden');
        elements.btnGirar.classList.remove('hidden');
    }
}

// Atualizar indicadores melhorados
function atualizarIndicadores(estadoFisica) {
    // Atualizar status
    let statusText = '';
    const tempoMinutos = Math.floor(gameState.tempoGiro / 60000);
    const tempoSegundos = Math.floor((gameState.tempoGiro % 60000) / 1000);
    const tempoFormatado = `${tempoMinutos}:${tempoSegundos.toString().padStart(2, '0')}`;
    
    switch (estadoFisica.fase) {
        case 'acelerando':
            statusText = `Acelerando suavemente... ${estadoFisica.velocidade.toFixed(1)} rpm`;
            break;
        case 'constante':
            statusText = `Girando fluidamente... ${estadoFisica.velocidade.toFixed(1)} rpm (${tempoFormatado})`;
            break;
        case 'desacelerando':
            statusText = `Parando com precisão... ${estadoFisica.velocidade.toFixed(1)} rpm`;
            break;
    }
    
    if (elements.statusText) {
        elements.statusText.textContent = statusText;
    }
    
    // Atualizar barra de velocidade com animação suave
    if (elements.velocidadeBar) {
        const porcentagem = (estadoFisica.velocidade / 25) * 100;
        elements.velocidadeBar.style.width = `${Math.min(100, porcentagem)}%`;
        
        // Cor dinâmica baseada na velocidade
        const hue = Math.min(120, (estadoFisica.velocidade / 25) * 120);
        elements.velocidadeBar.style.backgroundColor = `hsl(${hue}, 70%, 50%)`;
    }
}

// Mostrar resultado melhorado
function mostrarResultado(setor) {
    const isWin = setor.premio > 0;
    
    elements.resultado.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 15px;">
                ${isWin ? '🎉' : '😔'}
            </div>
            <div style="font-size: 2rem; margin-bottom: 10px; color: ${isWin ? '#ffd700' : '#ff6b6b'};">
                ${setor.texto}
            </div>
            <div style="font-size: 1.2rem; opacity: 0.9;">
                ${isWin ? 'Parabéns! Você ganhou com o giro melhorado!' : 'Tente novamente com o novo sistema!'}
            </div>
        </div>
    `;
    
    elements.resultado.classList.add('show');
    
    setTimeout(() => {
        elements.resultado.classList.remove('show');
    }, 5000);
}

// ===== FUNÇÕES AUXILIARES MELHORADAS =====

// Criar efeito ripple melhorado
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
    
    // Adicionar animação CSS se não existir
    if (!document.querySelector('#ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
            @keyframes rippleMelhorado {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
}

// Toast notifications melhoradas
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

// Criar partículas de fundo melhoradas
function criarParticulas() {
    if (!elements.particlesBg) return;
    
    for (let i = 0; i < 20; i++) { // Reduzido de 25 para 20
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
    
    // Adicionar CSS para animação de partículas se não existir
    if (!document.querySelector('#particle-style')) {
        const style = document.createElement('style');
        style.id = 'particle-style';
        style.textContent = `
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
        `;
        document.head.appendChild(style);
    }
}

console.log('🎰 RoletaWin Giro Melhorado carregada com sucesso!');
