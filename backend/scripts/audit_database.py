import sqlite3

def run_db_audit():
    conn = sqlite3.connect('careerbridge.db')
    cursor = conn.cursor()

    # 1. Integrity check
    cursor.execute('PRAGMA integrity_check;')
    integrity = cursor.fetchall()
    print('1. PRAGMA integrity_check:', integrity)

    # 2. Foreign key check
    cursor.execute('PRAGMA foreign_key_check;')
    fk_errors = cursor.fetchall()
    print(f'2. Foreign key violations: {len(fk_errors)}')
    if fk_errors:
        for err in fk_errors[:10]:
            print('   FK Violation:', err)

    # 3. Table list and row counts
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]
    print(f'3. Total tables: {len(tables)}')
    table_stats = {}
    for t in sorted(tables):
        cursor.execute(f'SELECT COUNT(*) FROM "{t}";')
        count = cursor.fetchone()[0]
        table_stats[t] = count
        print(f'   {t}: {count} rows')

    # 4. Check duplicate records in users, applications, etc.
    cursor.execute('SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;')
    duplicates = cursor.fetchall()
    print('4. Duplicate user emails:', len(duplicates), duplicates)

    cursor.execute('SELECT student_id, job_id, COUNT(*) FROM applications GROUP BY student_id, job_id HAVING COUNT(*) > 1;')
    dup_apps = cursor.fetchall()
    print('   Duplicate applications (same student + job):', len(dup_apps), dup_apps)

    # 5. Check index list
    cursor.execute("SELECT tbl_name, name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';")
    indexes = cursor.fetchall()
    print(f'5. Total custom indexes: {len(indexes)}')
    for tbl, idx in sorted(indexes):
        print(f'   {tbl} -> {idx}')

    # 6. Check foreign key pragma status
    cursor.execute('PRAGMA foreign_keys;')
    fk_enabled = cursor.fetchone()[0]
    print(f'6. PRAGMA foreign_keys enabled by default: {fk_enabled == 1}')

    conn.close()

if __name__ == '__main__':
    run_db_audit()

