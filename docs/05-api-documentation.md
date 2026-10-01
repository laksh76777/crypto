# CryptaShare — RESTful API Documentation

All API endpoints return standard JSON responses:

**Success Response:**
```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "..."
}
```

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new account, generates an RSA-2048 keypair, derives a key with PBKDF2 to encrypt the private key with AES-256-GCM, and issues a JWT token.

- **Request Body:**
  ```json
  {
    "name": "Alice Cooper",
    "email": "alice@cryptashare.io",
    "password": "Password123!",
    "role": "USER"
  }
  ```
- **Responses:**
  - `201 Created`: User registered and token returned.
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Email already exists.

### `POST /api/auth/login`
Authenticates a user against their bcrypt password hash and issues a JWT token.

- **Request Body:**
  ```json
  {
    "email": "alice@cryptashare.io",
    "password": "Password123!"
  }
  ```
- **Responses:**
  - `200 OK`: Authentication successful.
  - `401 Unauthorized`: Invalid credentials.
  - `403 Forbidden`: Account disabled by administrator.

### `GET /api/auth/me`
Retrieves the authenticated user's profile and public RSA key.
- **Headers:** `Authorization: Bearer <JWT>`
- **Response:** `200 OK`

---

## 2. File Sharing & Cryptography Endpoints

### `POST /api/files/share` (or `/api/files/upload`)
Multipart form-data endpoint that takes the original file in-memory, unlocks the sender's private key with `senderPassword`, encrypts the file with a fresh AES-256-GCM key, signs the SHA-256 hash with RSA-PSS, encrypts the AES key with the recipient's public key using RSA-OAEP, and writes only the ciphertext to disk.

- **Headers:** `Authorization: Bearer <JWT>`, `Content-Type: multipart/form-data`
- **Form Fields:**
  - `file`: Binary file upload (up to 50MB)
  - `receiverId`: MongoDB ObjectId of intended recipient
  - `senderPassword`: Password to unlock sender's private key for signing
  - `expirationHours`: `1`, `24`, `168` (7 days), or `0` (Never)
- **Response:** `201 Created`

### `GET /api/files/received`
Returns all encrypted file packages destined for the authenticated recipient.
- **Response:** `200 OK` (Array of file packages with sender details and expiration state)

### `GET /api/files/sent`
Returns all encrypted file packages created by the authenticated sender.
- **Response:** `200 OK`

### `GET /api/files/:id`
Retrieves detailed metadata, public keys, and cryptographic parameters for a specific file package.
- **Authorization:** Only the sender, recipient, or admin can access. Returns `403 Forbidden` otherwise.

### `POST /api/files/:id/verify`
Executes multi-step cryptographic verification:
1. Recipient RSA-OAEP private key decryption of AES key
2. AES-256-GCM decryption and authentication tag check
3. SHA-256 digest computation and bitwise comparison
4. Sender RSA-PSS digital signature verification
- **Request Body:**
  ```json
  {
    "password": "ReceiverPassword123!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "fileId": "66fb10...",
      "aesKeyDecrypted": true,
      "aesGcmAuthPassed": true,
      "sha256Matched": true,
      "signatureVerified": true,
      "allChecksPassed": true,
      "originalHash": "a1b2...",
      "computedHash": "a1b2..."
    }
  }
  ```

### `POST /api/files/:id/download`
Verifies integrity and, upon passing all checks, decrypts and streams the original file with its original filename and MIME type.
- **Request Body:** `{ "password": "..." }` (or query parameter `?password=...`)
- **Responses:**
  - `200 OK`: File stream (`Content-Disposition: attachment; filename="..."`)
  - `403 Forbidden`: Unauthorized user
  - `410 Gone`: Expired package
  - `422 Unprocessable Entity`: Verification failed (tampered data or bad signature).

### `POST /api/files/:id/tamper`
Academic demonstration endpoint. Flips bits in the stored encrypted ciphertext on disk to trigger AES-GCM and SHA-256 authentication failures during subsequent verification attempts.
- **Response:** `200 OK`

---

## 3. User & Administrative Endpoints

### `GET /api/users/recipients`
Returns all active registered users eligible to receive encrypted files. Excludes the current user.

### `GET /api/users/statistics`
Returns sent, received, verified, failed, and expired package counts.

### `GET /api/audit-logs`
Returns SIEM security audit events with optional query filtering (`action`, `limit`).

### `GET /api/admin/users`
Admin only. Returns all registered users with their status and public keys.

### `PATCH /api/admin/users/:id/status`
Admin only. Updates a user's status (`ACTIVE` or `DISABLED`).

### `GET /api/admin/statistics`
Admin only. Returns system-wide metrics across all users and files.
