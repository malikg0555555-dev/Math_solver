from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sympy as sp
import sys

print("Python version:", sys.version)
print("Starting Math Solver Server...")

app = Flask(__name__, static_folder="frontend", static_url_path="")
CORS(app)  # Enable CORS

x = sp.Symbol('x')

# ===== FRONTEND ROUTES =====
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# ===== API =====
@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify({'status':'healthy','message':'Math Solver API is running!','sympy_version': str(sp.__version__)})

@app.route('/api/solve', methods=['POST', 'OPTIONS'])
def solve():
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.json
        problem_type = data.get('type','equation')
        if problem_type=='equation':
            equation = data.get('expression','')
            return jsonify(solve_equation(equation))
        return jsonify({'success': False, 'message': f'Type {problem_type} not implemented'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'})

# ===== SOLVER FUNCTION =====
def solve_equation(equation):
    try:
        if '=' in equation:
            left, right = equation.split('=')
            expr = sp.sympify(left) - sp.sympify(right)
        else:
            expr = sp.sympify(equation)
        solutions = sp.solve(expr, x)
        if solutions:
            return {'success': True, 'type':'equation', 'input': equation, 'solutions':[str(s) for s in solutions], 'message': f'Solution(s): {", ".join([str(s) for s in solutions])}'}
        return {'success': False, 'type':'equation','message':'No solution found'}
    except Exception as e:
        return {'success': False, 'type':'equation','message': f'Error: {str(e)}'}

# ===== LOCAL TEST =====
if __name__ == '__main__':
    app.run(debug=True)  # No host/port for Vercel

# ✅ For deployment (Vercel / Render / etc.)
handler = app
