pipeline {
  agent any
  options { timestamps() }
  tools { nodejs 'node-20' }               // Manage Jenkins → Tools → NodeJS → name must be 'node-20'

  environment {
    CI   = 'true'
    PORT = '3000'
  }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()                         // clean workspace each run
        checkout scm
      }
    }

    stage('Tool Install') {
      steps {
        bat 'node -v & npm -v'              // prove Node/npm are on PATH
      }
    }

    stage('Build') {
      steps {
        bat 'npm ci'                        // clean, reproducible install
      }
    }

    // ✅ now enforce tests (no --passWithNoTests)
    stage('Test') {
      steps {
        bat 'npm run test:ci'
      }
    }

    // Temp "deploy" without Docker: start app, hit /health, stop it
    stage('Deploy (temp, no Docker)') {
      steps {
        powershell '''
          $ErrorActionPreference = "Stop"

          if (!(Test-Path "$env:WORKSPACE\\server.js")) {
            throw "server.js not found at workspace root: $env:WORKSPACE"
          }

          # Start the server in the background
          $p = Start-Process node -ArgumentList "server.js" -WorkingDirectory "$env:WORKSPACE" -PassThru -WindowStyle Hidden
          try {
            # Wait up to ~15s for the server to respond
            for ($i=0; $i -lt 15; $i++) {
              try {
                $r = Invoke-RestMethod "http://localhost:$env:PORT/health"
                if ($r) { break }
              } catch {
                Start-Sleep -Seconds 1
              }
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
  }

  post {
    always {
      archiveArtifacts artifacts: 'Dockerfile,server.js,Views/**,Tests/**,package*.json', onlyIfSuccessful: false
      cleanWs()
    }
  }
}

