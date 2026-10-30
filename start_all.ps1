Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "            Starting Takshashila Platform (Unified Mode)           " -ForegroundColor Yellow
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " [1/2] Frontend (Vite): http://localhost:5173" -ForegroundColor Green
Write-Host " [2/2] Backend API (FastAPI + RAG + Vision): http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host " Press Ctrl+C to stop both services anytime." -ForegroundColor DarkGray
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

npm run dev:all

