import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) res.status(400).json({ error: 'Missing email' });

    else if (!password) res.status(400).json({ error: 'Missing password' });

    else {
      const user = dbClient.findUser(email);
      if (user) res.status(400).json({ error: 'Already exist' });
      else {
        const pwd = sha1(password);
        dbClient.saveUser(email, pwd);
        const { _id, userMail } = dbClient.findUser(email);
        res.status(201).json({ id: _id, email: userMail });
      }
    }
  }
}

export default UsersController;
