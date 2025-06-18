document.addEventListener('DOMContentLoaded', function() {
    class ParasiteGame {
        constructor() {
            // Elementos do DOM
            this.domElements = {
                screens: {
                    start: document.getElementById('start-screen'),
                    howToPlay: document.getElementById('how-to-play-screen'),
                    game: document.getElementById('game-screen'),
                    result: document.getElementById('result-screen')
                },
                buttons: {
                    play: document.getElementById('play-btn'),
                    howToPlay: document.getElementById('how-to-play-btn'),
                    backToStart: document.getElementById('back-to-start-btn'),
                    restart: document.getElementById('restart-btn'),
                    backToMenu: document.getElementById('back-to-menu-btn'),
                    decisions: document.querySelectorAll('.decision-btn')
                },
                gameInfo: {
                    generation: document.getElementById('generation'),
                    resistancePercentage: document.getElementById('resistance-percentage'),
                    populationSize: document.getElementById('population-size'),
                    RFrequency: document.getElementById('R-frequency'),
                    rFrequency: document.getElementById('r-frequency'),
                    resultTitle: document.getElementById('result-title'),
                    resultMessage: document.getElementById('result-message'),
                    totalGenerations: document.getElementById('total-generations'),
                    maxResistance: document.getElementById('max-resistance'),
                    commonStrategy: document.getElementById('common-strategy'),
                    graphBars: document.querySelector('.graph-bars')
                }
            };

            // Constantes do jogo
            this.constants = {
                MAX_GENERATIONS: 20,
                RESISTANCE_THRESHOLD: 0.9,
                VICTORY_THRESHOLD: 0.5,
                VICTORY_CONSECUTIVE: 5,
                INITIAL_POPULATION: 100,
                INITIAL_GENOTYPES: { RR: 0.4, Rr: 0.3, rr: 0.3 }
            };

            // Efeitos das decisões
            this.decisionEffects = {
                continuous: {
                    survival: { RR: 1.0, Rr: 1.0, rr: 0.1 },
                    selection: 0.2,
                    description: "Aplicação contínua do mesmo antiparasitário"
                },
                rotation: {
                    survival: { RR: 0.9, Rr: 0.8, rr: 0.3 },
                    selection: 0.1,
                    description: "Rotação entre diferentes classes de antiparasitários"
                },
                integrated: {
                    survival: { RR: 0.7, Rr: 0.6, rr: 0.9 },
                    selection: -0.1,
                    description: "Manejo integrado (sem drogas + controle ambiental)"
                },
                nothing: {
                    survival: { RR: 0.8, Rr: 0.7, rr: 0.8 },
                    selection: 0,
                    description: "Nenhuma intervenção"
                }
            };

            // Estado do jogo
            this.state = {
                currentGeneration: 1,
                population: this.constants.INITIAL_POPULATION,
                genotypeDistribution: {...this.constants.INITIAL_GENOTYPES},
                resistanceHistory: [],
                decisionsHistory: [],
                gameOver: false,
                victory: false
            };

            // Inicializar eventos
            this.initEvents();
        }

        initEvents() {
            // Eventos de navegação
            this.domElements.buttons.play.addEventListener('click', () => this.startGame());
            this.domElements.buttons.howToPlay.addEventListener('click', () => this.showHowToPlay());
            this.domElements.buttons.backToStart.addEventListener('click', () => this.backToStart());
            this.domElements.buttons.restart.addEventListener('click', () => this.restartGame());
            this.domElements.buttons.backToMenu.addEventListener('click', () => this.backToMenu());

            // Eventos de decisão
            this.domElements.buttons.decisions.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.makeDecision(btn.dataset.action);
                });
            });
        }

        // Métodos de navegação
        startGame() {
            this.resetGame();
            this.showScreen('game');
            this.updateGameDisplay();
        }

        showHowToPlay() {
            this.showScreen('howToPlay');
        }

        backToStart() {
            this.showScreen('start');
        }

        backToMenu() {
            this.showScreen('start');
        }

        restartGame() {
            this.showScreen('game');
            this.startGame();
        }

        showScreen(screen) {
            // Esconder todas as telas
            Object.values(this.domElements.screens).forEach(screen => {
                screen.classList.add('hidden');
            });
            
            // Mostrar a tela solicitada
            this.domElements.screens[screen].classList.remove('hidden');
        }

        resetGame() {
            this.state = {
                currentGeneration: 1,
                population: this.constants.INITIAL_POPULATION,
                genotypeDistribution: {...this.constants.INITIAL_GENOTYPES},
                resistanceHistory: [],
                decisionsHistory: [],
                gameOver: false,
                victory: false
            };

            // Limpar gráfico
            this.domElements.gameInfo.graphBars.innerHTML = '';
        }

        // Lógica principal do jogo
        makeDecision(decision) {
            if (this.state.gameOver) return;

            // Registrar decisão
            this.state.decisionsHistory.push(decision);
            const effects = this.decisionEffects[decision];

            // 1. Calcular sobreviventes
            const survivors = this.calculateSurvivors(effects.survival);
            const totalSurvivors = survivors.RR + survivors.Rr + survivors.rr;

            // 2. Atualizar distribuição genotípica
            this.updateGenotypeDistribution(survivors, totalSurvivors);

            // 3. Atualizar frequências alélicas com seleção
            this.updateAlleleFrequencies(effects.selection);

            // 4. Reprodução (próxima geração)
            this.calculateNextGeneration();

            // 5. Atualizar população com variação aleatória
            this.state.population = Math.round(totalSurvivors * (1 + (Math.random() * 0.2 - 0.1)));

            // Registrar resistência para histórico
            const currentResistance = this.state.genotypeDistribution.RR + this.state.genotypeDistribution.Rr;
            this.state.resistanceHistory.push(currentResistance);

            // Verificar condições de vitória/derrota
            this.checkGameConditions();

            // Avançar geração e atualizar display
            this.state.currentGeneration++;
            this.updateGameDisplay();

            // Verificar se o jogo acabou
            if (this.state.gameOver) {
                this.showResults();
            }
        }

        calculateSurvivors(survivalRates) {
            return {
                RR: this.state.genotypeDistribution.RR * this.state.population * survivalRates.RR,
                Rr: this.state.genotypeDistribution.Rr * this.state.population * survivalRates.Rr,
                rr: this.state.genotypeDistribution.rr * this.state.population * survivalRates.rr
            };
        }

        updateGenotypeDistribution(survivors, totalSurvivors) {
            this.state.genotypeDistribution = {
                RR: survivors.RR / totalSurvivors,
                Rr: survivors.Rr / totalSurvivors,
                rr: survivors.rr / totalSurvivors
            };
        }

        updateAlleleFrequencies(selectionPressure) {
            // Calcular frequências alélicas após seleção
            let newRFreq = this.state.genotypeDistribution.RR + (this.state.genotypeDistribution.Rr / 2);
            let newrFreq = this.state.genotypeDistribution.rr + (this.state.genotypeDistribution.Rr / 2);

            // Aplicar pressão seletiva
            newRFreq += selectionPressure;
            newrFreq -= selectionPressure;

            // Normalizar frequências
            const total = newRFreq + newrFreq;
            this.state.alleleFrequencies = {
                R: newRFreq / total,
                r: newrFreq / total
            };
        }

        calculateNextGeneration() {
            // Lei de Hardy-Weinberg
            const R = this.state.alleleFrequencies.R;
            const r = this.state.alleleFrequencies.r;
            
            this.state.genotypeDistribution = {
                RR: R * R,
                Rr: 2 * R * r,
                rr: r * r
            };
        }

        checkGameConditions() {
            const currentResistance = this.state.genotypeDistribution.RR + this.state.genotypeDistribution.Rr;
            
            // Verificar derrota
            if (currentResistance >= this.constants.RESISTANCE_THRESHOLD) {
                this.state.gameOver = true;
                this.state.victory = false;
                return;
            }
            
            // Verificar vitória
            if (this.state.resistanceHistory.length >= this.constants.VICTORY_CONSECUTIVE) {
                const lastGenerations = this.state.resistanceHistory.slice(-this.constants.VICTORY_CONSECUTIVE);
                const allBelowThreshold = lastGenerations.every(r => r < this.constants.VICTORY_THRESHOLD);
                
                if (allBelowThreshold) {
                    this.state.gameOver = true;
                    this.state.victory = true;
                    return;
                }
            }
            
            // Verificar máximo de gerações
            if (this.state.currentGeneration >= this.constants.MAX_GENERATIONS) {
                this.state.gameOver = true;
                this.state.victory = currentResistance < this.constants.RESISTANCE_THRESHOLD;
            }
        }

        // Atualização da interface
        updateGameDisplay() {
            // Atualizar informações básicas
            this.domElements.gameInfo.generation.textContent = this.state.currentGeneration;
            
            const resistance = this.state.genotypeDistribution.RR + this.state.genotypeDistribution.Rr;
            this.domElements.gameInfo.resistancePercentage.textContent = Math.round(resistance * 100);
            
            this.domElements.gameInfo.populationSize.textContent = this.state.population;
            
            // Atualizar distribuição genotípica
            this.updateGenotypeBars();
            
            // Atualizar frequências alélicas
            this.updateAlleleFrequencyDisplay();
            
            // Atualizar gráfico
            this.updateGraph();
        }

        updateGenotypeBars() {
            const genotypes = this.state.genotypeDistribution;
            const bars = document.querySelectorAll('.bar');
            const percentages = document.querySelectorAll('.percentage');
            
            // RR bars
            bars[0].style.width = `${genotypes.RR * 100}%`;
            percentages[0].textContent = `${Math.round(genotypes.RR * 100)}%`;
            
            // Rr bars
            bars[1].style.width = `${genotypes.Rr * 100}%`;
            percentages[1].textContent = `${Math.round(genotypes.Rr * 100)}%`;
            
            // rr bars
            bars[2].style.width = `${genotypes.rr * 100}%`;
            percentages[2].textContent = `${Math.round(genotypes.rr * 100)}%`;
        }

        updateAlleleFrequencyDisplay() {
            const frequencies = this.calculateAlleleFrequencies();
            this.domElements.gameInfo.RFrequency.textContent = Math.round(frequencies.R * 100);
            this.domElements.gameInfo.rFrequency.textContent = Math.round(frequencies.r * 100);
        }

        calculateAlleleFrequencies() {
            return {
                R: this.state.genotypeDistribution.RR + (this.state.genotypeDistribution.Rr / 2),
                r: this.state.genotypeDistribution.rr + (this.state.genotypeDistribution.Rr / 2)
            };
        }

        updateGraph() {
            const currentResistance = this.state.genotypeDistribution.RR + this.state.genotypeDistribution.Rr;
            
            // Limitar o número de barras no gráfico
            if (this.state.resistanceHistory.length > 10) {
                this.domElements.gameInfo.graphBars.innerHTML = '';
                const startIndex = Math.max(0, this.state.resistanceHistory.length - 10);
                
                for (let i = startIndex; i < this.state.resistanceHistory.length; i++) {
                    this.addBarToGraph(i + 1, this.state.resistanceHistory[i]);
                }
            } else {
                this.addBarToGraph(this.state.currentGeneration, currentResistance);
            }
        }

        addBarToGraph(generation, resistance) {
            const barHeight = resistance * 100;
            const barColor = this.getResistanceColor(resistance);
            
            const barContainer = document.createElement('div');
            barContainer.classList.add('graph-bar-container');
            
            const bar = document.createElement('div');
            bar.classList.add('graph-bar');
            bar.style.height = `${barHeight}%`;
            bar.style.backgroundColor = barColor;
            
            const label = document.createElement('div');
            label.classList.add('graph-bar-label');
            label.textContent = generation;
            
            barContainer.appendChild(bar);
            barContainer.appendChild(label);
            this.domElements.gameInfo.graphBars.appendChild(barContainer);
        }

        getResistanceColor(resistance) {
            if (resistance >= this.constants.RESISTANCE_THRESHOLD) {
                return 'var(--error-color)';
            } else if (resistance >= this.constants.VICTORY_THRESHOLD) {
                return 'var(--warning-color)';
            } else {
                return 'var(--correct-color)';
            }
        }

        showResults() {
            this.showScreen('result');
            
            const finalResistance = this.state.genotypeDistribution.RR + this.state.genotypeDistribution.Rr;
            const resistancePercent = Math.round(finalResistance * 100);
            
            if (this.state.victory) {
                this.domElements.gameInfo.resultTitle.textContent = "Parabéns! Você Venceu!";
                this.domElements.gameInfo.resultMessage.innerHTML = `
                    <p>🎉 Você conseguiu controlar a resistência parasitária com sucesso!</p>
                    <p>Sua estratégia manteve a resistência abaixo de 50% por ${this.constants.VICTORY_CONSECUTIVE} gerações consecutivas.</p>
                    <p>Isso demonstra a importância do manejo racional de antiparasitários e da genética de populações.</p>
                `;
            } else {
                this.domElements.gameInfo.resultTitle.textContent = "Resistência Descontrolada";
                this.domElements.gameInfo.resultMessage.innerHTML = `
                    <p>😔 A resistência parasitária atingiu ${resistancePercent}%, tornando os tratamentos ineficazes.</p>
                    <p>Isso mostra como o uso inadequado de antiparasitários pode levar à seleção de parasitas resistentes.</p>
                    <p>Tente novamente com diferentes estratégias de manejo!</p>
                `;
            }
            
            // Estatísticas finais
            this.domElements.gameInfo.totalGenerations.textContent = this.state.currentGeneration - 1;
            
            const maxResistance = Math.max(...this.state.resistanceHistory);
            this.domElements.gameInfo.maxResistance.textContent = Math.round(maxResistance * 100);
            
            // Estratégia mais comum
            this.displayMostCommonStrategy();
        }

        displayMostCommonStrategy() {
            if (this.state.decisionsHistory.length === 0) return;
            
            const strategyCounts = {};
            this.state.decisionsHistory.forEach(strategy => {
                strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
            });
            
            const mostCommon = Object.keys(strategyCounts).reduce((a, b) => 
                strategyCounts[a] > strategyCounts[b] ? a : b
            );
            
            this.domElements.gameInfo.commonStrategy.textContent = this.decisionEffects[mostCommon].description;
        }
    }

    // Inicializar o jogo
    const game = new ParasiteGame();
});