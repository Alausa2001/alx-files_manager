import sha1 from 'sha1';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    /* decode credentials */
    try {
      const authHeader = req.get('Authorization');
      const encodedCredentials = authHeader.split(' ')[1];
      const buffObj = Buffer.from(encodedCredentials, 'base64');
      const credentials = buffObj.toString('utf-8');
      const [email, pwd] = credentials.split(':');

      /* search for valid user and generate an auth token */
      const user = await dbClient.findUser(email);
      if (sha1(pwd) !== user.password) res.status(401).json({ error: 'Unauthorized' });
      else {
        const token = v4();
        redisClient.set(`auth_${token}`, user._id.toString(), 86400);
        res.status(200).json({ token });
      }
    } catch (err) {
      console.log(err);
      res.status(401).json({ error: 'Unauthorized' }).end();
    }
  }

  static async getDisconnect(req, res) {
    const xToken = req.get('X-Token');
    const id = await redisClient.get(`auth_${xToken}`);
    if (!id) res.status(401).json({ error: 'Unauthorized' });
    else {
      await redisClient.del(`auth_${xToken}`);
      res.status(204).end();
    }
  }
}

export default AuthController;
