import { NextRequest, NextResponse } from 'next/server';
import { deleteImage } from '@/lib/utils/fileStorage';
import Logger from '@/lib/utils/logger';

const logger = new Logger('DeleteImageAPI');

interface DeleteImageRequest {
  imageUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DeleteImageRequest;

    if (!body.imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Only delete file URLs, not data URIs
    if (body.imageUrl.startsWith('data:')) {
      logger.debug('delete-image', 'Skipping data URI (not a file):', body.imageUrl.substring(0, 50));
      return NextResponse.json({
        success: true,
        message: 'Data URI (not a file, no deletion needed)'
      });
    }

    logger.debug('delete-image', 'Deleting image:', body.imageUrl);

    const deleted = await deleteImage(body.imageUrl);

    if (deleted) {
      logger.info('delete-image', 'Image deleted successfully:', body.imageUrl);
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      logger.warn('delete-image', 'Image file not found:', body.imageUrl);
      return NextResponse.json({
        success: true,
        message: 'Image file not found (may have been already deleted)'
      });
    }

  } catch (error) {
    logger.error('delete-image', 'Failed to delete image:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
