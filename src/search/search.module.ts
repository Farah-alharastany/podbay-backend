import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

import { Podcast } from './entities/podcast.entity';
import { Episode } from './entities/episode.entity';
@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Podcast, Episode]),
  ],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
