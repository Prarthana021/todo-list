from flask import Flask, request, jsonify, session, g
from flask_cors import CORS
import sqlite3, hashlib, os
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.urandom(24)

@app.before_request
def handle_options_requests():
    if request.method == 'OPTIONS':
        return '', 200

# Configure CORS
CORS(
    app,
    supports_credentials=True,
    resources={
        r"/api/*": {
            "origins": "http://localhost:3000",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"],
            "expose_headers": ["Set-Cookie"]
        }
    }
)

# Session configuration
app.config.update(
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_PATH='/'
)

DATABASE = "todolist.db"

def get_db():
    if not hasattr(g, "db"):
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db

@app.teardown_appcontext
def close_db(error=None):
    if hasattr(g, "db"):
        g.db.close()

def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def get_user_by_username(username):
    cur = get_db().execute("SELECT * FROM users WHERE username=?", (username,))
    return cur.fetchone()

def add_user(username, password):
    db = get_db()
    db.execute(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        (username, hash_password(password))
    )
    db.commit()

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    u, pw = data.get("username"), data.get("password")
    if not u or not pw:
        return jsonify(error="Username & password required"), 400
    if get_user_by_username(u):
        return jsonify(error="Username already exists"), 400
    add_user(u, pw)
    return jsonify(message="User registered successfully"), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    u, pw = data.get("username"), data.get("password")
    user = get_user_by_username(u)
    if user and user["password"] == hash_password(pw):
        session["user_id"] = user["id"]
        return jsonify(message="Login successful", user_id=user["id"]), 200
    return jsonify(error="Invalid credentials"), 401

@app.route("/api/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify(message="Logged out"), 200

@app.route("/api/items", methods=["GET"])
def get_items():
    if "user_id" not in session:
        return jsonify(error="Unauthorized"), 401
    uid = session["user_id"]
    rows = get_db().execute(
        "SELECT id, what_to_do, due_date, status, label FROM entries WHERE user_id=?",
        (uid,)
    ).fetchall()
    
    items = []
    for r in rows:
        task = {
            "id": r["id"],
            "what_to_do": r["what_to_do"],
            "due_date": r["due_date"],
            "status": r["status"],
            "label": r["label"] if r["label"] else "personal"
        }
        items.append(task)
    
    return jsonify(items)

@app.route("/api/upcoming-tasks", methods=["GET"])
def get_upcoming_tasks():
    if "user_id" not in session:
        return jsonify(error="Unauthorized"), 401
    
    uid = session["user_id"]
    now = datetime.now()
    
    # Get tasks due in the next 2 hours (for initial check)
    upcoming = get_db().execute(
        """SELECT id, what_to_do, due_date 
           FROM entries 
           WHERE user_id=? 
           AND status='pending' 
           AND due_date BETWEEN ? AND datetime(?, '+2 hours')""",
        (uid, now.strftime("%Y-%m-%d %H:%M:%S"), now.strftime("%Y-%m-%d %H:%M:%S"))
    ).fetchall()
    
    tasks = []
    for task in upcoming:
        due_time = datetime.strptime(task["due_date"], "%Y-%m-%d %H:%M:%S")
        time_left = due_time - now
        minutes_left = int(time_left.total_seconds() / 60)
        
        tasks.append({
            "id": task["id"],
            "task": task["what_to_do"],
            "due_date": task["due_date"],
            "minutes_left": minutes_left
        })
    
    return jsonify(tasks)

@app.route("/api/add", methods=["POST"])
def add_item():
    if "user_id" not in session:
        return jsonify(error="Unauthorized"), 401

    data = request.get_json()
    todo = data.get("todo")
    due = data.get("due_date")
    label = data.get("label", "personal")
    uid = session["user_id"]

    if not todo:
        return jsonify(error="Task description is required"), 400

    if not due:
        due = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    db = get_db()
    try:
        db.execute(
            "INSERT INTO entries (what_to_do, due_date, status, label, user_id) VALUES (?, ?, ?, ?, ?)",
            (todo, due, "pending", label, uid)
        )
        db.commit()
        return jsonify(message="Task added"), 201
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/api/update", methods=["PUT"])
def update_task():
    if "user_id" not in session:
        return jsonify(error="Unauthorized"), 401

    data = request.get_json()
    task_id = data.get("id")
    new_text = data.get("what_to_do")
    new_due_date = data.get("due_date")
    new_label = data.get("label")
    new_status = data.get("status")
    uid = session["user_id"]

    if not task_id:
        return jsonify(error="Task ID is required"), 400

    db = get_db()
    try:
        existing = db.execute(
            "SELECT * FROM entries WHERE id=? AND user_id=?",
            (task_id, uid)
        ).fetchone()
        
        if not existing:
            return jsonify(error="Task not found"), 404

        update_data = {
            "what_to_do": new_text if new_text is not None else existing["what_to_do"],
            "due_date": new_due_date if new_due_date is not None else existing["due_date"],
            "label": new_label if new_label is not None else existing["label"],
            "status": new_status if new_status is not None else existing["status"]
        }

        db.execute(
            """UPDATE entries 
               SET what_to_do=?, due_date=?, label=?, status=?
               WHERE id=? AND user_id=?""",
            (update_data["what_to_do"], 
             update_data["due_date"], 
             update_data["label"],
             update_data["status"],
             task_id, 
             uid)
        )
        db.commit()
        
        return jsonify(message="Task updated successfully"), 200
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/api/delete", methods=["DELETE"])
def delete_item():
    if "user_id" not in session:
        return jsonify(error="Unauthorized"), 401
        
    data = request.get_json()
    if not data or "id" not in data:
        return jsonify(error="Task ID is required"), 400
        
    item_id = data.get("id")
    uid = session["user_id"]
    
    db = get_db()
    try:
        result = db.execute(
            "DELETE FROM entries WHERE id=? AND user_id=?",
            (item_id, uid)
        )
        db.commit()
        
        if result.rowcount == 0:
            return jsonify(error="Task not found or not owned by user"), 404
            
        return jsonify(message="Task deleted"), 200
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/api/mark", methods=["PUT"])
def mark_done():
    if "user_id" not in session:
        return jsonify(error="Unauthorized"), 401
        
    data = request.get_json()
    if not data or "id" not in data:
        return jsonify(error="Task ID is required"), 400
        
    item_id = data.get("id")
    uid = session["user_id"]
    
    db = get_db()
    try:
        result = db.execute(
            "UPDATE entries SET status='done' WHERE id=? AND user_id=?",
            (item_id, uid)
        )
        db.commit()
        
        if result.rowcount == 0:
            return jsonify(error="Task not found or not owned by user"), 404
            
        return jsonify(message="Task marked as done"), 200
    except Exception as e:
        return jsonify(error=str(e)), 500

if __name__ == "__main__":
    with app.app_context():
        db = get_db()
        db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                what_to_do TEXT NOT NULL,
                due_date TEXT NOT NULL,
                status TEXT NOT NULL,
                label TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        db.commit()
    
    app.run(host="0.0.0.0", port=5001)