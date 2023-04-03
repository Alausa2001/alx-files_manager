import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static getStatus(req, res) {
    const dbStatus = dbClient.isAlive();
    const redisStatus = redisClient.isAlive();
    res.status(200).json({ redis: redisStatus, db: dbStatus });
  }

  static async getStats(req, res) {
    const noUsers = await dbClient.nbUsers();
    const noFiles = await dbClient.nbFiles();
    res.status(200).json({ users: noUsers, files: noFiles });
  }
}

export default AppController;
