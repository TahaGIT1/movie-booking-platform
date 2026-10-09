-- CineVerse PostgreSQL Schema v2.0
-- Based on the supplied CineVerse schema, with small implementation additions
-- explicitly marked as supporting tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('CUSTOMER','THEATRE_MANAGER','THEATRE_STAFF','SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE theatre_status_enum AS ENUM ('PENDING','DOCS_VERIFIED','APPROVED','REJECTED','SUSPENDED','ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE visual_format_enum AS ENUM ('2D','3D','IMAX','4DX','SCREEN_X');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE seat_tier_enum AS ENUM ('NORMAL','PREMIUM','RECLINER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE seat_status_enum AS ENUM ('AVAILABLE','BOOKED','UNAVAILABLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM ('INITIATED','PROCESSING','CONFIRMED','CANCELLED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('INITIATED','PROCESSING','SUCCESS','FAILED','CANCELLED','REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE ticket_scan_status_enum AS ENUM ('UNUSED','USED','INVALIDATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS theatres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_entity_name VARCHAR(255),
    gst_number VARCHAR(32) UNIQUE,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(16),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    status theatre_status_enum NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theatre_id UUID REFERENCES theatres(id) ON DELETE SET NULL,
    role user_role_enum NOT NULL DEFAULT 'CUSTOMER',
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    profile_photo_url TEXT,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles_permissions (
    id BIGSERIAL PRIMARY KEY,
    role user_role_enum NOT NULL,
    permission VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    device_label VARCHAR(128),
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS theatre_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theatre_id UUID NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL,
    file_url TEXT NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theatre_id UUID NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
    screen_number VARCHAR(16) NOT NULL,
    name VARCHAR(64) NOT NULL,
    supported_formats visual_format_enum[] NOT NULL DEFAULT '{2D}',
    sound_system VARCHAR(64),
    total_capacity INT NOT NULL CHECK(total_capacity > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(theatre_id, screen_number)
);

CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
    row_label VARCHAR(4) NOT NULL,
    seat_number INT NOT NULL CHECK(seat_number > 0),
    tier seat_tier_enum NOT NULL DEFAULT 'NORMAL',
    is_accessible BOOLEAN NOT NULL DEFAULT FALSE,
    is_broken BOOLEAN NOT NULL DEFAULT FALSE,
    grid_x INT NOT NULL,
    grid_y INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(screen_id, row_label, seat_number)
);

CREATE TABLE IF NOT EXISTS movies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    synopsis TEXT,
    duration_minutes INT NOT NULL CHECK(duration_minutes > 0),
    censor_certificate VARCHAR(8) NOT NULL,
    original_language VARCHAR(64) NOT NULL,
    supported_languages VARCHAR(64)[] NOT NULL DEFAULT '{}',
    genres VARCHAR(64)[] NOT NULL DEFAULT '{}',
    cast_members JSONB NOT NULL DEFAULT '[]'::jsonb,
    director VARCHAR(128),
    poster_url TEXT,
    trailer_url TEXT,
    release_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theatre_id UUID NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
    screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE RESTRICT,
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    visual_format visual_format_enum NOT NULL DEFAULT '2D',
    language_version VARCHAR(64) NOT NULL,
    base_tier_pricing JSONB NOT NULL,
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK(end_time > start_time)
);

CREATE TABLE IF NOT EXISTS show_seat_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    status seat_status_enum NOT NULL DEFAULT 'AVAILABLE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(show_id, seat_id)
);

CREATE TABLE IF NOT EXISTS concession_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theatre_id UUID NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64),
    price_cents INT NOT NULL CHECK(price_cents >= 0),
    is_vegetarian BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT,
    is_in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    theatre_id UUID REFERENCES theatres(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
    discount_percentage DECIMAL(5,2),
    flat_discount_amount INT,
    min_spend_amount INT NOT NULL DEFAULT 0,
    max_discount_cap INT,
    total_usage_limit INT NOT NULL DEFAULT 0,
    per_user_limit INT NOT NULL DEFAULT 1,
    current_redemptions INT NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((discount_percentage IS NOT NULL) <> (flat_discount_amount IS NOT NULL)),
    CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100))
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE RESTRICT,
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    subtotal_cents INT NOT NULL CHECK(subtotal_cents >= 0),
    convenience_fee_cents INT NOT NULL DEFAULT 0 CHECK(convenience_fee_cents >= 0),
    tax_cents INT NOT NULL DEFAULT 0 CHECK(tax_cents >= 0),
    discount_cents INT NOT NULL DEFAULT 0 CHECK(discount_cents >= 0),
    total_amount_cents INT NOT NULL CHECK(total_amount_cents >= 0),
    status booking_status_enum NOT NULL DEFAULT 'INITIATED',
    qr_payload_hash TEXT,
    qr_scan_status ticket_scan_status_enum NOT NULL DEFAULT 'UNUSED',
    scanned_at TIMESTAMPTZ,
    scanned_by_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cancellation_fee_cents INT NOT NULL DEFAULT 0,
    refund_amount_cents INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    allocated_price_cents INT NOT NULL CHECK(allocated_price_cents >= 0),
    UNIQUE(booking_id, seat_id)
);

CREATE TABLE IF NOT EXISTS booking_concessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES concession_items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK(quantity > 0),
    unit_price_cents INT NOT NULL CHECK(unit_price_cents >= 0)
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    gateway_name VARCHAR(64) NOT NULL DEFAULT 'MOCK',
    gateway_transaction_id VARCHAR(128) UNIQUE,
    gateway_order_id VARCHAR(128),
    amount_cents INT NOT NULL CHECK(amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(32) NOT NULL,
    status payment_status_enum NOT NULL DEFAULT 'INITIATED',
    idempotency_key UUID NOT NULL UNIQUE,
    gateway_response_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    amount_cents INT NOT NULL CHECK(amount_cents >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    provider_ref VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    rating_score SMALLINT NOT NULL CHECK(rating_score BETWEEN 1 AND 5),
    review_text TEXT,
    photos_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS watchlist (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    related_entity VARCHAR(64),
    related_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    target_entity VARCHAR(64) NOT NULL,
    target_id UUID,
    ip_address INET,
    user_agent TEXT,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_theatres_city_status ON theatres(city, status);
CREATE INDEX IF NOT EXISTS idx_shows_theatre_timeline ON shows(theatre_id, start_time, is_cancelled);
CREATE INDEX IF NOT EXISTS idx_shows_movie_timeline ON shows(movie_id, start_time);
CREATE INDEX IF NOT EXISTS idx_show_seat_inventory ON show_seat_status(show_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_history ON bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_reference_status ON bookings(booking_reference, qr_scan_status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);

-- Minimal permission seed for P0. Expand later.
INSERT INTO roles_permissions(role, permission) VALUES
('CUSTOMER','VIEW_MOVIES'),
('CUSTOMER','BOOK_TICKETS'),
('CUSTOMER','VIEW_OWN_BOOKINGS'),
('CUSTOMER','CANCEL_OWN_BOOKING'),
('THEATRE_MANAGER','MANAGE_THEATRE'),
('THEATRE_MANAGER','MANAGE_SEATS'),
('THEATRE_MANAGER','CREATE_SHOW'),
('THEATRE_MANAGER','VIEW_THEATRE_ANALYTICS'),
('THEATRE_STAFF','SCAN_TICKET'),
('THEATRE_STAFF','VIEW_TODAY_SHOWS'),
('SUPER_ADMIN','CREATE_MOVIE'),
('SUPER_ADMIN','MANAGE_USERS'),
('SUPER_ADMIN','APPROVE_THEATRE'),
('SUPER_ADMIN','GLOBAL_OVERRIDE')
ON CONFLICT DO NOTHING;
