import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) res.status(400).json({ error: 'Missing email' });

    else if (!password) res.status(400).json({ error: 'Missing password' });

    else {
      const user = await dbClient.findUser(email);
      if (user) res.status(400).json({ error: 'Already exist' });
      else {
        const pwd = sha1(password);
        const user = await dbClient.saveUser(email, pwd);
        res.status(201).json({ id: user.ops[0]._id, email: user.ops[0].email });
      }
    }
  }

  static async getMe(req, res) {
    const xToken = req.get('X-Token');
    const _id = await redisClient.get(`auth_${xToken}`);
    if (!_id) res.status(401).json({ error: 'Unauthorized' });
    else {
      const user = await dbClient.findId(_id);
      // console.log(user);
      if (user) res.json({ email: user.email, id: ObjectId(_id) });
      else res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

export default UsersController;
