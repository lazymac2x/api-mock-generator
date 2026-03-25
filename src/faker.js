/**
 * Contextual fake data generator — zero external dependencies.
 * Generates realistic data by analyzing field names and schema types.
 */

// ── Seed-able pseudo-random ──────────────────────────────────────────────────
let _seed = Date.now();
function random() {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function pick(arr) { return arr[Math.floor(random() * arr.length)]; }
function randInt(min, max) { return Math.floor(random() * (max - min + 1)) + min; }

// ── Data pools ───────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Luna', 'Daniel',
  'Ella', 'Michael', 'Aria', 'Sebastian', 'Chloe', 'Jack', 'Penelope', 'Owen'
];
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez'
];
const DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'proton.me', 'icloud.com', 'hey.com'];
const COMPANIES = [
  'Acme Corp', 'Globex Inc', 'Initech', 'Umbrella Co', 'Stark Industries',
  'Wayne Enterprises', 'Cyberdyne Systems', 'Soylent Corp', 'Massive Dynamic',
  'Aperture Science', 'Wonka Industries', 'Dunder Mifflin', 'Prestige Worldwide'
];
const CITIES = [
  'New York', 'London', 'Tokyo', 'Paris', 'Berlin', 'Sydney', 'Toronto',
  'Seoul', 'Singapore', 'Amsterdam', 'San Francisco', 'Austin', 'Barcelona'
];
const COUNTRIES = [
  'United States', 'United Kingdom', 'Japan', 'Germany', 'France',
  'Australia', 'Canada', 'South Korea', 'Netherlands', 'Spain', 'Sweden'
];
const STREETS = [
  'Main St', 'Oak Ave', 'Elm St', 'Park Blvd', 'Cedar Ln', 'Maple Dr',
  'Washington Ave', 'Pine St', 'Lake Rd', 'Hill St', 'River Rd', 'Sunset Blvd'
];
const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
  'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore',
  'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam',
  'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip'
];
const TITLES = [
  'Getting Started with API Development', 'Best Practices for REST APIs',
  'Understanding GraphQL', 'Microservices Architecture Guide',
  'Building Scalable Systems', 'Introduction to Cloud Computing',
  'DevOps Pipeline Setup', 'Security Best Practices', 'Performance Optimization',
  'Database Design Patterns', 'CI/CD Workflow Guide', 'Monitoring and Observability'
];
const TAGS = [
  'javascript', 'typescript', 'react', 'nodejs', 'api', 'rest', 'graphql',
  'docker', 'kubernetes', 'aws', 'python', 'golang', 'rust', 'devops',
  'testing', 'security', 'performance', 'database', 'frontend', 'backend'
];
const STATUSES = ['active', 'inactive', 'pending', 'archived', 'draft', 'published'];
const ROLES = ['admin', 'user', 'editor', 'viewer', 'moderator', 'owner'];
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'teal', 'pink'];
const MIME_TYPES = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain', 'application/json'];
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Mozilla/5.0 (X11; Linux x86_64)',
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CAD', 'AUD'];
const PRODUCT_NAMES = [
  'Pro Widget', 'Ultra Gadget', 'Smart Sensor', 'Power Module', 'Flex Cable',
  'Core Adapter', 'Nano Chip', 'Mega Drive', 'Cloud Hub', 'Edge Router'
];
const CATEGORIES = [
  'Electronics', 'Books', 'Clothing', 'Home', 'Sports', 'Toys', 'Food',
  'Health', 'Beauty', 'Automotive', 'Garden', 'Office'
];

// ── Generators ───────────────────────────────────────────────────────────────
function firstName() { return pick(FIRST_NAMES); }
function lastName() { return pick(LAST_NAMES); }
function fullName() { return `${firstName()} ${lastName()}`; }
function username() { return `${pick(FIRST_NAMES).toLowerCase()}${randInt(1, 999)}`; }
function email() { return `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase()}@${pick(DOMAINS)}`; }
function phone() { return `+1-${randInt(200, 999)}-${randInt(100, 999)}-${randInt(1000, 9999)}`; }
function avatar() { return `https://i.pravatar.cc/150?u=${randInt(1, 9999)}`; }
function url() { return `https://${pick(['example', 'demo', 'test', 'api', 'app'])}.${pick(['com', 'io', 'dev', 'org'])}/${word()}`; }
function ip() { return `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`; }
function uuid() {
  const h = '0123456789abcdef';
  let u = '';
  for (let i = 0; i < 32; i++) u += h[randInt(0, 15)];
  return `${u.slice(0,8)}-${u.slice(8,12)}-4${u.slice(13,16)}-${h[randInt(8,11)]}${u.slice(17,20)}-${u.slice(20,32)}`;
}
function word() { return pick(LOREM_WORDS); }
function sentence() {
  const len = randInt(5, 12);
  const words = Array.from({ length: len }, () => word());
  words[0] = words[0][0].toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}
function paragraph() { return Array.from({ length: randInt(3, 6) }, () => sentence()).join(' '); }
function pastDate() {
  const d = new Date();
  d.setDate(d.getDate() - randInt(1, 365));
  return d.toISOString();
}
function futureDate() {
  const d = new Date();
  d.setDate(d.getDate() + randInt(1, 365));
  return d.toISOString();
}
function recentDate() {
  const d = new Date();
  d.setHours(d.getHours() - randInt(1, 72));
  return d.toISOString();
}
function price() { return parseFloat((random() * 999 + 0.99).toFixed(2)); }
function rating() { return parseFloat((random() * 4 + 1).toFixed(1)); }
function latitude() { return parseFloat((random() * 180 - 90).toFixed(6)); }
function longitude() { return parseFloat((random() * 360 - 180).toFixed(6)); }
function bool() { return random() > 0.5; }
function zipCode() { return String(randInt(10000, 99999)); }
function color() { return pick(COLORS); }
function hexColor() { return '#' + randInt(0, 16777215).toString(16).padStart(6, '0'); }
function company() { return pick(COMPANIES); }
function city() { return pick(CITIES); }
function country() { return pick(COUNTRIES); }
function address() { return `${randInt(1, 9999)} ${pick(STREETS)}, ${city()}`; }

// ── Contextual field matcher ─────────────────────────────────────────────────
// Maps field name patterns to generators for realistic output.
const FIELD_PATTERNS = [
  [/^id$|_id$|Id$/,                      () => uuid()],
  [/^uuid$|^guid$/i,                     () => uuid()],
  [/^first.?name$/i,                     () => firstName()],
  [/^last.?name$/i,                      () => lastName()],
  [/^(full.?)?name$|^display.?name$/i,   () => fullName()],
  [/^user.?name$|^login$/i,              () => username()],
  [/^e?mail$/i,                          () => email()],
  [/^phone|^tel|^mobile/i,              () => phone()],
  [/^avatar|^image|^photo|^picture/i,   () => avatar()],
  [/^url$|^link$|^href$|^website$/i,    () => url()],
  [/^ip$|^ip.?address$/i,               () => ip()],
  [/^title$|^heading$|^subject$/i,       () => pick(TITLES)],
  [/^description$|^summary$|^excerpt$/i, () => sentence()],
  [/^body$|^content$|^text$|^bio$/i,     () => paragraph()],
  [/^tag/i,                              () => pick(TAGS)],
  [/^status$/i,                          () => pick(STATUSES)],
  [/^role$/i,                            () => pick(ROLES)],
  [/^color$/i,                           () => hexColor()],
  [/^password$|^hash$/i,                 () => '$2b$10$' + uuid().replace(/-/g, '')],
  [/^token$|^api.?key$|^secret$/i,       () => 'tok_' + uuid().replace(/-/g, '')],
  [/created|updated|modified|^date$|_at$|At$/i, () => recentDate()],
  [/^start|^begin/i,                     () => pastDate()],
  [/^end$|^expire|^deadline/i,           () => futureDate()],
  [/^due/i,                              () => futureDate()],
  [/^birth/i,                            () => pastDate()],
  [/^price$|^cost$|^amount$|^total$/i,   () => price()],
  [/^rating$|^score$/i,                  () => rating()],
  [/^count$|^quantity$|^qty$/i,          () => randInt(0, 100)],
  [/^age$/i,                             () => randInt(18, 80)],
  [/^lat$|^latitude$/i,                  () => latitude()],
  [/^lng$|^lon$|^longitude$/i,           () => longitude()],
  [/^zip$|^postal/i,                     () => zipCode()],
  [/^city$/i,                            () => city()],
  [/^country$/i,                         () => country()],
  [/^address$/i,                         () => address()],
  [/^street$/i,                          () => `${randInt(1, 9999)} ${pick(STREETS)}`],
  [/^company$|^org/i,                    () => company()],
  [/^currency$/i,                        () => pick(CURRENCIES)],
  [/^product/i,                          () => pick(PRODUCT_NAMES)],
  [/^category$/i,                        () => pick(CATEGORIES)],
  [/^mime/i,                             () => pick(MIME_TYPES)],
  [/^user.?agent$/i,                     () => pick(USER_AGENTS)],
  [/^slug$/i,                            () => pick(TITLES).toLowerCase().replace(/\s+/g, '-')],
  [/^active$|^enabled$|^verified$|^published$/i, () => bool()],
  [/^is_|^has_|^can_/i,                  () => bool()],
];

/**
 * Generate a fake value for a given field name and optional JSON Schema type/format.
 */
function fakeValue(fieldName, schema = {}) {
  const { type, format, enum: enumVals, minimum, maximum, minLength, maxLength } = schema;

  // Enum takes priority
  if (enumVals && enumVals.length) return pick(enumVals);

  // Format shortcuts
  if (format === 'email') return email();
  if (format === 'uri' || format === 'url') return url();
  if (format === 'uuid') return uuid();
  if (format === 'date-time' || format === 'datetime') return recentDate();
  if (format === 'date') return recentDate().split('T')[0];
  if (format === 'ipv4') return ip();
  if (format === 'phone') return phone();

  // Match by field name
  if (fieldName) {
    for (const [pattern, gen] of FIELD_PATTERNS) {
      if (pattern.test(fieldName)) return gen();
    }
  }

  // Fall back to type
  switch (type) {
    case 'integer':
      return randInt(minimum ?? 0, maximum ?? 1000);
    case 'number':
      return parseFloat((random() * (maximum ?? 1000 - (minimum ?? 0)) + (minimum ?? 0)).toFixed(2));
    case 'boolean':
      return bool();
    case 'string': {
      if (maxLength && maxLength <= 10) return word().slice(0, maxLength);
      return sentence();
    }
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return sentence();
  }
}

/**
 * Generate a fake object from a JSON Schema properties map.
 */
function fakeObject(properties = {}, required = []) {
  const obj = {};
  for (const [key, schema] of Object.entries(properties)) {
    if (schema.type === 'object' && schema.properties) {
      obj[key] = fakeObject(schema.properties, schema.required || []);
    } else if (schema.type === 'array') {
      const count = randInt(1, 3);
      if (schema.items) {
        if (schema.items.type === 'object' && schema.items.properties) {
          obj[key] = Array.from({ length: count }, () =>
            fakeObject(schema.items.properties, schema.items.required || [])
          );
        } else {
          obj[key] = Array.from({ length: count }, () => fakeValue(key, schema.items));
        }
      } else {
        obj[key] = Array.from({ length: count }, () => fakeValue(key));
      }
    } else {
      obj[key] = fakeValue(key, schema);
    }
  }
  return obj;
}

/**
 * Generate N fake objects.
 */
function fakeArray(properties, required, count = 5) {
  return Array.from({ length: count }, () => fakeObject(properties, required));
}

module.exports = {
  fakeValue,
  fakeObject,
  fakeArray,
  random,
  randInt,
  pick,
  uuid,
  email,
  fullName,
  username,
  phone,
  sentence,
  paragraph,
  pastDate,
  recentDate,
  futureDate,
  price,
  url,
  ip,
  city,
  country,
  address,
  company,
};
