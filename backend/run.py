from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.agents import run_researcher

try:
    from apscheduler.schedulers.background import BackgroundScheduler
except Exception:
    BackgroundScheduler = None

app = create_app()

if __name__ == "__main__":
    # schedule the Researcher daily at 06:00 if APScheduler is available
    scheduler = None
    if BackgroundScheduler is not None:
        scheduler = BackgroundScheduler()
        scheduler.add_job(run_researcher, 'cron', hour=6, minute=0)
        scheduler.start()

    try:
        app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
    finally:
        if scheduler:
            scheduler.shutdown(wait=False)
