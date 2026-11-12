import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import engine
from sqlalchemy import text, inspect

def run_migration():
    inspector = inspect(engine)
    with engine.begin() as conn:
        cols_drives = [c['name'] for c in inspector.get_columns('placement_drives')]
        if 'job_roles' not in cols_drives:
            conn.execute(text('ALTER TABLE placement_drives ADD COLUMN job_roles JSON NULL'))
            print('Added placement_drives.job_roles')
        if 'max_backlogs_allowed' not in cols_drives:
            conn.execute(text('ALTER TABLE placement_drives ADD COLUMN max_backlogs_allowed INT NOT NULL DEFAULT 0'))
            print('Added placement_drives.max_backlogs_allowed')
        if 'number_of_openings' not in cols_drives:
            conn.execute(text('ALTER TABLE placement_drives ADD COLUMN number_of_openings INT NOT NULL DEFAULT 10'))
            print('Added placement_drives.number_of_openings')

    print('Phase 13 Migration successfully executed!')

if __name__ == '__main__':
    run_migration()

