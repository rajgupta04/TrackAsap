pipeline {
  agent any

  environment {
    PROJECT_ID = credentials('gcp-project-id')
    REGION = 'us-central1'
    REPO = 'trackasap'
    FRONTEND_SERVICE = 'trackasap-frontend'
    BACKEND_SERVICE = 'trackasap-backend'
    FRONTEND_IMAGE = '${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/trackasap-frontend'
    BACKEND_IMAGE = '${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/trackasap-backend'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Auth GCP') {
      steps {
        withCredentials([file(credentialsId: 'gcp-sa-key', variable: 'GOOGLE_APPLICATION_CREDENTIALS')]) {
          sh 'gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"'
          sh 'gcloud config set project "$PROJECT_ID"'
          sh 'gcloud config set run/region "$REGION"'
          sh 'gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet'
        }
      }
    }

    stage('Build & Push Backend') {
      steps {
        sh 'docker build -t "$BACKEND_IMAGE:$BUILD_NUMBER" -t "$BACKEND_IMAGE:latest" ./backend'
        sh 'docker push "$BACKEND_IMAGE:$BUILD_NUMBER"'
        sh 'docker push "$BACKEND_IMAGE:latest"'
      }
    }

    stage('Deploy Backend') {
      steps {
        sh 'gcloud run deploy "$BACKEND_SERVICE" --image "$BACKEND_IMAGE:$BUILD_NUMBER" --platform managed --allow-unauthenticated --port 8080'
      }
    }

    stage('Resolve Backend URL') {
      steps {
        script {
          env.BACKEND_URL = sh(
            script: "gcloud run services describe ${BACKEND_SERVICE} --format='value(status.url)'",
            returnStdout: true
          ).trim()
        }
      }
    }

    stage('Build & Push Frontend') {
      steps {
        sh 'docker build --build-arg VITE_API_URL="$BACKEND_URL/api" -t "$FRONTEND_IMAGE:$BUILD_NUMBER" -t "$FRONTEND_IMAGE:latest" ./frontend'
        sh 'docker push "$FRONTEND_IMAGE:$BUILD_NUMBER"'
        sh 'docker push "$FRONTEND_IMAGE:latest"'
      }
    }

    stage('Deploy Frontend') {
      steps {
        sh 'gcloud run deploy "$FRONTEND_SERVICE" --image "$FRONTEND_IMAGE:$BUILD_NUMBER" --platform managed --allow-unauthenticated --port 8080'
      }
    }
  }

  post {
    always {
      sh 'docker image prune -f || true'
    }
  }
}
