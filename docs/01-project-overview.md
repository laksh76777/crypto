# CryptaShare — Project Overview

## 1. Project Title
**CryptaShare — Secure File Sharing and Integrity Verification Using Hybrid Cryptography**

**Domain:** Computer Science & Engineering / Cryptography and Network Security  
**Academic Level:** College Mini-Project / Final Year Project

---

## 2. Executive Summary & Problem Statement
In conventional file transfer mechanisms and cloud storage providers, data security frequently relies upon perimeter defenses or single-key encryption systems. These architectures exhibit critical security vulnerabilities:
1. **Plaintext Storage Risks:** Service providers retain master access to plaintext files or decryption keys.
2. **Computational Inefficiency of Asymmetric Primitives:** Pure asymmetric encryption algorithms like RSA are mathematically incapable of encrypting large files efficiently due to key-size limitations and intense CPU overhead.
3. **Absence of Sender Authentication & Non-Repudiation:** Symmetric-only ciphers (e.g., standard AES) cannot provide proof of who originated the file without shared secrets.
4. **Undetected Tampering:** Without cryptographic authentication tags and pre-encryption cryptographic digests, malicious in-flight modification or bit rot goes completely undetected.

**CryptaShare** addresses these challenges by implementing a state-of-the-art **Hybrid Cryptosystem** coupled with digital signatures and strict authorization checks.

---

## 3. Core Objectives
1. **Confidentiality:** Guaranteed via **AES-256-GCM** (Galois/Counter Mode) with unique ephemeral 256-bit symmetric session keys and 96-bit Initialization Vectors (IVs) per file.
2. **Key Encapsulation & Authorization:** The ephemeral AES session key is securely encapsulated using **RSA-OAEP** with the intended recipient's public key (2048-bit/3072-bit), ensuring only the designated recipient's private key can unlock it.
3. **Cryptographic Integrity Verification:** Pre-encryption **SHA-256** cryptographic hashes are calculated on the original file and compared bit-for-bit against the post-decryption payload.
4. **Sender Authenticity & Non-Repudiation:** Senders digitally sign the SHA-256 file digest using **RSA-PSS** (Probabilistic Signature Scheme) with their private key. Receivers verify this signature against the sender's public certificate.
5. **Zero-Plaintext Storage Policy:** The server and database persist **only** AES-256-GCM ciphertext, encrypted key bundles, and metadata. No plaintext documents or plaintext private keys are ever stored on disk.
6. **Protected Private Key Storage:** Private RSA keys are shielded at rest in the database using a key derived from the user's password via **PBKDF2** (100,000 iterations, SHA-256) combined with **AES-256-GCM** authenticated encryption.
7. **Security Event Auditing (SIEM):** Complete audit trail recording all user registration, authentication, upload, encryption, decryption, integrity validation, expiration, and unauthorized access attempts.

---

## 4. Key Actors & User Roles

| Role | Permissions & Responsibilities |
|---|---|
| **USER** | Upload and encrypt files; select authorized recipients; sign payloads with private key; view incoming encrypted packages; run multi-stage cryptographic integrity verifications; decrypt and download authorized files; view personal audit history. |
| **ADMIN** | System-wide visibility; inspect user registry; toggle user status (`ACTIVE` vs `DISABLED`); monitor system cryptographic metrics; audit global security logs; simulate tampering demonstrations for academic verification. |

---

## 5. College Evaluation Criteria Checklist

- [x] End-to-end working implementation (no mock UI or stubbed crypto).
- [x] Correct hybrid cryptographic design (AES-256-GCM + RSA-OAEP).
- [x] Digital signatures implemented via RSA-PSS over SHA-256 digests.
- [x] Persistent zero-plaintext storage on disk and database.
- [x] Password-protected private key persistence (PBKDF2 + AES-GCM).
- [x] Simulated file tampering mechanism for laboratory demonstration.
- [x] Role-Based Access Control (RBAC) and time-based access expiration.
- [x] Comprehensive security audit logging.
- [x] Automated test suites covering all primitives, roundtrips, and attack simulations.
