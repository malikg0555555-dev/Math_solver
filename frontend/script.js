class MathSolverApp {
    constructor() {
        this.currentType = 'equation';
        this.history = this.loadHistory();
        this.apiUrl = 'http://localhost:5000/api';
        
        this.initElements();
        this.bindEvents();
        this.renderHistory();
    }
    
    initElements() {
        this.typeBtns = document.querySelectorAll('.type-btn');
        this.solveBtn = document.getElementById('solve-btn');
        this.clearHistoryBtn = document.getElementById('clear-history');
        this.solutionDiv = document.getElementById('solution');
        this.historyDiv = document.getElementById('history');
        
        this.inputGroups = {
            equation: document.getElementById('equation-input'),
            system: document.getElementById('system-input'),
            expression: document.getElementById('expression-input')
        };
        
        this.inputs = {
            equation: document.getElementById('equation'),
            eq1: document.getElementById('eq1'),
            eq2: document.getElementById('eq2'),
            expression: document.getElementById('expression')
        };
        
        // Add example click handlers
        document.querySelectorAll('.example-tag').forEach(tag => {
            tag.addEventListener('click', () => this.fillExample(tag));
        });
    }
    
    bindEvents() {
        this.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchType(btn.dataset.type));
        });
        
        this.solveBtn.addEventListener('click', () => this.solve());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Enter key support
        Object.values(this.inputs).forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.solve();
                });
            }
        });
    }
    
    switchType(type) {
        this.currentType = type;
        
        // Update button states
        this.typeBtns.forEach(btn => {
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Show appropriate input group
        Object.values(this.inputGroups).forEach(group => {
            group.classList.remove('active');
        });
        
        if (type === 'system') {
            this.inputGroups.system.classList.add('active');
        } else if (type === 'equation') {
            this.inputGroups.equation.classList.add('active');
        } else {
            this.inputGroups.expression.classList.add('active');
        }
    }
    
    fillExample(tag) {
        const exampleText = tag.textContent;
        const currentInput = this.getCurrentInput();
        if (currentInput) {
            currentInput.value = exampleText;
        }
    }
    
    getCurrentInput() {
        switch(this.currentType) {
            case 'equation':
                return this.inputs.equation;
            case 'system':
                return null; // Multiple inputs
            default:
                return this.inputs.expression;
        }
    }
    
    getProblemData() {
        switch(this.currentType) {
            case 'equation':
                return {
                    type: 'equation',
                    expression: this.inputs.equation.value.trim()
                };
            case 'system':
                return {
                    type: 'system',
                    equations: [
                        this.inputs.eq1.value.trim(),
                        this.inputs.eq2.value.trim()
                    ]
                };
            case 'factor':
                return {
                    type: 'factor',
                    expression: this.inputs.expression.value.trim()
                };
            case 'simplify':
                return {
                    type: 'simplify',
                    expression: this.inputs.expression.value.trim()
                };
            case 'expand':
                return {
                    type: 'expand',
                    expression: this.inputs.expression.value.trim()
                };
            case 'derivative':
                return {
                    type: 'derivative',
                    expression: this.inputs.expression.value.trim()
                };
            case 'integral':
                return {
                    type: 'integral',
                    expression: this.inputs.expression.value.trim()
                };
            default:
                return null;
        }
    }
    
    async solve() {
        const problemData = this.getProblemData();
        
        if (!problemData || !this.validateInput(problemData)) {
            this.showError('Please enter a valid mathematical expression');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch(`${this.apiUrl}/solve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(problemData)
            });
            
            const result = await response.json();
            this.displayResult(result);
            
            if (result.success) {
                this.addToHistory(problemData, result);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to connect to server. Make sure the backend is running on port 5000');
        }
    }
    
    validateInput(problemData) {
        if (problemData.type === 'system') {
            return problemData.equations[0] && problemData.equations[1];
        } else if (problemData.expression) {
            return problemData.expression.length > 0;
        }
        return false;
    }
    
    showLoading() {
        this.solutionDiv.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner"></i>
                <p>Solving...</p>
            </div>
        `;
    }
    
    displayResult(result) {
        if (result.success) {
            let html = `<div class="solution-success">`;
            html += `<i class="fas fa-check-circle"></i> `;
            html += `<strong>${this.getOperationName(result.type)} Result:</strong><br><br>`;
            
            if (result.type === 'system') {
                html += `<div class="solution-info">`;
                html += `<strong>Solution:</strong><br>`;
                for (const [variable, value] of Object.entries(result.solutions)) {
                    html += `${variable} = ${value}<br>`;
                }
                html += `</div>`;
            } else if (result.type === 'equation') {
                html += `<div class="solution-info">`;
                html += `<strong>Solutions:</strong><br>`;
                result.solutions.forEach((sol, index) => {
                    html += `x${result.solutions.length > 1 ? index + 1 : ''} = ${sol}<br>`;
                });
                html += `</div>`;
            } else {
                html += `<div class="solution-info">`;
                if (result.original) {
                    html += `<strong>Original:</strong> ${result.original}<br><br>`;
                }
                html += `<strong>Result:</strong> ${result[result.type] || result.message}<br>`;
                html += `</div>`;
            }
            
            html += `<br><small>${result.message}</small>`;
            html += `</div>`;
            this.solutionDiv.innerHTML = html;
        } else {
            this.showError(result.message);
        }
    }
    
    getOperationName(type) {
        const names = {
            equation: 'Equation',
            system: 'System of Equations',
            factor: 'Factorization',
            simplify: 'Simplification',
            expand: 'Expansion',
            derivative: 'Derivative',
            integral: 'Integral'
        };
        return names[type] || 'Math';
    }
    
    showError(message) {
        this.solutionDiv.innerHTML = `
            <div class="solution-error">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Error:</strong><br>
                ${message}
            </div>
        `;
    }
    
    addToHistory(problemData, result) {
        const historyItem = {
            id: Date.now(),
            type: problemData.type,
            question: this.getQuestionText(problemData),
            answer: result.message,
            timestamp: new Date().toLocaleString()
        };
        
        this.history.unshift(historyItem);
        if (this.history.length > 20) this.history.pop();
        
        this.saveHistory();
        this.renderHistory();
    }
    
    getQuestionText(problemData) {
        if (problemData.type === 'system') {
            return `${problemData.equations[0]}, ${problemData.equations[1]}`;
        } else if (problemData.expression) {
            return problemData.expression;
        }
        return '';
    }
    
    renderHistory() {
        if (this.history.length === 0) {
            this.historyDiv.innerHTML = '<p class="empty-history">No history yet</p>';
            return;
        }
        
        let html = '';
        this.history.forEach(item => {
            html += `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-question">
                        <i class="fas fa-${this.getTypeIcon(item.type)}"></i>
                        ${this.truncateText(item.question, 50)}
                    </div>
                    <div class="history-answer">${this.truncateText(item.answer, 80)}</div>
                    <small style="color: #999;">${item.timestamp}</small>
                </div>
            `;
        });
        
        this.historyDiv.innerHTML = html;
        
        // Add click handlers to history items
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => this.loadFromHistory(item.dataset.id));
        });
    }
    
    getTypeIcon(type) {
        const icons = {
            equation: 'equals',
            system: 'chalkboard',
            factor: 'cubes',
            simplify: 'compress',
            expand: 'expand',
            derivative: 'chart-line',
            integral: 'chart-area'
        };
        return icons[type] || 'calculator';
    }
    
    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    loadFromHistory(id) {
        const item = this.history.find(h => h.id == id);
        if (item) {
            this.switchType(item.type);
            
            if (item.type === 'system') {
                const equations = item.question.split(', ');
                if (this.inputs.eq1) this.inputs.eq1.value = equations[0] || '';
                if (this.inputs.eq2) this.inputs.eq2.value = equations[1] || '';
            } else {
                const input = this.getCurrentInput();
                if (input) input.value = item.question;
            }
            
            this.solve();
        }
    }
    
    clearHistory() {
        if (confirm('Are you sure you want to clear all history?')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    }
    
    saveHistory() {
        localStorage.setItem('mathSolverHistory', JSON.stringify(this.history));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('mathSolverHistory');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MathSolverApp();
});
