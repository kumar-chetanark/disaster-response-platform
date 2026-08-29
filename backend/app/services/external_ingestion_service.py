import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.external_alert import ExternalAlert
from app.models.incident import Incident
from app.models.incident_source import IncidentSource
from app.models.alert import Alert
from app.services.external_source_service import (
    BaseExternalDisasterAdapter,
    GDACSAdapter,
    NormalizedDisasterEvent,
)

logger = logging.getLogger("external_alert_ingestion")

class ExternalAlertIngestionService:
    """
    Continuous Worldwide Disaster Alert Ingestion & Deduplication Pipeline.
    Manages adapters, deduplicates by (source, external_id), and safely converts alerts to canonical incidents upon Authority Review.
    """
    def __init__(self, adapters: Optional[List[BaseExternalDisasterAdapter]] = None):
        self.adapters = adapters or [GDACSAdapter()]
        self.last_attempted_sync: Optional[datetime] = None
        self.last_successful_sync: Optional[datetime] = None
        self.last_sync_status: str = "INITIALIZING"
        self.last_error: Optional[str] = None
        self.last_events_fetched: int = 0
        self.last_new_alerts: int = 0
        self.last_updated_alerts: int = 0

    def run_ingestion(self, db: Session) -> Dict[str, Any]:
        """
        Executes ingestion across all configured global adapters.
        Safe against network errors and timeouts - never crashes the host platform.
        """
        now = datetime.now(timezone.utc)
        self.last_attempted_sync = now
        total_fetched = 0
        total_new = 0
        total_updated = 0
        errors = []

        for adapter in self.adapters:
            try:
                events = adapter.fetch_events()
                total_fetched += len(events)
                new_count, updated_count = self._upsert_events(db, events)
                total_new += new_count
                total_updated += updated_count
            except Exception as e:
                err_msg = f"Failed to ingest from {adapter.source_name}: {str(e)}"
                logger.error(err_msg, exc_info=True)
                errors.append(err_msg)

        if errors and total_fetched == 0:
            self.last_sync_status = "TEMPORARILY UNAVAILABLE"
            self.last_error = "; ".join(errors)
        else:
            self.last_sync_status = "CONNECTED"
            self.last_successful_sync = now
            self.last_error = None if not errors else f"Partial success with errors: {'; '.join(errors)}"

        self.last_events_fetched = total_fetched
        self.last_new_alerts = total_new
        self.last_updated_alerts = total_updated

        return self.get_status()

    def _upsert_events(self, db: Session, events: List[NormalizedDisasterEvent]) -> tuple[int, int]:
        """
        Deduplicates by (source, external_id).
        Inserts new alerts as 'NEW'.
        Updates existing alerts with refreshed severity, location, and last_seen_at without overriding Authority reviews.
        """
        new_count = 0
        updated_count = 0
        now = datetime.now(timezone.utc)

        for ev in events:
            if not ev.external_id:
                continue

            existing = db.query(ExternalAlert).filter(
                ExternalAlert.source == ev.source,
                ExternalAlert.external_id == ev.external_id
            ).first()

            if existing:
                # Update existing record
                existing.last_seen_at = now
                existing.severity = ev.severity
                existing.alert_level = ev.alert_level or existing.alert_level
                existing.alert_score = ev.alert_score if ev.alert_score is not None else existing.alert_score
                if ev.description:
                    existing.description = ev.description
                if ev.latitude is not None and ev.longitude is not None:
                    existing.latitude = ev.latitude
                    existing.longitude = ev.longitude
                if ev.raw_data:
                    existing.raw_data = json.dumps(ev.raw_data)
                existing.updated_at = now
                updated_count += 1
            else:
                # Insert new alert record in 'NEW' status with defensive sanitization
                new_alert = ExternalAlert(
                    id=f"ext-{str(uuid.uuid4())[:8]}",
                    source=str(ev.source)[:32],
                    external_id=str(ev.external_id)[:64],
                    event_type=str(ev.event_type)[:64],
                    title=str(ev.title),
                    description=str(ev.description) if ev.description else None,
                    country=str(ev.country) if ev.country else None,
                    countries=str(ev.countries) if ev.countries else None,
                    location_name=str(ev.location_name) if ev.location_name else None,
                    latitude=ev.latitude,
                    longitude=ev.longitude,
                    severity=str(ev.severity)[:32],
                    alert_level=str(ev.alert_level)[:32] if ev.alert_level else None,
                    alert_score=ev.alert_score,
                    population_affected_est=str(ev.population_affected_est)[:128] if ev.population_affected_est else None,
                    published_at=ev.published_at or now,
                    updated_at=now,
                    source_url=str(ev.source_url) if ev.source_url else None,
                    status="NEW",
                    raw_data=json.dumps(ev.raw_data) if ev.raw_data else None,
                    created_at=now,
                    last_seen_at=now,
                )
                db.add(new_alert)
                new_count += 1

        db.commit()
        return new_count, updated_count

    def convert_alert_to_incident(
        self,
        db: Session,
        alert_id: str,
        authority_user: Optional[dict] = None,
        custom_notes: Optional[str] = None
    ) -> Incident:
        """
        Authority Review Action: Converts an ExternalAlert to a canonical Incident.
        Guards against double-conversion (HTTP 409).
        Integrates with the existing incident lifecycle, attaching audit sources and alerts.
        NEVER automatically dispatches squads or resources.
        """
        from fastapi import HTTPException, status

        ext_alert = db.query(ExternalAlert).filter(ExternalAlert.id == alert_id).first()
        if not ext_alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"External alert with ID '{alert_id}' not found."
            )

        # 1. Guard against Double-Conversion
        if ext_alert.status == "CONVERTED_TO_INCIDENT" and ext_alert.converted_incident_id:
            existing_inc = db.query(Incident).filter(Incident.id == ext_alert.converted_incident_id).first()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Double-Conversion Conflict: External alert '{alert_id}' was already converted to Incident '{existing_inc.title if existing_inc else ext_alert.converted_incident_id}'."
            )

        now = datetime.now(timezone.utc)
        auth_name = (authority_user.get("name") if authority_user else None) or "Chetan Kumar (Level 5)"
        badge_id = (authority_user.get("badge_id") if authority_user else None) or "AUTH-LVL5"

        # 2. Instantiate Canonical Incident via existing workflow
        inc_count = db.query(Incident).count() + 1
        new_inc_id = f"inc-{str(uuid.uuid4())[:6]}"
        
        # Format location
        clean_loc = ext_alert.location_name or ext_alert.country or "Global Region"
        if ext_alert.country and ext_alert.country not in clean_loc:
            clean_loc = f"{clean_loc}, {ext_alert.country}"

        canonical_incident = Incident(
            id=new_inc_id,
            title=f"Incident #{inc_count}",
            description=ext_alert.description or f"{ext_alert.event_type} event reported by {ext_alert.source}.",
            disaster_type=ext_alert.event_type.lower(),
            severity=ext_alert.severity,
            priority_level="Level 1" if ext_alert.severity in ["CRITICAL", "HIGH"] else "Level 2",
            status="PENDING",
            latitude=ext_alert.latitude or 0.0,
            longitude=ext_alert.longitude or 0.0,
            location_name=clean_loc,
            sector=ext_alert.country or "Global Sector",
            affected_population=str(ext_alert.population_affected_est or "50"),
            affected_area_sq_km=50.0,
            resource_coverage_pct=0,
            is_field_verified=True,
            created_at=now,
            updated_at=now,
        )
        db.add(canonical_incident)

        # 3. Create Auditable IncidentSource linking back to GDACS
        inc_source = IncidentSource(
            id=str(uuid.uuid4()),
            incident_id=new_inc_id,
            source_type="GOVERNMENT",
            source_label=f"{ext_alert.source} Global Intelligence Feed ({ext_alert.external_id})",
            channel_badge="GLOBAL_INTEL",
            confidence_score=98.0,
            summary=f"Ingested from {ext_alert.source}. Validated and converted to active incident by {auth_name}.",
            raw_content=f"SOURCE_URL: {ext_alert.source_url} | ALERT_LEVEL: {ext_alert.alert_level} | COUNTRY: {ext_alert.country}",
            is_contradiction=False,
            created_at=now,
        )
        db.add(inc_source)

        # 4. Broadcast high priority alert linked to newly created incident
        broadcast_alert = Alert(
            id=str(uuid.uuid4()),
            incident_id=new_inc_id,
            category="CIVIL",
            source=f"{ext_alert.source} Alert Intake",
            location=clean_loc,
            message=f"[{ext_alert.source} INTEL] {ext_alert.title} converted to Incident #{inc_count} ({ext_alert.severity}). Authority: {auth_name}.",
            severity=ext_alert.severity.lower() if ext_alert.severity.lower() in ["critical", "warning", "info"] else "warning",
            is_reviewed_by_authority=True,
            alert_time=now.strftime("%I:%M %p"),
            created_at=now,
        )
        db.add(broadcast_alert)

        # 5. Transition ExternalAlert status and record foreign key relationship
        ext_alert.status = "CONVERTED_TO_INCIDENT"
        ext_alert.converted_incident_id = new_inc_id
        ext_alert.updated_at = now

        db.commit()
        db.refresh(canonical_incident)
        db.refresh(ext_alert)

        return canonical_incident

    def get_status(self) -> Dict[str, Any]:
        return {
            "source": "GDACS",
            "status": self.last_sync_status,
            "last_successful_sync": self.last_successful_sync.isoformat() if self.last_successful_sync else None,
            "last_attempted_sync": self.last_attempted_sync.isoformat() if self.last_attempted_sync else None,
            "events_fetched": self.last_events_fetched,
            "new_alerts": self.last_new_alerts,
            "updated_alerts": self.last_updated_alerts,
            "last_error": self.last_error,
        }

# Global Singleton Ingestion Service
global_ingestion_service = ExternalAlertIngestionService()
