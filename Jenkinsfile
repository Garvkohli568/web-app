pipeline {
  agent any
  options { timestamps() }

  stages {
    stage('Checkout') {
      steps {
        deleteDir()      // wipe workspace before checkout
        checkout scm
      }
    }

    stage('Tool Install') {
      steps {
        // if you’re using the NodeJS tool in Jenkins, keep whatever you had before
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
        bat 'npm run test:ci'
      }
    }

    stage('Deploy (temp, no Docker)') {
      steps {
        bat '''
          set PORT=3000
          start "" /B node server.js
          ping 127.0.0.1 -n 3 >nul
          powershell -Command "Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json"
          for /f "tokens=2" %%p in ('tasklist ^| findstr /i "node.exe" ^| findstr /i "server.js"') do taskkill /pid %%p /f
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

