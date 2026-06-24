@echo off
chcp 65001 >nul
echo.
echo ================================================
echo    Background Image Library - Update index.json
echo ================================================
echo.

cd /d "%~dp0.."

echo Scanning image folders...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$categories = @('EL','Fashion','FMCG','Lifestyle'); $result = @{}; foreach ($cat in $categories) { $hbnPath = 'bgimg\'+$cat+'\HBN'; $ddPath = 'bgimg\'+$cat+'\DDCARD'; $hbnFiles = @(); $ddFiles = @(); if (Test-Path $hbnPath) { $hbnFiles = Get-ChildItem -Path $hbnPath -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)$' } | Select-Object -ExpandProperty Name | Sort-Object { [regex]::Replace($_, '\d+', { $args[0].Value.PadLeft(10) }) } }; if (Test-Path $ddPath) { $ddFiles = Get-ChildItem -Path $ddPath -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)$' } | Select-Object -ExpandProperty Name | Sort-Object { [regex]::Replace($_, '\d+', { $args[0].Value.PadLeft(10) }) } }; $result[$cat] = @{ hbn = $hbnFiles; ddcard = $ddFiles }; Write-Host ('  '+$cat+': HBN '+$hbnFiles.Count+' / DDCARD '+$ddFiles.Count) }; $result | ConvertTo-Json -Depth 4 | Out-File -FilePath 'bgimg\index.json' -Encoding UTF8; Write-Host ''; Write-Host 'DONE! index.json updated. Please press F5 in browser.' -ForegroundColor Green"

echo.
pause