import io
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.report import Report
from app.models.incident import Incident
from app.models.incident_source import IncidentSource
from app.models.citizen_report import CitizenReport
from app.models.assessment import Assessment
from app.models.operation import Operation
from app.models.resource_allocation import ResourceAllocation
from app.models.alert import Alert
from app.schemas.report import ReportCreate, ReportResponse, ReportListResponse

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def to_report_response(r: Report) -> ReportResponse:
    inc_title = r.incident.title if r.incident else "Central Command Network"
    created_str = r.created_at.strftime("%Y-%m-%d %I:%M %p") if r.created_at else "Just now"
    return ReportResponse(
        id=r.id,
        incident_id=r.incident_id,
        incident_title=inc_title,
        report_type=r.report_type,
        title=r.title,
        author=r.author,
        summary=r.summary,
        metrics_summary=r.metrics_summary,
        tags=r.tags,
        created_at=created_str,
    )

def list_reports(
    db: Session,
    incident_id: Optional[str] = None,
    report_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> ReportListResponse:
    query = db.query(Report)

    if incident_id:
        query = query.filter(Report.incident_id == incident_id)

    if report_type and report_type.upper() != "ALL":
        query = query.filter(Report.report_type.ilike(report_type))

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(desc(Report.created_at)).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return ReportListResponse(
        items=[to_report_response(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

def get_report_by_id(db: Session, report_id: str) -> Optional[Report]:
    return db.query(Report).filter(Report.id == report_id).first()

def create_report(db: Session, report_in: ReportCreate) -> ReportResponse:
    # If an incident_id is provided, validate that it exists in the database
    if report_in.incident_id:
        inc = db.query(Incident).filter(Incident.id == report_in.incident_id).first()
        if not inc:
            raise ValueError(f"Referenced incident ID '{report_in.incident_id}' does not exist.")

    now = datetime.now(timezone.utc)
    report_id = f"REP-{str(uuid.uuid4())[:8].upper()}"

    new_report = Report(
        id=report_id,
        incident_id=report_in.incident_id,
        report_type=report_in.report_type,
        title=report_in.title,
        author=report_in.author,
        summary=report_in.summary,
        metrics_summary=report_in.metrics_summary,
        tags=report_in.tags,
        created_at=now,
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return to_report_response(new_report)

def generate_report_pdf(db: Session, report_id: str) -> Optional[bytes]:
    report = get_report_by_id(db=db, report_id=report_id)
    if not report:
        return None

    # Fetch referenced incident and all related multi-channel records
    incident: Optional[Incident] = None
    sources: List[IncidentSource] = []
    citizen_reps: List[CitizenReport] = []
    assessments: List[Assessment] = []
    operations: List[Operation] = []
    allocations: List[ResourceAllocation] = []
    alerts: List[Alert] = []

    if report.incident_id:
        incident = db.query(Incident).filter(Incident.id == report.incident_id).first()
        if incident:
            sources = db.query(IncidentSource).filter(IncidentSource.incident_id == incident.id).all()
            citizen_reps = db.query(CitizenReport).filter(CitizenReport.incident_id == incident.id).all()
            assessments = db.query(Assessment).filter(Assessment.incident_id == incident.id).all()
            operations = db.query(Operation).filter(Operation.incident_id == incident.id).all()
            allocations = db.query(ResourceAllocation).filter(ResourceAllocation.incident_id == incident.id).all()
            alerts = db.query(Alert).filter(Alert.incident_id == incident.id).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Dark operational styling palette
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        alignment=TA_LEFT,
    )

    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155'),
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#64748B'),
    )

    badge_style = ParagraphStyle(
        'DocBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#0284C7'),
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>DISASTER RESPONSE COMMAND PLATFORM</b><br/><font color='#64748B'>OFFICIAL SITUATIONAL INTELLIGENCE & DEBRIEF DOSSIER</font>", body_style),
            Paragraph(f"<b>REPORT ID:</b> {report.id}<br/><b>TYPE:</b> {report.report_type}<br/><b>DATE:</b> {report.created_at.strftime('%Y-%m-%d %H:%M UTC')}", ParagraphStyle('RMeta', parent=meta_style, alignment=TA_RIGHT)),
        ]
    ]
    header_table = Table(header_data, colWidths=[340, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=6, spaceAfter=12))

    # 2. Report Title & Author
    story.append(Paragraph(report.title, title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"<b>Author:</b> {report.author} &bull; <b>Classification:</b> OFFICIAL USE ONLY &bull; <b>Linked Incident:</b> {report.incident_id or 'Central Command Network'}", meta_style))
    story.append(Spacer(1, 10))

    # 3. Executive Summary
    story.append(Paragraph("1. Executive Summary & Operational Narrative", h2_style))
    story.append(Paragraph(report.summary, body_style))
    story.append(Spacer(1, 10))

    # 4. Incident Intelligence Dossier (if linked)
    story.append(Paragraph("2. Canonical Incident Intelligence Overview", h2_style))
    if incident:
        inc_rows = [
            [
                Paragraph(f"<b>Incident ID:</b> {incident.id.upper()}", body_style),
                Paragraph(f"<b>Disaster Type:</b> {incident.disaster_type.upper()}", body_style),
                Paragraph(f"<b>Severity:</b> <font color='#DC2626'><b>{incident.severity}</b></font>", body_style),
            ],
            [
                Paragraph(f"<b>Location:</b> {incident.location_name}", body_style),
                Paragraph(f"<b>Priority:</b> {incident.priority_level}", body_style),
                Paragraph(f"<b>Status:</b> {incident.status}", body_style),
            ],
            [
                Paragraph(f"<b>Population at Risk:</b> {incident.affected_population or 'Estimated ~12,500'}", body_style),
                Paragraph(f"<b>Affected Area:</b> {incident.affected_area_sq_km or 12.4} km²", body_style),
                Paragraph(f"<b>Resource Coverage:</b> {incident.resource_coverage_pct or 60}%", body_style),
            ],
            [
                Paragraph(f"<b>Field Verified:</b> {'YES (Recon Confirmed)' if incident.is_field_verified else 'NO (Sensor Model)'}", body_style),
                Paragraph(f"<b>First Signal:</b> {incident.created_at.strftime('%Y-%m-%d %H:%M') if incident.created_at else '10:35 AM'}", body_style),
                Paragraph(f"<b>Last Updated:</b> {incident.updated_at.strftime('%Y-%m-%d %H:%M') if incident.updated_at else 'Just now'}", body_style),
            ],
        ]
        inc_table = Table(inc_rows, colWidths=[180, 180, 180])
        inc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(inc_table)
    else:
        story.append(Paragraph("<i>No canonical incident linked directly to this general platform report.</i>", body_style))
    story.append(Spacer(1, 10))

    # 5. Multi-Channel Corroborating Signals & Citizen Reports
    story.append(Paragraph("3. Multi-Channel Corroborating Intelligence Ledger", h2_style))
    if sources or citizen_reps:
        source_rows = [[Paragraph("<b>Channel</b>", badge_style), Paragraph("<b>Source / Reference</b>", badge_style), Paragraph("<b>Summary Payload</b>", badge_style), Paragraph("<b>Time</b>", badge_style)]]
        
        for s in sources:
            time_str = s.created_at.strftime('%H:%M') if s.created_at else "10:35"
            source_rows.append([
                Paragraph(f"<font color='#0284C7'>{s.channel_badge or s.source_type}</font>", body_style),
                Paragraph(s.source_label, body_style),
                Paragraph(s.summary, body_style),
                Paragraph(time_str, meta_style),
            ])

        for c in citizen_reps:
            c_time = c.created_at.strftime('%H:%M') if c.created_at else "10:35"
            source_rows.append([
                Paragraph("<font color='#16A34A'>CITIZEN</font>", body_style),
                Paragraph(f"Citizen Intake #{c.id}", body_style),
                Paragraph(f"{c.description} (Trapped: {c.is_people_trapped}, Danger: {c.is_immediate_danger})", body_style),
                Paragraph(c_time, meta_style),
            ])

        source_table = Table(source_rows, colWidths=[70, 120, 290, 60])
        source_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(source_table)
    else:
        story.append(Paragraph("<i>No corroborating intelligence sources recorded for this incident.</i>", body_style))
    story.append(Spacer(1, 10))

    # 6. Field Reconnaissance Assessments
    story.append(Paragraph("4. Field Reconnaissance Assessments", h2_style))
    if assessments:
        asm_rows = [[Paragraph("<b>Mission ID</b>", badge_style), Paragraph("<b>Mode & Asset</b>", badge_style), Paragraph("<b>Surveyed Area & Findings</b>", badge_style), Paragraph("<b>Status</b>", badge_style)]]
        for a in assessments:
            asm_rows.append([
                Paragraph(a.id, body_style),
                Paragraph(f"{a.assessment_mode} ({a.asset_name})", body_style),
                Paragraph(f"Area: {a.area_surveyed} • Damaged Structures: {a.structures_damaged_count} • Road: {a.road_accessibility_status} • People: {a.people_observed}", body_style),
                Paragraph(f"Evac: {a.evacuation_route_status}", meta_style),
            ])
        asm_table = Table(asm_rows, colWidths=[70, 120, 280, 70])
        asm_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(asm_table)
    else:
        story.append(Paragraph("<i>No structured field reconnaissance assessments recorded.</i>", body_style))
    story.append(Spacer(1, 10))

    # 7. Dispatched Operations & Resource Allocations
    story.append(Paragraph("5. Operational Tracks & Response Resource Deployments", h2_style))
    if operations or allocations:
        op_rows = [[Paragraph("<b>Record ID</b>", badge_style), Paragraph("<b>Assigned Resource / Unit</b>", badge_style), Paragraph("<b>Objective / Type</b>", badge_style), Paragraph("<b>Operational Status</b>", badge_style)]]
        for op in operations:
            res_name = op.resource.name if op.resource else (op.resource_id or "Response Squad")
            op_rows.append([
                Paragraph(op.id, body_style),
                Paragraph(res_name, body_style),
                Paragraph(f"{op.operation_type}: {op.mission_objective or 'Field mission'}", body_style),
                Paragraph(f"<font color='#0284C7'><b>{op.state}</b></font>", body_style),
            ])
        for alloc in allocations:
            res_name = alloc.resource.name if alloc.resource else (alloc.resource_id or "Response Unit")
            op_rows.append([
                Paragraph(alloc.id, body_style),
                Paragraph(res_name, body_style),
                Paragraph(f"Advisory Match ({alloc.match_score}%): {alloc.reason or 'Priority allocation'}", body_style),
                Paragraph(f"{alloc.status}", meta_style),
            ])
        op_table = Table(op_rows, colWidths=[70, 130, 260, 80])
        op_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(op_table)
    else:
        story.append(Paragraph("<i>No operational dispatches or resource allocations currently active.</i>", body_style))
    story.append(Spacer(1, 10))

    # 8. Early Warning Telemetry Alerts
    story.append(Paragraph("6. Telemetry Intelligence & Early Warning Alerts", h2_style))
    if alerts:
        alt_rows = [[Paragraph("<b>Alert ID</b>", badge_style), Paragraph("<b>Source Stream</b>", badge_style), Paragraph("<b>Telemetry Warning Message</b>", badge_style), Paragraph("<b>Severity</b>", badge_style)]]
        for alt in alerts:
            alt_rows.append([
                Paragraph(alt.id[:8], body_style),
                Paragraph(alt.source, body_style),
                Paragraph(alt.message, body_style),
                Paragraph(f"<font color='#DC2626'>{alt.severity.upper()}</font>" if alt.severity.lower() == 'critical' else alt.severity.upper(), body_style),
            ])
        alt_table = Table(alt_rows, colWidths=[60, 120, 290, 70])
        alt_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(alt_table)
    else:
        story.append(Paragraph("<i>No early warning alerts recorded for this incident.</i>", body_style))

    # 9. Sign-off Footer
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceBefore=6, spaceAfter=8))
    footer_text = f"CONFIDENTIAL &bull; CENTRAL DISASTER RESPONSE COMMAND PLATFORM &bull; Generated by {report.author} &bull; Page 1 of 1"
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=meta_style, alignment=TA_CENTER)))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
