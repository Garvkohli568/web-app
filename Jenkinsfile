pipeline {
  agent any
  options { timestamps() }
  tools { nodejs 'node-20' }                    // Manage Jenkins → Tools → NodeJS → name must match

  environment {
    CI   = 'true'
    PORT = '3000'                               // staging port
    PROD_PORT = '4001'                          // "production" port (simulated)
  }

  stages {

    stage('Checkout') {
      steps {
        deleteDir()                             // clean workspace each run
        checkout scm
      }
    }

    stage('Tool Install') {
      steps {
        bat 'node -v & npm -v'
      }
    }

    stage('Build') {
      steps {
        bat 'npm ci'                            // clean, reproducible install
      }
    }

    stage('Test') {
      steps {
        // strict: must have and pass tests
        bat 'npm run test:ci'
      }
    }

    // 6) CODE QUALITY — ESLint (non-blocking first pass, publishes JUnit report)
    stage('Code Quality') {
      steps {
        // Ensure eslint exists (idempotent)
        bat 'npm i -D eslint >NUL 2>&1 || exit /b 0'

        // Create minimal config if missing
        powershell '''
          if (-not (Test-Path ".eslintrc.json")) {
            $cfg = @{
              env = @{ node = $true; jest = $true }
              extends = "eslint:recommended"
              rules = @{}
            } | ConvertTo-Json -Compress
            Set-Content -Encoding UTF8 -Path .eslintrc.json -Value $cfg
          }
        '''

        // Lint source; do not fail the build on first pass (exit 0)
        bat 'mkdir reports 2>NUL & npx eslint . --ext .js -f junit -o reports\\eslint.xml || exit /b 0'

        // Publish ESLint JUnit output (if present)
        junit allowEmptyResults: true, testResults: 'reports/eslint.xml'
        archiveArtifacts artifacts: '.eslintrc.json,reports/eslint.xml', onlyIfSuccessful: false
      }
    }

    // 7) SECURITY — npm audit gate: fail on High/Critical vulns
    stage('Security') {
      steps {
        bat 'mkdir reports 2>NUL & npm audit --production --json > reports\\npm-audit.json || exit /b 0'
        powershell '''
          $p = "reports/npm-audit.json"
          if (-not (Test-Path $p)) { throw "npm-audit report not found" }
          $j = Get-Content $p -Raw | ConvertFrom-Json
          $hi  = $j.metadata.vulnerabilities.high
          $cri = $j.metadata.vulnerabilities.critical
          Write-Host "Vulnerabilities: High=$hi Critical=$cri"
          if (($hi + $cri) -gt 0) {
            throw "Security gate failed: High=$hi Critical=$cri"
          }
        '''
        archiveArtifacts artifacts: 'reports/npm-audit.json', onlyIfSuccessful: false
      }
    }

    // 4) BUILD ARTEFACT — create a ZIP we can deploy
    stage('Build Artifact') {
      steps {
        powershell '''
          New-Item -ItemType Directory -Path dist -Force | Out-Null
          $name = "web-app-$env:BUILD_NUMBER.zip"
          Compress-Archive -Path server.js, package*.json, Views -DestinationPath "dist\\$name" -Force
          Write-Host "Created dist\\$name"
        '''
        archiveArtifacts artifacts: 'dist/*.zip', onlyIfSuccessful: true
      }
    }

    // 8) DEPLOY — staging (unzip artefact, run on PORT, health check, stop)
    stage('Deploy (staging)') {
      steps {
        powershell '''
          $ErrorActionPreference = "Stop"
          $zip = (Get-ChildItem dist\\*.zip | Select-Object -First 1).FullName
          if (-not $zip) { throw "No artefact found under dist/*.zip" }

          # Clean staging dir, expand artefact
          Remove-Item -Recurse -Force staging -ErrorAction SilentlyContinue
          New-Item -ItemType Directory staging | Out-Null
          Expand-Archive -Path $zip -DestinationPath staging -Force

          # Start server from artefact
          $env:PORT = $env:PORT
          $p = Start-Process node -ArgumentList "server.js" -WorkingDirectory "$env:WORKSPACE\\staging" -PassThru -WindowStyle Hidden

          try {
            # Wait up to ~15s for health
            for ($i=0; $i -lt 15; $i++) {
              try {
                $r = Invoke-RestMethod "http://localhost:$env:PORT/health"
                if ($r) { break }
              } catch { Start-Sleep -Seconds 1 }
            }
            $r = Invoke-RestMethod "http://localhost:$env:PORT/health"
            $r | ConvertTo-Json
          }
          finally {
            Stop-Process -Id $p.Id -Force
          }
        '''
      }
    }

    // 9) RELEASE — simulate prod: run artefact on PROD_PORT, health, stop
    stage('Release (promote to prod)') {
      steps {
        powershell '''
          $ErrorActionPreference = "Stop"
          $zip = (Get-ChildItem dist\\*.zip | Select-Object -First 1).FullName
          if (-not $zip) { throw "No artefact found under dist/*.zip" }

          # Clean prod dir, expand artefact
          Remove-Item -Recurse -Force prod -ErrorAction SilentlyContinue
          New-Item -ItemType Directory prod | Out-Null
          Expand-Archive -Path $zip -DestinationPath prod -Force

          # Start on "production" port
          $env:PORT = $env:PROD_PORT
          $p = Start-Process node -ArgumentList "server.js" -WorkingDirectory "$env:WORKSPACE\\prod" -PassThru -WindowStyle Hidden

          try {
            for ($i=0; $i -lt 15; $i++) {
              try {
                $r = Invoke-RestMethod "http://localhost:$env:PROD_PORT/health"
                if ($r) { break }
              } catch { Start-Sleep -Seconds 1 }
            }
            $r = Invoke-RestMethod "http://localhost:$env:PROD_PORT/health"
            $r | ConvertTo-Json
          }
          finally {
            Stop-Process -Id $p.Id -Force
          }
        '''
      }
    }

    // 10) MONITORING — synthetic ping loop (simulated alert)
    stage('Monitoring & Alerting (synthetic)') {
      steps {
        powershell '''
          $ErrorActionPreference = "Stop"
          # Start prod again, ping multiple times, stop
          $env:PORT = $env:PROD_PORT
          $p = Start-Process node -ArgumentList "server.js" -WorkingDirectory "$env:WORKSPACE\\prod" -PassThru -WindowStyle Hidden
          try {
            $fail = 0
            for ($i=1; $i -le 5; $i++) {
              try {
                $r = Invoke-RestMethod "http://localhost:$env:PROD_PORT/health"
                "$([DateTime]::Now.ToString('s')) OK $($r.status)" | Out-File -FilePath monitor.log -Append -Encoding ascii
              } catch {
                $fail++
                "$([DateTime]::Now.ToString('s')) DOWN" | Out-File -FilePath monitor.log -Append -Encoding ascii
                Start-Sleep -Seconds 2
              }
              Start-Sleep -Seconds 1
            }
            if ($fail -gt 0) { throw "Monitoring detected $fail failures" }
          }
          finally {
            Stop-Process -Id $p.Id -Force
          }
        '''
        archiveArtifacts artifacts: 'monitor.log', onlyIfSuccessful: false
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'Dockerfile,server.js,Views/**,Tests/**,package*.json,reports/**,dist/**', onlyIfSuccessful: false
      cleanWs()
    }
  }
}


