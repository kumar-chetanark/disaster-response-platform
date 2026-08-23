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
    inc_title = r.incident.title if hasattr(r, 'incident') and r.incident else "Central Command Network"
    inc_loc = r.incident.location_name if hasattr(r, 'incident') and r.incident else "Global Command"
    return ReportResponse(
        id=r.id,
        incident_id=r.incident_id,
        incident_title=inc_title,
        incident_location=inc_loc,
        report_type=r.report_type,
        title=r.title,
        author=r.author,
        summary=r.summary,
        metrics_summary=r.metrics_summary,
        tags=r.tags,
        status=getattr(r, 'status', 'PENDING') or 'PENDING',
        created_at=r.created_at or datetime.now(timezone.utc),
    )

def get_reports(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    report_type: Optional[str] = None,
    incident_id: Optional[str] = None,
) -> ReportListResponse:
    query = db.query(Report)
    if report_type:
        query = query.filter(Report.report_type == report_type)
    if incident_id:
        query = query.filter(Report.incident_id == incident_id)
    
    total = query.count()
    items = query.order_by(desc(Report.created_at)).offset(skip).limit(limit).all()
    return ReportListResponse(total=total, items=[to_report_response(r) for r in items])

def get_report_by_id(db: Session, report_id: str) -> Optional[Report]:
    return db.query(Report).filter(Report.id == report_id).first()

def create_report(db: Session, req: ReportCreate) -> Report:
    new_rep = Report(
        id=f"rep-{uuid.uuid4().hex[:8]}",
        incident_id=req.incident_id,
        report_type=req.report_type,
        title=req.title,
        author=req.author,
        summary=req.summary,
        metrics_summary=req.metrics_summary,
        tags=req.tags,
        status=req.status or "PENDING",
    )
    db.add(new_rep)
    db.commit()
    db.refresh(new_rep)
    return new_rep

def generate_report_pdf(db: Session, report: Report) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'RepTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    h2_style = ParagraphStyle(
        'RepH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'RepBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    meta_style = ParagraphStyle(
        'RepMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#64748B')
    )
    badge_style = ParagraphStyle(
        'RepBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#FFFFFF'),
        alignment=TA_CENTER
    )

    # 1. Header with Metadata
    header_data = [
        [
            Paragraph(f"<b>DISASTER RESPONSE COMMAND &bull; {report.report_type}</b>", meta_style),
            Paragraph(f"<b>STATUS:</b> {getattr(report, 'status', 'PENDING')} | <b>DATE:</b> {report.created_at.strftime('%Y-%m-%d %H:%M') if report.created_at else 'Just now'}", ParagraphStyle('RightMeta', parent=meta_style, alignment=TA_RIGHT)),
        ]
    ]
    header_table = Table(header_data, colWidths=[300, 240])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F172A'), spaceBefore=4, spaceAfter=8))

    story.append(Paragraph(report.title, title_style))
    story.append(Paragraph(f"<b>Author:</b> {report.author} &nbsp;|&nbsp; <b>Report ID:</b> {report.id} &nbsp;|&nbsp; <b>Status:</b> {getattr(report, 'status', 'PENDING')}", meta_style))
    story.append(Spacer(1, 8))

    # 2. Executive Summary Box
    story.append(Paragraph("1. Executive Incident Summary & Scope", h2_style))
    summary_p = Paragraph(report.summary, body_style)
    metrics_p = Paragraph(f"<b>Key Operational Metrics:</b> {report.metrics_summary or 'Standard telemetry active'}", meta_style)
    summary_table = Table([[summary_p], [metrics_p]], colWidths=[540])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # Fetch context data from database if incident linked
    incident = db.query(Incident).filter(Incident.id == report.incident_id).first() if report.incident_id else None
    sources = db.query(IncidentSource).filter(IncidentSource.incident_id == report.incident_id).all() if report.incident_id else []
    citizen_reps = db.query(CitizenReport).filter(CitizenReport.incident_id == report.incident_id).all() if report.incident_id else []
    assessments = db.query(Assessment).filter(Assessment.incident_id == report.incident_id).all() if report.incident_id else []
    operations = db.query(Operation).filter(Operation.incident_id == report.incident_id).all() if report.incident_id else []
    allocations = db.query(ResourceAllocation).filter(ResourceAllocation.incident_id == report.incident_id).all() if report.incident_id else []
    alerts = db.query(Alert).filter(Alert.incident_id == report.incident_id).all() if report.incident_id else []

    # 3. Linked Incident Dossier
    story.append(Paragraph("2. Canonical Incident Profile", h2_style))
    if incident:
        inc_rows = [
            [
                Paragraph(f"<b>Title:</b> {incident.title}", body_style),
                Paragraph(f"<b>Type / Category:</b> {incident.disaster_type or 'General'}", body_style),
                Paragraph(f"<b>Severity:</b> <font color='#DC2626'><b>{incident.severity}</b></font>", body_style),
            ],
            [
                Paragraph(f"<b>Location:</b> {incident.location_name or incident.sector or 'Sector 7G'}", body_style),
                Paragraph(f"<b>Pop. Affected:</b> {incident.affected_population or 'N/A'}", body_style),
                Paragraph(f"<b>Resource Coverage:</b> {incident.resource_coverage_pct or 0}%", body_style),
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

    # 4. Multi-Channel Corroborating Signals
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

    # 5. Field Reconnaissance Assessments
    story.append(Paragraph("4. Field Reconnaissance Assessments", h2_style))
    if assessments:
        asm_rows = [[Paragraph("<b>Mission ID</b>", badge_style), Paragraph("<b>Mode & Asset</b>", badge_style), Paragraph("<b>Surveyed Area & Findings</b>", badge_style), Paragraph("<b>Status</b>", badge_style)]]
        for a in assessments:
            asm_rows.append([
                Paragraph(a.id, body_style),
                Paragraph(f"{a.assessment_mode} ({a.asset_name})", body_style),
                Paragraph(f"Area: {a.area_surveyed} | Damaged: {a.structures_damaged_count} | Road: {a.road_accessibility_status} | People: {a.people_observed}", body_style),
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

    # 6. Operations & Allocations
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

    # 7. Sign-off Footer
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceBefore=6, spaceAfter=8))
    footer_text = f"CONFIDENTIAL • CENTRAL DISASTER RESPONSE COMMAND PLATFORM • Generated by {report.author} • Page 1 of 1"
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=meta_style, alignment=TA_CENTER)))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
