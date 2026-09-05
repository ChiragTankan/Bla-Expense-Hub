import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load CI environment variables for tests
config({ path: join(__dirname, '..', '.ci.env') });

// import { User } from '../src/user/entities/user.entity';
// import { Role } from '../src/user/entities/role.entity';
// import { UserRole } from '../src/user/entities/user-role.entity';
// import { Job } from '../src/job/entities/job.entity';
// import { Geometry } from '../src/geometry/entities/geometry.entity';
// import { FieldraIdentifier } from '../src/common/entities/fieldra-identifier.entity';

export const testEntities = [
  // User,
  // Role,
  // UserRole,
  // Job,
  // Geometry,
  // FieldraIdentifier,
];

export const TestDataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  username: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'cadframe-ci',
  entities: testEntities,
  synchronize: false,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
});
