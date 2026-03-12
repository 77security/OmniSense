-- Enable UUID extension for secure identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER CONFIGURATION (Zero-Knowledge Key Storage)
-- Note: 'vt_key_encrypted' should be encrypted client-side.
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY, -- Matches the ID from Identity service
    vt_key_encrypted_user TEXT, -- Encrypted with user's derived password key
    vt_key_encrypted_app TEXT,  -- Encrypted with app-level master key (for scheduled tasks)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. COMMON THREAT INTELLIGENCE (Base Table for inheritance/reference)
-- We use a mix of fixed columns and JSONB for vendor-specific detections
CREATE TABLE ti_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    query_count INTEGER DEFAULT 1,
    detections JSONB DEFAULT '{}', -- Format: {"CrowdStrike": "Malicious", "Kaspersky": "Clean"}
    tags TEXT[] DEFAULT '{}'
);

-- 3. FILE ENTITY
CREATE TABLE ti_files (
    id UUID PRIMARY KEY REFERENCES ti_base(id) ON DELETE CASCADE,
    hash_md5 CHAR(32) UNIQUE,
    hash_sha1 CHAR(40) UNIQUE,
    hash_sha256 CHAR(64) UNIQUE,
    file_size BIGINT,
    magic_string TEXT, -- e.g., "PE32 executable (console) Intel 80386"
    signer TEXT,       -- Digital signature info
    file_name_observed TEXT[] -- Array of seen filenames
);

-- 4. DOMAIN ENTITY
CREATE TABLE ti_domains (
    id UUID PRIMARY KEY REFERENCES ti_base(id) ON DELETE CASCADE,
    domain_name TEXT UNIQUE,
    whois_data JSONB,
    dns_records JSONB, -- { "A": ["1.1.1.1"], "MX": ["mail.ext.com"] }
    subdomains TEXT[],
    current_certificate_thumbprint TEXT
);

-- 5. IP ENTITY
CREATE TABLE ti_ips (
    id UUID PRIMARY KEY REFERENCES ti_base(id) ON DELETE CASCADE,
    ip_address INET UNIQUE,
    asn INTEGER,
    asn_org TEXT,
    whois_data JSONB,
    related_domains JSONB, -- List of domains with timestamps
    related_certs JSONB    -- List of SSL certs with timestamps
);

-- 6. URL ENTITY
CREATE TABLE ti_urls (
    id UUID PRIMARY KEY REFERENCES ti_base(id) ON DELETE CASCADE,
    url_full TEXT UNIQUE,
    url_host TEXT,
    url_path TEXT,
    final_redirect_url TEXT
);

-- 7. RELATIONSHIPS (The "Graph" component)
-- Connects IPs to Files (e.g., file downloaded from IP)
CREATE TABLE ti_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL,
    target_id UUID NOT NULL,
    rel_type TEXT NOT NULL, -- "downloaded_from", "resolves_to", "signed_by"
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB -- Specifics like "static" vs "dynamic" for file-ip rels
);

-- INDEXING FOR PERFORMANCE
CREATE INDEX idx_files_sha256 ON ti_files(hash_sha256);
CREATE INDEX idx_ips_address ON ti_ips(ip_address);
CREATE INDEX idx_domains_name ON ti_domains(domain_name);
CREATE INDEX idx_detections ON ti_base USING gin (detections);
