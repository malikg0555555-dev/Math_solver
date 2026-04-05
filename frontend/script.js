class MathSolverApp {
    constructor() {
        this.currentType = 'equation';
        this.history = this.loadHistory();
        this.apiUrl = '/api'; // ✅ Use relative path for mobile & Vercel

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

        document.querySelectorAll('.example-tag').forEach(tag => {
            tag.addEventListener('click', () => this.fillExample(tag));
        });
    }

    bindEvents() {
        this.typeBtns.forEach(btn => btn.addEventListener('click', () => this.switchType(btn.dataset.type)));
        this.solveBtn.addEventListener('click', () => this.solve());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        Object.values(this.inputs).forEach(input => {
            if (input) input.addEventListener('keypress', e => {
                if (e.key === 'Enter') this.solve();
            });
        });
    }

    switchType(type) {
        this.currentType = type;
        this.typeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
        Object.values(this.inputGroups).forEach(group => group.classList.remove('active'));

        if (type === 'system') this.inputGroups.system.classList.add('active');
        else if (type === 'equation') this.inputGroups.equation.classList.add('active');
        else this.inputGroups.expression.classList.add('active');
    }

    fillExample(tag) {
        const currentInput = this.getCurrentInput();
        if (currentInput) currentInput.value = tag.textContent;
    }

    getCurrentInput() {
        if (this.currentType === 'equation') return this.inputs.equation;
        if (this.currentType === 'expression') return this.inputs.expression;
        return null;
    }

    getProblemData() {
        switch(this.currentType) {
            case 'equation': return { type: 'equation', expression: this.inputs.equation.value.trim() };
            case 'system': return { type: 'system', equations: [this.inputs.eq1.value.trim(), this.inputs.eq2.value.trim()] };
            default: return { type: this.currentType, expression: this.inputs.expression.value.trim() };
        }
    }

    async solve() {
        const problemData = this.getProblemData();
        if (!this.validateInput(problemData)) return this.showError('Please enter a valid mathematical expression');
        this.showLoading();

        try {
            const response = await fetch(`${this.apiUrl}/solve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(problemData)
            });
            const result = await response.json();
            this.displayResult(result);
            if (result.success) this.addToHistory(problemData, result);
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to connect to the server. Make sure the backend is running.');
        }
    }

    validateInput(problemData) {
        if (problemData.type === 'system') return problemData.equations[0] && problemData.equations[1];
        return problemData.expression && problemData.expression.length > 0;
    }

    showLoading() {
        this.solutionDiv.innerHTML = `<div class="loading"><i class="fas fa-spinner"></i><p>Solving...</p></div>`;
    }

    displayResult(result) {
        if (!result.success) return this.showError(result.message);
        let html = `<div class="solution-success"><i class="fas fa-check-circle"></i><strong>${this.currentType} Result:</strong><br><br>`;
        if (result.type === 'equation') {
            html += `<div class="solution-info"><strong>Solutions:</strong><br>${result.solutions.map((s,i) => `x${result.solutions.length>1?i+1:''} = ${s}`).join('<br>')}</div>`;
        }
        html += `<br><small>${result.message}</small></div>`;
        this.solutionDiv.innerHTML = html;
    }

    showError(message) {
        this.solutionDiv.innerHTML = `<div class="solution-error"><i class="fas fa-exclamation-triangle"></i><strong>Error:</strong><br>${message}</div>`;
    }

    addToHistory(problemData, result) {
        const historyItem = { id: Date.now(), type: problemData.type, question: this.getQuestionText(problemData), answer: result.message, timestamp: new Date().toLocaleString() };
        this.history.unshift(historyItem);
        if (this.history.length>20) this.history.pop();
        this.saveHistory();
        this.renderHistory();
    }

    getQuestionText(problemData) {
        if (problemData.type==='system') return `${problemData.equations[0]}, ${problemData.equations[1]}`;
        return problemData.expression || '';
    }

    renderHistory() {
        if (this.history.length === 0) { this.historyDiv.innerHTML = '<p class="empty-history">No history yet</p>'; return; }
        this.historyDiv.innerHTML = this.history.map(item => `<div class="history-item" data-id="${item.id}"><div class="history-question"><i class="fas fa-${item.type==='equation'?'equals':'chalkboard'}"></i>${item.question}</div><div class="history-answer">${item.answer}</div><small style="color:#999;">${item.timestamp}</small></div>`).join('');
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => this.loadFromHistory(item.dataset.id));
        });
    }

    loadFromHistory(id) {
        const item = this.history.find(h => h.id==id);
        if (!item) return;
        this.switchType(item.type);
        if (item.type==='system') {
            const eqs = item.question.split(', ');
            this.inputs.eq1.value = eqs[0]||''; this.inputs.eq2.value = eqs[1]||'';
        } else {
            const input = this.getCurrentInput();
            if (input) input.value = item.question;
        }
        this.solve();
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all history?')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    }

    saveHistory() { localStorage.setItem('mathSolverHistory', JSON.stringify(this.history)); }
    loadHistory() { const saved = localStorage.getItem('mathSolverHistory'); return saved ? JSON.parse(saved) : []; }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => new MathSolverApp());
