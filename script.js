class RoletaProfissional {
    constructor() {
        this.roleta = document.querySelector('.roleta');
        this.btnGirar = document.querySelector('.btn-girar');
        this.statusTexto = document.querySelector('.status-texto');
        this.velocidadeLabel = document.querySelector('.velocidade-label');
        this.velocidadeFill = document.querySelector('.velocidade-fill');
        
        this.girando = false;
        this.anguloAtual = 0;
        this.velocidadeAtual = 0;
        this.tempoInicio = 0;
        this.animationId = null;
        
        // Configuração dos setores (8 setores de 45 graus cada)
        this.setores = [
            { inicio: 0, fim: 45, premio: 25, cor: '#ffd700', nome: 'Amarelo' },      // R$ 25
            { inicio: 45, fim: 90, premio: 0, cor: '#2a2a2a', nome: 'Vazio' },       // Vazio
            { inicio: 90, fim: 135, premio: 15, cor: '#ff6b6b', nome: 'Vermelho' },  // R$ 15
            { inicio: 135, fim: 180, premio: 0, cor: '#2a2a2a', nome: 'Vazio' },     // Vazio
            { inicio: 180, fim: 225, premio: 50, cor: '#4ecdc4', nome: 'Azul' },     // R$ 50
            { inicio: 225, fim: 270, premio: 0, cor: '#2a2a2a', nome: 'Vazio' },     // Vazio
            { inicio: 270, fim: 315, premio: 100, cor: '#b19cd9', nome: 'Roxo' },    // R$ 100
            { inicio: 315, fim: 360, premio: 0, cor: '#2a2a2a', nome: 'Vazio' }      // Vazio
        ];
        
        this.inicializar();
    }
    
    inicializar() {
        this.btnGirar.addEventListener('click', () => this.iniciarGiro());
        this.atualizarStatus('Pronto para girar a roleta aprimorada!');
        this.atualizarVelocidade(0, 0);
    }
    
    iniciarGiro() {
        if (this.girando) {
            this.pararGiro();
            return;
        }
        
        this.girando = true;
        this.btnGirar.textContent = '⏹ PARAR';
        this.btnGirar.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)';
        
        // Velocidade inicial aleatória entre 15-25 RPM
        this.velocidadeAtual = 15 + Math.random() * 10;
        this.tempoInicio = Date.now();
        
        this.roleta.classList.add('girando');
        this.animarGiro();
    }
    
    animarGiro() {
        if (!this.girando) return;
        
        const tempoDecorrido = (Date.now() - this.tempoInicio) / 1000;
        
        // Atualizar ângulo baseado na velocidade
        this.anguloAtual += this.velocidadeAtual * 6; // 6 graus por RPM por frame
        if (this.anguloAtual >= 360) {
            this.anguloAtual -= 360;
        }
        
        // Aplicar rotação
        this.roleta.style.transform = `rotate(${this.anguloAtual}deg)`;
        
        // Atualizar status
        this.atualizarStatus(`Girando com 4 setores coloridos... ${this.velocidadeAtual.toFixed(1)} rpm (${this.formatarTempo(tempoDecorrido)})`);
        this.atualizarVelocidade(this.velocidadeAtual, 25);
        
        this.animationId = requestAnimationFrame(() => this.animarGiro());
    }
    
    pararGiro() {
        this.girando = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.roleta.classList.remove('girando');
        
        // Desaceleração suave
        this.desacelerar();
    }
    
    desacelerar() {
        const desaceleracao = () => {
            this.velocidadeAtual *= 0.95; // Reduz 5% da velocidade a cada frame
            
            if (this.velocidadeAtual > 0.5) {
                this.anguloAtual += this.velocidadeAtual * 6;
                if (this.anguloAtual >= 360) {
                    this.anguloAtual -= 360;
                }
                
                this.roleta.style.transform = `rotate(${this.anguloAtual}deg)`;
                this.atualizarVelocidade(this.velocidadeAtual, 25);
                
                requestAnimationFrame(desaceleracao);
            } else {
                this.finalizarGiro();
            }
        };
        
        desaceleracao();
    }
    
    finalizarGiro() {
        // Calcular setor final baseado no ângulo
        // O indicador está no topo, então precisamos ajustar o cálculo
        const anguloIndicador = (360 - this.anguloAtual) % 360;
        const setorVencedor = this.determinarSetor(anguloIndicador);
        
        this.mostrarResultado(setorVencedor);
        this.resetarBotao();
    }
    
    determinarSetor(angulo) {
        for (let setor of this.setores) {
            if (angulo >= setor.inicio && angulo < setor.fim) {
                return setor;
            }
        }
        // Fallback para o primeiro setor
        return this.setores[0];
    }
    
    mostrarResultado(setor) {
        if (setor.premio > 0) {
            this.atualizarStatus(`🎉 PARABÉNS! Você ganhou R$ ${setor.premio.toFixed(2)} no setor ${setor.nome}!`);
            this.celebrarVitoria();
        } else {
            this.atualizarStatus(`😔 Que pena! A roleta parou no setor vazio. Tente novamente!`);
        }
        
        this.atualizarVelocidade(0, 0);
        
        // Destacar o setor vencedor temporariamente
        this.destacarSetor(setor);
    }
    
    destacarSetor(setor) {
        // Criar um efeito visual para destacar o setor vencedor
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 320px;
            height: 320px;
            border-radius: 50%;
            border: 4px solid ${setor.premio > 0 ? '#00ff88' : '#ff6b6b'};
            box-shadow: 0 0 30px ${setor.premio > 0 ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 107, 107, 0.6)'};
            pointer-events: none;
            z-index: 15;
            animation: pulseWin 2s ease-in-out;
        `;
        
        this.roleta.parentElement.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
        }, 2000);
    }
    
    celebrarVitoria() {
        // Adicionar animação de celebração
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulseWin {
                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.8; }
            }
            
            @keyframes celebrate {
                0%, 100% { transform: scale(1); }
                25% { transform: scale(1.05); }
                75% { transform: scale(0.95); }
            }
        `;
        document.head.appendChild(style);
        
        this.roleta.style.animation = 'celebrate 0.6s ease-in-out 3';
        
        setTimeout(() => {
            this.roleta.style.animation = '';
            style.remove();
        }, 2000);
    }
    
    resetarBotao() {
        this.btnGirar.textContent = '▶ GIRAR';
        this.btnGirar.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)';
        
        setTimeout(() => {
            this.atualizarStatus('Pronto para girar a roleta aprimorada!');
        }, 3000);
    }
    
    atualizarStatus(texto) {
        this.statusTexto.textContent = texto;
    }
    
    atualizarVelocidade(velocidade, maxVelocidade) {
        this.velocidadeLabel.textContent = `Velocidade: ${velocidade.toFixed(1)} RPM`;
        const porcentagem = maxVelocidade > 0 ? (velocidade / maxVelocidade) * 100 : 0;
        this.velocidadeFill.style.width = `${Math.min(porcentagem, 100)}%`;
    }
    
    formatarTempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = Math.floor(segundos % 60);
        return `${minutos}:${segs.toString().padStart(2, '0')}`;
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new RoletaProfissional();
    
    // Adicionar efeitos visuais extras
    adicionarEfeitosVisuais();
});

function adicionarEfeitosVisuais() {
    // Efeito de brilho nos valores dos prêmios
    const premioItems = document.querySelectorAll('.premio-item');
    premioItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'scale(1.02)';
            item.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.2)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'scale(1)';
            item.style.boxShadow = 'none';
        });
    });
    
    // Efeito de partículas douradas
    criarParticulasDouradas();
}

function criarParticulasDouradas() {
    const container = document.querySelector('.container');
    
    for (let i = 0; i < 20; i++) {
        const particula = document.createElement('div');
        particula.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ffd700;
            border-radius: 50%;
            opacity: 0.6;
            animation: floatParticle ${5 + Math.random() * 10}s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            z-index: -1;
        `;
        
        container.appendChild(particula);
    }
    
    // Adicionar animação das partículas
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatParticle {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.6;
            }
            90% {
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

