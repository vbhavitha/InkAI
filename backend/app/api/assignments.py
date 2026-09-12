from __future__ import annotations

from pathlib import Path
from typing import Any, Dict
from uuid import uuid4
import re
import json

from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
)
from pydantic import BaseModel, Field

from app.assignments.assignment_service import (
    AssignmentService,
)
from app.assignments.page_layout import PageConfig
from app.assignments.pdf_renderer import (
    AssignmentPDFRenderer,
)

from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.assignment import Assignment
from app.models.pdf_document import PdfDocument

from app.services.pdf_storage_service import (
    PDFStorageService,
)
from app.services.pdf_validation_service import (
    PDFValidationError,
    PDFValidationService,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/assignments",
    tags=["Assignments"],
)

# =========================================================
# PDF STORAGE / VALIDATION
# =========================================================

pdf_storage_service = PDFStorageService()
pdf_validation_service = PDFValidationService()

# ============================================================
# STEP 31 — DRAFT STORAGE
# ============================================================

DRAFTS_DIRECTORY = (
    Path("generated")
    / "assignments"
    / "drafts"
)

DRAFTS_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)

# ============================================================
# STEP 29 — DOWNLOAD FILE NAME
# ============================================================

def sanitize_filename_part(value: str) -> str:
    """
    Convert user-provided text into a safe filename component.
    """
    value = str(value or "").strip()

    if not value:
        return ""

    value = re.sub(
        r"[^\w\s-]",
        "",
        value,
        flags=re.UNICODE,
    )

    value = re.sub(
        r"[\s-]+",
        "_",
        value,
    )

    return value.strip("_")


def build_assignment_filename(
    title: str,
    student_name: str,
    db: Session,
) -> str:
    """
    Build a human-readable PDF filename.

    Example:
        Computer_Networks_Assignment_Bhavitha.pdf

    If the same assignment/student already exists:
        Computer_Networks_Assignment_Bhavitha_2.pdf
    """

    clean_title = sanitize_filename_part(
        title
    )

    clean_student = sanitize_filename_part(
        student_name
    )

    if not clean_title:
        clean_title = "InkAI_Assignment"

    if clean_student:
        base_name = (
            f"{clean_title}_{clean_student}"
        )
    else:
        base_name = clean_title

    existing_count = (
        db.query(Assignment)
        .filter(
            Assignment.user_id == TEMP_USER_ID,
            Assignment.title == title,
            Assignment.student_name == student_name,
        )
        .count()
    )

    if existing_count == 0:
        return f"{base_name}.pdf"

    return (
        f"{base_name}_{existing_count + 1}.pdf"
    )

class AssignmentDuplicateRequest(BaseModel):
    title: str | None = None


# ============================================================
# REQUEST SCHEMA
# ============================================================

class AssignmentRequest(BaseModel):
    """
    Assignment request received from the Phase 8 frontend.

    document:
        Structured TipTap JSON from Phase 6.

    assignment:
        Assignment metadata and settings.

    page:
        Page size, orientation and margin settings.
    """

    document: Dict[str, Any]

    assignment: Dict[str, Any] = Field(
        default_factory=dict
    )

    page: Dict[str, Any] = Field(
        default_factory=dict
    )

class AssignmentGenerateRequest(BaseModel):
    document_id: str

    draft_id: int | None = None

    template: str = "college_assignment"

    paper: str = "ruled"

    handwriting_style: str = "school_notebook"

    ink: str = "blue"

    page_numbers: bool = True

    assignment: Dict[str, Any] = Field(
        default_factory=dict
    )

    handwriting: Dict[str, Any] = Field(
        default_factory=dict
    )

    # STEP 20 — Optional PDF watermark configuration.
    watermark: Dict[str, Any] = Field(
        default_factory=dict
    )

# ============================================================
# STEP 31 — DRAFT REQUEST
# ============================================================

class AssignmentDraftRequest(BaseModel):
    draft_id: int | None = None

    document_id: str

    template: str = "college_assignment"

    paper: str = "ruled"

    handwriting_style: str = "school_notebook"

    ink: str = "blue"

    page_numbers: bool = True

    assignment: Dict[str, Any] = Field(
        default_factory=dict
    )

    handwriting: Dict[str, Any] = Field(
        default_factory=dict
    )

class AssignmentRegenerateRequest(BaseModel):
    paper: str | None = None
    handwriting_style: str | None = None
    ink: str | None = None
    page_numbers: bool | None = None

    assignment: Dict[str, Any] = Field(
        default_factory=dict
    )

    handwriting: Dict[str, Any] = Field(
        default_factory=dict
    )

# =========================================================
# STEP 26 — DUPLICATE ASSIGNMENT
# =========================================================

@router.post("/{assignment_id}/duplicate")
def duplicate_assignment(
    assignment_id: int,
    request: AssignmentDuplicateRequest,
    db: Session = Depends(get_db),
):
    """
    Duplicate an existing assignment.

    A new Assignment record is created.
    A new Document record is also created so the
    duplicated assignment can later be edited independently.
    """

    try:
        # -----------------------------------------------------
        # 1. Find original assignment
        # -----------------------------------------------------

        original = (
            db.query(Assignment)
            .filter(
                Assignment.id == assignment_id,
                Assignment.user_id == TEMP_USER_ID,
            )
            .first()
        )

        if not original:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )

        # -----------------------------------------------------
        # 2. Load original document
        # -----------------------------------------------------

        from app.api.documents import get_document

        original_document = get_document(
            original.document_id
        )

        if not original_document:
            raise HTTPException(
                status_code=404,
                detail="Source document not found.",
            )

        # -----------------------------------------------------
        # 3. Create new document
        # -----------------------------------------------------
        #
        # We use the existing Document model directly.
        #

        from app.models.document import Document
        import json

        original_content = (
            original_document.get("content", {})
            if isinstance(
                original_document,
                dict
            )
            else {}
        )

        if isinstance(
            original_content,
            str
        ):
            try:
                original_content = json.loads(
                    original_content
                )
            except json.JSONDecodeError:
                original_content = {}

        new_document = Document(
            user_id=TEMP_USER_ID,

            title=(
                request.title
                or f"{original.title} — Copy"
            ),

            content=json.dumps(
                original_content
            ),
        )

        db.add(new_document)

        db.flush()

        # -----------------------------------------------------
        # 4. Create duplicated assignment
        # -----------------------------------------------------

        new_assignment = Assignment(
            user_id=TEMP_USER_ID,

            document_id=new_document.id,

            title=(
                request.title
                or f"{original.title} — Copy"
            ),

            subject=original.subject,

            student_name=original.student_name,

            roll_number=original.roll_number,

            class_name=original.class_name,

            section=original.section,

            teacher_name=original.teacher_name,

            assignment_date=original.assignment_date,

            template=original.template,

            paper_style=original.paper_style,

            handwriting_style=original.handwriting_style,

            ink_color=original.ink_color,

            page_count=original.page_count,

            # Do not reuse the original PDF.
            pdf_path=None,
        )

        db.add(new_assignment)

        db.commit()

        db.refresh(new_assignment)

        # -----------------------------------------------------
        # 5. Return new assignment
        # -----------------------------------------------------

        return {
            "assignment_id": new_assignment.id,

            "document_id": new_document.id,

            "title": new_assignment.title,

            "status": "duplicated",

            "message": (
                "Assignment duplicated successfully."
            ),
        }

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to duplicate assignment: "
                f"{error}"
            ),
        )


# ============================================================
# PAGE CONFIGURATION
# ============================================================

def build_page_config(
    page: Dict[str, Any] | None = None,
    assignment: Dict[str, Any] | None = None,
) -> PageConfig:
    """
    Build the authoritative assignment pagination configuration.

    The existing AssignmentPageLayout remains responsible for
    pagination. The reusable PDF layout is used for page geometry
    and display configuration.

    Legacy custom margins in points are still accepted. New callers
    may send customMarginsUnit="mm" to use millimetres.
    """
    page = page or {}
    assignment = assignment or {}

    paper_size = page.get(
        "paperSize",
        assignment.get("paperSize", "A4"),
    )

    orientation = page.get(
        "orientation",
        assignment.get("orientation", "portrait"),
    )

    margin_preset = page.get(
        "marginPreset",
        assignment.get("marginPreset", "normal"),
    )

    custom_margins = (
        page.get("customMargins")
        or assignment.get("customMargins")
        or {}
    )

    # --------------------------------------------------------
    # Margins
    # --------------------------------------------------------

    if margin_preset == "narrow":
        margins = {
            "top": 36,
            "right": 36,
            "bottom": 36,
            "left": 36,
        }

    elif margin_preset == "wide":
        margins = {
            "top": 72,
            "right": 65,
            "bottom": 72,
            "left": 65,
        }

    elif margin_preset == "custom":
        unit = str(
            page.get(
                "customMarginsUnit",
                assignment.get(
                    "customMarginsUnit",
                    "points",
                ),
            )
            or "points"
        ).lower()

        if unit == "mm":
            from app.pdf.layout import mm_to_points

            margins = {
                "top": mm_to_points(
                    float(custom_margins.get("top", 20))
                ),
                "right": mm_to_points(
                    float(custom_margins.get("right", 20))
                ),
                "bottom": mm_to_points(
                    float(custom_margins.get("bottom", 20))
                ),
                "left": mm_to_points(
                    float(custom_margins.get("left", 20))
                ),
            }
        else:
            # Legacy Phase 8 point-based settings.
            margins = {
                "top": float(
                    custom_margins.get("top", 56)
                ),
                "right": float(
                    custom_margins.get("right", 50)
                ),
                "bottom": float(
                    custom_margins.get("bottom", 56)
                ),
                "left": float(
                    custom_margins.get("left", 50)
                ),
            }

    else:
        margins = {
            "top": 56,
            "right": 50,
            "bottom": 56,
            "left": 50,
        }

    # --------------------------------------------------------
    # Custom page size
    # --------------------------------------------------------

    custom_page_size = (
        page.get("customPageSize")
        or assignment.get("customPageSize")
        or {}
    )

    custom_width_mm = custom_page_size.get(
        "widthMm"
    )

    custom_height_mm = custom_page_size.get(
        "heightMm"
    )

    # --------------------------------------------------------
    # Header
    # --------------------------------------------------------

    header_enabled = bool(
        assignment.get(
            "headerEnabled",
            page.get("headerEnabled", False),
        )
    )

    header_text = str(
        assignment.get(
            "headerText",
            page.get("headerText", ""),
        )
        or ""
    ).strip()

    if header_enabled and not header_text:
        title = str(
            assignment.get("title")
            or assignment.get("assignmentTitle")
            or ""
        ).strip()

        subject = str(
            assignment.get("subject")
            or ""
        ).strip()

        student = str(
            assignment.get("studentName")
            or ""
        ).strip()

        if title:
            header_text = title
        elif student and subject:
            header_text = (
                f"Name: {student} | "
                f"Subject: {subject}"
            )
        elif subject:
            header_text = (
                f"Subject: {subject}"
            )

    header_position = str(
        assignment.get(
            "headerPosition",
            page.get("headerPosition", "center"),
        )
        or "center"
    ).lower()

    header_font_size = float(
        assignment.get(
            "headerFontSize",
            11,
        )
        or 11
    )

    header_bold = bool(
        assignment.get(
            "headerBold",
            False,
        )
    )

    # STEP 19 — Reserve a dedicated header band.
    # Body pagination must never consume this space.
    header_height = (
        max(header_font_size + 16, 28)
        if header_enabled and header_text
        else 0
    )

    # --------------------------------------------------------
    # Footer
    # --------------------------------------------------------

    show_footer = bool(
        assignment.get(
            "showFooter",
            True,
        )
    )

    footer_text = str(
        assignment.get(
            "footerText",
            "InkAI — Assignment",
        )
        or ""
    )

    footer_position = str(
        assignment.get(
            "footerPosition",
            "center",
        )
        or "center"
    ).lower()

    footer_font_size = float(
        assignment.get(
            "footerFontSize",
            9,
        )
        or 9
    )

    footer_bold = bool(
        assignment.get(
            "footerBold",
            False,
        )
    )

    # --------------------------------------------------------
    # Page numbers
    # --------------------------------------------------------

    show_page_number = bool(
        assignment.get(
            "showPageNumber",
            True,
        )
    )

    page_number_position = str(
        assignment.get(
            "pageNumberPosition",
            "center",
        )
        or "center"
    ).lower()

    page_number_show_total = bool(
        assignment.get(
            "pageNumberShowTotal",
            False,
        )
    )

    page_number_prefix = str(
        assignment.get(
            "pageNumberPrefix",
            "Page",
        )
        or "Page"
    )

    page_number_font_size = float(
        assignment.get(
            "pageNumberFontSize",
            9,
        )
        or 9
    )

    page_number_bold = bool(
        assignment.get(
            "pageNumberBold",
            False,
        )
    )

    # STEP 19 — Reserve a dedicated footer band.
    # Footer text and page numbers share this band; body pagination never
    # uses it.
    footer_height = (
        max(
            footer_font_size + 18,
            page_number_font_size + 18,
            40,
        )
        if (show_footer or show_page_number)
        else 0
    )

    return PageConfig(
        paper_size=paper_size,
        orientation=orientation,
        margin_preset=margin_preset,

        top=margins["top"],
        right=margins["right"],
        bottom=margins["bottom"],
        left=margins["left"],

        line_height=float(
            assignment.get(
                "lineHeight",
                28,
            )
            or 28
        ),

        header_height=header_height,
        footer_height=footer_height,

        header_enabled=header_enabled,
        header_text=header_text,
        header_position=header_position,
        header_font_size=header_font_size,
        header_bold=header_bold,

        show_footer=show_footer,
        footer_text=footer_text,
        footer_position=footer_position,
        footer_font_size=footer_font_size,
        footer_bold=footer_bold,

        show_page_number=show_page_number,
        page_number_position=page_number_position,
        page_number_show_total=page_number_show_total,
        page_number_prefix=page_number_prefix,
        page_number_font_size=page_number_font_size,
        page_number_bold=page_number_bold,

        custom_width_mm=(
            float(custom_width_mm)
            if custom_width_mm is not None
            else None
        ),
        custom_height_mm=(
            float(custom_height_mm)
            if custom_height_mm is not None
            else None
        ),
    )


# =========================================================
# PDF PAGE SIZE
# =========================================================

def get_expected_pdf_page_size(
    page_config: PageConfig,
) -> tuple[float, float]:
    """
    Return the expected PDF page dimensions in points.

    Uses the existing PageConfig so PDF validation remains
    consistent with the authoritative assignment layout.
    """

    # PageConfig already owns the page geometry.
    # Different versions of the project may expose geometry
    # through slightly different attributes, so prefer the
    # existing page-size helper when available.

    if hasattr(
        page_config,
        "get_page_size",
    ):
        size = page_config.get_page_size()

        if size:
            return (
                float(size[0]),
                float(size[1]),
            )

    # -----------------------------------------------------
    # Standard PDF page sizes in points
    # -----------------------------------------------------

    standard_sizes = {
        "A4": (
            595.2756,
            841.8898,
        ),
        "A5": (
            419.5276,
            595.2756,
        ),
        "LETTER": (
            612.0,
            792.0,
        ),
        "LEGAL": (
            612.0,
            1008.0,
        ),
    }

    paper_size = str(
        getattr(
            page_config,
            "paper_size",
            "A4",
        )
        or "A4"
    ).upper()

    if paper_size in standard_sizes:
        width, height = standard_sizes[
            paper_size
        ]

        orientation = str(
            getattr(
                page_config,
                "orientation",
                "portrait",
            )
            or "portrait"
        ).lower()

        if orientation == "landscape":
            return (
                height,
                width,
            )

        return (
            width,
            height,
        )

    # -----------------------------------------------------
    # Custom dimensions
    # -----------------------------------------------------

    custom_width = getattr(
        page_config,
        "custom_width_mm",
        None,
    )

    custom_height = getattr(
        page_config,
        "custom_height_mm",
        None,
    )

    if (
        custom_width
        and custom_height
    ):
        width_points = (
            float(custom_width)
            * 72.0
            / 25.4
        )

        height_points = (
            float(custom_height)
            * 72.0
            / 25.4
        )

        orientation = str(
            getattr(
                page_config,
                "orientation",
                "portrait",
            )
            or "portrait"
        ).lower()

        if orientation == "landscape":
            return (
                height_points,
                width_points,
            )

        return (
            width_points,
            height_points,
        )

    # Safe default
    return (
        595.2756,
        841.8898,
    )


# ============================================================
# STEP 13 + STEP 14 + STEP 15 + STEP 16
# ============================================================

@router.post("/paginate")
def paginate_assignment(
    request: AssignmentRequest,
):
    """
    Paginate a Phase 6 structured document.

    Supports:

    STEP 13
        Automatic pagination when page space is exhausted.

    STEP 14
        Explicit TipTap pageBreak nodes.

    STEP 15
        Page numbers and total page count.

    STEP 16
        Optional footer configuration.
    """

    try:

        page_config = build_page_config(
            page=request.page,
            assignment=request.assignment,
        )

        service = AssignmentService(
            page_config=page_config
        )

        result = service.build_assignment(
            document=request.document,
            assignment=request.assignment,
        )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to paginate assignment: "
                f"{error}"
            ),
        )

# ============================================================
# STEP 31 — SAVE / UPDATE DRAFT
# ============================================================

@router.post("/draft")
def save_assignment_draft(
    request: AssignmentDraftRequest,
    db: Session = Depends(get_db),
):
    try:
        # ------------------------------------------------------
        # Find existing draft
        # ------------------------------------------------------

        assignment_record = None

        if request.draft_id:
            assignment_record = (
                db.query(Assignment)
                .filter(
                    Assignment.id == request.draft_id,
                    Assignment.user_id == TEMP_USER_ID,
                )
                .first()
            )

            if not assignment_record:
                raise HTTPException(
                    status_code=404,
                    detail="Draft not found.",
                )

        # ------------------------------------------------------
        # Create new draft
        # ------------------------------------------------------

        if assignment_record is None:
            assignment_record = Assignment(
                user_id=TEMP_USER_ID,
                document_id=int(request.document_id),
                title=request.assignment.get(
                    "title",
                    "Untitled Assignment",
                ),
                subject=request.assignment.get(
                    "subject",
                    "",
                ),
                student_name=request.assignment.get(
                    "studentName",
                    "",
                ),
                roll_number=request.assignment.get(
                    "rollNumber",
                    "",
                ),
                class_name=request.assignment.get(
                    "className",
                    "",
                ),
                section=request.assignment.get(
                    "section",
                    "",
                ),
                teacher_name=request.assignment.get(
                    "teacherName",
                    "",
                ),
                assignment_date=request.assignment.get(
                    "date",
                    "",
                ),
                template=request.template,
                paper_style=request.paper,
                handwriting_style=request.handwriting_style,
                ink_color=request.ink,
                page_count=0,
                pdf_path=None,
            )

            db.add(assignment_record)
            db.flush()

        # ------------------------------------------------------
        # Update draft metadata
        # ------------------------------------------------------

        assignment_record.document_id = int(
            request.document_id
        )

        assignment_record.title = request.assignment.get(
            "title",
            "",
        )

        assignment_record.subject = request.assignment.get(
            "subject",
            "",
        )

        assignment_record.student_name = request.assignment.get(
            "studentName",
            "",
        )

        assignment_record.roll_number = request.assignment.get(
            "rollNumber",
            "",
        )

        assignment_record.class_name = request.assignment.get(
            "className",
            "",
        )

        assignment_record.section = request.assignment.get(
            "section",
            "",
        )

        assignment_record.teacher_name = request.assignment.get(
            "teacherName",
            "",
        )

        assignment_record.assignment_date = request.assignment.get(
            "date",
            "",
        )

        assignment_record.template = request.template
        assignment_record.paper_style = request.paper
        assignment_record.handwriting_style = (
            request.handwriting_style
        )
        assignment_record.ink_color = request.ink

        # ------------------------------------------------------
        # Save complete configuration to JSON
        # ------------------------------------------------------

        draft_data = {
            "draft_id": assignment_record.id,
            "document_id": int(request.document_id),
            "template": request.template,
            "paper": request.paper,
            "handwriting_style": request.handwriting_style,
            "ink": request.ink,
            "page_numbers": request.page_numbers,
            "assignment": request.assignment,
            "handwriting": request.handwriting,
        }

        draft_path = (
            DRAFTS_DIRECTORY
            / f"{assignment_record.id}.json"
        )

        draft_path.write_text(
            json.dumps(
                draft_data,
                indent=2,
            ),
            encoding="utf-8",
        )

        db.commit()
        db.refresh(assignment_record)

        return {
            "draft_id": assignment_record.id,
            "status": "draft",
            "document_id": assignment_record.document_id,
            "title": assignment_record.title,
            "message": "Draft saved successfully.",
        }

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save assignment draft: "
                f"{error}"
            ),
        )

# ============================================================
# STEP 31 — GET DRAFT
# ============================================================

@router.get("/{assignment_id}/draft")
def get_assignment_draft(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.id == assignment_id,
            Assignment.user_id == TEMP_USER_ID,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment draft not found.",
        )

    draft_path = (
        DRAFTS_DIRECTORY
        / f"{assignment.id}.json"
    )

    if not draft_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Draft configuration not found.",
        )

    try:
        draft_data = json.loads(
            draft_path.read_text(
                encoding="utf-8"
            )
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to read draft configuration.",
        )

    return {
        **draft_data,
        "status": (
            "completed"
            if assignment.pdf_path
            else "draft"
        ),
    }

@router.post("/generate")
def generate_assignment(
    request: AssignmentGenerateRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a high-resolution assignment PDF.

    The browser preview is NOT used as the PDF source.

    The assignment is rebuilt and rendered on the backend.
    """

    try:
        # ---------------------------------------------------------
        # 1. Load the source document
        # ---------------------------------------------------------

        from app.api.documents import get_document

        document = get_document(
            request.document_id
        )

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found.",
            )

        # ---------------------------------------------------------
        # 2. Build assignment settings
        # ---------------------------------------------------------

        assignment = {
            **request.assignment,

            "template": request.template,

            "paperStyle": request.paper,

            "handwritingStyle": (
                request.handwriting_style
            ),

            "ink": request.ink,

            "showPageNumber": (
                request.page_numbers
            ),
        }

        # ---------------------------------------------------------
        # 3. Build page configuration
        # ---------------------------------------------------------

        page_config = build_page_config(
            page=assignment,
            assignment=assignment,
        )

        # ---------------------------------------------------------
        # 4. Paginate structured Phase 6 document
        # ---------------------------------------------------------

        service = AssignmentService(
            page_config=page_config
        )

        result = service.build_assignment(
            document=document,
            assignment=assignment,
        )

        pages = result.get(
            "pages",
            [],
        )

        # ---------------------------------------------------------
        # 5. Create high-resolution PDF
        # ---------------------------------------------------------

        # Render into a temporary/generated location first.
        # The file is NOT considered final until validation passes.

        temporary_directory = (
            Path("generated")
            / "assignments"
            / "temporary"
        )

        temporary_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        temporary_pdf_id = str(
            uuid4()
        )

        temporary_pdf_path = (
            temporary_directory
            / f"{temporary_pdf_id}.pdf"
        )

        renderer = AssignmentPDFRenderer(
            page_config=page_config,
            handwriting=request.handwriting,
            watermark=request.watermark,
        )

        renderer.render(
            pages=pages,
            output_path=str(
                temporary_pdf_path
            ),
        )

        # ---------------------------------------------------------
        # 5A. Validate generated PDF
        # ---------------------------------------------------------

        try:
            expected_page_size = (
                get_expected_pdf_page_size(
                    page_config
                )
            )

            validation_result = (
                pdf_validation_service.validate(
                    pdf_path=temporary_pdf_path,
                    expected_page_count=len(
                        pages
                    ),
                    expected_page_size=(
                        expected_page_size
                    ),
                )
            )

        except PDFValidationError as error:

            # Delete invalid generated PDF.
            if temporary_pdf_path.exists():
                temporary_pdf_path.unlink()

            raise HTTPException(
                status_code=500,
                detail=(
                    "Generated PDF failed validation: "
                    f"{error}"
                ),
            )

        # ---------------------------------------------------------
        # 5B. Build permanent filename
        # ---------------------------------------------------------

        pdf_filename = build_assignment_filename(
            title=request.assignment.get(
                "title",
                request.assignment.get(
                    "assignmentTitle",
                    "Untitled Assignment",
                ),
            ),
            student_name=request.assignment.get(
                "studentName",
                "",
            ),
            db=db,
        )

        # ---------------------------------------------------------
        # 5C. Move validated PDF into final storage
        # ---------------------------------------------------------

        try:

            final_pdf_path = (
                pdf_storage_service.save_final_pdf(
                    source_path=temporary_pdf_path,
                    filename=pdf_filename,
                )
            )

        except Exception as error:

            if temporary_pdf_path.exists():
                temporary_pdf_path.unlink()

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to store generated PDF: "
                    f"{error}"
                ),
            )

        # Remove temporary PDF after successful storage.
        if temporary_pdf_path.exists():
            temporary_pdf_path.unlink()

        # =========================================================
        # SAVE / UPDATE ASSIGNMENT RECORD
        # =========================================================

        if request.draft_id:
            assignment_record = (
                db.query(Assignment)
                .filter(
                    Assignment.id == request.draft_id,
                    Assignment.user_id == TEMP_USER_ID,
                )
                .first()
            )

            if not assignment_record:
                raise HTTPException(
                    status_code=404,
                    detail="Draft assignment not found.",
                )

        else:
            assignment_record = Assignment(
                user_id=TEMP_USER_ID,
                document_id=int(
                    request.document_id
                ),
            )

            db.add(assignment_record)
            db.flush()

        # ---------------------------------------------------------
        # Update assignment information
        # ---------------------------------------------------------

        assignment_record.document_id = int(
            request.document_id
        )

        assignment_record.title = (
            request.assignment.get(
                "title",
                request.assignment.get(
                    "assignmentTitle",
                    "Untitled Assignment",
                ),
            )
        )

        assignment_record.subject = (
            request.assignment.get(
                "subject",
                "",
            )
        )

        assignment_record.student_name = (
            request.assignment.get(
                "studentName",
                "",
            )
        )

        assignment_record.roll_number = (
            request.assignment.get(
                "rollNumber",
                "",
            )
        )

        assignment_record.class_name = (
            request.assignment.get(
                "className",
                "",
            )
        )

        assignment_record.section = (
            request.assignment.get(
                "section",
                "",
            )
        )

        assignment_record.teacher_name = (
            request.assignment.get(
                "teacherName",
                request.assignment.get(
                    "teacher",
                    "",
                ),
            )
        )

        assignment_record.assignment_date = (
            request.assignment.get(
                "date",
                "",
            )
        )

        assignment_record.template = (
            request.template
        )

        assignment_record.paper_style = (
            request.paper
        )

        assignment_record.handwriting_style = (
            request.handwriting_style
        )

        assignment_record.ink_color = (
            request.ink
        )

        assignment_record.page_count = (
            len(pages)
        )

        assignment_record.pdf_path = str(
            final_pdf_path
        )

        # ---------------------------------------------------------
        # CREATE PDF DOCUMENT RECORD
        # ---------------------------------------------------------

        pdf_document = PdfDocument(
            user_id=TEMP_USER_ID,
            document_id=int(
                request.document_id
            ),
            assignment_id=assignment_record.id,
            filename=pdf_filename,
            file_path=str(
                final_pdf_path
            ),
            page_size=str(
                assignment.get(
                    "paperSize",
                    "A4",
                )
                or "A4"
            ),
            page_count=len(pages),
        )

        db.add(pdf_document)

        db.commit()

        db.refresh(
            assignment_record
        )

        db.refresh(
            pdf_document
        )

        # ---------------------------------------------------------
        # 6. Return generation result
        # ---------------------------------------------------------

        return {
            "assignment_id": assignment_record.id,
            "pdf_id": pdf_document.id,
            "status": "completed",
            "pages": len(pages),
            "filename": pdf_document.filename,
            "file_path": pdf_document.file_path,
            "validation": validation_result,
            "download_url": (
                f"/api/assignments/"
                f"{assignment_record.id}/download"
            ),
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate assignment PDF: "
                f"{error}"
            ),
        )

# =========================================================
# ASSIGNMENT HISTORY
# =========================================================

@router.get("")
def get_assignments(
    db: Session = Depends(get_db),
):
    assignments = (
        db.query(Assignment)
        .filter(
            Assignment.user_id == TEMP_USER_ID
        )
        .order_by(
            Assignment.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": assignment.id,
            "document_id": assignment.document_id,
            "title": assignment.title,
            "subject": assignment.subject,
            "student_name": assignment.student_name,
            "roll_number": assignment.roll_number,
            "class_name": assignment.class_name,
            "section": assignment.section,
            "teacher_name": assignment.teacher_name,
            "assignment_date": assignment.assignment_date,
            "template": assignment.template,
            "paper_style": assignment.paper_style,
            "handwriting_style": assignment.handwriting_style,
            "ink_color": assignment.ink_color,
            "page_count": assignment.page_count,
            "status": (
                "completed"
                if assignment.pdf_path
                else "draft"
            ),
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at,
        }
        for assignment in assignments
    ]

# =========================================================
# DOWNLOAD ASSIGNMENT
# =========================================================

@router.get("/{assignment_id}/download")
def download_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    """
    Download the latest generated PDF for an assignment.

    Step 27:
        Prefer the new PdfDocument storage record.

    Backward compatibility:
        If no PdfDocument record exists, fall back to
        Assignment.pdf_path used by older assignments.
    """

    # -----------------------------------------------------
    # 1. Find assignment
    # -----------------------------------------------------

    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.id == assignment_id,
            Assignment.user_id == TEMP_USER_ID,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found.",
        )

    # -----------------------------------------------------
    # 2. Find latest PdfDocument
    # -----------------------------------------------------

    pdf_document = (
        db.query(PdfDocument)
        .filter(
            PdfDocument.assignment_id
            == assignment.id,
            PdfDocument.user_id
            == TEMP_USER_ID,
        )
        .order_by(
            PdfDocument.created_at.desc()
        )
        .first()
    )

    pdf_path = None

    # -----------------------------------------------------
    # 3. Prefer PdfDocument path
    # -----------------------------------------------------

    if pdf_document:
        pdf_path = Path(
            pdf_document.file_path
        )

    # -----------------------------------------------------
    # 4. Backward compatibility
    # -----------------------------------------------------

    if (
        pdf_path is None
        or not pdf_path.exists()
    ):
        if assignment.pdf_path:

            legacy_path = Path(
                assignment.pdf_path
            )

            if legacy_path.exists():
                pdf_path = legacy_path

    # -----------------------------------------------------
    # 5. Verify PDF exists
    # -----------------------------------------------------

    if (
        pdf_path is None
        or not pdf_path.exists()
    ):
        raise HTTPException(
            status_code=404,
            detail="PDF file not found.",
        )

    if not pdf_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="PDF path is not a valid file.",
        )

    # -----------------------------------------------------
    # 6. Build human-readable filename
    # -----------------------------------------------------

    download_filename = (
        pdf_document.filename
        if pdf_document
        and pdf_document.filename
        else build_assignment_filename(
            title=assignment.title,
            student_name=assignment.student_name,
            db=db,
        )
    )

    # -----------------------------------------------------
    # 7. Return PDF
    # -----------------------------------------------------

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=download_filename,
    )

# =========================================================
# DELETE ASSIGNMENT
# =========================================================

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete an assignment and all associated PDF files.

    Removes:

        1. Stored PDF files
        2. PdfDocument database records
        3. Draft JSON
        4. Assignment database record
    """

    try:

        # -------------------------------------------------
        # 1. Find assignment
        # -------------------------------------------------

        assignment = (
            db.query(Assignment)
            .filter(
                Assignment.id == assignment_id,
                Assignment.user_id == TEMP_USER_ID,
            )
            .first()
        )

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )

        # -------------------------------------------------
        # 2. Find associated PDF records
        # -------------------------------------------------

        pdf_documents = (
            db.query(PdfDocument)
            .filter(
                PdfDocument.assignment_id
                == assignment.id,
                PdfDocument.user_id
                == TEMP_USER_ID,
            )
            .all()
        )

        # -------------------------------------------------
        # 3. Track deleted files
        # -------------------------------------------------

        deleted_paths = set()

        # -------------------------------------------------
        # 4. Delete PdfDocument files
        # -------------------------------------------------

        for pdf_document in pdf_documents:

            if not pdf_document.file_path:
                continue

            pdf_path = Path(
                pdf_document.file_path
            )

            resolved_path = str(
                pdf_path.resolve()
            )

            # Avoid deleting the same file twice.
            if resolved_path in deleted_paths:
                continue

            if pdf_path.exists():
                pdf_storage_service.delete_pdf(
                    pdf_path
                )

            deleted_paths.add(
                resolved_path
            )

        # -------------------------------------------------
        # 5. Delete legacy Assignment.pdf_path
        # -------------------------------------------------

        if assignment.pdf_path:

            legacy_pdf_path = Path(
                assignment.pdf_path
            )

            resolved_legacy_path = str(
                legacy_pdf_path.resolve()
            )

            if (
                resolved_legacy_path
                not in deleted_paths
            ):

                if legacy_pdf_path.exists():
                    pdf_storage_service.delete_pdf(
                        legacy_pdf_path
                    )

        # -------------------------------------------------
        # 6. Delete PdfDocument records
        # -------------------------------------------------

        for pdf_document in pdf_documents:
            db.delete(pdf_document)

        # -------------------------------------------------
        # 7. Delete draft JSON
        # -------------------------------------------------

        draft_path = (
            DRAFTS_DIRECTORY
            / f"{assignment.id}.json"
        )

        if draft_path.exists():
            draft_path.unlink()

        # -------------------------------------------------
        # 8. Delete assignment
        # -------------------------------------------------

        db.delete(assignment)

        db.commit()

        # -------------------------------------------------
        # 9. Return success
        # -------------------------------------------------

        return {
            "message": (
                "Assignment and associated PDF "
                "documents deleted successfully."
            )
        }

    except HTTPException:
        raise

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to delete assignment: "
                f"{error}"
            ),
        )
# =========================================================
# STEP 25 — REGENERATE ASSIGNMENT
# =========================================================

@router.post("/{assignment_id}/regenerate")
def regenerate_assignment(
    assignment_id: int,
    request: AssignmentRegenerateRequest,
    db: Session = Depends(get_db),
):
    """
    Regenerate an existing assignment.

    The existing Assignment record is updated instead of
    creating a new assignment history entry.

    PDF flow:

        AssignmentService
              ↓
        AssignmentPageLayout
              ↓
        AssignmentPDFRenderer
              ↓
        Temporary PDF
              ↓
        PDFValidationService
              ↓
        storage/pdf/final/
              ↓
        PdfDocument

    Only the latest PdfDocument is retained.
    """

    temporary_pdf_path = None
    final_pdf_path = None

    try:

        # =====================================================
        # 1. FIND EXISTING ASSIGNMENT
        # =====================================================

        assignment_record = (
            db.query(Assignment)
            .filter(
                Assignment.id == assignment_id,
                Assignment.user_id == TEMP_USER_ID,
            )
            .first()
        )

        if not assignment_record:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )

        # =====================================================
        # 2. LOAD ORIGINAL STRUCTURED DOCUMENT
        # =====================================================

        from app.api.documents import get_document

        document = get_document(
            assignment_record.document_id
        )

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Source document not found.",
            )

        # =====================================================
        # 3. KEEP OLD VALUES WHEN NOT PROVIDED
        # =====================================================

        new_paper = (
            request.paper
            or assignment_record.paper_style
            or "ruled"
        )

        new_handwriting_style = (
            request.handwriting_style
            or assignment_record.handwriting_style
            or "school_notebook"
        )

        new_ink = (
            request.ink
            or assignment_record.ink_color
            or "blue"
        )

        # =====================================================
        # 4. BUILD ASSIGNMENT SETTINGS
        # =====================================================

        assignment_data = {
            "title": assignment_record.title,

            "subject": (
                assignment_record.subject
                or ""
            ),

            "studentName": (
                assignment_record.student_name
                or ""
            ),

            "rollNumber": (
                assignment_record.roll_number
                or ""
            ),

            "className": (
                assignment_record.class_name
                or ""
            ),

            "section": (
                assignment_record.section
                or ""
            ),

            "teacherName": (
                assignment_record.teacher_name
                or ""
            ),

            "date": (
                assignment_record.assignment_date
                or ""
            ),

            "template": (
                assignment_record.template
                or "college_assignment"
            ),

            "paperStyle": new_paper,

            "handwritingStyle": (
                new_handwriting_style
            ),

            "ink": new_ink,

            "showPageNumber": (
                request.page_numbers
                if request.page_numbers is not None
                else True
            ),

            **request.assignment,
        }

        # =====================================================
        # 5. BUILD PAGE CONFIGURATION
        # =====================================================

        page_config = build_page_config(
            page=assignment_data,
            assignment=assignment_data,
        )

        # =====================================================
        # 6. REBUILD PAGINATION
        # =====================================================

        service = AssignmentService(
            page_config=page_config
        )

        result = service.build_assignment(
            document=document,
            assignment=assignment_data,
        )

        pages = result.get(
            "pages",
            [],
        )

        if not pages:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unable to regenerate assignment: "
                    "no pages were produced."
                ),
            )

        # =====================================================
        # 7. CREATE TEMPORARY PDF
        # =====================================================

        temporary_directory = (
            Path("generated")
            / "assignments"
            / "temporary"
        )

        temporary_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        temporary_pdf_id = str(
            uuid4()
        )

        temporary_pdf_path = (
            temporary_directory
            / f"{temporary_pdf_id}.pdf"
        )

        renderer = AssignmentPDFRenderer(
            page_config=page_config,
            handwriting=request.handwriting,
        )

        renderer.render(
            pages=pages,
            output_path=str(
                temporary_pdf_path
            ),
        )

        # =====================================================
        # 8. VALIDATE GENERATED PDF
        # =====================================================

        expected_page_size = (
            get_expected_pdf_page_size(
                page_config
            )
        )

        validation_result = (
            pdf_validation_service.validate(
                pdf_path=temporary_pdf_path,
                expected_page_count=len(
                    pages
                ),
                expected_page_size=(
                    expected_page_size
                ),
            )
        )

        # -----------------------------------------------------
        # Use the existing filename when available.
        # Otherwise create a new human-readable filename.
        # -----------------------------------------------------

        existing_pdf_document = (
            db.query(PdfDocument)
            .filter(
                PdfDocument.assignment_id
                == assignment_record.id,
                PdfDocument.user_id
                == TEMP_USER_ID,
            )
            .order_by(
                PdfDocument.created_at.desc()
            )
            .first()
        )

        if (
            existing_pdf_document
            and existing_pdf_document.filename
        ):
            pdf_filename = (
                existing_pdf_document.filename
            )
        else:
            pdf_filename = build_assignment_filename(
                title=assignment_record.title,
                student_name=(
                    assignment_record.student_name
                    or ""
                ),
                db=db,
            )

        # =====================================================
        # 10. STORE VALIDATED PDF
        # =====================================================

        final_pdf_path = (
            pdf_storage_service.save_final_pdf(
                source_path=temporary_pdf_path,
                filename=pdf_filename,
            )
        )

        # =====================================================
        # 11. DELETE TEMPORARY PDF
        # =====================================================

        if temporary_pdf_path.exists():
            temporary_pdf_path.unlink()

        temporary_pdf_path = None

        # =====================================================
        # 12. FIND EXISTING PdfDocument RECORDS
        # =====================================================

        old_pdf_documents = (
            db.query(PdfDocument)
            .filter(
                PdfDocument.assignment_id
                == assignment_record.id,
                PdfDocument.user_id
                == TEMP_USER_ID,
            )
            .all()
        )

        # =====================================================
        # 13. DELETE OLD PDF FILES
        # =====================================================

        deleted_paths = set()

        for old_pdf_document in (
            old_pdf_documents
        ):

            if not old_pdf_document.file_path:
                continue

            old_pdf_path = Path(
                old_pdf_document.file_path
            )

            resolved_old_path = str(
                old_pdf_path.resolve()
            )

            # Never accidentally delete the newly
            # generated final PDF.
            if (
                resolved_old_path
                == str(
                    final_pdf_path.resolve()
                )
            ):
                continue

            if (
                resolved_old_path
                not in deleted_paths
            ):

                if old_pdf_path.exists():
                    pdf_storage_service.delete_pdf(
                        old_pdf_path
                    )

                deleted_paths.add(
                    resolved_old_path
                )

        # =====================================================
        # 14. DELETE OLD PdfDocument RECORDS
        # =====================================================

        for old_pdf_document in (
            old_pdf_documents
        ):
            db.delete(
                old_pdf_document
            )

        # =====================================================
        # 15. DELETE OLD LEGACY PDF IF DIFFERENT
        # =====================================================

        old_assignment_pdf_path = (
            assignment_record.pdf_path
        )

        if old_assignment_pdf_path:

            old_assignment_pdf = Path(
                old_assignment_pdf_path
            )

            old_assignment_resolved = str(
                old_assignment_pdf.resolve()
            )

            new_pdf_resolved = str(
                final_pdf_path.resolve()
            )

            if (
                old_assignment_resolved
                != new_pdf_resolved
                and old_assignment_resolved
                not in deleted_paths
            ):

                if old_assignment_pdf.exists():
                    pdf_storage_service.delete_pdf(
                        old_assignment_pdf
                    )

        # =====================================================
        # 16. UPDATE ASSIGNMENT RECORD
        # =====================================================

        assignment_record.paper_style = (
            new_paper
        )

        assignment_record.handwriting_style = (
            new_handwriting_style
        )

        assignment_record.ink_color = (
            new_ink
        )

        assignment_record.page_count = (
            len(pages)
        )

        assignment_record.pdf_path = str(
            final_pdf_path
        )

        # =====================================================
        # 17. CREATE NEW PdfDocument RECORD
        # =====================================================

        pdf_document = PdfDocument(
            user_id=TEMP_USER_ID,

            document_id=(
                assignment_record.document_id
            ),

            assignment_id=(
                assignment_record.id
            ),

            filename=pdf_filename,

            file_path=str(
                final_pdf_path
            ),

            page_size=str(
                assignment_data.get(
                    "paperSize",
                    "A4",
                )
                or "A4"
            ),

            page_count=len(
                pages
            ),
        )

        db.add(
            pdf_document
        )

        # =====================================================
        # 18. COMMIT DATABASE CHANGES
        # =====================================================

        db.commit()

        db.refresh(
            assignment_record
        )

        db.refresh(
            pdf_document
        )

        # =====================================================
        # 19. RETURN RESULT
        # =====================================================

        return {
            "assignment_id": (
                assignment_record.id
            ),

            "pdf_id": (
                pdf_document.id
            ),

            "status": "regenerated",

            "pages": len(
                pages
            ),

            "filename": (
                pdf_document.filename
            ),

            "file_path": (
                pdf_document.file_path
            ),

            "validation": (
                validation_result
            ),

            "download_url": (
                f"/api/assignments/"
                f"{assignment_record.id}/download"
            ),
        }

    except HTTPException:
        raise

    except PDFValidationError as error:

        # -----------------------------------------------------
        # Remove invalid temporary PDF
        # -----------------------------------------------------

        if (
            temporary_pdf_path
            and temporary_pdf_path.exists()
        ):
            temporary_pdf_path.unlink()

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Regenerated PDF failed validation: "
                f"{error}"
            ),
        )

    except Exception as error:

        # -----------------------------------------------------
        # Remove temporary PDF
        # -----------------------------------------------------

        if (
            temporary_pdf_path
            and temporary_pdf_path.exists()
        ):
            temporary_pdf_path.unlink()

        # -----------------------------------------------------
        # Remove final PDF if database operation failed
        # -----------------------------------------------------

        if (
            final_pdf_path
            and final_pdf_path.exists()
        ):
            try:
                pdf_storage_service.delete_pdf(
                    final_pdf_path
                )
            except Exception:
                pass

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to regenerate assignment: "
                f"{error}"
            ),
        )