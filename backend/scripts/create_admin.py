import os
import sys
import argparse

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
import app.models
from app.models.user import User, UserRole, AuditLog
from app.core.security import get_password_hash


def create_admin(email: str, password: str, full_name: str = "Placement Officer"):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    email_clean = email.lower().strip()

    try:
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            print(f"⚠️ Administrator with email '{email_clean}' already exists. Updating password...")
            existing.password_hash = get_password_hash(password)
            existing.role = UserRole.TPO
            existing.is_active = True
            existing.is_verified = True
            db.commit()
            print(f"✅ Administrator '{email_clean}' updated successfully with Argon2id!")
            return

        new_admin = User(
            email=email_clean,
            password_hash=get_password_hash(password),
            role=UserRole.TPO,
            is_active=True,
            is_verified=True,
        )
        db.add(new_admin)
        db.flush()

        db.add(AuditLog(
            user_id=new_admin.id,
            action="CREATE_ADMIN_CLI",
            resource_type="user",
            resource_id=new_admin.id,
            details_json={"full_name": full_name}
        ))
        db.commit()
        print(f"✅ Administrator '{email_clean}' ({full_name}) provisioned successfully with Argon2id hash!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Secure CLI script for provisioning CareerBridge administrators.")
    parser.add_argument("--email", default="tpo@university.edu", help="Admin / TPO email address")
    parser.add_argument("--password", default="Password123!", help="Admin secure password")
    parser.add_argument("--name", default="Dr. Rajesh Verma", help="Full name of placement officer")
    args = parser.parse_args()

    create_admin(args.email, args.password, args.name)

