import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Podcast } from './podcast.entity';
import { Episode } from './episode.entity';

@Injectable()
export class SearchService {
  constructor(
    private httpService: HttpService,
    @InjectRepository(Podcast)
    private podcastRepo: Repository<Podcast>,
    @InjectRepository(Episode)
    private episodeRepo: Repository<Episode>,
  ) {}

  async searchAndSave(term: string) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast`;
    const response = await lastValueFrom(this.httpService.get(url));
    const results = response.data.results;

    const podcasts: Podcast[] = [];
    const episodes: Episode[] = [];

    for (const item of results) {
      if (!item.feedUrl) continue;

      // حفظ أو إيجاد البودكاست
      let podcast = await this.podcastRepo.findOne({ where: { itunesId: item.trackId } });

      if (!podcast) {
        podcast = this.podcastRepo.create({
          itunesId: item.trackId,
          name: item.trackName,
          artist: item.artistName,
          image: item.artworkUrl600,
          feedUrl: item.feedUrl,
        });
        podcast = await this.podcastRepo.save(podcast);
      }

      podcasts.push(podcast);

      // جلب الإبسودات (10 حلقات فقط كمثال)
      const epUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(item.trackName)}&media=podcast&entity=podcastEpisode`;
      const epResponse = await lastValueFrom(this.httpService.get(epUrl));
      const epResults = epResponse.data.results;

      for (const ep of epResults.slice(0, 10)) {
        const exists = await this.episodeRepo.findOne({ where: { itunesId: ep.trackId } });
        if (!exists) {
          const episode = this.episodeRepo.create({
            itunesId: ep.trackId,
            title: ep.trackName,
            description: ep.description,
            audioUrl: ep.episodeUrl || ep.previewUrl || '',
            releaseDate: ep.releaseDate,
            podcast,
          });
          const savedEp = await this.episodeRepo.save(episode);
          episodes.push(savedEp);
        }
      }
    }

    return { podcasts, episodes };
  }
}
