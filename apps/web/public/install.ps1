$ErrorActionPreference = "Stop"

function Write-Info {
  param([string]$Message)
  Write-Host "==> " -ForegroundColor Yellow -NoNewline
  Write-Host $Message
}

$arch = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
$target = switch ($arch) {
  "AMD64" { "windows-x64" }
  "ARM64" { "windows-arm64" }
  default { $null }
}
if (-not $target) {
  throw "yoink for Windows supports x64 and arm64 (detected $arch)."
}

$repo = "MajidRaimi/yoink"
$asset = "yoink-$target.zip"

$version = $env:YOINK_VERSION
if (-not $version) {
  $version = Invoke-RestMethod "https://api.github.com/repos/$repo/releases" |
    Where-Object { $_.tag_name -match '^v[0-9]' -and $_.tag_name -notlike 'desktop-*' } |
    Select-Object -First 1 -ExpandProperty tag_name
}
if (-not $version) {
  throw "could not resolve the latest yoink version."
}

$base = "https://github.com/$repo/releases/download/$version"
$tmp = New-Item -ItemType Directory -Path (Join-Path $env:TEMP "yoink-install-$([Guid]::NewGuid().ToString('N'))")

try {
  Write-Info "downloading yoink $version ($target)"
  $zip = Join-Path $tmp.FullName $asset
  Invoke-WebRequest -Uri "$base/$asset" -OutFile $zip

  $checksums = Join-Path $tmp.FullName "checksums.txt"
  Invoke-WebRequest -Uri "$base/checksums.txt" -OutFile $checksums

  $entry = Get-Content $checksums | Where-Object { $_ -match "\s$([regex]::Escape($asset))$" } | Select-Object -First 1
  if (-not $entry) {
    throw "no checksum entry found for $asset"
  }
  $expected = ($entry -split "\s+")[0]
  $actual = (Get-FileHash -Algorithm SHA256 -Path $zip).Hash
  if ($expected -ne $actual) {
    throw "checksum mismatch for $asset"
  }
  Write-Info "checksum verified"

  $installDir = Join-Path $env:LOCALAPPDATA "Programs\yoink"
  Expand-Archive -Path $zip -DestinationPath $installDir -Force
  Write-Info "installed to $installDir\yoink.exe"

  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $userPathEntries = ($userPath -split ";") | Where-Object { $_ } | ForEach-Object { $_.TrimEnd("\") }
  if ($userPathEntries -notcontains $installDir.TrimEnd("\")) {
    $newUserPath = if ($userPath) { "$userPath;$installDir" } else { $installDir }
    [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
    Write-Info "added $installDir to your PATH, restart your terminal to pick it up"
  }
  $env:Path = "$env:Path;$installDir"

  Write-Info "run 'yoink add' to register your first account"
  & (Join-Path $installDir "yoink.exe") version
}
finally {
  Remove-Item -Recurse -Force $tmp.FullName -ErrorAction SilentlyContinue
}
