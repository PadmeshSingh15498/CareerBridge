import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import engine, Base
from sqlalchemy import text, inspect
import app.models  # Ensure all models are registered with Base

def run_migration():
    # 1. Create any missing tables (such as notification_preferences) via SQLAlchemy metadata
    Base.metadata.create_all(bind=engine)
    print("Base metadata create_all executed (notification_preferences verified/created).")

    inspector = inspect(engine)
    is_sqlite = engine.dialect.name == "sqlite"

    with engine.begin() as conn:
        # 2. Update notifications table columns
        cols_notif = [c['name'] for c in inspector.get_columns('notifications')]
        if 'category' not in cols_notif:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'general'"))
            print("Added notifications.category")

        # 3. Update interview_sessions table columns
        cols_int = [c['name'] for c in inspector.get_columns('interview_sessions')]
        if 'company_target' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN company_target VARCHAR(150) NOT NULL DEFAULT 'General Tech'"))
            print("Added interview_sessions.company_target")
        if 'interview_type' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN interview_type VARCHAR(50) NOT NULL DEFAULT 'technical'"))
            print("Added interview_sessions.interview_type")
        if 'topics' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN topics JSON NULL"))
            print("Added interview_sessions.topics")
        if 'current_question_index' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN current_question_index INT NOT NULL DEFAULT 0"))
            print("Added interview_sessions.current_question_index")
        if 'total_questions' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN total_questions INT NOT NULL DEFAULT 5"))
            print("Added interview_sessions.total_questions")
        if 'status' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'in_progress'"))
            print("Added interview_sessions.status")
        if 'detailed_scores' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN detailed_scores JSON NULL"))
            print("Added interview_sessions.detailed_scores")
        if 'missing_concepts' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN missing_concepts JSON NULL"))
            print("Added interview_sessions.missing_concepts")
        if 'improvements' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN improvements JSON NULL"))
            print("Added interview_sessions.improvements")
        if 'weak_topics' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN weak_topics JSON NULL"))
            print("Added interview_sessions.weak_topics")
        if 'recommendations' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN recommendations JSON NULL"))
            print("Added interview_sessions.recommendations")
        if 'completed_at' not in cols_int:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN completed_at DATETIME NULL"))
            print("Added interview_sessions.completed_at")

    print("Phase 14 Database Migration completed successfully!")

if __name__ == '__main__':
    run_migration()
