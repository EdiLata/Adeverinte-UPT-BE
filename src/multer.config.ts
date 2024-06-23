import {diskStorage} from 'multer';
import {extname} from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const extension = extname(file.originalname);
      callback(null, `${uniqueSuffix}${extension}`);
    },
  }),
};
