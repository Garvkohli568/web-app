pipeline {
  agent any
  options { timestamps() }
  tools { nodejs 'node-20' }     // Manage Jenkins → Tools → NodeJS installations… (name must match)

  environment {
    CI   = 'true'                // makes npm/jest run in CI mode
    PORT = '3000'                // temp runtime port for the health check
  }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()              // auto-wipe workspace
        checkout scm
      }
    }

    stage('Tool Install') {
      steps {
        bat 'node -v & npm -v'   // prove Node/npm are on PATH from the NodeJS tool
      }
    }

    stage('Build') {
      steps {
        bat 'npm ci'             // clean, reproducible install
      }
    }

    stage('Test') {
      steps {
        bat 'npm run test:ci'    // expects "test:ci": "jest --ci" in package.json
      }
    }

    // Temporary "deploy" check without Docker:
    // start app, call /health, then stop it.
    stage('Deploy (temp, no Docker)') {
      steps {
        powershell '''
          $ErrorActionPreference = "Stop"
          $p = Start-Process node -ArgumentList "server.js" -WorkingDirectory "$env:WORKSPACE" -PassThru -WindowStyle Hidden
          try {
            # wait up to ~10s for server to come up
            for ($i=0; $i -lt 10; $i++) {
              try {
                $r = Invoke-RestMethod "http://localhost:$env:PORT/health"
                if ($r) { break }
              } catch { Start-Sleep -Seconds 1 }
            }
            $r = Invoke-RestMethod "http://localhost:$env:PORT/health"
            $r | ConvertTo-Json
          } finally {
            Stop-Process -Id $p.Id -Force
          }
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'Dockerfile,server.js,Views/**,Tests/**,package*.json', onlyIfSuccessful: false
      cleanWs()
    }
  }
}
