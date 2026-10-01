# VeriCrypt — System Architecture & Workflow

## 1. High-Level Architectural Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Browser (React + Vite + Tailwind)"]
        UI["Cybersecurity Dashboard UI"]
        State["Auth Context & Token Store"]
        CryptoUI["Verification & Decryption Modal"]
    end

    subgraph API_Layer ["Backend Gateway (Express.js + TypeScript)"]
        SecMW["Helmet & Rate Limiter & CORS"]
        AuthMW["JWT & RBAC Middleware"]
        Controllers["Auth / File / User / Audit Controllers"]
    end

    subgraph Service_Layer ["Core Engine Services"]
        CryptoService["Crypto Service (AES, RSA, SHA, PSS)"]
        FileService["File Lifecycle & Storage Manager"]
        AuditService["SIEM Security Audit Service"]
    end

    subgraph Storage_Layer ["Persistence & Storage Tier"]
        DB[(MongoDB: Users, Files, AuditLogs)]
        FS[("Encrypted File Store (/uploads/*.enc)")]
    end

    UI --> SecMW
    SecMW --> AuthMW
    AuthMW --> Controllers
    Controllers --> Service_Layer
    CryptoService --> Storage_Layer
    FileService --> Storage_Layer
    AuditService --> DB
```

---

## 2. End-to-End Hybrid Encryption & Transmission Workflow

### Step-by-Step Sequence:

```mermaid
sequenceDiagram
    autonumber
    actor Sender as Alice (Sender)
    participant Client as VeriCrypt Client
    participant Server as VeriCrypt Server
    participant Crypto as CryptoService
    participant Disk as Encrypted Storage
    participant DB as MongoDB
    actor Receiver as Bob (Receiver)

    Note over Sender,Client: Step 1: File Selection & Key Unlocking
    Sender->>Client: Selects file, recipient (Bob), expiration, enters password
    Client->>Server: POST /api/files/share (Multipart payload)

    Note over Server,Crypto: Step 2: Hybrid Encryption Engine
    Server->>DB: Fetch Alice (Sender) and Bob (Receiver) profiles
    Server->>Crypto: Decrypt Alice's private key (PBKDF2 + AES-GCM) with Alice's password
    Server->>Crypto: Compute SHA-256(Original File Buffer)
    Server->>Crypto: Sign SHA-256 hash using Alice's private key (RSA-PSS)
    Server->>Crypto: Generate random 256-bit AES key & 96-bit IV
    Server->>Crypto: Encrypt file buffer with AES-256-GCM -> (Ciphertext + 128-bit AuthTag)
    Server->>Crypto: Encrypt AES key using Bob's RSA Public Key (RSA-OAEP)

    Note over Server,Disk: Step 3: Zero-Plaintext Persistence
    Server->>Disk: Write ONLY ciphertext to /uploads/{UUID}.enc
    Server->>DB: Save File Record (IV, AuthTag, EncryptedAESKey, Hash, Signature, Expiration)
    Server->>DB: Record Audit Logs (FILE_UPLOADED, FILE_ENCRYPTED, FILE_SHARED)
    Server-->>Client: Returns 201 Created (Package ID & Hash)

    Note over Receiver,Client: Step 4: Verification & Retrieval
    Receiver->>Client: Opens Received Files & clicks "Verify & Download"
    Client->>Receiver: Prompts Bob for password (to unlock Bob's private key)
    Receiver->>Client: Enters Bob's password
    Client->>Server: POST /api/files/:id/verify { password }
    Server->>DB: Retrieve file package and Alice's public key
    Server->>Crypto: Decrypt Bob's private key (PBKDF2 + AES-GCM) with Bob's password
    Server->>Crypto: Decrypt AES key with Bob's private key (RSA-OAEP)
    Server->>Disk: Read ciphertext
    Server->>Crypto: Decrypt ciphertext with AES-256-GCM & verify AuthTag
    Server->>Crypto: Compute SHA-256(Decrypted) and verify against stored SHA-256
    Server->>Crypto: Verify RSA-PSS signature against Alice's Public Key
    Server-->>Client: Verification Success Response
    Client->>Server: POST /api/files/:id/download { password }
    Server-->>Receiver: Streams original plaintext file
```

---

## 3. Storage Separation & Principle of Least Privilege
1. **Persistent Filesystem (`/uploads/`):** Contains **only** high-entropy encrypted blobs (`.enc`). Even in the event of an arbitrary physical disk theft, the contents are indistinguishable from random noise and unreadable without both the private RSA key and the user's password.
2. **Database Collections:**
   - `users`: Contains user metadata, bcrypt password hashes, SPKI public keys, and password-encrypted private key bundles.
   - `files`: Encapsulated AES session keys, IVs, GCM authentication tags, SHA-256 digests, and RSA-PSS signatures.
   - `auditLogs`: Structured immutable audit entries without sensitive cryptographic key material.
