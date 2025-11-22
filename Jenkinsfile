/**
 * ============================================================================
 * FILE: Jenkinsfile
 * PURPOSE: Jenkins Pipeline for Customer Reviews Lambda App Repository
 * 
 * WHAT THIS PIPELINE DOES:
 * 1. Triggers on push to ANY branch (via GitHub webhook)
 * 2. Automatically detects branch name and extracts PR number/identifier
 * 3. Builds TypeScript Lambda code
 * 4. Packages Lambda code (reviews handler + mock API handler)
 * 5. Creates PR-specific configuration in infrastructure repo
 * 6. Triggers infrastructure pipeline to deploy CDK stack
 * 
 * BRANCH NAMING FLEXIBILITY:
 * - Supports ANY branch name (e.g., feature/pr-212, bugfix-123, my-branch)
 * - Extracts PR numbers from multiple patterns:
 *   * Pattern 1: pr-123, PR-456, pr_789
 *   * Pattern 2: bugfix-123, issue-456, ticket-789 (trailing numbers)
 *   * Pattern 3: Any number found in branch name
 *   * Fallback: Creates unique ID from branch name + commit hash
 * 
 * PR-SPECIFIC RESOURCES:
 * - Lambda function name: customer-reviews-lambda-pr-{PR_NUMBER}
 * - Mock API Lambda: mock-api-lambda-pr-{PR_NUMBER}
 * - S3 bucket: customer-reviews-fragments-pr-{PR_NUMBER}
 * - Stack name: CustomerReviewsIacStack-{PR_NUMBER}
 * 
 * TRIGGER:
 * - GitHub webhook on push to any branch
 * - Or manual trigger via Jenkins UI
 * 
 * JENKINS CONFIGURATION:
 * - Branch Specifier: ** (matches all branches)
 * - Lightweight checkout: Disabled (to fetch exact branch from webhook)
 * ============================================================================
 */

pipeline {
    agent any
    
    environment {
        AWS_CREDENTIALS_ID = 'aws-credentials'
        GITHUB_TOKEN_CREDENTIALS_ID = 'github-token-pr-detection'
        INFRA_REPO_URL = 'https://github.com/DeepakDevProjects/customer-reviews-iac.git'
        INFRA_REPO_DIR = 'infra-repo'
        PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:${env.PATH}"
    }
    
    tools {
        nodejs 'NodeJS-22'
    }
    
    stages {
        stage('Checkout Code & Detect PR Number') {
            steps {
                script {
                    env.PR_NUMBER = 'default'
                    
                    echo "============================================"
                    echo "Checking out Customer Reviews App repository"
                    echo "============================================"
                    
                    def branchName = env.GIT_BRANCH ?: env.BRANCH_NAME
                    if (branchName) {
                        branchName = branchName.replaceFirst('^origin/', '')
                        echo "Branch from environment: ${branchName}"
                    }
                    
                    if (!branchName || branchName.trim() == '' || branchName == 'detached' || branchName == 'HEAD') {
                        echo "No branch detected from environment, checking out default and detecting..."
                        checkout scm
                        branchName = sh(
                            script: 'git rev-parse --abbrev-ref HEAD',
                            returnStdout: true
                        ).trim()
                        echo "Detected branch from git: ${branchName}"
                    } else {
                        checkout scm
                    }
                    
                    echo "Final branch name: ${branchName}"
                    
                    def detectedPrNumber = null
                    
                    // Try to extract PR number from branch name
                    // Pattern 1: pr-123, PR-456, pr_789
                    def matcher1 = branchName =~ /(?i)pr[-_]?(\d+)/
                    if (matcher1.find()) {
                        detectedPrNumber = matcher1.group(1)
                        echo "✅ Found PR number using pattern 1: ${detectedPrNumber}"
                    }
                    
                    // Pattern 2: Any trailing number
                    if (!detectedPrNumber) {
                        def matcher2 = branchName =~ /(\d+)$/
                        if (matcher2.find()) {
                            detectedPrNumber = matcher2.group(1)
                            echo "✅ Found PR number using pattern 2: ${detectedPrNumber}"
                        }
                    }
                    
                    // Pattern 3: Any number in branch name
                    if (!detectedPrNumber) {
                        def matcher3 = branchName =~ /(\d+)/
                        if (matcher3.find()) {
                            detectedPrNumber = matcher3.group(1)
                            echo "✅ Found PR number using pattern 3: ${detectedPrNumber}"
                        }
                    }
                    
                    // Try GitHub API if no PR number found
                    if (!detectedPrNumber || detectedPrNumber == 'default') {
                        echo "Attempting to detect PR via GitHub API..."
                        withCredentials([string(credentialsId: "${GITHUB_TOKEN_CREDENTIALS_ID}", variable: 'GITHUB_TOKEN')]) {
                            try {
                                def repoUrl = sh(
                                    script: 'git config --get remote.origin.url',
                                    returnStdout: true
                                ).trim()
                                
                                def owner = null
                                def repo = null
                                
                                if (repoUrl.contains('github.com')) {
                                    def afterGithub = repoUrl.split('github.com[/:]')[1]
                                    if (afterGithub) {
                                        if (afterGithub.startsWith(':') || afterGithub.startsWith('/')) {
                                            afterGithub = afterGithub.substring(1)
                                        }
                                        def ownerRepoParts = afterGithub.replace('.git', '').split('/')
                                        if (ownerRepoParts.size() >= 2) {
                                            owner = ownerRepoParts[0]
                                            repo = ownerRepoParts[1]
                                        }
                                    }
                                }
                                
                                if (owner && repo) {
                                    def apiUrl = "https://api.github.com/repos/${owner}/${repo}/pulls?head=${owner}:${branchName}&state=open"
                                    def response = sh(
                                        script: """
                                            curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
                                                 -H "Accept: application/vnd.github.v3+json" \
                                                 "${apiUrl}"
                                        """,
                                        returnStdout: true
                                    ).trim()
                                    
                                    def jsonResponse = new groovy.json.JsonSlurper().parseText(response)
                                    if (jsonResponse && jsonResponse.size() > 0) {
                                        detectedPrNumber = jsonResponse[0].number.toString()
                                        echo "✅ Found PR number from GitHub API: ${detectedPrNumber}"
                                    }
                                }
                            } catch (Exception e) {
                                echo "⚠️ Failed to query GitHub API: ${e.getMessage()}"
                            }
                        }
                    }
                    
                    // Fallback: create unique ID
                    if (!detectedPrNumber || detectedPrNumber == 'default') {
                        def commitHash = sh(
                            script: 'git rev-parse --short HEAD',
                            returnStdout: true
                        ).trim()
                        def uniqueId = "${branchName}-${commitHash}".replaceAll('[^a-zA-Z0-9-]', '-')
                        detectedPrNumber = uniqueId
                        echo "⚠️ No PR number found, using unique ID: ${detectedPrNumber}"
                    }
                    
                    env.PR_NUMBER = detectedPrNumber
                    echo "✅ PR_NUMBER set to: ${env.PR_NUMBER}"
                }
            }
        }
        
        stage('Setup Node.js') {
            steps {
                sh '''
                    node --version
                    npm --version
                    echo "Node.js and npm are available"
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    npm install
                    echo "Dependencies installed successfully"
                '''
            }
        }
        
        stage('Build TypeScript') {
            steps {
                sh '''
                    npm run build
                    echo "TypeScript compilation completed"
                '''
            }
        }
        
        stage('Package Lambda Code') {
            steps {
                script {
                    echo "============================================"
                    echo "Packaging Lambda code for deployment"
                    echo "============================================"
                }
                sh '''
                    # Package reviews Lambda (src/)
                    cd src
                    zip -r ../customer-reviews-app-pr-${PR_NUMBER}.zip .
                    cd ..
                    
                    # Package mock API Lambda (mock-api/)
                    cd mock-api
                    zip -r ../mock-api-pr-${PR_NUMBER}.zip .
                    cd ..
                    
                    echo "Lambda packages created:"
                    ls -lh *-pr-${PR_NUMBER}.zip
                '''
            }
        }
        
        stage('Create PR Config in Infra Repo') {
            steps {
                script {
                    echo "============================================"
                    echo "Creating PR-specific config in infrastructure repo"
                    echo "============================================"
                }
                withCredentials([string(credentialsId: "${GITHUB_TOKEN_CREDENTIALS_ID}", variable: 'GITHUB_TOKEN')]) {
                    sh '''
                        # Clone infrastructure repo
                        git clone https://${GITHUB_TOKEN}@github.com/DeepakDevProjects/customer-reviews-iac.git ${INFRA_REPO_DIR} || true
                        cd ${INFRA_REPO_DIR}
                        
                        # Create config directory for this PR
                        mkdir -p config/pr-${PR_NUMBER}
                        
                        # Create PR-specific config file
                        cat > config/pr-${PR_NUMBER}/config.json <<EOF
{
  "prNumber": "${PR_NUMBER}",
  "lambdaCodePackage": "customer-reviews-app-pr-${PR_NUMBER}.zip",
  "mockApiCodePackage": "mock-api-pr-${PR_NUMBER}.zip",
  "lambdaFunctionName": "customer-reviews-lambda-pr-${PR_NUMBER}",
  "mockApiFunctionName": "mock-api-lambda-pr-${PR_NUMBER}",
  "s3BucketName": "customer-reviews-fragments-pr-${PR_NUMBER}",
  "stackName": "CustomerReviewsIacStack-${PR_NUMBER}",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
                        
                        # Commit and push config
                        git config user.name "Jenkins"
                        git config user.email "jenkins@example.com"
                        git add config/pr-${PR_NUMBER}/config.json
                        git commit -m "Add PR ${PR_NUMBER} configuration" || echo "No changes to commit"
                        git push origin main || echo "Push failed (may already exist)"
                        
                        echo "PR ${PR_NUMBER} configuration created in infrastructure repo"
                    '''
                }
            }
        }
        
        stage('Trigger Infrastructure Deployment') {
            steps {
                script {
                    echo "============================================"
                    echo "Triggering infrastructure deployment for PR ${PR_NUMBER}"
                    echo "============================================"
                    
                    try {
                        def infraJob = build job: 'customer-reviews-infrastructure-pipeline',
                            parameters: [
                                string(name: 'PR_NUMBER', value: "${PR_NUMBER}")
                            ],
                            wait: true,
                            propagate: false
                        
                        echo "Infrastructure pipeline completed for PR ${PR_NUMBER}"
                        echo "Infrastructure pipeline build number: ${infraJob.number}"
                        echo "Infrastructure pipeline result: ${infraJob.result}"
                    } catch (Exception e) {
                        echo "WARNING: Infrastructure pipeline failed or not found: ${e.message}"
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo "Pipeline completed for PR ${PR_NUMBER}"
        }
        success {
            echo "✅ Customer Reviews App pipeline succeeded for PR ${PR_NUMBER}"
        }
        failure {
            echo "❌ Customer Reviews App pipeline failed for PR ${PR_NUMBER}"
        }
    }
}

