// ===== ROLETA MINI SIMPLIFICADA =====

// Estados da roleta
const ESTADOS_ROLETA = {
    IDLE: 'idle',
    SPINNING: 'spinning',
    STOPPED: 'stopped'
};

// Estado do jogo
let gameState = {
    estadoRoleta: ESTADOS_ROLETA.IDLE,
    girosRestantes: 3,
    saldoAtual: 0
};

// Elementos DOM
const elements = {
    btnGirar: document.getElementById('btn-girar'),
    btnParar: document.getElementById('btn-parar'),
    roleta: document.getElementById('roleta'),
    toastContainer: document.getElementById('toast-container'),
    resultadoModal: document.getElementById('resultado-modal'),
    btnContinuar: document.getElementById('btn-continuar'),
    premioValor: document.getElementById('premio-valor'),
    novoSaldo: document.getElementById('novo-saldo'),
    girosCount: document.getElementById('giros-count'),
    saldoAtual: document.getElementById('saldo-atual')
};

// Configuração de prêmios
const premiosPossiveis = [
    { valor: 0, texto: 'Tente novamente!', peso: 50 },
    { valor: 25, texto: 'R$ 25,00', peso: 25 },
    { valor: 50, texto: 'R$ 50,00', peso: 15 },
    { valor: 75, texto: 'R$ 75,00', peso: 10 }
];

// ===== FUNÇÕES PRINCIPAIS =====

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎰 RoletaWin - Iniciando...');
    inicializarEventListeners();
    atualizarInterface();
});

// Event listeners
function inicializarEventListeners() {
    if (elements.btnGirar) {
        elements.btnGirar.addEventListener('click', iniciarGiro);
    }
    
    if (elements.btnContinuar) {
        elements.btnContinuar.addEventListener('click', fecharModal);
    }
    
    // Fechar modal clicando fora
    if (elements.resultadoModal) {
        elements.resultadoModal.addEventListener('click', function(e) {
            if (e.target === elements.resultadoModal) {
                fecharModal();
            }
        });
    }
}

// Iniciar giro
function iniciarGiro() {
    if (gameState.estadoRoleta !== ESTADOS_ROLETA.IDLE || gameState.girosRestantes <= 0) {
        return;
    }
    
    gameState.estadoRoleta = ESTADOS_ROLETA.SPINNING;
    gameState.girosRestantes--;
    
    // Atualizar interface
    elements.btnGirar.disabled = true;
    elements.btnGirar.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>GIRANDO...</span>';
    
    // Adicionar efeito visual à roleta
    if (elements.roleta) {
        elements.roleta.style.animationDuration = '0.1s';
        elements.roleta.style.filter = 'brightness(1.2) saturate(1.3)';
        elements.roleta.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
    }
    
    mostrarToast('A roleta está girando! Aguarde o resultado...', 'info');
    
    // Simular tempo de giro
    setTimeout(() => {
        finalizarGiro();
    }, 3000 + Math.random() * 2000); // 3-5 segundos
}

// Finalizar giro
function finalizarGiro() {
    gameState.estadoRoleta = ESTADOS_ROLETA.STOPPED;
    
    // Remover efeitos visuais
    if (elements.roleta) {
        elements.roleta.style.animationDuration = '3s';
        elements.roleta.style.filter = '';
        elements.roleta.style.boxShadow = '';
    }
    
    // Calcular resultado
    const premio = calcularPremio();
    
    // Atualizar saldo
    gameState.saldoAtual += premio.valor;
    
    // Mostrar resultado
    setTimeout(() => {
        mostrarResultado(premio);
        
        // Resetar botão após um tempo
        setTimeout(() => {
            resetarBotao();
        }, 1000);
    }, 500);
}

// Calcular prêmio baseado nos pesos
function calcularPremio() {
    const totalPeso = premiosPossiveis.reduce((sum, premio) => sum + premio.peso, 0);
    const random = Math.random() * totalPeso;
    
    let pesoAcumulado = 0;
    for (const premio of premiosPossiveis) {
        pesoAcumulado += premio.peso;
        if (random <= pesoAcumulado) {
            return premio;
        }
    }
    
    return premiosPossiveis[0]; // Fallback
}

// Mostrar resultado
function mostrarResultado(premio) {
    if (!elements.resultadoModal) return;
    
    // Atualizar conteúdo do modal
    if (elements.premioValor) {
        elements.premioValor.textContent = premio.texto;
    }
    
    if (elements.novoSaldo) {
        elements.novoSaldo.textContent = gameState.saldoAtual.toFixed(2);
    }
    
    // Atualizar título e descrição baseado no prêmio
    const titulo = document.getElementById('resultado-titulo');
    const descricao = document.getElementById('resultado-descricao');
    const icon = document.getElementById('resultado-icon');
    
    if (premio.valor > 0) {
        if (titulo) titulo.textContent = 'Parabéns!';
        if (descricao) descricao.textContent = 'Você ganhou um prêmio!';
        if (icon) icon.innerHTML = '<i class="fas fa-trophy"></i>';
        
        // Efeitos de vitória
        criarConfetes();
        mostrarToast(`Parabéns! Você ganhou ${premio.texto}!`, 'success');
    } else {
        if (titulo) titulo.textContent = 'Que pena!';
        if (descricao) descricao.textContent = 'Não foi desta vez, mas continue tentando!';
        if (icon) icon.innerHTML = '<i class="fas fa-heart-broken"></i>';
        
        mostrarToast('Não foi desta vez! Tente novamente.', 'warning');
    }
    
    // Mostrar modal
    elements.resultadoModal.classList.remove('hidden');
    
    // Atualizar interface
    atualizarInterface();
}

// Fechar modal
function fecharModal() {
    if (elements.resultadoModal) {
        elements.resultadoModal.classList.add('hidden');
    }
    
    // Verificar se ainda há giros
    if (gameState.girosRestantes <= 0) {
        mostrarMensagemSemGiros();
    } else {
        gameState.estadoRoleta = ESTADOS_ROLETA.IDLE;
    }
}

// Resetar botão
function resetarBotao() {
    if (elements.btnGirar) {
        elements.btnGirar.disabled = false;
        elements.btnGirar.innerHTML = '<i class="fas fa-play"></i><span>GIRAR</span>';
    }
}

// Mostrar mensagem quando não há mais giros
function mostrarMensagemSemGiros() {
    const girosSection = document.getElementById('giros-gratis-info');
    if (!girosSection) return;
    
    girosSection.innerHTML = `
        <div class="mensagem-sem-giros">
            <div class="sem-giros-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="sem-giros-titulo">Giros Grátis Esgotados</h3>
            <p class="sem-giros-descricao">
                Você utilizou todos os seus giros grátis! 
                Faça um depósito para continuar jogando nas mesas premium.
            </p>
            <button class="btn-depositar" onclick="window.location.href='#depositar'">
                <i class="fas fa-credit-card"></i>
                <span>Fazer Depósito</span>
            </button>
        </div>
    `;
    
    mostrarToast('Giros grátis esgotados! Faça um depósito para continuar.', 'warning');
}

// Atualizar interface
function atualizarInterface() {
    // Atualizar saldo
    if (elements.saldoAtual) {
        elements.saldoAtual.textContent = gameState.saldoAtual.toFixed(2);
    }
    
    // Atualizar contador de giros
    if (elements.girosCount) {
        elements.girosCount.textContent = gameState.girosRestantes;
    }
    
    // Atualizar contador no modal
    const girosRestantesModal = document.getElementById('giros-restantes-count');
    if (girosRestantesModal) {
        girosRestantesModal.textContent = gameState.girosRestantes;
    }
    
    // Mostrar/ocultar informações de giros
    const girosInfo = document.getElementById('giros-info');
    if (girosInfo) {
        if (gameState.girosRestantes > 0) {
            girosInfo.style.display = 'block';
        } else {
            girosInfo.style.display = 'none';
        }
    }
}

// ===== FUNÇÕES DE EFEITOS VISUAIS =====

// Criar confetes
function criarConfetes() {
    const particlesBg = document.getElementById('particles-bg');
    if (!particlesBg) return;
    
    for (let i = 0; i < 30; i++) {
        const confete = document.createElement('div');
        const cores = ['#ffd700', '#ff6b6b', '#4ecdc4', '#9b59b6', '#ff9f43'];
        
        confete.style.cssText = `
            position: absolute;
            width: ${Math.random() * 8 + 4}px;
            height: ${Math.random() * 8 + 4}px;
            background: ${cores[Math.floor(Math.random() * cores.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            pointer-events: none;
            animation: confeteFall ${2 + Math.random() * 3}s ease-out forwards;
            animation-delay: ${Math.random() * 2}s;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        `;
        
        particlesBg.appendChild(confete);
    }
    
    // Limpar confetes após animação
    setTimeout(() => {
        const confetes = particlesBg.querySelectorAll('div');
        confetes.forEach(confete => {
            if (confete.style.animation.includes('confeteFall')) {
                confete.remove();
            }
        });
    }, 6000);
}

// Toast notifications
function mostrarToast(mensagem, tipo = 'info') {
    if (!elements.toastContainer) return;
    
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
    
    elements.toastContainer.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    
    // Remover após 4 segundos
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===== CSS ADICIONAL PARA ANIMAÇÕES =====

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes confeteFall {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
    
    .mensagem-sem-giros {
        text-align: center;
        padding: 3rem 2rem;
        background: rgba(255, 107, 107, 0.1);
        border-radius: 16px;
        border: 2px solid rgba(255, 107, 107, 0.3);
        margin: 2rem 0;
        animation: fadeInUp 0.5s ease-out;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .sem-giros-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
        font-size: 2rem;
        color: #ffffff;
        box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
        animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
        }
        50% {
            transform: scale(1.05);
            box-shadow: 0 12px 40px rgba(255, 107, 107, 0.5);
        }
    }
    
    .sem-giros-titulo {
        font-family: 'Orbitron', monospace;
        font-size: 1.8rem;
        font-weight: 700;
        color: #ff6b6b;
        margin-bottom: 1rem;
    }
    
    .sem-giros-descricao {
        color: #cccccc;
        font-size: 1rem;
        line-height: 1.6;
        margin-bottom: 2rem;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .btn-depositar {
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        color: #0a0e27;
        border: none;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
    }
    
    .btn-depositar:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 40px rgba(255, 215, 0, 0.4);
    }
`;
document.head.appendChild(style);

console.log('🎰 RoletaWin carregado com sucesso!');

