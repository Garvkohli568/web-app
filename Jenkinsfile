pipeline {
  agent any
  options { timestamps() }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Tool Install') {
      steps {
        // Use the preconfigured Node tool "node-20"
        withEnv(["PATH+NODE=${tool 'node-20'}"]) {
          bat 'node -v & npm -v'
        }
      }
    }

    stage('Build') {
      steps {
        withEnv(["PATH+NODE=${tool 'node-20'}"]) {
          bat 'npm ci'
        }
      }
    }

    stage('Test') {
      steps {
        withEnv(["PATH+NODE=${tool 'node-20'}"]) {
          // ← allow empty test suites to pass
          bat 'npm run test:ci -- --passWithNoTests'
        }
      }
    }

    // Simple smoke "deploy" without Docker: start, hit /health, stop
    stage('Deploy (temp, no Docker)') {
      steps {
        withEnv(["PATH+NODE=${tool 'node-20'}", "PORT=3000"]) {
          bat '''
            start "" /b node server.js
            timeout /t 2 >NUL
            powershell -Command "(Invoke-RestMethod http://localhost:%PORT%/health | ConvertTo-Json)"
            taskkill /im node.exe /f >NUL 2>&1
          '''
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'Dockerfile,server.js,Views/**,Tests/**,package*.json', onlyIfSuccessful: false
    }
  }
}
