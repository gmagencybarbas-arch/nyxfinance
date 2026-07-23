# Atualiza DATABASE_URL para pooler Supabase (Vercel serverless) e sobe na Vercel.
# Nao imprime senhas.

function Get-EnvVal($name) {
  foreach ($f in @('.env.local', '.env')) {
    if (-not (Test-Path $f)) { continue }
    $line = Get-Content $f | Where-Object { $_ -match ("^\s*" + [regex]::Escape($name) + "\s*=") } | Select-Object -First 1
    if ($line -match '^\s*[^=]+=\s*(.*)$') {
      $v = $Matches[1].Trim().Trim('"').Trim("'")
      if ($v) { return $v }
    }
  }
  return $null
}

$db = Get-EnvVal 'DATABASE_URL'
if (-not $db) { throw 'DATABASE_URL nao encontrada' }

# Se ja for pooler, extrai senha do formato postgres.ref:pass@pooler
if ($db -match 'postgresql://postgres\.([^:]+):([^@]+)@aws-0-([^.]+)\.pooler\.supabase\.com:(\d+)/') {
  $ref = $Matches[1]
  $dbPass = $Matches[2]
  $region = $Matches[3]
  Write-Host "ja pooler ref=$ref region=$region"
} elseif ($db -match 'postgresql://([^:]+):([^@]+)@db\.([^:/]+)\.supabase\.co:(\d+)/') {
  $dbPass = $Matches[2]
  $ref = $Matches[3]
  $region = 'sa-east-1'
  Write-Host "direct->pooler ref=$ref region=$region"
} else {
  throw 'formato DATABASE_URL nao reconhecido'
}

$encPass = [Uri]::EscapeDataString($dbPass)
$direct = "postgresql://postgres:${encPass}@db.${ref}.supabase.co:5432/postgres"
$pooler = "postgresql://postgres.${ref}:${encPass}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

foreach ($envPath in @('.env.local', '.env')) {
  if (-not (Test-Path $envPath)) { continue }
  $content = Get-Content $envPath -Raw
  if ($content -match '(?m)^DATABASE_URL=') {
    $content = [regex]::Replace($content, '(?m)^DATABASE_URL=.*$', "DATABASE_URL=`"$pooler`"")
  } else {
    $content = $content.TrimEnd() + "`nDATABASE_URL=`"$pooler`"`n"
  }
  if ($content -match '(?m)^DIRECT_URL=') {
    $content = [regex]::Replace($content, '(?m)^DIRECT_URL=.*$', "DIRECT_URL=`"$direct`"")
  } else {
    $content = $content.TrimEnd() + "`nDIRECT_URL=`"$direct`"`n"
  }
  [System.IO.File]::WriteAllText((Resolve-Path $envPath), $content)
  Write-Host "updated $envPath"
}

Write-Host 'Uploading to Vercel nyxfinance...'
npx vercel env add DATABASE_URL production,preview --project nyxfinance --value $pooler --force --yes --sensitive
npx vercel env add DIRECT_URL production,preview --project nyxfinance --value $direct --force --yes --sensitive
Write-Host 'Redeploying...'
npx vercel --prod --yes --project nyxfinance
Write-Host 'ALL_OK'
