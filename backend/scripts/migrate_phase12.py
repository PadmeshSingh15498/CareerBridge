import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import engine
from sqlalchemy import text, inspect

def run_migration():
    inspector = inspect(engine)
    with engine.begin() as conn:
        # 1. companies
        cols = [c['name'] for c in inspector.get_columns('companies')]
        if 'description' not in cols:
            conn.execute(text('ALTER TABLE companies ADD COLUMN description TEXT NULL'))
            print('Added companies.description')
        if 'hr_contact_name' not in cols:
            conn.execute(text('ALTER TABLE companies ADD COLUMN hr_contact_name VARCHAR(150) NULL'))
            print('Added companies.hr_contact_name')
        if 'hr_contact_email' not in cols:
            conn.execute(text('ALTER TABLE companies ADD COLUMN hr_contact_email VARCHAR(255) NULL'))
            print('Added companies.hr_contact_email')
        if 'hr_contact_phone' not in cols:
            conn.execute(text('ALTER TABLE companies ADD COLUMN hr_contact_phone VARCHAR(50) NULL'))
            print('Added companies.hr_contact_phone')
        if 'verification_status' not in cols:
            conn.execute(text("ALTER TABLE companies ADD COLUMN verification_status VARCHAR(50) NOT NULL DEFAULT 'pending_verification'"))
            print('Added companies.verification_status')
        
        # Sync verification_status with is_verified
        conn.execute(text("UPDATE companies SET verification_status = 'verified' WHERE is_verified = 1"))
        conn.execute(text("UPDATE companies SET verification_status = 'pending_verification' WHERE is_verified = 0 AND (verification_status IS NULL OR verification_status = '')"))
        
        # 2. applications
        cols_app = [c['name'] for c in inspector.get_columns('applications')]
        if 'recruiter_notes' not in cols_app:
            conn.execute(text('ALTER TABLE applications ADD COLUMN recruiter_notes TEXT NULL'))
            print('Added applications.recruiter_notes')
            
        # 3. interviews
        cols_iv = [c['name'] for c in inspector.get_columns('interviews')]
        if 'interview_mode' not in cols_iv:
            conn.execute(text("ALTER TABLE interviews ADD COLUMN interview_mode VARCHAR(50) NOT NULL DEFAULT 'virtual'"))
            print('Added interviews.interview_mode')
        if 'instructions' not in cols_iv:
            conn.execute(text('ALTER TABLE interviews ADD COLUMN instructions TEXT NULL'))
            print('Added interviews.instructions')

    print('Phase 12 Migration successfully executed!')

if __name__ == '__main__':
    run_migration()
