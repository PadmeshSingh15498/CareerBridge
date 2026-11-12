"""
REST API Router for Notifications & Alert Preferences.
Handles in-app notification center, unread counters, read/unread states,
and category notification preferences.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_active_user
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.notification import (
    NotificationListResponse, NotificationItem,
    NotificationPreferenceResponse, NotificationPreferenceUpdateRequest,
    UnreadCountResponse
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])


@router.get("", response_model=APIResponse[NotificationListResponse])
def list_notifications(
    category: Optional[str] = Query(None, description="Filter by category"),
    is_read: Optional[bool] = Query(None, description="Filter by read state"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieves paginated notifications for the authenticated user."""
    result = NotificationService.list_notifications(
        db=db,
        user_id=current_user.id,
        category=category,
        is_read=is_read,
        page=page,
        page_size=page_size
    )
    return APIResponse(
        success=True,
        message="Notifications retrieved successfully.",
        data=result
    )


@router.get("/unread-count", response_model=APIResponse[UnreadCountResponse])
def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Returns the total number of unread in-app alerts."""
    result = NotificationService.get_unread_count(db, current_user.id)
    return APIResponse(
        success=True,
        message="Unread notification count retrieved.",
        data=result
    )


@router.put("/{notification_id}/read", response_model=APIResponse[NotificationItem])
def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Marks an individual notification as read."""
    item = NotificationService.mark_as_read(db, current_user.id, notification_id)
    return APIResponse(
        success=True,
        message="Notification marked as read.",
        data=item
    )


@router.put("/mark-all-read", response_model=APIResponse[dict])
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Marks all pending notifications as read for current user."""
    res = NotificationService.mark_all_read(db, current_user.id)
    return APIResponse(
        success=True,
        message=res["message"],
        data=res
    )


@router.get("/preferences", response_model=APIResponse[NotificationPreferenceResponse])
def get_notification_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieves user notification channels and category preferences."""
    pref = NotificationService.get_preferences(db, current_user.id)
    return APIResponse(
        success=True,
        message="Notification preferences retrieved.",
        data=pref
    )


@router.put("/preferences", response_model=APIResponse[NotificationPreferenceResponse])
def update_notification_preferences(
    payload: NotificationPreferenceUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Updates notification category toggles and email preference."""
    pref = NotificationService.update_preferences(db, current_user.id, payload)
    return APIResponse(
        success=True,
        message="Notification preferences updated successfully.",
        data=pref
    )

