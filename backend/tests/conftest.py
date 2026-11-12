import os
import pytest
from fastapi.testclient import TestClient

os.environ["TESTING"] = "1"

from app.api.deps import get_db
from app.core.database import SessionLocal
from app.main import app as fastapi_app
import app.models


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()
