-- Create knowledge schema
CREATE SCHEMA IF NOT EXISTS knowledge;

CREATE TABLE IF NOT EXISTS knowledge.crawl_sessions (
    id int4 PRIMARY KEY NOT NULL,
    stats json,
    start_time timestamp,
    end_time timestamp,
    status varchar,
    config json
);

CREATE TABLE IF NOT EXISTS knowledge.crawl_metrics (
    id int4 PRIMARY KEY NOT NULL,
    requests_per_second float8,
    session_id int4,
    timestamp timestamp,
    success_rate float8,
    memory_usage float8,
    active_connections int4,
    queue_size int4,
    FOREIGN KEY (session_id) REFERENCES knowledge.crawl_sessions(id)
);

CREATE TABLE IF NOT EXISTS knowledge.crawled_pages (
    id int4 PRIMARY KEY NOT NULL,
    depth int4,
    meta_description varchar,
    title varchar,
    crawl_time timestamp,
    headers json,
    status_code int4,
    content json,
    url varchar,
    domain varchar,
    session_id int4,
    FOREIGN KEY (session_id) REFERENCES knowledge.crawl_sessions(id)
);

CREATE TABLE IF NOT EXISTS knowledge.founders (
    id int4 PRIMARY KEY NOT NULL,
    name varchar NOT NULL,
    title varchar,
    session_id int4,
    company varchar,
    batch varchar,
    company_url varchar,
    image_url varchar,
    description varchar,
    page_id int4,
    created_at timestamp,
    updated_at timestamp,
    raw_data json,
    linkedin_url text,
    FOREIGN KEY (session_id) REFERENCES knowledge.crawl_sessions(id)
);

CREATE TABLE IF NOT EXISTS knowledge.founder_linkedin_data (
    id int4 PRIMARY KEY NOT NULL,
    founder_id int4,
    created_at timestamp,
    full_profile jsonb,
    connections int4,
    skills jsonb,
    education jsonb,
    experience jsonb,
    updated_at timestamp,
    linkedin_url text,
    headline text,
    location text,
    FOREIGN KEY (founder_id) REFERENCES knowledge.founders(id)
); 