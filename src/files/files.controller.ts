import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express, Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('convert/pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert a file (DOCX, Markdown, HTML, Image) to PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Returns the generated PDF as a downloadable file',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async convertToPdf(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.filesService.convertToPdf(file);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );

    res.send(result.buffer);
  }
}
