# License Generator Script for PowerShell
# Run: .\scripts\license-generator.ps1

$licensesFile = "$PSScriptRoot\licenses.json"

function Load-Licenses {
    if (Test-Path $licensesFile) {
        return Get-Content $licensesFile | ConvertFrom-Json
    }
    return @()
}

function Save-Licenses($licenses) {
    $licenses | ConvertTo-Json -Depth 10 | Set-Content $licensesFile -Encoding UTF8
}

function Generate-Key {
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    $key = ""
    for ($i = 0; $i -lt 16; $i++) {
        if ($i -gt 0 -and $i % 4 -eq 0) { $key += "-" }
        $key += $chars[(Get-Random -Maximum $chars.Length)]
    }
    return $key
}

function Create-License {
    Write-Host "`n=== انشاء ترخيص جديد ===" -ForegroundColor Cyan
    
    $clientName = Read-Host "اسم العميل"
    if ([string]::IsNullOrWhiteSpace($clientName)) {
        Write-Host "اسم العميل مطلوب!" -ForegroundColor Red
        return
    }
    
    $clientEmail = Read-Host "البريد الالكتروني (اختياري)"
    
    Write-Host "`nنوع الترخيص:"
    Write-Host "  1. trial (تجريبي - 7 ايام)"
    Write-Host "  2. basic (اساسي - 30 يوم)"
    Write-Host "  3. pro (احترافي - 365 يوم)"
    Write-Host "  4. enterprise (مؤسسي - 730 يوم)"
    $typeChoice = Read-Host "اختر (1-4)"
    
    $typeMap = @{
        "1" = @{ name = "trial"; days = 7; profiles = 5 }
        "2" = @{ name = "basic"; days = 30; profiles = 20 }
        "3" = @{ name = "pro"; days = 365; profiles = 100 }
        "4" = @{ name = "enterprise"; days = 730; profiles = 999 }
    }
    
    if (-not $typeMap.ContainsKey($typeChoice)) {
        Write-Host "اختيار غير صحيح!" -ForegroundColor Red
        return
    }
    
    $selectedType = $typeMap[$typeChoice]
    
    $customProfiles = Read-Host "عدد البروفايلات (اتركه فارغ للافتراضي: $($selectedType.profiles))"
    if ([string]::IsNullOrWhiteSpace($customProfiles)) {
        $maxProfiles = $selectedType.profiles
    } else {
        $maxProfiles = [int]$customProfiles
    }
    
    $customDays = Read-Host "مدة الترخيص بالايام (اتركه فارغ للافتراضي: $($selectedType.days))"
    if ([string]::IsNullOrWhiteSpace($customDays)) {
        $days = $selectedType.days
    } else {
        $days = [int]$customDays
    }
    
    $key = Generate-Key
    $now = Get-Date
    $expiration = $now.AddDays($days)
    
    $licenseData = @{
        k = $key
        t = $selectedType.name
        m = $maxProfiles
        e = $expiration.ToString("yyyy-MM-ddTHH:mm:ss")
        c = $now.ToString("yyyy-MM-ddTHH:mm:ss")
    }
    
    $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($licenseData | ConvertTo-Json -Compress))
    $licenseCode = [Convert]::ToBase64String($jsonBytes)
    
    $license = @{
        id = [guid]::NewGuid().ToString()
        key = $key
        code = $licenseCode
        clientName = $clientName
        clientEmail = $clientEmail
        type = $selectedType.name
        maxProfiles = $maxProfiles
        createdAt = $now.ToString("yyyy-MM-dd HH:mm:ss")
        expiresAt = $expiration.ToString("yyyy-MM-dd HH:mm:ss")
    }
    
    $licenses = @(Load-Licenses)
    $licenses += $license
    Save-Licenses $licenses
    
    Write-Host "`n" -NoNewline
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "    تم انشاء الترخيص بنجاح!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nمعلومات الترخيص:" -ForegroundColor Yellow
    Write-Host "  العميل: $clientName"
    Write-Host "  النوع: $($selectedType.name)"
    Write-Host "  البروفايلات: $maxProfiles"
    Write-Host "  ينتهي في: $($expiration.ToString('yyyy-MM-dd'))"
    Write-Host "`nكود الترخيص (انسخه للعميل):" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $licenseCode -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    
    # Copy to clipboard
    $licenseCode | Set-Clipboard
    Write-Host "(تم نسخ الكود للحافظة)" -ForegroundColor Gray
}

function Show-Licenses {
    $licenses = @(Load-Licenses)
    
    if ($licenses.Count -eq 0) {
        Write-Host "`nلا توجد تراخيص محفوظة." -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n=== التراخيص المحفوظة ($($licenses.Count)) ===" -ForegroundColor Cyan
    
    for ($i = 0; $i -lt $licenses.Count; $i++) {
        $lic = $licenses[$i]
        $expired = (Get-Date) -gt [DateTime]::Parse($lic.expiresAt)
        $status = if ($expired) { "[منتهي]" } else { "[فعال]" }
        $color = if ($expired) { "Red" } else { "Green" }
        
        Write-Host "`n[$($i + 1)] $($lic.clientName) - $($lic.type)" -ForegroundColor $color
        Write-Host "    المفتاح: $($lic.key)"
        Write-Host "    البروفايلات: $($lic.maxProfiles)"
        Write-Host "    ينتهي: $($lic.expiresAt) $status"
    }
}

function Copy-LicenseCode {
    $licenses = @(Load-Licenses)
    
    if ($licenses.Count -eq 0) {
        Write-Host "`nلا توجد تراخيص." -ForegroundColor Yellow
        return
    }
    
    Show-Licenses
    $choice = Read-Host "`nاختر رقم الترخيص للنسخ"
    $index = [int]$choice - 1
    
    if ($index -ge 0 -and $index -lt $licenses.Count) {
        $licenses[$index].code | Set-Clipboard
        Write-Host "`nتم نسخ كود الترخيص للحافظة!" -ForegroundColor Green
    } else {
        Write-Host "اختيار غير صحيح!" -ForegroundColor Red
    }
}

function Delete-License {
    $licenses = @(Load-Licenses)
    
    if ($licenses.Count -eq 0) {
        Write-Host "`nلا توجد تراخيص." -ForegroundColor Yellow
        return
    }
    
    Show-Licenses
    $choice = Read-Host "`nاختر رقم الترخيص للحذف"
    $index = [int]$choice - 1
    
    if ($index -ge 0 -and $index -lt $licenses.Count) {
        $name = $licenses[$index].clientName
        $licenses = $licenses | Where-Object { $_ -ne $licenses[$index] }
        Save-Licenses $licenses
        Write-Host "`nتم حذف ترخيص: $name" -ForegroundColor Green
    } else {
        Write-Host "اختيار غير صحيح!" -ForegroundColor Red
    }
}

# Main Menu
function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║     مولد التراخيص - Profile Suite  ║" -ForegroundColor Cyan
    Write-Host "  ╚════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. انشاء ترخيص جديد" -ForegroundColor White
    Write-Host "  2. عرض التراخيص" -ForegroundColor White
    Write-Host "  3. نسخ كود ترخيص" -ForegroundColor White
    Write-Host "  4. حذف ترخيص" -ForegroundColor White
    Write-Host "  5. خروج" -ForegroundColor White
    Write-Host ""
}

# Main Loop
do {
    Show-Menu
    $choice = Read-Host "اختر"
    
    switch ($choice) {
        "1" { Create-License }
        "2" { Show-Licenses }
        "3" { Copy-LicenseCode }
        "4" { Delete-License }
        "5" { 
            Write-Host "`nمع السلامة!" -ForegroundColor Cyan
            exit 
        }
        default { Write-Host "اختيار غير صحيح!" -ForegroundColor Red }
    }
    
    if ($choice -ne "5") {
        Write-Host ""
        Read-Host "اضغط Enter للمتابعة"
    }
} while ($true)
