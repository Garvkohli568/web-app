pipeline {
  agent any
  options { timestamps() }

  // You already added NodeJS tool in Jenkins (Manage Jenkins > Tools) as "node-lts"
  tools { nodejs 'node-lts' }

  stages {
    stage('Checkout') { steps { checkout scm } }

    stage('Build') {
      steps {
        // npm is available via the NodeJS tool
        powershell 'node -v; npm -v; npm ci'
      }
    }

    stage('Test') {
      steps {
        // Run default script and pass --ci to Jest
        powershell 'npm test -- --ci'
      }
    }

    // TEMP deploy without Docker: start server, hit /health, stop
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
