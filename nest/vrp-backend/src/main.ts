/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; 
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              
      forbidNonWhitelisted: true,  
      transform: true,          
    }),
  );

  app.enableCors(); 

  const config = new DocumentBuilder()
    .setTitle('SEAPEDIA API')
    .setDescription('Dokumentasi lengkap REST API untuk platform e-commerce SEAPEDIA.')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();
    
  // 3. Men-generate dokumen dan mengaitkannya ke rute /api-docs
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
  console.log(`Swagger UI is available at: http://localhost:${port}/api-docs`);
}
bootstrap();