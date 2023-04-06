import fs from 'fs';
import mime from 'mime-types';
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

      if (!name) {
        res.status(400).json({ error: 'Missing name' });
        return;
      }

      if (!type || !(['folder', 'image', 'file'].includes(type))) {
        res.status(400).json({ error: 'Missing type' });
        return;
        /* eslint-disable-next-line */
      }

      const { data } = req.body;
      if (!data && type !== 'folder') {
        res.status(400).json({ error: 'Missing data' });
        return;
      }

      if (parentId) {
        const parentExist = await dbClient.findFileById(parentId);
        // res.status(400).json({ error: parentExist });
        if (!parentExist) {
          res.status(400).json({ error: 'Parent not found' });
          return;
        }
        if (parentExist && parentExist.type !== 'folder') {
          res.status(400).json({ error: 'Parent is not a folder' });
          return;
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

  static async getShow(req, res) {
    const token = req.get('X-Token');
    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    /* trying to pinpoint some errors - with next 5 lines */
    const id = user;
    const idExists = await dbClient.findId(id);
    if (!idExists) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const fileId = req.params.id;
    // console.log(fileId);
    const doc = await dbClient.findFileById(fileId);
    if (!doc) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json(doc);
  }

  static async getIndex(req, res) {
    const token = req.get('X-Token');
    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = user;
    const idExists = await dbClient.findId(id);
    if (!idExists) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { parentId = 0, page = 0 } = req.query;
    if (!parentId) {
      const files = await dbClient.listFiles(parentId, page, 20, user);
      res.status(200).json(files);
      return;
    }
    // file
    // console.log(parentId);
    const files = await dbClient.listFiles(parentId, page, 20, user);
    res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const token = req.get('X-Token');
    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    /* trying to pinpoint some errors - with next 5 lines */
    const iid = user;
    const idExists = await dbClient.findId(iid);
    if (!idExists) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const fileId = req.params.id;
    const userHasFile = await dbClient.userHasFile(fileId, user);
    if (!userHasFile) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    let updatedDoc = await dbClient.updateDoc(userHasFile, { isPublic: true });
    updatedDoc = await dbClient.userHasFile(fileId, user);
    const id = updatedDoc._id;
    delete updatedDoc._id;
    delete updatedDoc.localPath;
    res.status(200).json({ id, ...updatedDoc });
  }

  static async putUnpublish(req, res) {
    const token = req.get('X-Token');
    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    /* trying to pinpoint some errors - with next 5 lines */
    const iid = user;
    const idExists = await dbClient.findId(iid);
    if (!idExists) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const fileId = req.params.id;
    const userHasFile = await dbClient.userHasFile(fileId, user);
    if (!userHasFile) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    let updatedDoc = await dbClient.updateDoc(userHasFile, { isPublic: false });
    updatedDoc = await dbClient.userHasFile(fileId, user);
    const id = updatedDoc._id;
    delete updatedDoc._id;
    delete updatedDoc.localPath;
    res.status(200).json({ id, ...updatedDoc });
  }

  static async getFile(req, res) {
    const token = req.get('X-Token');
    const user = await redisClient.get(`auth_${token}`);

    const fileId = req.params.id;
    const fileExists = await dbClient.findFileById(fileId);

    if (!fileExists) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if ((!user || fileExists.isPublic === false) && fileExists.userId !== user) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (fileExists.type === 'folder') {
      res.status(400).json({ error: "A folder doesn't have content" });
      return;
    }
    /* needed a fnc to return file path */
    const file = await dbClient.userHasFile(fileId, user);

    if (!fs.existsSync(file.localPath)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const contentType = mime.contentType(fileExists.name);
    try {
      const data = await fs.promises.readFile(file.localPath);
      res.header('Content-Type', contentType).status(200).send(data);
    } catch (err) {
      res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
