import fs from 'fs';
import { v4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    let token = req.get('X-Token');
    token = `auth_${token}`;
    const user = await redisClient.get(token);
    if (!user) res.status(401).json({ error: 'Unauthorized' });
    else {
      const {
        name, type, parentId = 0, isPublic = false,
      } = req.body;

      if (!name) res.status(400).json({ error: 'Missing name' });
      else if (!type || !(['folder', 'image', 'file'].includes(type))) {
        res.status(400).json({ error: 'Missing type' });
        /* eslint-disable-next-line */
      }
      const { data } = req.body;
      if (!data && type !== 'folder') res.status(400).json({ error: 'Missing data' });

      if (parentId) {
        const parentExist = await dbClient.findFileById(parentId);
        // res.status(400).json({ error: parentExist });
        if (!parentExist) res.status(400).json({ error: 'Parent not found' });
        else if (parentExist && parentExist.type !== 'folder') {
          res.status(400).json({ error: 'Parent is not a folder' });
          /* eslint-disable-next-line */
        }
      }
      if (type === 'folder') {
        const userId = user;
        const fileData = {
          name,
          userId,
          parentId,
          type,
          isPublic,
        };
        const newFolder = await dbClient.saveFile(fileData);
        const ops = newFolder.ops[0];
        res.status(201).json({
          id: ops._id, userId: ops.userId, name, type, isPublic, parentId,
        });
        /* eslint-disable-next-line */
      }
      if (type === 'image' || type === 'file') {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileId = v4();
        const localPath = `${folderPath}/${fileId}`;
        const { data } = req.body;
        const content = Buffer.from(data, 'base64');

        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath);
        }
        fs.writeFile(localPath, content, { flag: 'a' }, (err) => {
          if (err) console.log(err);
        });

        const fileData = {
          name,
          type,
          userId: user,
          isPublic,
          parentId,
          localPath,
        };
        const newFile = await dbClient.saveFile(fileData);
        const ops = newFile.ops[0];
        res.status(201).json({
          id: ops._id, userId: ops.userId, name, type, isPublic, parentId,
        });
      }
    }
  }
}

export default FilesController;
