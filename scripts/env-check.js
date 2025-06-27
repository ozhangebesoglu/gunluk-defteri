#!/usr/bin/env node
/**
 * Environment Variables Check Script
 * Validates required environment variables across all environments
 */

const fs = require('fs')
const path = require('path')

class EnvironmentChecker {
  constructor() {
    this.errors = []
    this.warnings = []
    this.passed = []
  }

  // Required variables for each environment
  getRequiredVars() {
    return {
      root: [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY'
      ],
      frontend: [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY'
      ],
      backend: [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_KEY'
      ]
    }
  }

  // Check if .env file exists
  checkEnvFileExists(envPath, name) {
    if (fs.existsSync(envPath)) {
      this.passed.push(`✅ ${name} .env file found`)
      return true
    } else {
      this.warnings.push(`⚠️ ${name} .env file missing: ${envPath}`)
      return false
    }
  }

  // Parse .env file
  parseEnvFile(filePath) {
    try {
      const envContent = fs.readFileSync(filePath, 'utf8')
      const env = {}
      
      envContent.split('\n').forEach(line => {
        line = line.trim()
        if (line && !line.startsWith('#') && line.includes('=')) {
          const [key, ...valueParts] = line.split('=')
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
          env[key.trim()] = value
        }
      })
      
      return env
    } catch (error) {
      this.errors.push(`❌ Error reading ${filePath}: ${error.message}`)
      return {}
    }
  }

  // Check required variables
  checkRequiredVars(env, requiredVars, envName) {
    requiredVars.forEach(varName => {
      if (env[varName]) {
        if (env[varName] !== 'your_value_here' && !env[varName].includes('your_')) {
          this.passed.push(`✅ ${envName}: ${varName} is set`)
        } else {
          this.warnings.push(`⚠️ ${envName}: ${varName} has placeholder value`)
        }
      } else {
        this.errors.push(`❌ ${envName}: ${varName} is missing`)
      }
    })
  }

  // Validate Supabase URL format
  validateSupabaseUrl(url, envName) {
    if (url && url.startsWith('https://') && url.includes('.supabase.co')) {
      this.passed.push(`✅ ${envName}: Supabase URL format is valid`)
    } else if (url) {
      this.errors.push(`❌ ${envName}: Invalid Supabase URL format`)
    }
  }

  // Validate Supabase key format
  validateSupabaseKey(key, envName, keyType) {
    if (key && key.startsWith('eyJ') && key.length > 100) {
      this.passed.push(`✅ ${envName}: ${keyType} format is valid`)
    } else if (key) {
      this.errors.push(`❌ ${envName}: Invalid ${keyType} format`)
    }
  }

  // Main check function
  async check() {
    console.log('🔐 Environment Variables Check\n')

    const envPaths = {
      root: path.join(process.cwd(), '.env'),
      frontend: path.join(process.cwd(), 'frontend', '.env'),
      backend: path.join(process.cwd(), 'backend', '.env')
    }

    const requiredVars = this.getRequiredVars()

    // Check each environment
    for (const [envName, envPath] of Object.entries(envPaths)) {
      console.log(`📁 Checking ${envName} environment...`)
      
      if (this.checkEnvFileExists(envPath, envName)) {
        const env = this.parseEnvFile(envPath)
        this.checkRequiredVars(env, requiredVars[envName], envName)
        
        // Special validations
        if (envName === 'root' || envName === 'frontend') {
          this.validateSupabaseUrl(env.VITE_SUPABASE_URL || env.SUPABASE_URL, envName)
          this.validateSupabaseKey(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY, envName, 'anon key')
        }
        
        if (envName === 'backend') {
          this.validateSupabaseUrl(env.SUPABASE_URL, envName)
          this.validateSupabaseKey(env.SUPABASE_SERVICE_KEY, envName, 'service key')
        }
      }
      
      console.log('')
    }

    // Check example files
    console.log('📋 Checking example files...')
    const exampleFiles = [
      'env.example',
      'frontend/env.example',
      'backend/env.example'
    ]
    
    exampleFiles.forEach(file => {
      const fullPath = path.join(process.cwd(), file)
      this.checkEnvFileExists(fullPath, `${file}`)
    })

    // Print results
    this.printResults()
    
    return this.errors.length === 0
  }

  printResults() {
    console.log('\n🎯 Results Summary\n')
    
    if (this.passed.length > 0) {
      console.log('✅ PASSED:')
      this.passed.forEach(msg => console.log(`  ${msg}`))
      console.log('')
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️ WARNINGS:')
      this.warnings.forEach(msg => console.log(`  ${msg}`))
      console.log('')
    }
    
    if (this.errors.length > 0) {
      console.log('❌ ERRORS:')
      this.errors.forEach(msg => console.log(`  ${msg}`))
      console.log('')
    }

    // Final status
    if (this.errors.length === 0) {
      console.log('🎉 Environment configuration is ready!')
    } else {
      console.log('💥 Environment configuration has errors that need to be fixed.')
      console.log('\n📖 Instructions:')
      console.log('1. Copy env.example files to .env files')
      console.log('2. Replace placeholder values with your actual keys')
      console.log('3. Get Supabase credentials from your Supabase dashboard')
    }
  }
}

// Run check if called directly
if (require.main === module) {
  const checker = new EnvironmentChecker()
  checker.check().then(success => {
    process.exit(success ? 0 : 1)
  })
}

module.exports = EnvironmentChecker 