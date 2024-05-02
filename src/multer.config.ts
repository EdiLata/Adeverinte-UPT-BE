import {diskStorage} from 'multer';
import {extname} from 'path';

// Storage configuration for multer
export const multerConfig = {
  storage: diskStorage({
    destination: './uploads', // Ensure this directory exists or create it if it does not
    filename: (req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const extension = extname(file.originalname);
      callback(null, `${uniqueSuffix}${extension}`);
    },
  }),
};
