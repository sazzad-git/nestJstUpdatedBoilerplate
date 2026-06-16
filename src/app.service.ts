import { Injectable } from '@nestjs/common';
import { SazzadStorage } from './common/lib/Disk/SazzadStorage';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello world';
  }

  async test(image: Express.Multer.File) {
    try {
      const fileName = image.originalname;
      const fileType = image.mimetype;
      const fileSize = image.size;
      const fileBuffer = image.buffer;

      const result = await SazzadStorage.put(fileName, fileBuffer);

      return {
        success: true,
        message: 'Image uploaded successfully',
        data: result,
        url: SazzadStorage.url(fileName),
      };
    } catch (error) {
      throw new Error(`Failed to upload image: ${error}`);
    }
  }
}
