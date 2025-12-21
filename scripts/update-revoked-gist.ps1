# ============================================
# سكريبت تحديث التراخيص الملغاة على GitHub Gist
# ============================================

# الإعدادات - عدّل هذه القيم:
$GITHUB_TOKEN = "YOUR_GITHUB_TOKEN_HERE"  # Personal Access Token
$GIST_ID = "YOUR_GIST_ID_HERE"            # معرف الـ Gist (الجزء الأخير من الرابط)
$FILE_PATH = "revoked-licenses.json"       # مسار الملف المحلي

# ============================================
# لا تعدّل أسفل هذا السطر
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   تحديث التراخيص الملغاة على Gist" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود الملف
if (-not (Test-Path $FILE_PATH)) {
    Write-Host "خطأ: الملف $FILE_PATH غير موجود!" -ForegroundColor Red
    Write-Host "تأكد من تصدير الملف من صفحة الأدمن أولاً" -ForegroundColor Yellow
    exit 1
}

# قراءة محتوى الملف
$content = Get-Content -Path $FILE_PATH -Raw -Encoding UTF8

# تجهيز البيانات للإرسال
$body = @{
    files = @{
        "revoked-licenses.json" = @{
            content = $content
        }
    }
} | ConvertTo-Json -Depth 3

# إرسال التحديث
try {
    $response = Invoke-RestMethod `
        -Uri "https://api.github.com/gists/$GIST_ID" `
        -Method Patch `
        -Headers @{
            "Authorization" = "Bearer $GITHUB_TOKEN"
            "Accept" = "application/vnd.github+json"
            "User-Agent" = "ProfileSuite-Updater"
        } `
        -Body $body `
        -ContentType "application/json; charset=utf-8"
    
    Write-Host ""
    Write-Host "✅ تم التحديث بنجاح!" -ForegroundColor Green
    Write-Host ""
    Write-Host "رابط الملف:" -ForegroundColor Yellow
    Write-Host $response.files.'revoked-licenses.json'.raw_url -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host "❌ فشل التحديث!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "اضغط أي مفتاح للإغلاق..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
