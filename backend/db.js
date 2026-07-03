const fs = require('fs');
const path = require('path');

const PASSWORD_HASH = '$2b$10$Kz/bUQfRD7PnOTA65oJk2OyOd7D0yIN4d5XvmGAYVVrSsqUtu9Lu6'; // engineer123
const wards = [
  ['Ward 1 - Gandhi Nagar', 'Gandhi Nagar'],
  ['Ward 2 - Shanti Nagar', 'Shanti Nagar'],
  ['Ward 3 - Lake View', 'Lake View'],
  ['Ward 4 - Green Park', 'Green Park']
];
const names = [
  'Aarav Sharma', 'Diya Patel', 'Kabir Singh', 'Ananya Rao', 'Vivaan Kumar',
  'Ishita Das', 'Arjun Mehta', 'Meera Nair', 'Rohan Gupta', 'Kavya Iyer'
];

const getInitialSeedData = () => {
  const verifiedResidents = wards.flatMap(([ward, locality], wardIndex) => names.map((name, index) => ({
    _id: `resident-${wardIndex + 1}-${index + 1}`,
    name,
    phone: `9${wardIndex + 1}${String(index + 1).padStart(8, '0')}`,
    ward,
    address: `${index + 1}, ${locality}, Aqua City`
  })));
  const waterSources = [
    { _id: 'w1s1', ward: wards[0][0], name: 'Gandhi Nagar Community Well', type: 'Community Well', address: 'Temple Road, Gandhi Nagar' },
    { _id: 'w1s2', ward: wards[0][0], name: 'Gandhi Nagar Overhead Tank', type: 'Overhead Tank', address: 'Ward Office Road, Gandhi Nagar' },
    { _id: 'w2s1', ward: wards[1][0], name: 'Shanti Nagar Borewell', type: 'Borewell', address: 'Municipal School Road, Shanti Nagar' },
    { _id: 'w2s2', ward: wards[1][0], name: 'Shanti Nagar Public Tap', type: 'Public Tap', address: 'Market Street, Shanti Nagar' },
    { _id: 'w3s1', ward: wards[2][0], name: 'Lake View Pump Station', type: 'Pump Station', address: 'Lake Road, Lake View' },
    { _id: 'w3s2', ward: wards[2][0], name: 'Lake View Service Reservoir', type: 'Reservoir', address: 'Hill Top, Lake View' },
    { _id: 'w4s1', ward: wards[3][0], name: 'Green Park Municipal Tap', type: 'Public Tap', address: 'Central Park Road, Green Park' },
    { _id: 'w4s2', ward: wards[3][0], name: 'Green Park Tube Well', type: 'Tube Well', address: 'East Colony, Green Park' }
  ].map((source) => ({ ...source, status: 'Safe', lastTested: new Date().toISOString() }));
  const users = [
    {
      _id: 'aee-1',
      name: 'AEE Priya Menon',
      email: 'aee.ward1@aquawatcher.org',
      password: PASSWORD_HASH,
      phone: '8000000001',
      ward: wards[0][0],
      address: `${wards[0][0]} Office`,
      role: 'assistant_engineer',
      createdAt: new Date().toISOString()
    }
  ];
  return { users, verifiedResidents, waterSources, complaints: [] };
};

class JSONDatabase {
  constructor() { this.filePath = path.join(__dirname, 'database.json'); this.data = getInitialSeedData(); this.init(); }
  init() {
    if (fs.existsSync(this.filePath)) {
      try {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        // Replace the former admin/inspector/citizen demo data with the new two-role ward model.
        if (!Array.isArray(this.data.verifiedResidents) || !this.data.verifiedResidents.length || this.data.users?.some((user) => ['admin', 'inspector', 'citizen'].includes(user.role))) {
          this.data = getInitialSeedData();
          this.save();
        }
      }
      catch (err) { console.error('Could not read database.json. Creating demo data.', err); this.save(); }
    } else this.save();
  }
  save() { fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8'); }
  collection(name) {
    if (!this.data[name]) { this.data[name] = []; this.save(); }
    const matches = (item, query) => Object.keys(query).every((key) => query[key] === undefined || item[key] === query[key]);
    return {
      find: (query = {}) => ({ toArray: () => this.data[name].filter((item) => matches(item, query)) }),
      findOne: (query = {}) => this.data[name].find((item) => matches(item, query)) || null,
      insertOne: (item) => { if (!item._id) item._id = Math.random().toString(36).slice(2, 11); this.data[name].push(item); this.save(); return { acknowledged: true, insertedId: item._id }; },
      updateOne: (query, update) => { const index = this.data[name].findIndex((item) => matches(item, query)); if (index < 0) return { matchedCount: 0, modifiedCount: 0 }; this.data[name][index] = { ...this.data[name][index], ...(update.$set || update) }; this.save(); return { matchedCount: 1, modifiedCount: 1 }; }
    };
  }
}

let dbInstance;
const connectDB = async () => { dbInstance = new JSONDatabase(); };
const getCollection = (name) => dbInstance.collection(name);
module.exports = { connectDB, getCollection, isMongo: () => false, getInitialSeedData };
