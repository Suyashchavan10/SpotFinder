pipeline {
    agent any
    environment {
        // Define variables
        GITHUB_REPO = 'https://github.com/Suyashchavan10/SpotFinder.git'
        DOCKERHUB_USERNAME = 'krutikpatel'
        // DOCKERHUB_USERNAME = 'suyash1910'
        K8S_DEPLOYMENT_FILE = 'k8s-deployment.yml'
        CONFIGMAP_FILE = 'configmap.yml'
    }
    stages {
        stage('Checkout Code') {
            steps {
                script {
                    git branch: 'krutik', url: "${GITHUB_REPO}"
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script{
                    sh 'docker-compose build'
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script{
                    docker.withRegistry('', 'DockerHubCred'){
                        sh "docker tag frontend:latest ${env.DOCKERHUB_USERNAME}/frontend"
                        sh "docker tag backend:latest ${env.DOCKERHUB_USERNAME}/backend"
                        // sh "docker tag model:latest ${env.DOCKERHUB_USERNAME}/model"
                        // sh "docker push ${env.DOCKERHUB_USERNAME}/frontend"
                        // sh "docker push ${env.DOCKERHUB_USERNAME}/backend"
                        // sh "docker push ${env.DOCKERHUB_USERNAME}/model"
                    }
                }
            }
        }
        // stage('Test Backend Service') {
        //     steps {
        //         script {
        //             // Run the curl command inside a temporary pod
        //             def response = sh(script: "kubectl run --rm -i debug --image=curlimages/curl --restart=Never -- curl http://backend-service:5000/ping", returnStdout: true).trim()

        //             // Assert the response to match the expected value
        //             assert response == '{"message":"Pong!"}' : "Backend service did not respond as expected. Response: ${response}"
        //             echo "Test passed: Backend service is up and responding correctly."
        //         }
        //     }
        // }
        stage('Deploy to kubernetes using Ansible notebook') {
            steps {
                sh '''
                    ansible-playbook -i inventory.ini ansible-deploy.yml --vault-password-file vault_password.txt
                '''
            }
        }
    }
}
