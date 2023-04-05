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
    const countFiles = await this.files.countDocuments();
    return countFiles;
  }

  async findUser(email) {
    this.database = this.mongoClient.db();
    this.users = this.database.collection('users');
    const user = await this.users.findOne({ email });
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
    const user = await this.users.insert({ email, password: pwd });
    return user;
  }

  async findFileById(id) {
    this.database = this.mongoClient.db();
    this.files = this.database.collection('files');

    const projection = {
      projection: {
        id: '$_id', _id: 0, name: 1, userId: 1, type: 1, isPublic: 1, parentId: 1,
      },
    };
    /* eslint-disable-next-line */
    const file = await this.files.findOne({ _id: ObjectId(id) }, projection)
    return file;
  }

  // async findFile

  async saveFile(data) {
    this.database = this.mongoClient.db();
    this.files = this.database.collection('files');
    const file = await this.files.insertOne(data);
    return file;
  }

  async listFiles(parenId, page, limit, user) {
    this.database = this.mongoClient.db();
    this.files = this.database.collection('files');
    // const id = this.files.findOne({ userId: id });
    const projection = {
      projection: {
        id: '$_id', _id: 0, name: 1, userId: 1, type: 1, isPublic: 1, parentId: 1,
      },
    };

    if (!parenId) {
      const userFiles = this.files.find({ userId: user }, projection)
        .limit(limit).skip(page * limit).toArray();
      return userFiles;
    }
    const file = await this.files.find({ parentId: parenId, userId: user }, projection)
      .limit(limit).skip(page * limit).toArray();
    return file;
  }

  async userHasFile(file, user) {
    this.database = this.mongoClient.db();
    this.files = this.database.collection('files');

    const doc = await this.files.findOne({ _id: ObjectId(file), userId: user });
    return doc;
  }

  async updateDoc(match, update) {
    this.database = this.mongoClient.db();
    this.files = this.database.collection('files');
    const doc = await this.files.updateOne(match, { $set: update });
    return doc;
  }
}

const dbClient = new DBClient();
export default dbClient;
