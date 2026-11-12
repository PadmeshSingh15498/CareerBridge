def test_root_health_check():
    from app.main import root_health_check
    data = root_health_check()
    assert data["status"] == "online"
    assert data["service"] == "CareerBridge"
    assert "database" in data


def test_api_v1_health_check():
    from app.api.v1.health import get_health_status
    envelope = get_health_status()
    assert envelope.success is True
    assert envelope.data is not None
    assert envelope.data.version == "1.0.0"
    assert envelope.data.database["status"] == "healthy"

