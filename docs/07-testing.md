# CryptaShare — Testing Strategy & Verification Report

## 1. Automated Test Suite Summary
The automated test suite is developed using **Jest** and **Supertest**, verifying all cryptographic primitives, end-to-end API workflows, authorization guards, and tampering defenses.

### Test Matrix

| # | Test Case Description | Test Suite | Target Primitive | Result |
|---|---|---|---|---|
| 1 | RSA Key Pair Generation | `crypto.test.ts` | RSA-2048 (SPKI/PKCS#8) | **PASS** |
| 2 | Private Key Protection (PBKDF2 + AES-GCM) | `crypto.test.ts` | PBKDF2 / AES-256-GCM | **PASS** |
| 3 | SHA-256 Digest Determinism & Avalanche | `crypto.test.ts` | SHA-256 | **PASS** |
| 4 | RSA-PSS Digital Signature & Verification | `crypto.test.ts` | RSA-PSS (SHA-256) | **PASS** |
| 5 | Hybrid AES-256-GCM + RSA-OAEP Roundtrip | `crypto.test.ts` | AES-GCM / RSA-OAEP | **PASS** |
| 6 | Ciphertext Bit-Flipping Tampering Test | `crypto.test.ts` | AES-GCM AuthTag | **PASS** |
| 7 | AuthTag Tampering Test | `crypto.test.ts` | AES-GCM AuthTag | **PASS** |
| 8 | Multi-User Registration with RSA Keypairs | `api.test.ts` | Registration API / Key Generation | **PASS** |
| 9 | Authentication & JWT Validation | `api.test.ts` | Bcrypt / JWT / Auth Middleware | **PASS** |
| 10 | Recipient Discovery Endpoint | `api.test.ts` | User Service / Query Filter | **PASS** |
| 11 | Hybrid File Sharing (Alice -> Bob) | `api.test.ts` | Multipart / AES / RSA-OAEP / RSA-PSS | **PASS** |
| 12 | Recipient Package Inspection | `api.test.ts` | File Query / Metadata Exposure | **PASS** |
| 13 | Multi-Stage Cryptographic Verification | `api.test.ts` | Decrypt / Verify Digest / Verify Sig | **PASS** |
| 14 | Original File Recovery & Download | `api.test.ts` | Decryption Stream / Content-Disposition | **PASS** |
| 15 | Unauthorized Third-Party Block (403) | `api.test.ts` | Authorization Middleware | **PASS** |
| 16 | Demonstration Ciphertext Tampering & Block | `api.test.ts` | Simulated Tampering API / 422 Block | **PASS** |
| 17 | SIEM Audit Log Event Capture | `api.test.ts` | Audit Service / Log Queries | **PASS** |

---

## 2. Cryptographic Roundtrip Verification

```
[Plaintext File]
       │
       ▼
[AES-256-GCM Encrypt with K_aes] ──► [Encrypted Payload File on Disk]
       │                                       │
       ▼                                       ▼
[SHA-256 Hash] ──► [RSA-PSS Sign with SK_a]    [AES-256-GCM Decrypt with K_aes]
                                               │
                                               ▼
                                  [Recomputed SHA-256 Hash]
                                               │
                                               ▼
                                  [Compare Hashes: EXACT MATCH]
                                               │
                                               ▼
                                  [Verify RSA-PSS with PK_a: VALID]
                                               │
                                               ▼
                                  [Verified Plaintext Restored]
```

---

## 3. Tampering Test Verification

```
[Original File] ──► [AES-256-GCM Encrypt] ──► [Ciphertext on Disk]
                                                      │
                                                      ▼
                                         [Simulate Tamper: Flip 1 Bit]
                                                      │
                                                      ▼
                                       [Recipient Attempts Decrypt]
                                                      │
                                                      ▼
                              [AES-GCM AuthTag Mismatch Exception]
                                                      │
                                                      ▼
                                       [SECURITY ALERT: FAILED]
                                                      │
                                                      ▼
                                             [DOWNLOAD BLOCKED]
```

---

## 4. Running the Tests Locally

Execute all test suites from the backend directory:
```bash
cd backend
npm test
```
Or execute specific suites:
```bash
npx jest tests/crypto.test.ts
npx jest tests/api.test.ts
```
