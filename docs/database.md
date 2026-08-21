# Database Schema Specification: Disaster Response Platform

## 1. Overview
The persistence layer is modeled in PostgreSQL (Supabase). It stores incidents, geospatial zones, damage assessments, emergency resources, and deployment audit logs.

*Status: **PLANNED** (No database migrations or live tables exist yet).*

---

## 2. Entity Relationship Overview
```
[ Incidents ] 1 ──── < [ Priority Zones ] 1 ──── < [ Allocations ] > ──── 1 [ Resources ]
      │                          │
      └────── 1 ──── < [ Aerial Assessments ]
```

---

## 3. Table Definitions

### 3.1 `incidents`
Stores top-level disaster events (floods, earthquakes, wildfires).
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique incident identifier |
| `title` | VARCHAR(255) | NOT NULL | Name of the incident |
| `type` | VARCHAR(50) | NOT NULL | `flood`, `earthquake`, `wildfire`, `hurricane` |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'active' | `active`, `monitoring`, `resolved` |
| `severity` | VARCHAR(50) | NOT NULL | `critical`, `high`, `medium`, `low` |
| `latitude` | DOUBLE PRECISION | NOT NULL | Epicenter latitude |
| `longitude` | DOUBLE PRECISION | NOT NULL | Epicenter longitude |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

### 3.2 `aerial_assessments` (Core Feature)
Stores imagery assessment runs, damage indexes, and AI output metrics.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Assessment identifier |
| `incident_id` | UUID | REFERENCES incidents(id) | Associated incident |
| `image_url_before` | TEXT | NULLABLE | Baseline imagery reference URL |
| `image_url_after` | TEXT | NOT NULL | Post-incident aerial imagery reference URL |
| `damage_score` | FLOAT | NOT NULL (0.0 to 1.0) | Calculated structural damage percentage |
| `severity_level` | VARCHAR(50) | NOT NULL | `critical`, `high`, `moderate`, `minor` |
| `confidence` | FLOAT | NOT NULL (0.0 to 1.0) | Confidence score of assessment |
| `detected_features` | JSONB | NOT NULL, DEFAULT '{}' | Coordinates of bounding boxes / masks |
| `ai_model_version`| VARCHAR(100)| NOT NULL | Model / heuristic version used |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Assessment timestamp |

### 3.3 `priority_zones`
Stores prioritized spatial sectors requiring immediate response.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Zone identifier |
| `incident_id` | UUID | REFERENCES incidents(id) | Associated incident |
| `zone_name` | VARCHAR(100) | NOT NULL | Sector name (e.g. "Sector 4B - Riverfront") |
| `priority_rank` | INTEGER | NOT NULL | 1 (highest) to N (lowest) |
| `population_est` | INTEGER | NOT NULL DEFAULT 0 | Estimated affected population |
| `access_status` | VARCHAR(50) | NOT NULL | `accessible`, `blocked`, `air_only` |
| `coordinates` | JSONB | NOT NULL | GeoJSON polygon or centroid coordinates |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

### 3.4 `resources`
Stores available emergency units, equipment, and medical personnel.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Resource identifier |
| `name` | VARCHAR(150) | NOT NULL | e.g. "SAR Team Alpha", "Helicopter Med-1" |
| `category` | VARCHAR(50) | NOT NULL | `medical`, `search_and_rescue`, `supplies`, `heavy_machinery` |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'available' | `available`, `assigned`, `in_transit`, `offline` |
| `current_lat` | DOUBLE PRECISION | NULLABLE | Current location latitude |
| `current_lon` | DOUBLE PRECISION | NULLABLE | Current location longitude |

### 3.5 `allocations`
Audit log of dispatches connecting resources to priority zones.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Allocation identifier |
| `zone_id` | UUID | REFERENCES priority_zones(id) | Target zone |
| `resource_id` | UUID | REFERENCES resources(id) | Assigned resource |
| `assigned_by` | VARCHAR(100) | NOT NULL | Operator ID or `AI_AUTO_DISPATCH` |
| `reasoning` | TEXT | NULLABLE | AI rationale for allocation |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'dispatched' | `dispatched`, `on_scene`, `completed` |
| `dispatched_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Dispatch timestamp |
