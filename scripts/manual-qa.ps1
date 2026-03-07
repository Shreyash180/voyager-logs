param(
  [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "Voyager Logs manual QA smoke checks against $BaseUrl"

function Check-Endpoint($Path) {
  try {
    $res = Invoke-WebRequest -Uri "$BaseUrl$Path" -UseBasicParsing -TimeoutSec 15
    Write-Host "[OK] $Path -> $($res.StatusCode)"
  } catch {
    Write-Host "[FAIL] $Path -> $($_.Exception.Message)"
  }
}

Check-Endpoint "/"
Check-Endpoint "/api/health"
Check-Endpoint "/api/posts?page=1&limit=5"
Check-Endpoint "/login"
Check-Endpoint "/register"

Write-Host ""
Write-Host "Manual checks to perform in browser:"
Write-Host "1. Login as admin and open /admin/posts/new"
Write-Host "2. Test thumbnail preview + upload"
Write-Host "3. Test video URL preview"
Write-Host "4. Create post with tags and verify homepage card"
Write-Host "5. Test search, tag filter, pagination"
Write-Host "6. Open post and test like/comment/bookmark"
