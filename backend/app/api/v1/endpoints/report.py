from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.models.domain import DomainAnalysisRequest
from app.api.v1.endpoints.domain import analyze_domain
from app.reports.pdf_generator import PDFReportGenerator
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

pdf_generator = PDFReportGenerator()


@router.post("/generate")
async def generate_report(request: DomainAnalysisRequest):
    """
    Generate PDF report for domain analysis
    
    This endpoint:
    1. Performs domain analysis
    2. Generates court-ready PDF
    3. Returns download link
    """
    try:
        # Perform analysis
        analysis_result = await analyze_domain(request)
        
        # Generate PDF
        pdf_path = pdf_generator.generate_report(analysis_result.data)
        
        return {
            "status": "success",
            "data": {
                "report_path": pdf_path,
                "filename": pdf_path.split('/')[-1],
                "download_url": f"/api/v1/report/download/{pdf_path.split('/')[-1]}"
            }
        }
        
    except Exception as e:
        logger.error(f"Report generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Report generation failed: {str(e)}"
        )


@router.get("/download/{filename}")
async def download_report(filename: str):
    """Download generated PDF report"""
    try:
        filepath = f"./reports/{filename}"
        return FileResponse(
            filepath,
            media_type='application/pdf',
            filename=filename
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )