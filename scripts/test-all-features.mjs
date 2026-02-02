#!/usr/bin/env node
/**
 * BlockMed - Test All Features
 * Runs through critical scripts and validates setup.
 * Usage: node scripts/test-all-features.mjs
 */
import { spawn } from 'child_process'
import { createInterface } from 'readline'

const tests = [
  { name: 'Solidity Lint', cmd: 'npm', args: ['run', 'lint:sol'] },
  { name: 'Contract Tests', cmd: 'npm', args: ['run', 'test:blockchain'] },
  { name: 'Frontend Build', cmd: 'npm', args: ['run', 'build'] },
]

async function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false })
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))))
    p.on('error', reject)
  })
}

async function main() {
  console.log('\n🧪 BlockMed - Testing All Features\n')
  console.log('='.repeat(50))

  let passed = 0
  for (const t of tests) {
    try {
      process.stdout.write(`\n▶ ${t.name}... `)
      await run(t.cmd, t.args)
      console.log('✅ PASS')
      passed++
    } catch (e) {
      console.log('❌ FAIL')
      console.error(e.message)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`\nResult: ${passed}/${tests.length} passed\n`)
  process.exit(passed === tests.length ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
