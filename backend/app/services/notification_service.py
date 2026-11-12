import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.models.user import User, Notification, NotificationType, NotificationPreference
from app.schemas.notification import (
    NotificationItem, NotificationListResponse,
    NotificationPreferenceResponse, NotificationPreferenceUpdateRequest,
    UnreadCountResponse
)

logger = logging.getLogger(__name__)


class NotificationService:

    @staticmethod
    def get_or_create_preferences(db: Session, user_id: str) -> NotificationPreference:
        """Retrieves user notification preferences or creates defaults."""
        pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == user_id).first()
        if not pref:
            pref = NotificationPreference(
                user_id=user_id,
                email_notifications=True,
                job_recommendations=True,
                application_updates=True,
                interview_alerts=True,
                placement_drives=True,
                learning_milestones=True,
                updated_at=datetime.utcnow()
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    @staticmethod
    def send_notification(
        db: Session,
        user_id: str,
        title: str,
        message: str,
        category: str = "general",
        notification_type: NotificationType = NotificationType.INFO,
        action_url: Optional[str] = None,
        force_send_email: bool = False
    ) -> Optional[Notification]:
        """
        Creates an in-app notification respecting user preferences,
        and triggers optional email dispatch when configured.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"Notification user {user_id} not found.")
            return None

        # Check notification preference
        pref = NotificationService.get_or_create_preferences(db, user_id)
        category_clean = category.lower().strip()

        # Category preference mapping
        category_allowed = True
        if category_clean in ["job_recommendation", "job_recommendations"] and not pref.job_recommendations:
            category_allowed = False
        elif category_clean in ["application_status", "new_applications", "application"] and not pref.application_updates:
            category_allowed = False
        elif category_clean in ["interview_schedule", "interview_reminder", "interview"] and not pref.interview_alerts:
            category_allowed = False
        elif category_clean in ["placement_drive", "drive"] and not pref.placement_drives:
            category_allowed = False
        elif category_clean in ["learning_milestone", "milestone"] and not pref.learning_milestones:
            category_allowed = False

        if not category_allowed:
            logger.info(f"Notification {category} suppressed by user preferences for {user.email}")
            return None

        notif = Notification(
            user_id=user.id,
            title=title,
            message=message,
            category=category_clean,
            notification_type=notification_type,
            action_url=action_url,
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        # Email dispatch if enabled and email service available
        if pref.email_notifications and (force_send_email or category_clean in ["interview_schedule", "placement_drive"]):
            NotificationService.send_email_notification(
                to_email=user.email,
                subject=f"CareerBridge Alert: {title}",
                body=f"{title}\n\n{message}\n\nAccess the portal: {action_url or 'http://localhost:3000'}"
            )

        return notif

    @staticmethod
    def list_notifications(
        db: Session,
        user_id: str,
        category: Optional[str] = None,
        is_read: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20
    ) -> NotificationListResponse:
        """Retrieves paginated notifications for the current user."""
        query = db.query(Notification).filter(Notification.user_id == user_id)

        if category:
            query = query.filter(Notification.category == category.lower().strip())

        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)

        total = query.count()
        unread_count = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .count()
        )

        items = (
            query.order_by(desc(Notification.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        notif_items = [
            NotificationItem(
                id=n.id,
                user_id=n.user_id,
                title=n.title,
                message=n.message,
                notification_type=n.notification_type.value if hasattr(n.notification_type, "value") else str(n.notification_type),
                category=n.category or "general",
                action_url=n.action_url,
                is_read=n.is_read,
                created_at=n.created_at
            )
            for n in items
        ]

        return NotificationListResponse(
            total=total,
            unread_count=unread_count,
            page=page,
            page_size=page_size,
            notifications=notif_items
        )

    @staticmethod
    def get_unread_count(db: Session, user_id: str) -> UnreadCountResponse:
        """Returns the number of unread notifications for a user."""
        count = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .count()
        )
        return UnreadCountResponse(unread_count=count)

    @staticmethod
    def mark_as_read(db: Session, user_id: str, notification_id: str) -> NotificationItem:
        """Marks an individual notification as read."""
        notif = (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )
        if not notif:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

        notif.is_read = True
        db.commit()
        db.refresh(notif)

        return NotificationItem(
            id=notif.id,
            user_id=notif.user_id,
            title=notif.title,
            message=notif.message,
            notification_type=notif.notification_type.value if hasattr(notif.notification_type, "value") else str(notif.notification_type),
            category=notif.category or "general",
            action_url=notif.action_url,
            is_read=notif.is_read,
            created_at=notif.created_at
        )

    @staticmethod
    def mark_all_read(db: Session, user_id: str) -> Dict[str, Any]:
        """Marks all unread notifications for a user as read."""
        updated = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .update({"is_read": True}, synchronize_session=False)
        )
        db.commit()
        return {"updated_count": updated, "message": "All notifications marked as read"}

    @staticmethod
    def get_preferences(db: Session, user_id: str) -> NotificationPreferenceResponse:
        """Retrieves user notification preferences."""
        pref = NotificationService.get_or_create_preferences(db, user_id)
        return NotificationPreferenceResponse(
            user_id=pref.user_id,
            email_notifications=pref.email_notifications,
            job_recommendations=pref.job_recommendations,
            application_updates=pref.application_updates,
            interview_alerts=pref.interview_alerts,
            placement_drives=pref.placement_drives,
            learning_milestones=pref.learning_milestones,
            updated_at=pref.updated_at
        )

    @staticmethod
    def update_preferences(
        db: Session,
        user_id: str,
        payload: NotificationPreferenceUpdateRequest
    ) -> NotificationPreferenceResponse:
        """Modifies user notification category preferences."""
        pref = NotificationService.get_or_create_preferences(db, user_id)

        if payload.email_notifications is not None:
            pref.email_notifications = payload.email_notifications
        if payload.job_recommendations is not None:
            pref.job_recommendations = payload.job_recommendations
        if payload.application_updates is not None:
            pref.application_updates = payload.application_updates
        if payload.interview_alerts is not None:
            pref.interview_alerts = payload.interview_alerts
        if payload.placement_drives is not None:
            pref.placement_drives = payload.placement_drives
        if payload.learning_milestones is not None:
            pref.learning_milestones = payload.learning_milestones

        pref.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(pref)

        return NotificationPreferenceResponse(
            user_id=pref.user_id,
            email_notifications=pref.email_notifications,
            job_recommendations=pref.job_recommendations,
            application_updates=pref.application_updates,
            interview_alerts=pref.interview_alerts,
            placement_drives=pref.placement_drives,
            learning_milestones=pref.learning_milestones,
            updated_at=pref.updated_at
        )

    @staticmethod
    def send_email_notification(to_email: str, subject: str, body: str) -> bool:
        """
        Sends email via configured SMTP service if settings are provided,
        otherwise safely logs the dispatch for audit without throwing.
        """
        smtp_host = getattr(settings, "SMTP_HOST", None)
        smtp_port = getattr(settings, "SMTP_PORT", 587)
        smtp_user = getattr(settings, "SMTP_USER", None)
        smtp_password = getattr(settings, "SMTP_PASSWORD", None)

        if smtp_host and smtp_user:
            try:
                msg = MIMEMultipart()
                msg["From"] = smtp_user
                msg["To"] = to_email
                msg["Subject"] = subject
                msg.attach(MIMEText(body, "plain"))

                with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_password)
                    server.send_message(msg)

                logger.info(f"Email sent successfully to {to_email}")
                return True
            except Exception as e:
                logger.warning(f"SMTP delivery failed to {to_email}: {e}")
                return False
        else:
            # Email service not configured: gracefully log dispatch
            logger.info(f"[EMAIL SERVICE UNCONFIGURED] Dispatched to {to_email} | Subject: {subject}")
            return False

