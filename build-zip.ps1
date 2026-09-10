# PowerShell script to package the project for AWS Elastic Beanstalk deployment

$ErrorActionPreference = "Stop"

$workspaceDir = $PSScriptRoot
$outputZip = Join-Path $workspaceDir "deploy.zip"
$tempStagingDir = Join-Path $workspaceDir "deploy_temp_staging"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Preparing AWS Elastic Beanstalk Deployment Zip" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Clean previous artifacts
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
    Write-Host "[-] Removed existing deploy.zip" -ForegroundColor Yellow
}

if (Test-Path $tempStagingDir) {
    Remove-Item $tempStagingDir -Recurse -Force
}

New-Item -ItemType Directory -Path $tempStagingDir | Out-Null

# 2. Files & Folders to include in Elastic Beanstalk Bundle
$itemsToInclude = @(
    "index.html",
    "pdr.html",
    "museum-plan.html",
    "notes-kanban.html",
    "team-admin.html",
    "style.css",
    "server.js",
    "db.js",
    "package.json",
    ".env.example",
    "Procfile",
    "js",
    "assets",
    "data",
    "uploads",
    ".ebextensions"
)

foreach ($item in $itemsToInclude) {
    $srcPath = Join-Path $workspaceDir $item
    if (Test-Path $srcPath) {
        $destPath = Join-Path $tempStagingDir $item
        if (Test-Path $srcPath -PathType Container) {
            Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
        } else {
            Copy-Item -Path $srcPath -Destination $destPath -Force
        }
        Write-Host "[+] Included: $item" -ForegroundColor Green
    } else {
        Write-Host "[!] Warning: Item '$item' not found, skipped." -ForegroundColor Yellow
    }
}

# 3. Create Zip file with standard forward slashes (Linux/AWS compatible)
Write-Host "`nCompressing files into deploy.zip..." -ForegroundColor Cyan
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipStream = [System.IO.File]::Open($outputZip, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $tempStagingDir -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($tempStagingDir.Length + 1).Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $relative, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    Write-Host "  -> Packed: $relative" -ForegroundColor DarkGray
}

$archive.Dispose()
$zipStream.Dispose()

# 4. Clean staging directory
Remove-Item $tempStagingDir -Recurse -Force

# 5. Output Summary
$zipSize = (Get-Item $outputZip).Length / 1KB
Write-Host "`n==============================================" -ForegroundColor Green
Write-Host " [SUCCESS] Bundle created successfully!" -ForegroundColor Green
Write-Host " File: deploy.zip ($([math]::Round($zipSize, 2)) KB)" -ForegroundColor Green
Write-Host " Path: $outputZip" -ForegroundColor Green
Write-Host " You can now upload 'deploy.zip' directly to AWS Elastic Beanstalk Console." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
