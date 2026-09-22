from flask import Flask, render_template, request, redirect, url_for, session
from database import get_db
from datetime import date, timedelta, datetime
from bson.objectid import ObjectId
import jwt
import requests as http_requests

NOTIFY_API = 'http://localhost:4000/api/notify'

def notify(endpoint, payload):
    """Fire-and-forget to SAVIX notification API."""
    try:
        http_requests.post(f'{NOTIFY_API}/{endpoint}', json=payload, timeout=5)
    except Exception as e:
        print(f"Notify error ({endpoint}):", e)

app = Flask(__name__)
app.secret_key = 'schemesathi_secret_key_2026'

@app.before_request
def require_auth():
    allowed_endpoints = ['sso_login', 'static']
    if request.endpoint not in allowed_endpoints and not session.get('user_id'):
        return redirect("http://127.0.0.1:8080/index.html")

@app.route('/sso')
def sso_login():
    token = request.args.get('token')
    if token:
        try:
            payload = jwt.decode(token, "schemesathi_secret_key_2026", algorithms=["HS256"])
            session['user_id']    = payload.get('id', '1')
            session['user_email'] = payload.get('email', '')
            session['user_name']  = payload.get('name', '')
        except Exception as e:
            print("SSO Error:", e)
    return redirect(url_for('home'))

VAPID_PUBLIC_KEY = "YOUR_PUBLIC_KEY_HERE"

@app.route("/save-subscription", methods=["POST"])
def save_subscription():
    data = request.get_json()

    endpoint = data["endpoint"]
    p256dh = data["keys"]["p256dh"]
    auth = data["keys"]["auth"]

    db = get_db()
    db.push_subscriptions.insert_one({
        "user_id": session.get("user_id", "1"),
        "endpoint": endpoint,
        "p256dh": p256dh,
        "auth": auth
    })

    return {"success": True}

@app.context_processor
def inject_theme():
    db = get_db()
    settings = db.settings.find_one({"user_id": session.get("user_id", "1")})
    theme = settings.get("theme", "light") if settings else "light"
    return dict(theme=theme)


from apscheduler.schedulers.background import BackgroundScheduler
from win11toast import toast
import smtplib
from email.message import EmailMessage

scheduler = BackgroundScheduler()

def send_email_notification(to_email, app_password, subject, body):
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = to_email
        msg['To'] = to_email
        
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(to_email, app_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print("Email Error:", e)

def check_notifications():
    try:
        db = get_db()
        tasks = list(db.tasks.find({"status": "Pending"}))
        now              = datetime.now()
        current_time_str = now.strftime("%H:%M")
        current_date_str = now.strftime("%Y-%m-%d")
        
        for task in tasks:
            start_date = task.get("start_date", "")
            end_date   = task.get("end_date", "")
            times      = task.get("times", [])
            user_email = task.get("user_email", "")
            
            # Reminder: task is active AND it's a scheduled time
            if start_date <= current_date_str <= end_date and current_time_str in times:
                try:
                    toast(
                        f"Task Reminder: {task.get('title')}",
                        task.get("description", "Scheduled task time!") or "Scheduled task time!"
                    )
                except Exception:
                    pass
                # Use SAVIX notify API
                if user_email:
                    notify("task-reminder", {"email": user_email, "task": {
                        "title": task.get("title",""),
                        "description": task.get("description",""),
                        "end_date": end_date
                    }})
            
            # Task ending today reminder at 10:00 AM
            if current_date_str == end_date and current_time_str == "10:00":
                try:
                    toast(
                        f"Task Ending Today: {task.get('title')}",
                        "Would you like to extend this task?"
                    )
                except Exception:
                    pass
                if user_email:
                    notify("task-reminder", {"email": user_email, "task": {
                        "title": f"[Ending Today] {task.get('title','')}",
                        "description": "This task ends today. Would you like to extend it?",
                        "end_date": end_date
                    }})
    except Exception as e:
        print("Notification Error:", e)

scheduler.add_job(func=check_notifications, trigger="interval", minutes=1)
scheduler.start()

@app.route("/extend/<string:task_id>", methods=["POST"])
def extend_task(task_id):
    db = get_db()
    extend_by = request.form.get("extend_by", "1_week")
    task = db.tasks.find_one({"_id": ObjectId(task_id)})
    if task:
        try:
            end_date = datetime.strptime(task.get("end_date", ""), "%Y-%m-%d")
            if extend_by == "1_week":
                new_end = end_date + timedelta(weeks=1)
            elif extend_by == "2_weeks":
                new_end = end_date + timedelta(weeks=2)
            else:
                custom_date = request.form.get("custom_date")
                new_end = datetime.strptime(custom_date, "%Y-%m-%d")
            
            db.tasks.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": {"end_date": new_end.strftime("%Y-%m-%d")}}
            )
        except Exception as e:
            print("Extend error:", e)
    return redirect(url_for("home"))

@app.route("/")
def home():
    db = get_db()
    user_settings = db.settings.find_one({"user_id": session.get("user_id", "1")})

    if user_settings:
      default_priority = user_settings.get("default_priority", "Low")
      theme = user_settings.get("theme", "light")
    else:
      default_priority = "Low"
      theme = "light"

    tasks = list(db.tasks.find({"user_id": session.get("user_id", "1")}).sort("_id", -1))

    today = date.today()
    tomorrow = today + timedelta(days=1)

    overdue_tasks = []
    today_tasks = []
    tomorrow_tasks = []
    upcoming_tasks = []

    completed = 0
    high = 0

    for task in tasks:
      task['task_id'] = str(task['_id'])  # Add task_id for templates

      if task.get("status") == "Completed":
        completed += 1
        continue
        
      if task.get("priority") == "High":
        high += 1

      end_date_str = task.get("end_date", "")
      try:
          due_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
      except ValueError:
          due_date = today

      if due_date < today:
          overdue_tasks.append(task)
      elif due_date == today:
          today_tasks.append(task)
      elif due_date == tomorrow:
          tomorrow_tasks.append(task)
      else:
          upcoming_tasks.append(task)

    total = len(tasks)
    pending = total - completed

    return render_template(
        "index.html",
        tasks=tasks,
        total=total,
        completed=completed,
        pending=pending,
        high=high,
        default_priority=default_priority,
        theme=theme,
        overdue_tasks=overdue_tasks,
        today_tasks=today_tasks,
        tomorrow_tasks=tomorrow_tasks,
        upcoming_tasks=upcoming_tasks,
    )
        

@app.route("/add", methods=["POST"])
def add_task():
    title       = request.form.get("title", "")
    description = request.form.get("description", "")
    category    = request.form.get("category", "")
    priority    = request.form.get("priority", "Low")
    start_date  = request.form.get("start_date", "")
    end_date    = request.form.get("end_date", "")
    times       = request.form.getlist("times")

    db = get_db()
    # Save user_email directly inside task for the background thread to use
    user_email = session.get("user_email", "")

    db.tasks.insert_one({
        "user_id":     session.get("user_id", "1"),
        "user_email":  user_email,
        "title":       title,
        "description": description,
        "category":    category,
        "priority":    priority,
        "start_date":  start_date,
        "end_date":    end_date,
        "times":       times,
        "status":      "Pending"
    })

    # ── Send task-registered email notification ──
    if user_email:
        task_data = {
            "title": title, "description": description, "category": category,
            "priority": priority, "start_date": start_date, "end_date": end_date
        }
        notify("task-registered", {"email": user_email, "task": task_data})

    return redirect(url_for("home"))

@app.route("/complete/<string:task_id>")
def complete_task(task_id):
    db = get_db()
    try:
        task = db.tasks.find_one({"_id": ObjectId(task_id)})
        db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": {"status": "Completed"}})

        # ── Send task-completed notification ──
        if task:
            user_email = task.get("user_email", "")
            if not user_email:
                user_email = session.get("user_email", "")
            if user_email:
                notify("task-completed", {"email": user_email, "task": {"title": task.get("title",""), "description": task.get("description","")}})
    except Exception as e:
        print("Complete task error:", e)
    return redirect(url_for("home"))


@app.route("/delete/<string:task_id>")
def delete_task(task_id):
    db = get_db()
    try:
        db.tasks.delete_one({"_id": ObjectId(task_id)})
    except Exception:
        pass
    return redirect(url_for("home"))

@app.route("/tasks")
def tasks_list():
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "")
    priority = request.args.get("priority", "")
    status = request.args.get("status", "")

    db = get_db()
    query = {"user_id": session.get("user_id", "1")}

    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    if category:
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}
    if priority:
        query["priority"] = {"$regex": f"^{priority}$", "$options": "i"}
    if status:
        query["status"] = {"$regex": f"^{status}$", "$options": "i"}

    tasks = list(db.tasks.find(query).sort("_id", -1))
    for t in tasks:
        t['task_id'] = str(t['_id'])

    return render_template(
        "tasks.html",
        tasks=tasks,
        search=search,
        category=category,
        priority=priority,
        status=status
    )

@app.route("/calendar")
def calendar():
    db = get_db()
    tasks = list(db.tasks.find({"user_id": session.get("user_id", "1")}, {"title": 1, "start_date": 1, "end_date": 1, "times": 1, "priority": 1, "status": 1}))
    for t in tasks:
        t['task_id'] = str(t['_id'])

    return render_template("calendar.html", tasks=tasks)

@app.route("/analytics")
def analytics():
    db = get_db()
    user_id = session.get("user_id", "1")

    completed = db.tasks.count_documents({"user_id": user_id, "status": "Completed"})
    pending = db.tasks.count_documents({"user_id": user_id, "status": "Pending"})

    categories_agg = list(db.tasks.aggregate([
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$category", "total": {"$sum": 1}}}
    ]))
    categories = [doc["_id"] for doc in categories_agg if doc["_id"]]
    counts = [doc["total"] for doc in categories_agg if doc["_id"]]
    
    priorities_agg = list(db.tasks.aggregate([
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$priority", "total": {"$sum": 1}}}
    ]))
    priorities = [doc["_id"] for doc in priorities_agg if doc["_id"]]
    priority_counts = [doc["total"] for doc in priorities_agg if doc["_id"]]

    total_tasks = completed + pending
    completion_rate = 0
    if total_tasks > 0:
        completion_rate = round((completed / total_tasks) * 100)

    return render_template(
        "analytics.html",
        completed=completed,
        pending=pending,
        categories=categories,
        counts=counts,
        priorities=priorities,
        priority_counts=priority_counts,
        completion_rate=completion_rate
    )

@app.route("/profile")
def profile():
    db = get_db()
    user = db.users.find_one({"user_id": session.get("user_id", "1")})
    if not user:
        user = {"user_id": session.get("user_id", "1"), "full_name": "User", "email": ""}
    return render_template(
        "profile.html",
        user=user
    )


@app.route("/update-profile", methods=["POST"])
def update_profile():
    full_name = request.form.get("full_name", "")
    email = request.form.get("email", "")

    db = get_db()
    db.users.update_one(
        {"user_id": session.get("user_id", "1")},
        {"$set": {"full_name": full_name, "email": email}},
        upsert=True
    )

    return redirect("/profile")

@app.route("/settings", methods=["GET", "POST"])
def settings():
    db = get_db()
    user_id = session.get("user_id", "1")

    if request.method == "POST":
        theme = request.form.get("theme", "light")
        reminders = 1 if request.form.get("reminders") else 0
        default_priority = request.form.get("default_priority", "Low")
        
        email_reminders = 1 if request.form.get("email_reminders") else 0

        db.settings.update_one(
            {"user_id": user_id},
            {"$set": {
                "theme": theme, 
                "reminders": reminders, 
                "default_priority": default_priority,
                "email_reminders": email_reminders
            }},
            upsert=True
        )

        return redirect("/settings")

    settings_data = db.settings.find_one({"user_id": user_id})
    if not settings_data:
        settings_data = {"theme": "light", "reminders": 0, "default_priority": "Low"}

    return render_template(
        "settings.html",
        settings=settings_data
    )

if __name__ == "__main__":
    app.run(debug=True, port=5000)

