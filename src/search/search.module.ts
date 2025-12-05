import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

import { Podcast } from './podcast.entity';
import { Episode } from './episode.entity';
@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Podcast, Episode]),
  ],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
