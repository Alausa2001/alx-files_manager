import { MongoClient, ObjectId } from 'mongodb';

class DBClient {
  constructor() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 27017;
    const db = process.env.DB_DATABASE || 'files_manager';

    this.mongoClient = new MongoClient(`mongodb://${dbHost}:${dbPort}/${db}`);
    this.mongoClient.connect();
  }

  isAlive() {
    return this.mongoClient.isConnected();
  }

  async nbUsers() {
    this.database = this.mongoClient.db();
    this.users = this.database.collection('users');
    const countUsers = await this.users.countDocuments();
    return countUsers;
  }

  async nbFiles() {
    this.database = this.mongoClient.db();
    this.files = this.database.collection('files');
    const countFiles = this.files.countDocuments();
    return countFiles;
  }

  async findUser(email) {
    this.database = this.mongoClient.db();
    this.users = this.database.collection('users');
    const user = this.users.findOne({ email });
    return user;
  }

  async findId(id) {
    this.database = this.mongoClient.db();
    this.users = this.database.collection('users');
    const user = await this.users.findOne({ _id: ObjectId(id) });
    return user;
  }

  async saveUser(email, pwd) {
    this.database = this.mongoClient.db();
    this.users = this.database.collection('users');
    const user = this.users.insert({ email, password: pwd });
    return user;
  }

  async findFileById(id) {
    this.database = this.mongoClient.db();
    this.files = this.database.collection('files');
    const file = this.files.findOne({ _id: ObjectId(id) });
    return file;
  }

  async saveFile(data) {
    this.database = this.mongoClient.db();
    this.files = this.database.collection('files');
    const file = this.files.insertOne(data);
    return file;
  }

  async listFiles(parenId, page, limit) {
    this.database = this.mongoClient.db();
    this.files = this.database.collection('files');
    const file = this.files.find({ parentId: parenId }).limit(limit).skip(page * limit).toArray();
    return file;
  }
}

const dbClient = new DBClient();
export default dbClient;
