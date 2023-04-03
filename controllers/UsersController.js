import sha1 from 'sha1';
import dbClient from '../utils/db';

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
}

export default UsersController;
