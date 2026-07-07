# run.ps1
Set-Location $PSScriptRoot

if (-Not (Test-Path "build")) {
    New-Item -ItemType Directory -Force -Path "build"
}

Set-Location build
cmake ..
cmake --build . --config Release

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild successful. Running CCIMS...`n" -ForegroundColor Green
    if (Test-Path "../build/ccims_cli.exe") {
        ../build/ccims_cli.exe
    } else {
        ../build/Release/ccims_cli.exe
    }
} else {
    Write-Host "`nBuild failed." -ForegroundColor Red
}

Set-Location $PSScriptRoot
