#!groovy

node {
  try {
    env.COMPOSE_PROJECT_NAME = "district-builder-${env.BRANCH_NAME}-${env.BUILD_NUMBER}"

    stage('checkout') {
      checkout scm
    }

    env.AWS_PROFILE = 'district-builder'
    env.AWS_DEFAULT_REGION = 'us-east-1'

    stage('cibuild') {
      wrap([$class: 'AnsiColorBuildWrapper']) {
        sh './scripts/cibuild'
      }
    }

    if (env.BRANCH_NAME == 'develop' || env.BRANCH_NAME.startsWith('test/') || env.BRANCH_NAME.startsWith('release/') || env.BRANCH_NAME.startsWith('hotfix/')) {
      // Publish container images built and tested during `cibuild`
      // to the private Amazon Container Registry tagged with the
      // first seven characters of the revision SHA.
      stage('cipublish') {
        // Decode the ECR endpoint stored within Jenkins.
        withCredentials([[$class: 'StringBinding',
                credentialsId: 'DB_AWS_ECR_ENDPOINT',
                variable: 'DB_AWS_ECR_ENDPOINT']]) {
          wrap([$class: 'AnsiColorBuildWrapper']) {
            sh './scripts/cipublish'
          }
        }
      }
    }

    if (currentBuild.currentResult == 'SUCCESS' && currentBuild.previousBuild?.result != 'SUCCESS') {
      def slackMessage = ":jenkins: *DistrictBuilder (${env.BRANCH_NAME}) #${env.BUILD_NUMBER}*"
      if (env.CHANGE_TITLE) {
        slackMessage += "\n${env.CHANGE_TITLE} - ${env.CHANGE_AUTHOR}"
      }
      slackMessage += "\n<${env.BUILD_URL}|View Build>"
      slackSend channel: '#district-builder', color: 'good', message: slackMessage
    }
  } catch (err) {
    // Some exception was raised in the `try` block above. Assemble
    // an appropirate error message for Slack.
    def slackMessage = ":jenkins-angry: *DistrictBuilder (${env.BRANCH_NAME}) #${env.BUILD_NUMBER}*"
    if (env.CHANGE_TITLE) {
      slackMessage += "\n${env.CHANGE_TITLE} - ${env.CHANGE_AUTHOR}"
    }
    slackMessage += "\n<${env.BUILD_URL}|View Build>"
    slackSend  channel: '#district-builder', color: 'danger', message: slackMessage

    // Re-raise the exception so that the failure is propagated to Jenkins.
    throw err
  } finally {
    // Pass or fail, ensure that the services and networks created by Docker
    // Compose are torn down.
    sh 'docker-compose down -v'
  }
}
