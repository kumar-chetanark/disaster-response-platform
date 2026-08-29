# Database Architecture — Disaster Response Platform (PS-07)

## Production Database
- **Engine**: Supabase PostgreSQL (Port 5432 Session Pooler)
- **Host**: `aws-0-ap-southeast-1.pooler.supabase.com`
- **ORM**: SQLAlchemy 2.0 (Declarative Base)
- **Local Fallback**: SQLite (`disaster_response_dev.db`)

## Schema & Core Entities (13 Relational Tables)

### 1. `external_alerts`
Persistent worldwide disaster early warning feed from GDACS.
- `id` (VARCHAR(64), PK)
- `source` (VARCHAR(32), INDEX): e.g. "GDACS"
- `external_id` (VARCHAR(64), INDEX): Source-assigned unique ID
- `event_type` (VARCHAR(64), INDEX): EARTHQUAKE, FLOOD, TROPICAL_CYCLONE, WILDFIRE, DROUGHT, etc.
- `title` (TEXT)
- `description` (TEXT)
- `country` (TEXT)
- `countries` (TEXT): Comma-separated list of affected countries
- `location_name` (TEXT)
- `latitude`, `longitude` (FLOAT)
- `severity` (VARCHAR(32), INDEX): CRITICAL, HIGH, MEDIUM, LOW
- `alert_level` (VARCHAR(32)): Red, Orange, Green
- `alert_score` (FLOAT)
- `population_affected_est` (VARCHAR(128))
- `published_at` (DATETIME): Real disaster event detection time from source
- `updated_at`, `created_at`, `last_seen_at` (DATETIME)
- `source_url` (TEXT)
- `status` (VARCHAR(32), INDEX): NEW, REVIEWED, VALIDATED, REJECTED, CONVERTED_TO_INCIDENT
- `converted_incident_id` (VARCHAR(64), FK -> `incidents.id`, NULLABLE)
- `raw_data` (TEXT): JSON payload

### 2. `incidents`
Canonical active disaster incident registry.
- `id` (VARCHAR(36), PK)
- `title` (VARCHAR(255))
- `description` (TEXT)
- `disaster_type` (VARCHAR(50)): flood, earthquake, cyclone, fire, etc.
- `severity` (VARCHAR(50)): CRITICAL, HIGH, MEDIUM, LOW
- `priority_level` (VARCHAR(50)): Level 1, Level 2, Level 3
- `status` (VARCHAR(50)): PENDING, ACTIVE, MONITORING, RESOLVED
- `latitude`, `longitude` (FLOAT)
- `location_name`, `sector` (VARCHAR(255))
- `affected_population` (VARCHAR(100))
- `affected_area_sq_km` (FLOAT)
- `resource_coverage_pct` (INTEGER)
- `is_field_verified` (BOOLEAN)
- `created_at`, `updated_at` (DATETIME)

### 3. `incident_sources`
Corroboration audit trail linked to incidents.
- `id` (VARCHAR(36), PK)
- `incident_id` (VARCHAR(36), FK -> `incidents.id`, CASCADE)
- `source_type` (VARCHAR(50)): CITIZEN, GOVERNMENT, SENSOR
- `channel_badge` (VARCHAR(50)): GLOBAL_INTEL, SMS, WEB, SENSOR
- `confidence_score` (FLOAT)
- `summary` (TEXT)
- `raw_content` (TEXT)
- `is_contradiction` (BOOLEAN)
- `contradiction_reason` (VARCHAR(255))
- `created_at` (DATETIME)

### 4. `alerts`
Broadcast and internal alerts for command operators.
- `id` (VARCHAR(36), PK)
- `incident_id` (VARCHAR(36), FK -> `incidents.id`, CASCADE)
- `category` (VARCHAR(50)): CIVIL, SENSOR, DISPATCH
- `source`, `location`, `message` (TEXT)
- `severity` (VARCHAR(50))
- `is_reviewed_by_authority` (BOOLEAN)
- `alert_time` (VARCHAR(50))
- `created_at` (DATETIME)

### 5. `resources`
Personnel, vehicle squads, aerial drones, and relief shelters.
- `id` (VARCHAR(36), PK)
- `name`, `type`, `category` (VARCHAR)
- `status` (VARCHAR): AVAILABLE, ASSIGNED, DISPATCHED, EN_ROUTE
- `base_location` (VARCHAR)
- `latitude`, `longitude` (FLOAT)
- `capabilities`, `capacity`, `personnel_count`, `equipment_details` (TEXT)
- `shelter_capacity`, `shelter_occupied` (INTEGER)

### 6. `resource_allocations`
Capability-matched recommendation advisories.
- `id` (VARCHAR(36), PK)
- `incident_id` (VARCHAR(36), FK -> `incidents.id`)
- `resource_id` (VARCHAR(36), FK -> `resources.id`)
- `status` (VARCHAR): RECOMMENDED, APPROVED, MODIFIED, REJECTED
- `match_score` (INTEGER)
- `travel_time_est`, `reason` (TEXT)
- `decided_by`, `decided_at` (DATETIME)

### 7. `operations`
Active consolidated tactical missions.
- `id` (VARCHAR(36), PK)
- `incident_id` (VARCHAR(36), FK -> `incidents.id`)
- `resource_id` (VARCHAR(36), FK -> `resources.id`)
- `operation_type`, `state` (VARCHAR): DISPATCHED, IN TRANSIT, ON SCENE, ACTIVE, COMPLETED
- `destination_location`, `authorized_by`, `mission_objective` (TEXT)
- `dispatched_time`, `estimated_completion`, `field_updates_log` (TEXT)

### 8. `assessments`
Field and aerial damage reconnaissance records.
- `id` (VARCHAR(36), PK)
- `incident_id` (VARCHAR(36), FK -> `incidents.id`)
- `assessor_id`, `assessor_role`, `hazard_type` (VARCHAR)
- `severity_score` (FLOAT), `structural_damage_pct` (FLOAT), `road_blocked` (BOOLEAN), `survivors_observed` (INTEGER)
- `notes` (TEXT), `created_at` (DATETIME)

### 9. `reports`
Official SITREP debrief documents and PDF downloads.
- `id` (VARCHAR(36), PK)
- `incident_id` (VARCHAR(36), FK -> `incidents.id`, NULLABLE)
- `report_type`, `title`, `author`, `summary`, `metrics_summary`, `tags`, `status` (TEXT)

### 10. `citizen_reports`
Direct civilian distress submissions.
- `id` (VARCHAR(36), PK)
- `citizen_name`, `phone_number`, `disaster_type`, `severity`, `address`, `description` (TEXT)
- `latitude`, `longitude` (FLOAT), `people_count` (INTEGER), `medical_attention_required` (BOOLEAN)

### 11. `shelters`
Relief centers and emergency medical facilities.
- `id` (VARCHAR(36), PK), `name`, `location`, `total_capacity`, `current_occupancy`, `available_beds`, `icu_beds`, `water_litres`, `food_person_days`, `medicine_days_stock`

### 12. `inventory`
Relief stockpile items.
- `id` (VARCHAR(36), PK), `item_name`, `category`, `quantity`, `unit`, `storage_location`

### 13. `users`
Authority personnel identities.
- `id` (VARCHAR(36), PK), `email`, `hashed_password`, `full_name`, `role`, `authority_level`, `badge_number`, `is_active`
