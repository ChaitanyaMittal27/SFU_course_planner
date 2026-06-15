Department dept = departmentRepository.findById(5);

```

JPA **automatically translates** between:
- Java objects ↔️ Database rows
- Java method calls ↔️ SQL queries

---

## How JPA Works: The Layers
```

┌─────────────────────────────────────────┐
│ Your Controller/Service Code │
│ departmentRepo.findById(5) │
└─────────────────┬───────────────────────┘
│
↓
┌─────────────────────────────────────────┐
│ Spring Data JPA (Interface) │
│ Provides: findById, findAll, save │
└─────────────────┬───────────────────────┘
│
↓
┌─────────────────────────────────────────┐
│ Hibernate (JPA Implementation) │
│ Generates SQL: SELECT \* FROM... │
└─────────────────┬───────────────────────┘
│
↓
┌─────────────────────────────────────────┐
│ JDBC Driver (PostgreSQL) │
│ Sends SQL to database │
└─────────────────┬───────────────────────┘
│
↓
┌─────────────────────────────────────────┐
│ Supabase PostgreSQL Database │
└─────────────────────────────────────────┘

```

### Key Components:

1. **@Entity Classes** - Java objects that map to database tables
2. **@Repository Interfaces** - Define what queries you want
3. **Hibernate** - Generates and executes SQL for you
4. **Entity Manager** - Tracks changes to objects, manages persistence

---

## Your Current Approach vs JPA

### **Your Current Approach: "Load-Once, Use-Forever"**
```

Application Startup:
┌──────────────────────────────────────────────┐
│ 1. Application.java starts │
│ 2. @Bean departmentMap() is called │
│ 3. DBLoader connects to Supabase │
│ 4. DBLoader executes: │
│ SELECT \* FROM course_data │
│ 5. Loop through ALL rows │
│ 6. Build nested structure in RAM: │
│ Map<Long, Department> │
│ └─> Map<Long, Course> │
│ └─> Map<Long, Offering> │
│ └─> Map<String, Section> │
│ 7. Store entire structure in memory │
│ 8. Return map to Spring │
└──────────────────────────────────────────────┘

Runtime (e.g., user visits /api/departments):
┌──────────────────────────────────────────────┐
│ 1. BrowseController.getDepartments() │
│ 2. Access departmentMap (already in RAM) │
│ 3. Loop through map.values() │
│ 4. Convert to DTO │
│ 5. Return to user │
│ │
│ Database: NOT TOUCHED ❌ │
│ SQL Queries: ZERO ❌ │
└──────────────────────────────────────────────┘

When Database Updates:
┌──────────────────────────────────────────────┐
│ 1. Sync job inserts new data into Supabase │
│ 2. departmentMap still has old data in RAM │
│ 3. Users see stale data │
│ 4. Only updates after app restart │
└──────────────────────────────────────────────┘

```

**Diagram:**
```

┌─────────────┐
│ Supabase │ ← Data updates here
│ PostgreSQL │
└──────┬──────┘
│
│ One-time load at startup
↓
┌──────────────────────┐
│ AWS Elastic │
│ Beanstalk │
│ │
│ ┌────────────────┐ │
│ │ In-Memory Map │ │ ← Frozen snapshot
│ │ (HashMap) │ │
│ │ │ │
│ │ 50 Departments │ │
│ │ 2000 Courses │ │
│ └────────────────┘ │
└──────────────────────┘
↑
│ All API requests read from here
│
API Requests

```

---

### **JPA Approach: "Query-On-Demand"**
```

Application Startup:
┌──────────────────────────────────────────────┐
│ 1. Application.java starts │
│ 2. Spring creates Repository beans │
│ 3. Hibernate reads @Entity classes │
│ 4. Hibernate validates schema matches DB │
│ 5. Connection pool initialized (HikariCP) │
│ 6. Ready to handle requests │
│ │
│ NO DATA LOADED ✅ │
│ Memory Usage: Minimal │
└──────────────────────────────────────────────┘

Runtime (e.g., user visits /api/departments):
┌──────────────────────────────────────────────┐
│ 1. BrowseController.getDepartments() │
│ 2. Call departmentRepository.findAll() │
│ 3. Hibernate generates SQL: │
│ SELECT \* FROM departments │
│ 4. Execute query against Supabase │
│ 5. Map ResultSet to Department objects │
│ 6. Convert to DTOs │
│ 7. Return to user │
│ │
│ Database: QUERIED EVERY TIME ✅ │
│ SQL Queries: 1 per request ✅ │
└──────────────────────────────────────────────┘

When Database Updates:
┌──────────────────────────────────────────────┐
│ 1. Sync job inserts new data into Supabase │
│ 2. Next API request queries database │
│ 3. Users see fresh data immediately ✅ │
│ 4. No restart needed ✅ │
└──────────────────────────────────────────────┘

```

**Diagram:**
```

┌─────────────┐
│ Supabase │ ← Data updates here
│ PostgreSQL │
└──────┬──────┘
│
│ Query on every request
↓
┌──────────────────────┐
│ AWS Elastic │
│ Beanstalk │
│ │
│ ┌────────────────┐ │
│ │ JPA Repository │ │ ← Just interfaces
│ │ (No data) │ │
│ └────────────────┘ │
│ │
│ ┌────────────────┐ │
│ │ Connection │ │ ← Pool of DB connections
│ │ Pool (5-10) │ │
│ └────────────────┘ │
└──────────────────────┘
↑
│ Executes SQL queries
│
API Requests
