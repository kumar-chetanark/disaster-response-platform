# Database Architecture (Phase 1 — Backend Foundation)

## Technology
- **Database**: PostgreSQL (Supabase compatible) / SQLite development engine.
- **ORM**: SQLAlchemy 2.0.
- **Migrations**: Alembic with auto-generation support.

## Core Schema & Tables

### 1. `users`
Authority and citizen user identities and permission levels.
- `id` (VARCHAR(36), PK): UUID
- `email` (VARCHAR(255), UNIQUE, INDEX)
- `hashed_password` (VARCHAR(255), NULLABLE)
- `full_name` (VARCHAR(255))
- `role` (VARCHAR(50)): `CITIZEN`, `AUTHORITY`, `FIRST_RESPONDER`, `ADMIN`
- `authority_level` (INTEGER): e.g., Level 5 Command
- `badge_number` (VARCHAR(50), NULLABLE)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (DATETIME)

### 2. `incidents`
Canonical, deduplicated disaster incident records.
- `id` (VARCHAR(36), PK): UUID
- `title` (VARCHAR(255), INDEX)
- `description` (TEXT)
- `disaster_type` (VARCHAR(50), INDEX): cyclone, flood, earthquake, infrastructure, fire
- `severity` (VARCHAR(20), INDEX): `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
- `priority_level` (VARCHAR(20)): `Level 1`, `Level 2`, `Level 3`
- `status` (VARCHAR(20), INDEX): `ACTIVE`, `MONITORING`, `RESOLVED`
- `latitude`, `longitude` (FLOAT)
- `location_name` (VARCHAR(255))
- `sector` (VARCHAR(50))
- `affected_population` (VARCHAR(50))
- `affected_area_sq_km` (FLOAT)
- `resource_coverage_pct` (INTEGER)
- `is_field_verified` (BOOLEAN)
- `created_at`, `updated_at` (DATETIME)

### 3. `incident_sources`
Corroboration source ledger storing distinct multi-channel intelligence contributing to a canonical incident.
- `id` (VARCHAR(36), PK): UUID
- `incident_id` (VARCHAR(36), FK -> incidents.id, INDEX)
- `source_type` (VARCHAR(50)): `CITIZEN`, `WEATHER`, `NEWS`, `GOVERNMENT`, `FIELD_ASSESSMENT`, `SATELLITE`
- `source_label` (VARCHAR(255))
- `channel_badge` (VARCHAR(50)): `CELL_SMS`, `IVR_VOICE`, `WEB_APP`, `IMD_METEO`, `GOV_BULLETIN`
- `confidence_score` (FLOAT)
- `summary` (TEXT)
- `raw_content` (TEXT)
- `created_at` (DATETIME)

### 4. `citizen_reports`
Raw public citizen intakes prior to/post correlation.
- `id` (VARCHAR(36), PK): UUID
- `incident_id` (VARCHAR(36), FK -> incidents.id, NULLABLE, INDEX)
- `location_text` (VARCHAR(255))
- `disaster_type` (VARCHAR(50))
- `description` (TEXT)
- `is_people_trapped` (BOOLEAN)
- `is_immediate_danger` (BOOLEAN)
- `affected_people_estimate` (VARCHAR(50))
- `citizen_contact` (VARCHAR(100))
- `status` (VARCHAR(50)): `INGESTED`, `CORROBORATED`, `RESOLVED`
- `created_at` (DATETIME)

### 5. `assessments`
Generalized multi-mode field reconnaissance records (Drone, Helicopter, Land, Water).
- `id` (VARCHAR(36), PK): UUID
- `incident_id` (VARCHAR(36), FK -> incidents.id, INDEX)
- `assessment_mode` (VARCHAR(50)): `Aerial — Drone`, `Aerial — Helicopter`, `Land Team / Vehicle`, `Water / Boat Team`
- `mission_type` (VARCHAR(100)): Area Scan, Damage Assessment, Search & Rescue Support, Resource Delivery, Route Assessment, Communication
- `asset_id` (VARCHAR(100))
- `asset_name` (VARCHAR(255))
- `assessment_time` (VARCHAR(50))
- `weather_conditions` (VARCHAR(255))
- `area_surveyed` (VARCHAR(255))
- `hazards_detected` (TEXT)
- `structures_damaged_count` (INTEGER)
- `road_accessibility_status` (VARCHAR(100))
- `people_observed` (VARCHAR(255))
- `recommended_resources` (TEXT)
- `evacuation_route_status` (VARCHAR(100))
- `operator_observations` (TEXT)
- `confidence_score` (FLOAT)
- `media_file_urls` (TEXT)
- `submitted_at` (DATETIME)

### 6. `resources`
Operational emergency asset inventory.
- `id` (VARCHAR(36), PK): UUID
- `name` (VARCHAR(255), INDEX)
- `category` (VARCHAR(50), INDEX): medical, police_army, rescue, aerial, water, land, shelter, supplies
- `status` (VARCHAR(50), INDEX): `AVAILABLE`, `IN OPERATION`, `DISPATCHED`, `MAINTENANCE`, `UNAVAILABLE`
- `base_location` (VARCHAR(255), INDEX)
- `personnel_count` (INTEGER)
- `equipment_details` (TEXT)
- `shelter_capacity`, `shelter_occupied` (INTEGER)
- `supplies_food_days`, `supplies_food_people`, `supplies_medicine_count`, `supplies_clothing_count` (INTEGER)
- `created_at`, `updated_at` (DATETIME)

### 7. `resource_allocations`
Decision records linking incidents to resources.
- `id` (VARCHAR(36), PK): UUID
- `incident_id` (VARCHAR(36), FK -> incidents.id, INDEX)
- `resource_id` (VARCHAR(36), FK -> resources.id, INDEX)
- `status` (VARCHAR(50)): `RECOMMENDED`, `APPROVED`, `MODIFIED`, `REJECTED`, `ALLOCATED`
- `match_score` (INTEGER)
- `travel_time_est` (VARCHAR(50))
- `reason` (TEXT)
- `decided_by` (VARCHAR(255))
- `decided_at` (DATETIME)
- `created_at` (DATETIME)

### 8. `operations`
Active operational mission tracks created upon Authority dispatch.
- `id` (VARCHAR(36), PK): UUID
- `incident_id` (VARCHAR(36), FK -> incidents.id, INDEX)
- `resource_id` (VARCHAR(36), FK -> resources.id, INDEX)
- `operation_type` (VARCHAR(100))
- `state` (VARCHAR(50), INDEX): `DISPATCHED`, `IN TRANSIT`, `IN OPERATION`, `COMPLETED`
- `destination_location` (VARCHAR(255))
- `authorized_by` (VARCHAR(255))
- `mission_objective` (TEXT)
- `dispatched_time` (VARCHAR(50))
- `estimated_completion` (VARCHAR(50))
- `field_updates_log` (TEXT)
- `created_at`, `updated_at` (DATETIME)

### 9. `alerts`
External early warnings and SCADA alerts.
- `id` (VARCHAR(36), PK): UUID
- `incident_id` (VARCHAR(36), FK -> incidents.id, NULLABLE, INDEX)
- `category` (VARCHAR(50)): `METEO`, `CIVIL`, `INFRASTRUCTURE`, `MEDICAL`, `GOVERNMENT`
- `source` (VARCHAR(255))
- `location` (VARCHAR(255))
- `message` (TEXT)
- `severity` (VARCHAR(20)): `critical`, `warning`, `info`
- `is_reviewed_by_authority` (BOOLEAN)
- `alert_time` (VARCHAR(50))
- `created_at` (DATETIME)

### 10. `shelters`
Dedicated shelter capacity tracking.
- `id` (VARCHAR(36), PK): UUID
- `name` (VARCHAR(255), INDEX)
- `location` (VARCHAR(255))
- `total_capacity` (INTEGER)
- `current_occupancy` (INTEGER)
- `contact_phone` (VARCHAR(50))
- `created_at` (DATETIME)

### 11. `inventory`
Supplies and stockpile tracking.
- `id` (VARCHAR(36), PK): UUID
- `item_name` (VARCHAR(255), INDEX)
- `category` (VARCHAR(50)): food, medicine, clothing, power, shelter_supplies
- `quantity` (INTEGER)
- `unit` (VARCHAR(50))
- `storage_location` (VARCHAR(255))
- `created_at` (DATETIME)

### 12. `reports`
Historical debriefs and after-action logs.
- `id` (VARCHAR(36), PK): UUID
- `incident_id` (VARCHAR(36), FK -> incidents.id, NULLABLE, INDEX)
- `report_type` (VARCHAR(100))
- `title` (VARCHAR(255))
- `author` (VARCHAR(255))
- `summary` (TEXT)
- `metrics_summary` (VARCHAR(255))
- `tags` (VARCHAR(255))
- `created_at` (DATETIME)
