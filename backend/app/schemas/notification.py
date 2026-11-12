from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class NotificationItem(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    category: str = "general"
    action_url: Optional[str] = None
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    page: int
    page_size: int
    notifications: List[NotificationItem]


class NotificationPreferenceResponse(BaseModel):
    user_id: str
    email_notifications: bool
    job_recommendations: bool
    application_updates: bool
    interview_alerts: bool
    placement_drives: bool
    learning_milestones: bool
    updated_at: datetime


class NotificationPreferenceUpdateRequest(BaseModel):
    email_notifications: Optional[bool] = None
    job_recommendations: Optional[bool] = None
    application_updates: Optional[bool] = None
    interview_alerts: Optional[bool] = None
    placement_drives: Optional[bool] = None
    learning_milestones: Optional[bool] = None


class UnreadCountResponse(BaseModel):
    unread_count: int

