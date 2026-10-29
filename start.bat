@echo off
title Takshashila Platform Runner
echo ===================================================================
echo             Starting Takshashila Platform (Unified Mode)           
echo ===================================================================
echo.
echo  [1/2] Frontend (Vite): http://localhost:5173
echo  [2/2] Backend API (FastAPI + RAG + Vision): http://localhost:8000
echo.
echo  Press Ctrl+C to stop both services anytime.
echo ===================================================================
echo.

npm run dev:all

