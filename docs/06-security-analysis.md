# CryptaShare — Security Analysis & Threat Modeling

## 1. Threat Modeling (STRIDE Evaluation)

| STRIDE Threat Category | Potential Attack Vector | CryptaShare Mitigation Strategy |
|---|---|---|
| **Spoofing Identity** | Adversary claims to be Alice and sends a malicious file to Bob. | **RSA-PSS Digital Signature:** The file digest is digitally signed with Alice's private key. Bob verifies this using Alice's public certificate. An attacker without Alice's private key cannot forge this signature. |
| **Tampering with Data** | Attacker intercepts or modifies ciphertext on disk or in transit. | **AES-256-GCM + SHA-256:** AES-GCM includes a 128-bit authentication tag calculated via GHASH. Modifying even 1 bit causes decryption to abort. Furthermore, the pre-encryption SHA-256 digest is compared against the decrypted payload. |
| **Repudiation** | Alice claims she never sent the confidential document. | **Non-Repudiation via Digital Signatures:** Because Alice's private key is mathematically bound to the signature and only known to Alice, she cannot deny authorship. |
| **Information Disclosure** | Server disk compromised, physical theft, or database dump. | **Hybrid Encryption & Zero-Plaintext Storage:** Persistent storage contains only AES-256-GCM ciphertext. Private keys are encrypted using PBKDF2 (100k rounds) + AES-GCM. Plaintext files never reside on disk. |
| **Denial of Service** | Flooding upload or login endpoints to exhaust compute/storage. | **Rate Limiting & File Size Caps:** `express-rate-limit` enforces strict IP-based windows; Multer enforces a 50MB payload cap. |
| **Elevation of Privilege** | Standard user accesses admin functions or other users' files. | **Strict Backend RBAC:** Controllers verify that requester ID matches either `senderId`, `receiverId`, or has `ADMIN` role. Frontend state is never trusted. |

---

## 2. Attack Scenario Analyses

### Scenario A: Chosen-Ciphertext Attack (CCA) against RSA
- **Threat:** If basic RSA PKCS#1 v1.5 padding is used, Bleichenbacher-style padding oracle attacks can decrypt ciphertexts.
- **CryptaShare Defense:** Employs **RSA-OAEP** with SHA-256. OAEP provides provable indistinguishability under adaptive chosen-ciphertext attacks (IND-CCA2).

### Scenario B: Database Breach / Insider Threat
- **Threat:** Malicious database administrator inspects MongoDB collections.
- **Observations:**
  - `passwordHash` is protected by bcrypt with salt (12 rounds).
  - `encryptedPrivateKey` is protected by PBKDF2 (100,000 iterations) + AES-256-GCM.
  - The database contains **zero plaintext files** and **zero plaintext private keys**.
  - The administrator cannot decrypt any user's files without their account password.

### Scenario C: File Tampering on Disk
- **Threat:** Attacker modifies `.enc` ciphertext in the storage directory.
- **Observation:** When receiver triggers verification, AES-256-GCM detects the authentication tag mismatch and immediately halts. Download is blocked, and an alert is displayed.

---

## 3. Cryptographic Hygiene & Best Practices
1. **No Hardcoded Secrets:** All secrets, ports, and parameters are managed through environment variables with secure defaults.
2. **Sanitized Error Outputs:** Production error handlers omit stack traces and internal system paths.
3. **Audit Log Privacy:** Passwords, tokens, private keys, and raw symmetric keys are sanitized/redacted before writing to SIEM logs.
