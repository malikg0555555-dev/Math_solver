from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sympy as sp
import sys

print("Python version:", sys.version)
print("Starting Math Solver Server...")

# Serve frontend folder
app = Flask(__name__, static_folder="frontend", static_url_path="")
CORS(app)  # Enable CORS

# Create symbols
x = sp.Symbol('x')
y = sp.Symbol('y')

# ==============================
# FRONTEND ROUTES
# ==============================
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# ==============================
# API ROUTES
# ==============================
@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify({
        'status': 'healthy',
        'message': 'Math Solver API is running!',
        'sympy_version': str(sp.__version__)
    })

@app.route('/api/solve', methods=['POST', 'OPTIONS'])
def solve():
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.json
        print("Received request:", data)

        problem_type = data.get('type', 'equation')

        if problem_type == 'equation':
            equation = data.get('expression', '')
            result = solve_equation(equation)
        else:
            result = {
                'success': False,
                'message': f'Type {problem_type} not implemented'
            }

        return jsonify(result)

    except Exception as e:
        print("Error:", str(e))
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        })

# ==============================
# SOLVER FUNCTION
# ==============================
def solve_equation(equation):
    try:
        print(f"Solving: {equation}")
        if '=' in equation:
            left, right = equation.split('=')
            expr = sp.sympify(left) - sp.sympify(right)
        else:
            expr = sp.sympify(equation)

        solutions = sp.solve(expr, x)

        if solutions:
            solution_strs = [str(sol) for sol in solutions]
            return {
                'success': True,
                'type': 'equation',
                'input': equation,
                'solutions': solution_strs,
                'message': f'Solution(s): {", ".join(solution_strs)}'
            }
        else:
            return {
                'success': False,
                'type': 'equation',
                'message': 'No solution found'
            }

    except Exception as e:
        print("Solve Error:", str(e))
        return {
            'success': False,
            'type': 'equation',
            'message': f'Error: {str(e)}'
        }

# ==============================
# MAIN (Local Testing Only)
# ==============================
if __name__ == '__main__':
    print("="*50)
    print("Math Solver API Server (Local)")
    print("="*50)
    app.run(debug=True)  # Do NOT set host or port for Vercel

# ✅ For deployment (Vercel / Render / etc.)
handler = app
