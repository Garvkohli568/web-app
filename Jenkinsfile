pipeline {
  agent any
  options { timestamps() }
  tools { nodejs 'node-20' }          // Jenkins → Manage Jenkins → Tools → NodeJS installations (name must match)

  environment {
    CI   = 'true'
    PORT = '3000'
  }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()                    // clean workspace each run
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
        bat 'npm ci'
      }
    }

    stage('Test') {
      steps {
        // now STRICT: will fail if tests fail or are missing
        bat 'npm run test:ci'
      }
    }

    // Temporary deploy check (no Docker): start app, hit /health, stop
    stage('Deploy (temp, no Docker)') {
      steps {
        powershell '''
          $ErrorActionPreference = "Stop"

          if (!(Test-Path "$env:WORKSPACE\\server.js")) {
            throw "server.js not found at workspace root: $env:WORKSPACE"
          }

          $p = Start-Process node -ArgumentList "server.js" -WorkingDirectory "$env:WORKSPACE" -PassThru -WindowStyle Hidden
          try {
            for ($i=0; $i -lt 15; $i++) {
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
