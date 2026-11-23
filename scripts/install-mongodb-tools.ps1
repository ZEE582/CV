$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$toolsRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.cache/mongodb-tools'))
New-Item -ItemType Directory -Path $toolsRoot -Force | Out-Null
$archive=Join-Path $toolsRoot 'mongodb-database-tools-windows-x86_64-100.20.1.zip'
$expected='5a1a8aa2c87ca0685ffdcad403601b110d495d44afe579473b8f75ec46621c80'
if(!(Test-Path -LiteralPath $archive)){
 Invoke-WebRequest 'https://fastdl.mongodb.org/tools/db/mongodb-database-tools-windows-x86_64-100.20.1.zip' -OutFile $archive
}
if((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw 'Database Tools checksum mismatch; executable not run.'}
Expand-Archive -LiteralPath $archive -DestinationPath $toolsRoot -Force
$bin=Join-Path $toolsRoot 'mongodb-database-tools-windows-x86_64-100.20.1/bin'
& (Join-Path $bin 'mongodump.exe') --version
if($LASTEXITCODE -ne 0){throw 'mongodump version check failed.'}
& (Join-Path $bin 'mongorestore.exe') --version
if($LASTEXITCODE -ne 0){throw 'mongorestore version check failed.'}
Write-Output 'Verified official Database Tools 100.20.1 in project cache. No system installation or database change.'
