pipeline {
  agent any
  options { timestamps() }

  environment {
    // Change 'node-20' if your configured Node tool has a different name
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
        script { env.PATH = "${env.NODEJS_HOME}\\bin;${env.PATH}" }
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
        // Enforce tests (fails if none or failing)
        bat 'npm run test:ci'
      }
    }

    stage('Deploy (temp, no Docker)') {
      steps {
        bat '''
          if not exist server.js (
            echo server.js not found at workspace root: %cd%
            exit /b 1
          )
          rem Start the app
          start "" /b node server.js
          timeout /t 2 >NUL
          rem Health check should return {"status":"OK"}
          powershell -Command "(Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json)"
          rem Stop the app
          taskkill /im node.exe /f >NUL 2>&1
        '''
      }
    }

    stage('Archive Artifacts') {
      steps {
        archiveArtifacts(
          artifacts: 'Dockerfile,server.js,Views/**,Tests/**,package*.json,coverage/**',
          allowEmptyArchive: true,
          onlyIfSuccessful: false,
          fingerprint: true
        )
      }
    }
  }
}
