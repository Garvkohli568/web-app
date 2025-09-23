pipeline {
  agent any
  options { timestamps() }
  tools { nodejs 'node-20' }          // Manage Jenkins → Tools → NodeJS → name must be 'node-20'

  environment {
    CI   = 'true'
    PORT = '3000'                      // change if 3000 is busy on the agent
  }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()                    // wipe workspace each run
        checkout scm
      }
    }

    stage('Tool Install') {
      steps {
        bat 'node -v & npm -v'         // prove Node/npm are on PATH
      }
    }

    stage('Build') {
      steps {
        bat 'npm ci'                   // clean, reproducible install
      }
    }

    stage('Test') {
      steps {
        // allow pipeline to pass even if no tests are present
        bat 'npm run test:ci -- --passWithNoTests'
      }
    }

    // Temp "deploy": start app, hit /health, stop it (no Docker)
    stage('Deploy (temp, no Docker)') {
      steps {
        powershell '''
          $ErrorActionPreference = "Stop"

          if (!(Test-Path "$env:WORKSPACE\\server.js")) {
            throw "server.js not found at workspace root: $env:WORKSPACE"
          }

          # Start server in background
          $p = Start-Process node -ArgumentList "server.js" -WorkingDirectory "$env:WORKSPACE" -PassThru -WindowStyle Hidden
          try {
            # Wait up to ~15s for the server
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
