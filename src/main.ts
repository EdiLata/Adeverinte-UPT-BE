import {NestFactory} from '@nestjs/core';
import {SwaggerModule, DocumentBuilder} from '@nestjs/swagger';
import {AppModule} from './app.module';
import {ConfigService} from '@nestjs/config';
import {LoggerService} from './logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);
  const uploadDir = path.resolve('./uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true});
  }

  const options = new DocumentBuilder()
    .setTitle('Adeverinte UPT API')
    .setVersion('1')
    .addServer('http://localhost:3000/', 'Local environment')
    .addServer('https://staging.yourapi.com/', 'Staging')
    .addServer('https://production.yourapi.com/', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  const logger: LoggerService = new LoggerService();

  app.enableCors();
  logger.verbose(
    `Application listening on port => ${configService.get('port')}`,
  );
  await app.listen(configService.get('port'));
}
bootstrap();
