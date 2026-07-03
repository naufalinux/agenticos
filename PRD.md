# Product Requirement Document (PRD)

## Project: AgenticOS Desktop System Service/Daemon

**Document Version:** 1.0.0

**Target Architecture:** $x86\_64$ Windows & Linux

**System Type:** Hybrid Event-Driven Microservices Local Daemon

**Security Level:** Production-Grade Enterprise (RAT-Mitigated Safeguards)

---

## 1. Executive Summary

### 1.1 High-Level Overview

AgenticOS is an innovative, chat-based, OS-level Agentic AI desktop system service and daemon designed to automate advanced workflows on Windows and Linux $x86\_64$ platforms. Unlike traditional remote desktop tools, AgenticOS operates directly within the system background with elevated privileges, interpreting human intent through natural language interfaces and translating it into precise low-level human-computer interactions (HCI) and system tasks.

### 1.2 Core Problem Statement

Enterprise automation in specialized domains like Hospital Information Systems (HIS) and Financial Management often requires interacting with legacy desktop applications, direct local databases, and protected system files. Existing automation solutions (such as basic RPA or cloud-bound AI wrappers) either lack deep OS-level execution privileges, fail to adapt dynamically to unexpected operational contexts, or create massive data-privacy liabilities by routing local enterprise data to external, unsecured cloud servers.

### 1.3 Value Proposition

* **Deep OS Integration:** Direct execution via low-level native bindings (Win32 API / X11-uinput) to manipulate mice, keyboards, files, and local databases.
* **Hardened Local Security:** Built with strict Remote Access Trojan (RAT) countermeasures, enforcing user-binding, multi-factor authentication, structural state isolation, and forensically detailed auditing.
* **Deterministic AI Control:** Orchestrated via dynamic, state-managed execution loops where AI planning is completely governed by explicit enterprise contexts stored in markdown documents (`AGENTS.md`) and subject to precise Human-in-the-Loop approvals.

---

## 2. Product Scope & Core Features

### 2.1 MVP Feature Breakdown

* **Multi-Channel Interface Ingress:** Dual-mode inputs via a local webview chat interface designed following Google Gemini UI/UX specifications, alongside remote ingress via direct integration with the Telegram Bot API and a local WAHA (WhatsApp HTTP API) container webhook.
* **OS Execution Engine:** Automation capabilities encompassing application instantiation, keyboard typing simulation, mouse cursor manipulation (clicks, drags, taps), filesystem modification, local database queries, and system state operations (reboot/shutdown commands).
* **Granular Context Tuning:** Dynamic execution guidance driven through formatting conventions defined in a root-level `AGENTS.md` file, providing live system prompt overrides without requiring a daemon restart.
* **Three-Tier Authorization Gate:** Configurable approval parameters (`Approve`, `Deny`, `Always Approve`) mapped to distinct system operations and managed through local structured configuration profiles.

### 2.2 User Personas & Journeys

* **Enterprise System Administrator:** Provisions accounts, establishes foundational permissions, restricts system boundaries within `AGENTS.md`, and monitors system activity through cryptographic audit logs.
* **Operational Staff (HIS/Financial Operator):** Interacts with the interface to perform heavy daily workflows (e.g., *"Extract the last 5 days of inpatient metrics and update the offline financial database ledger"*).

### 2.3 Out-of-Scope Items

* Multi-tenant remote cloud dashboards.
* Automated multi-device cross-network machine coordination.
* Direct kernel-level driver injection or kernel-space operations.

---

## 3. Technical & Agentic Architecture

### 3.1 Specified Production Tech Stack

| Layer | Component Technology | Implementation Strategy |
| --- | --- | --- |
| **Core Daemon** | **Rust** | Compiled to a standalone, low-footprint binary. Built with native system service wrappers (`windows-service` for Windows Service Control Manager, and native `systemd` units for Linux). Handles elevated system calls. |
| **CLI Client** | **Go (Golang)** | Built into a standalone binary (`agenticos`). Utilizes high-performance terminal layout rendering for interactive commands and streaming. |
| **Frontend UI** | **Tauri (Rust-Backed Webview)** | Renders a lightweight, high-performance web dashboard engineered to mimic the layout, typography, and responsive state animations of Google Gemini's web application. Runs with memory overhead < 20MB. |
| **Local Database** | **SQLite via SQLCipher Extension** | Single-file database encrypted locally using military-grade AES-256 encryption. Restricts read/write actions strictly to the system `SYSTEM` (Windows) or `root` (Linux) context. |
| **Local IPC Interface** | **gRPC over Localhost (via Tonic Crate)** | Facilitates low-latency, strictly isolated inter-process communication between the CLI client/Tauri frontend and the underlying Rust daemon via Protocol Buffers. Bound exclusively to `127.0.0.1:50051`. |
| **Ingress Protocols** | **REST & WebSockets (via Axum Crate)** | Running on `127.0.0.1:50052`. Exposes a deterministic webhook layout to accept incoming POST traffic from the local WAHA Docker container and streams live UI state packets to the Tauri frame. |
| **Orchestration Core** | **Google Gemini LLM API** | Utilizes official API interfaces to continuously infer user query intent against structural instructions loaded from `AGENTS.md`. |
| **WhatsApp Gateway** | **WAHA Container (Docker Local)** | Encapsulates the underlying WhatsApp Web protocols into a standard REST abstraction layer, proxying chat payloads to the core daemon's loopback receiver. |

### 3.2 Agentic AI Core Architecture

```
[User Chat / WA / TG] ──> [Ingress REST/gRPC] ──> [Planner Service]
                                                        │
                                               (Loads AGENTS.md Rules)
                                                        │
                                                        ▼
[OS Target] <── [Executor (Rust)] <── [Approval Gate] <─┘
     │                  │
     ▼                  ▼
[Validator] ──> [Task Logs (SQLCipher)]

```

* **The Planner:** Implements a stateful parsing graph that ingests `InboundMessageEvent` tokens and matches them against rules extracted from `AGENTS.md`. It outputs a strict JSON Directed Acyclic Graph (DAG) specifying step-by-step actions.
* **The Executor:** Consumes verified sub-task JSON tokens and transforms them into native window procedures via raw OS calls (e.g., using `winuser` macros on Windows or `/dev/uinput` interfaces on Linux).
* **The Validator:** Executes precise evaluation heuristics (e.g., verifying if a target process ID exists or if a text string resides within a local database field) to confirm task completeness.

---

## 4. Functional & Non-Functional Requirements

### 4.1 System Lifecycles & Security Flows

#### First-Time User Registration

1. The user logs into the local OS workspace and initiates the Tauri frontend interface.
2. The core daemon captures a permanent hardware fingerprint (Hardware ID/HWID) by hashing motherboard UUIDs, CPU serial indices, and primary network interface MAC addresses.
3. The user interacts with the Registration screen:
* Selects active local OS user binding variables (`%USERNAME%` or `$USER`).
* Establishes a complex administrative passphrase.
* Inputs a designated corporate Google Mail address for system event alerts.
* Scans a dynamically displayed QR code using a standard TOTP Authenticator application.


4. Kredential matrices are hashed using **Argon2id** and committed into the SQLCipher database layer.
5. The system shoots an automated verification OTP code to the provided Google Mail profile via a secure corporate SMTP relay.
6. Upon entering the correct OTP, registration is sealed, and default configuration profiles (`config.json` / `settings.ini`) are populated.

#### Daily Secure Authentication Loop

1. The workstation undergoes system booting procedures; `agenticosd` / `AgenticOSService` initializes instantly within the system background.
2. The user executes local OS session authentication.
3. Following a deterministic **5-second operational stability delay**, the Tauri application is launched in focus-locked modal state.
4. The user inputs their account passphrase matching the pre-populated current OS `$USER` string.
5. Upon local verification of the password, the daemon immediately transmits a forensically complete **Security Notification Email** to the registered Google account containing:
* Precise timestamp and machine Hostname.
* External network IP address.
* Derived GPT coordinate lookups, city-level geolocation, and an embedded Google Maps navigation anchor.


6. The user passes the authentication barrier, moving the service into a `STAND_BY` processing state.

#### The Agentic Iteration Loop (Chat & Task Flow)

1. An incoming instruction string is ingested by the daemon from the Tauri workspace, WhatsApp, or Telegram.
2. The daemon switches its operational state variable to `PLANNING`, triggering the **Planner** to compose a detailed sequential execution manifest based on rules parsed from `AGENTS.md`.
3. The state transitions to `AWAITING_APPROVAL`. The interface holds execution and displays an interaction matrix: **[Approve]**, **[Deny]**, and **[Always Approve for Session]**.
4. Upon user approval, the state moves to `EXECUTING`. The **Executor** drives low-level OS operations step-by-step.
5. Each micro-action is written to the **Task Logs** system with verbose metadata parameters.
6. The **Validator** analyzes execution outputs, transitioning the system state to `AWAITING_COMPLETION`.
7. A conversational confirmation modal is issued: *"Task Finished? [Yes] / [No]"*.
* **If Yes:** The daemon returns to `STAND_BY`, awaiting a new instruction.
* **If No:** The agent smoothly requests clearer clarifying parameters from the operator using polite, formal phrasing.



### 4.2 Non-Functional Requirements

* **Security:** Enforce rigid cryptographic boundaries. Absolute isolation of port listeners (`127.0.0.1`). Rejection of any network frame originating outside the loopback address.
* **Session Lifecycle Resilience:** Detection of OS shutdown/reboot interrupts (`SIGTERM`, `WM_QUERYENDSESSION`) must trigger instantaneous session token invalidation, current stack termination, memory wipe, and database log sync.
* **Performance Constraints:** Background execution profiling must not exceed **250MB RAM** and **15% total CPU utilization** during heavy UI simulation states.

---

## 5. API & Data Model Specifications

### 5.1 Local Network Endpoint Blueprints

#### gRPC Services (Port `50051`)

* `rpc Register(RegisterRequest) returns (RegisterResponse);`
* *Purpose:* Binds user attributes, sets up passwords and TOTP codes.


* `rpc Login(LoginRequest) returns (LoginResponse);`
* *Purpose:* Authorizes access and triggers forensic email notifications.


* `rpc StreamEvents(stream UserEvent) returns (stream AgentState);`
* *Purpose:* Real-time, bidirectional command and telemetry pipeline.



#### REST HTTP Endpoints (Port `50052`)

* `POST /api/v1/webhook/waha`
* *Payload:* JSON body containing inbound WhatsApp message content and meta-structures.


* `GET /api/v1/status`
* *Response:* Structural status schema (`LOCKED`, `STAND_BY`, `EXECUTING`) along with active tracking configurations.



---

## 6. CLI Command Architecture (`agenticos`)

The system command-line executable interacts with the gRPC service framework over the loopback link using the following syntax structure:

```bash
# Security & Account Provisioning
agenticos register
agenticos login
agenticos logout
agenticos status

# Task & Pipeline Interactions
agenticos exec "Open the system ledger and append row summary"
agenticos approve
agenticos deny
agenticos complete --yes
agenticos complete --no

# Context Operational Adjustments
agenticos context reload
agenticos config --show

# Forensic Telemetry
agenticos logs --tail

```

---

## 7. Error Handling, Failsafe, & Crash Prevention

### 7.1 Defensive Sandboxing & Resource Isolation

* **Panic Capture Infrastructure:** Implement structured recovery loops across execution routines (`defer recover()` blocks across Go threads and `catch_unwind` closures around Rust native binding stacks) to prevent singular processing failures from crashing the core system daemon.
* **Hard Execution Context Timeouts:** Impose strict 30-second context limits on all low-level shell integrations and native windows automation instructions. If a process stops responding, it must be forcefully terminated using a native `SIGKILL` routine.
* **Hardcoded Protection Safeguards:** The `Executor` core must implement compiled blocklist rules preventing destructive structural modifications to root system directories (e.g., blocking `rm -rf /` or alterations within `C:\Windows\System32`), regardless of instructions found within local `AGENTS.md` files.

### 7.2 Fallback States & Structural Resilience

* **Network Disruptions:** If external network infrastructure goes offline, internet-dependent frameworks (Telegram API, external Gemini APIs) must fall back to an exponential back-off reconnection loop. The core daemon continues operating strictly via local gRPC interfaces.
* **Profile Damage Recovery:** If configuration files or database structures face corruption on initialization, the daemon must drop back to a native pre-configured enterprise baseline state while setting system authorization status variables to `LOCKED` for security.
* **System-Managed Diagnostics:** The background service configurations must integrate directly into host OS monitoring structures (`Restart=on-failure` configurations inside systemd units and standard Service Recovery Manager workflows on Windows environments) to ensure high operational availability.