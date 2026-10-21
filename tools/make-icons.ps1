# make-icons.ps1
$ErrorActionPreference = "Stop"

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$htmlPath = (Resolve-Path "e:\math\tools\icon-canvas.html").Path
$fileUrl = "file:///" + $htmlPath.Replace("\", "/")
$out512 = "e:\math\icon-512.png"

Write-Output "Rendering 512x512 with Edge headless..."
& $edgePath --headless --screenshot="$out512" --window-size=512,512 --default-background-color=00000000 "$fileUrl"

Start-Sleep -Milliseconds 1500

if (-not (Test-Path $out512)) {
    throw "Failed to create $out512"
}

Write-Output "Successfully generated $out512"

Add-Type -AssemblyName System.Drawing

function Resize-Image($srcPath, $destPath, $targetWidth, $targetHeight) {
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $destBitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($srcImg, 0, 0, $targetWidth, $targetHeight)
    
    $destBitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $destBitmap.Dispose()
    $srcImg.Dispose()
    Write-Output "Generated $destPath ($($targetWidth)x$($targetHeight))"
}

Resize-Image $out512 "e:\math\apple-touch-icon.png" 180 180
Resize-Image $out512 "e:\math\icon-192.png" 192 192
Resize-Image $out512 "e:\math\favicon-32x32.png" 32 32
Resize-Image $out512 "e:\math\favicon-16x16.png" 16 16

Write-Output "All icons generated successfully!"
