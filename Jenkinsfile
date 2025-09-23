pipeline {
  agent any
  options { timestamps() }

  stages {
    stage('Checkout') { steps { checkout scm } }

    stage('Build') {
      steps {
        // Clean, reproducible install
        powershell 'npm ci'
      }
    }

    stage('Test') {
      steps {
        // Run Jest in CI mode (no watch, proper exit codes)
        powershell 'npm run test:ci'
      }
    }

    // TEMP "deploy" without Docker: start Node, hit /health, then stop it
    stage('Deploy (temp, no Docker)') {
      steps {
        powershell '''
          $env:PORT = 3000
          $p = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru
          Start-Sleep -Seconds 2
          Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json
          Stop-Process -Id $p.Id -Force
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'Dockerfile,server.js,Views/**,Tests/**,package*.json', onlyIfSuccessful: false
    }
  }
}
