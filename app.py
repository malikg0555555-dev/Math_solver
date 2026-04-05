from flask import Flask, request, jsonify
from flask_cors import CORS
import sympy as sp
import sys

print("Python version:", sys.version)
print("Starting Math Solver Server...")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create symbols
x = sp.Symbol('x')
y = sp.Symbol('y')

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    """Simple health check endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify({
        'status': 'healthy',
        'message': 'Math Solver API is running!',
        'timestamp': str(sp.__version__)
    })

@app.route('/api/solve', methods=['POST', 'OPTIONS'])
def solve():
    """Solve mathematical problems"""
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
                'message': f'Type {problem_type} not implemented in this version'
            }
        
        return jsonify(result)
        
    except Exception as e:
        print("Error:", str(e))
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        })

def solve_equation(equation):
    """Solve algebraic equations"""
    try:
        print(f"Solving equation: {equation}")
        
        # Parse the equation
        if '=' in equation:
            left, right = equation.split('=')
            expr = sp.sympify(left) - sp.sympify(right)
        else:
            expr = sp.sympify(equation)
        
        # Solve for x
        solutions = sp.solve(expr, x)
        
        if solutions:
            solution_strs = [str(sol) for sol in solutions]
            return {
                'success': True,
                'type': 'equation',
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
        print(f"Error solving equation: {str(e)}")
        return {
            'success': False,
            'type': 'equation',
            'message': f'Error: {str(e)}'
        }

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'name': 'Math Solver API',
        'version': '1.0',
        'endpoints': {
            'health': '/api/health',
            'solve': '/api/solve (POST)'
        },
        'example': {
            'url': '/api/solve',
            'method': 'POST',
            'body': {
                'type': 'equation',
                'expression': '2*x + 5 = 15'
            }
        }
    })

if __name__ == '__main__':
    print("=" * 50)
    print("Math Solver API Server")
    print("=" * 50)
    print("Server will run on: http://127.0.0.1:5000")
    print("Test health: http://127.0.0.1:5000/api/health")
    print("Test equation: POST to /api/solve")
    print("=" * 50)
    
    try:
        app.run(
            host='127.0.0.1',
            port=5000,
            debug=True,
            use_reloader=False
        )
    except Exception as e:
        print(f"Failed to start server: {e}")
        input("Press Enter to exit...")