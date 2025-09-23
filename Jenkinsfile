pipeline {
  agent any
  options { timestamps() }

  // Use the NodeJS tool you defined in Jenkins (Manage Jenkins → Tools).
  // If your tool has a different name, change 'node-20' below.
  environment {
    NODEJS_HOME = tool name: 'node-20', type: 'org.jenkinsci.plugins.tools.nodejs.NodeJSInstallation'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Tool Install') {
      steps {
        // Put Node & npm on PATH for this build
        script {
          env.PATH = "${env.NODEJS_HOME}\\bin;${env.PATH}"
        }
        bat 'node -v & npm -v'
      }
    }

    stage('Build') {
      steps {
        // Reproducible install (uses package-lock.json)
        bat 'npm ci'
      }
    }

    stage('Test') {
      steps {
        // Enforce tests: NO extra flags. This fails if zero tests are found or any test fails.
        bat 'npm run test:ci'
      }
    }

    stage('Deploy (temp, no Docker)') {
      steps {
        // Start the app, hit /health, then stop it. (CI-friendly, no interactive windows)
        bat '''
          if not exist server.js (
            echo server.js not found at workspace root: %cd%
            exit /b 1
          )

          rem Start Node in background
          start "" /b node server.js

          rem Give the server a moment to boot
          timeout /t 2 >NUL

          rem Health check (expects {"status":"OK"...})
          powershell -Command "(Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json)"

          rem Stop node to clean up
          taskkill /im node.exe /f >NUL 2>&1
        '''
      }
    }
  }

  post {
    always {
      // Keep key files and (if enabled) coverage for the report
      archiveArtifacts artifacts: 'Dockerfile,server.js,Views/**,Tests/**,package*.json,coverage/**', onlyIfSuccessful: false
    }
  }
}
